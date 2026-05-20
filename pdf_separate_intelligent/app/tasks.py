import json
from celery import Celery
import tempfile
import os
import shutil
import fitz
from PIL import Image
import io
from .utils import split_pdf_one_page_per_file, process_single_page_pdf, extract_employee_info, extract_text_with_fallback, generate_pay_slip_filename, extract_period_from_dates
from .crypto import decrypt_file, encrypt_file

app = Celery(
    'pdf_processor',
    broker='redis://redis:6379/1',
    backend='redis://redis:6379/1',
    broker_connection_retry_on_startup=True
)

REPORT_FILENAME = "_report_results.json"

@app.task(bind=True)
def process_pdf_task(self, input_pdf_path: str):
    """
    Async task to process PDF pay slips: split, OCR rename, organize by employee ID
    """
    task_id = self.request.id

    try:
        # Create temp dirs for this task
        temp_base = tempfile.gettempdir()
        task_temp_dir = os.path.join(temp_base, f'pdf_task_{task_id}')
        pages_dir = os.path.join(task_temp_dir, 'pages')
        final_dir = os.path.join(task_temp_dir, 'final')


        # Debug info
        print(f"DEBUG: Starting input_pdf_path: {input_pdf_path}")

        os.makedirs(pages_dir, exist_ok=True)
        os.makedirs(final_dir, exist_ok=True)

        # Decrypt input file to temp
        decrypted_input = os.path.join(task_temp_dir, 'decrypted_input.pdf')
        decrypt_file(input_pdf_path, decrypted_input)

        # Step 1: Split PDF
        self.update_state(state='PROGRESS', meta={'progress': 'Splitting PDF'})
        page_files = split_pdf_one_page_per_file(decrypted_input, pages_dir)

        # Step 2: Process each page with pay slip OCR and organize by employee
        processed_files = []
        total_pages = len(page_files)

        # Organize by employee folders, track per-page results for report
        employee_folders = {}
        page_results = []

        for idx, page_file in enumerate(page_files):
            # Extract text and employee info - always use OCR for pay slips
            employee_info = None
            period_info = None
            error_message = None

            # Try multiple approaches to extract employee info
            # 1. Extract text directly from PDF
            try:
                doc = fitz.open(page_file)
                text = ""
                for page_num in range(min(2, len(doc))):
                    page = doc.load_page(page_num)
                    text += page.get_text("text") + "\n"
                doc.close()

                if text.strip():
                    employee_info = extract_employee_info(text)
                    period_info = extract_period_from_dates(text)
            except Exception as e:
                error_message = str(e)

            # 2. If no employee info found, try OCR
            if not employee_info:
                try:
                    pytesseract_available = True
                    import pytesseract
                except ImportError:
                    pytesseract_available = False

                if pytesseract_available:
                    try:
                        doc = fitz.open(page_file)
                        page = doc.load_page(0)
                        pix = page.get_pixmap(dpi=300)
                        img_data = pix.tobytes("ppm")
                        image = Image.open(io.BytesIO(img_data))
                        ocr_text = pytesseract.image_to_string(image, lang='fra')
                        doc.close()

                        employee_info = extract_employee_info(ocr_text)
                        if not period_info:
                            period_info = extract_period_from_dates(ocr_text)
                    except Exception as e:
                        err = f"OCR failed: {str(e)}"
                        error_message = f"{error_message}; {err}" if error_message else err
                        print(f"OCR failed for {page_file}: {e}")

            # 3. Fallback if still no info found
            had_ocr_fallback = False
            if not employee_info:
                print(f"DEBUG: Could not extract employee info from {page_file}")
                from datetime import datetime
                now = datetime.now()
                fallback_id = f"UNKNOWN_{now.strftime('%H%M%S')}_{idx+1:03d}"
                matricule, nom, prenom = fallback_id, f"UNKNOWN_{idx+1:03d}", f"UNKNOWN_{idx+1:03d}"
                period_info = period_info or ("SEP", "2025")
                had_ocr_fallback = True
                err_msg = error_message or "Could not extract employee info via text or OCR"
                error_message = err_msg
            else:
                matricule, nom, prenom = employee_info
                print(f"DEBUG: Extracted employee info for {page_file}: ID={matricule}, NOM={nom}, PRENOM={prenom}, PERIOD={period_info}")

            # Create employee folder
            if matricule not in employee_folders:
                employee_dir = os.path.join(final_dir, matricule)
                os.makedirs(employee_dir, exist_ok=True)
                employee_folders[matricule] = employee_dir

            employee_dir = employee_folders[matricule]

            # Generate filename and move file
            final_filename = generate_pay_slip_filename(employee_info, period_info, idx + 1)
            final_path = os.path.join(employee_dir, final_filename)

            # Handle duplicates within the same employee folder
            counter = 1
            original_path = final_path
            while os.path.exists(final_path):
                base, ext = os.path.splitext(original_path)
                final_path = os.path.join(employee_dir, f"{base}_{counter}{ext}")
                counter += 1

            # Update progress with current filename
            self.update_state(state='PROGRESS', meta={
                'detail': f'Traitement pour {nom} {prenom} ({matricule})',
                'progress': f'Fiche en cours : {final_filename} ({idx + 1} / {total_pages})',
                'current': idx + 1,
                'total': total_pages
            })

            shutil.move(page_file, final_path)
            processed_files.append(final_path)

            # Track page result
            is_success = not had_ocr_fallback and not error_message
            page_results.append({
                'page': idx + 1,
                'matricule': matricule,
                'nom': nom,
                'prenom': prenom,
                'filename': final_filename,
                'status': 'Success' if is_success else 'Error',
                'error': error_message if not is_success else None
            })

        # Encrypt all PDF files in final_dir and change extension to .enc
        self.update_state(state='PROGRESS', meta={'progress': 'Encrypting output files'})
        for root, dirs, files in os.walk(final_dir):
            for file in files:
                if file.lower().endswith('.pdf'):
                    file_path = os.path.join(root, file)
                    encrypted_path = os.path.splitext(file_path)[0] + '.enc'
                    encrypt_file(file_path, encrypted_path)
                    os.remove(file_path)  # Delete original PDF after encryption

        # Step 3: Move organized structure to output
        self.update_state(state='PROGRESS', meta={'progress': 'Organizing files by employee'})
        output_dir = os.path.join("output", f'{input_pdf_path}_{task_id}'.replace('/', '_').replace('\\', '_').replace('.pdf', '').replace('uploads_', ''))
        shutil.move(final_dir, output_dir)

        # Write report results JSON alongside the output
        report_path = os.path.join(output_dir, REPORT_FILENAME)
        success_count = sum(1 for r in page_results if r['status'] == 'Success')
        failed_count = sum(1 for r in page_results if r['status'] == 'Error')

        # Group by employee for report
        employees = {}
        for r in page_results:
            mat = r['matricule']
            if mat not in employees:
                employees[mat] = {
                    'matricule': mat,
                    'nom': r['nom'],
                    'prenom': r['prenom'],
                    'files': [],
                    'total': 0,
                    'success': 0,
                    'failed': 0
                }
            employees[mat]['files'].append({
                'filename': r['filename'],
                'status': r['status'],
                'error': r['error']
            })
            employees[mat]['total'] += 1
            if r['status'] == 'Success':
                employees[mat]['success'] += 1
            else:
                employees[mat]['failed'] += 1

        report_data = {
            'task_id': task_id,
            'total_expected': total_pages,
            'total_processed': success_count,
            'total_failed': failed_count,
            'employees': employees
        }

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        # Clean up input
        os.remove(input_pdf_path)

        return {
            'status': 'SUCCESS',
            'output_dir': output_dir,
            'file_count': len(processed_files),
            'employee_count': len(employee_folders),
            'total_expected': total_pages,
            'total_success': success_count,
            'total_failed': failed_count
        }

    except Exception as e:
        # Clean up on error
        if 'task_temp_dir' in locals() and os.path.exists(task_temp_dir):
            shutil.rmtree(task_temp_dir)
        if 'input_pdf_path' in locals() and os.path.exists(input_pdf_path):
            os.remove(input_pdf_path)
        raise Exception(f'Processing failed: {str(e)}')
