# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Employe, FichePaie  # Assure-toi que le modèle existe
from .serializers import EmployeSerializer, FichePaieSerializer # Tu dois créer ce serializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .ldap_auth import LDAPUnavailable, authenticate_ldap, sync_user_from_ldap

# Création d'un API avec méthode GET et 'AllowAny' pour la permission (Permettre tout)
@api_view(['GET'])
@permission_classes([AllowAny])
def test_fiche_paie(request):
    return Response(
        {'message': 'test fiche de paie'}
    ) 

# --- NOUVELLE VUE : Créer un employé ---
@api_view(['POST'])
@permission_classes([AllowAny])  # Change plus tard avec IsAuthenticated si besoin
def create_employe(request):
    serializer = EmployeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
@permission_classes([AllowAny])
def list_employes(request):
    employes = Employe.objects.filter(actif=True)
    serializer = EmployeSerializer(employes, many=True)
    return Response(serializer.data)


            #04/11/25
          # CRUD EMPLOYE
@api_view(['GET'])
@permission_classes([AllowAny])
def list_employes(request):
    """
    Liste tous les employés actifs.
    URL : GET /employe/list/
    """
    employes = Employe.objects.filter(actif=True)
    serializer = EmployeSerializer(employes, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_employe(request):
    """
    Crée un nouvel employé.
    Exemple JSON :
    {
        "matricule": "EMP001",
        "nom": "DUPONT",
        "prenom": "Jean",
        "email": "jean.dupont@exemple.com"
    }
    """
    serializer = EmployeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def retrieve_employe(request, pk):
    """
    Détail d’un employé par ID.
    URL : GET /employe/1/
    """
    try:
        employe = Employe.objects.get(pk=pk, actif=True)
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé ou désactivé'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = EmployeSerializer(employe)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_employe(request, pk):
    """
    Met à jour un employé (complet avec PUT, partiel avec PATCH).
    """
    try:
        employe = Employe.objects.get(pk=pk)
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = EmployeSerializer(employe, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_employe(request, pk):
    """
    Désactive un employé (soft delete).
    On garde l'historique des fiches de paie.
    """
    try:
        employe = Employe.objects.get(pk=pk)
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    employe.actif = False
    employe.save()
    return Response(status=status.HTTP_204_NO_CONTENT)



# ======================= CRUD FICHE DE PAIE ========================
# Vues optimisées avec select_related('employe') pour joindre les tables en une requête SQL.
# Gestion des fichiers PDF via champ FileField dans le modèle.
@api_view(['GET'])
@permission_classes([AllowAny])
def list_fiches_paie(request):
    """
    Liste toutes les fiches de paie avec les infos de l'employé.
    Utilise select_related() pour optimiser les requêtes SQL.
    """
    fiches = FichePaie.objects.select_related('employe').all()
    serializer = FichePaieSerializer(fiches, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_fiche_paie(request):
    """
    Crée une fiche de paie (ex: après import CSV/PDF).
    Champs requis :
    - employe (ID)
    - mois (ex: "Janvier 2025")
    - fichier_pdf (chemin ou URL)
    """
    serializer = FichePaieSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def retrieve_fiche_paie(request, pk):
    """
    Détail d’une fiche de paie.
    """
    try:
        fiche = FichePaie.objects.get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response(
            {'error': 'Fiche de paie non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = FichePaieSerializer(fiche)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_fiche_paie(request, pk):
    """
    Met à jour une fiche (ex: marquer comme envoyée, corriger mois).
    """
    try:
        fiche = FichePaie.objects.get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response(
            {'error': 'Fiche de paie non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = FichePaieSerializer(fiche, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_fiche_paie(request, pk):
    """
    Supprime définitivement une fiche de paie.
    Attention : supprime aussi les envois associés si tu les remets plus tard.
    """
    try:
        fiche = FichePaie.objects.get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response(
            {'error': 'Fiche de paie non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )

    fiche.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@authentication_classes([JWTAuthentication])
def get_employe_by_matricule(request):
    """
    Récupère les informations de l'employé connecté via son matricule.
    URL : GET /employe/by-matricule/
    """
    try:
        # Récupérer l'utilisateur connecté
        user = request.user
        
        # Trouver l'employé associé à cet utilisateur
        employe = Employe.objects.get(user=user, actif=True)
        
        # Retourner uniquement le matricule
        return Response(
            {'matricule': employe.matricule},
            status=status.HTTP_200_OK
        )
        
    except Employe.DoesNotExist:
        return Response(
            {'error': 'Employé non trouvé ou désactivé'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur serveur: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('username')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Username and password required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            ldap_attrs = authenticate_ldap(email, password)
        except LDAPUnavailable:
            return Response({'error': 'Authentication service unavailable'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if not ldap_attrs:
            return Response({'error': 'Invalid credentials'},
                            status=status.HTTP_401_UNAUTHORIZED)

        user, employe, _ = sync_user_from_ldap(ldap_attrs)
        if not user.is_active:
            return Response({'error': 'Account disabled'},
                            status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        employe_data = {
            'matricule': employe.matricule,
            'nom': employe.nom,
            'prenom': employe.prenom,
            'email': employe.email,
            'departement': employe.departement,
            'poste': employe.poste,
        }

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
            },
            'matricule': employe.matricule,
            'employe': employe_data,
        })

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user info
    URL : GET /api/v1/me/
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    })


import os
import re
from datetime import datetime

MONTH_MAP = {
    'jan': '01', 'fev': '02', 'mar': '03', 'avr': '04',
    'mai': '05', 'jun': '06', 'jui': '07', 'aou': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
}

def parse_folder_date(folder_name):
    match = re.match(r'^(jan|fev|mar|avr|mai|jun|jui|aou|sep|oct|nov|dec)_(20\d{2})', folder_name.lower())
    if match:
        month = MONTH_MAP.get(match.group(1), '01')
        year = match.group(2)
        return f'{year}-{month}-01'
    return None

@api_view(['GET'])
@permission_classes([AllowAny])
def transaction_stats(request):
    """
    Récupère les statistiques mensuelles basées sur les dossiers dans pdf_separate_intelligent/output
    Retourne la date d'ajout et le nombre de fichiers par dossier
    URL : GET /api/v1/transaction-stats/
    """
    output_path = os.environ.get('PDF_OUTPUT_PATH', os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'pdf_separate_intelligent', 'output'))
    
    if not os.path.exists(output_path):
        return Response({'labels': [], 'data': []})
    
    folder_stats = []
    for folder_name in os.listdir(output_path):
        folder_path = os.path.join(output_path, folder_name)
        if os.path.isdir(folder_path):
            folder_date = parse_folder_date(folder_name)
            if not folder_date:
                continue
            
            file_count = 0
            for root, dirs, files in os.walk(folder_path):
                file_count += len(files)
            
            folder_stats.append({
                'date': folder_date,
                'count': file_count,
                'folder_name': folder_name
            })
    
    folder_stats.sort(key=lambda x: x['date'])
    
    labels = [stat['date'] for stat in folder_stats]
    data = [stat['count'] for stat in folder_stats]
    total = sum(stat['count'] for stat in folder_stats)
    
    return Response({
        'labels': labels,
        'data': data,
        'total': total,
        'total_employes': Employe.objects.filter(actif=True).count()
    })


# ==================================================================
# VERSION CORRIGÉE : EXPORT REPORT (Mivantana avy amin'ny Django)
# ==================================================================
import io
import re
import json
import os
import csv as csv_module
from django.http import HttpResponse

FILENAME_PATTERN = re.compile(r'^(\d+)_.+\.enc$')

class ExportReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Fanamarinana ho an'ny Administrateur
        if not request.user.is_staff:
            return Response(
                {'error': 'Seuls les administrateurs peuvent exporter le rapport.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Fandraisana ny paramètres query avy amin'ny React
        task_id = request.query_params.get('task_id')
        fmt = request.query_params.get('format', 'xlsx')

        if not task_id:
            return Response(
                {'error': 'Le paramètre task_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Famolavolana ny lalana mankany amin'ny dossiers
        output_path = os.environ.get(
            'PDF_OUTPUT_PATH',
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                         'pdf_separate_intelligent', 'output')
        )

        batch_dir = self._resolve_batch_dir(output_path, task_id)
        if not batch_dir:
            return Response(
                {'error': 'Aucun dossier de traitement trouvé pour ce task_id. Vérifiez que le traitement est terminé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 4. Fikarakarana ny mombamomba ny mpiasa
        employees = self._build_employee_data(batch_dir)

        total_expected = sum(emp['total'] for emp in employees.values())
        total_processed = sum(emp['success'] for emp in employees.values())
        total_failed = sum(emp['failed'] for emp in employees.values())
        safe_id = task_id[:8] if len(task_id) > 8 else task_id

        # 5. Fandefasana ny fichier mifandraika amin'ny format nangatahana
        if fmt == 'csv':
            return self._generate_csv(employees, total_expected, total_processed, total_failed, safe_id)
        return self._generate_xlsx(employees, total_expected, total_processed, total_failed, safe_id)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _resolve_batch_dir(self, output_path, task_id):
        """Find the batch output directory for this task_id."""
        if not os.path.exists(output_path):
            return None
        for dir_name in os.listdir(output_path):
            if task_id in dir_name:
                dir_path = os.path.join(output_path, dir_name)
                if os.path.isdir(dir_path):
                    return dir_path
        return None

    def _parse_enc_filename(self, filename):
        m = FILENAME_PATTERN.match(filename)
        if m:
            return m.group(1)
        if filename.startswith('UNKNOWN_'):
            return filename.replace('.enc', '')
        return None

    def _build_employee_data(self, batch_dir):
        json_path = os.path.join(batch_dir, '_report_results.json')
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                report_data = json.load(f)
            return report_data.get("employees", {})

        employees = {}
        for emp_dir_name in os.listdir(batch_dir):
            emp_dir_path = os.path.join(batch_dir, emp_dir_name)
            if not os.path.isdir(emp_dir_path):
                continue

            enc_files = [f for f in os.listdir(emp_dir_path) if f.lower().endswith('.enc')]
            if not enc_files:
                continue

            matricule = self._parse_enc_filename(enc_files[0]) or emp_dir_name

            emp_entry = {
                'matricule': matricule,
                'nom': matricule,
                'prenom': '',
                'files': [],
                'total': 0,
                'success': 0,
                'failed': 0,
            }

            for enc_file in sorted(enc_files):
                pdf_name = enc_file.replace('.enc', '.pdf')
                file_entry = {
                    'filename': pdf_name,
                    'status': 'Success',
                    'error': None,
                }
                emp_entry['files'].append(file_entry)
                emp_entry['total'] += 1
                emp_entry['success'] += 1

            employees[matricule] = emp_entry

        return employees

    def _generate_xlsx(self, employees, total_expected, total_processed, total_failed, safe_id):
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Rapport Importation"

        hdr_font = Font(bold=True, color="FFFFFF", size=11)
        hdr_fill = PatternFill(start_color="166534", end_color="166534", fill_type="solid")
        title_font = Font(bold=True, size=14, color="166534")
        sub_font = Font(bold=True, size=11, color="374151")
        ok_font = Font(color="166534", bold=True)
        err_font = Font(color="DC2626", bold=True)
        ok_fill = PatternFill(start_color="F0FDF4", end_color="F0FDF4", fill_type="solid")
        er_fill = PatternFill(start_color="FEF2F2", end_color="FEF2F2", fill_type="solid")
        bdr = Border(
            left=Side(style='thin', color='D1D5DB'),
            right=Side(style='thin', color='D1D5DB'),
            top=Side(style='thin', color='D1D5DB'),
            bottom=Side(style='thin', color='D1D5DB'),
        )

        # Title
        ws.merge_cells('A1:D1')
        ws['A1'] = "Rapport d'Importation & Réconciliation"
        ws['A1'].font = title_font
        ws['A1'].alignment = Alignment(horizontal='center')
        ws.row_dimensions[1].height = 30

        # Summary
        ws.merge_cells('A3:B3')
        ws['A3'] = "Résumé de la réconciliation"
        ws['A3'].font = sub_font
        summary = [
            ("Total attendu (pages dans le PDF)", total_expected),
            ("Total traités avec succès", total_processed),
            ("Total en échec", total_failed),
            ("Taux de succès", f"{total_processed / total_expected * 100:.1f}%" if total_expected > 0 else "N/A"),
        ]
        for i, (label, value) in enumerate(summary):
            row = 4 + i
            ws.cell(row=row, column=1, value=label).font = Font(bold=True)
            ws.cell(row=row, column=2, value=value).alignment = Alignment(horizontal='center')
            ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=2)

        # Column headers
        hr = 9
        for ci, h in enumerate(["Matricule", "Nom du Fichier", "Statut", "Message Erreur"], 1):
            c = ws.cell(row=hr, column=ci, value=h)
            c.font = hdr_font
            c.fill = hdr_fill
            c.alignment = Alignment(horizontal='center', vertical='center')
            c.border = bdr

        ws.column_dimensions['A'].width = 18
        ws.column_dimensions['B'].width = 55
        ws.column_dimensions['C'].width = 14
        ws.column_dimensions['D'].width = 60

        row = hr + 1
        for mat in sorted(employees.keys(), key=lambda x: (x.startswith("UNKNOWN"), x)):
            emp = employees[mat]
            start = row
            for f in emp["files"]:
                is_err = f["status"] == "Error"
                fill = er_fill if is_err else ok_fill

                ws.cell(row=row, column=1, value=emp["matricule"]).border = bdr
                ws.cell(row=row, column=2, value=f["filename"]).border = bdr
                sc = ws.cell(row=row, column=3, value=f["status"])
                sc.font = err_font if is_err else ok_font
                sc.border = bdr
                ws.cell(row=row, column=4, value=f["error"] or "").border = bdr
                for col in range(1, 5):
                    ws.cell(row=row, column=col).fill = fill
                row += 1

            if row - start > 1:
                ws.merge_cells(start_row=start, start_column=1, end_row=row - 1, end_column=1)

            ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=4)
            sc = ws.cell(row=row, column=1,
                         value=f"Total {emp['matricule']}: {emp['total']} fichier(s), {emp['success']} succès, {emp['failed']} échec(s)")
            sc.font = Font(bold=True, italic=True, color="374151")
            sc.border = bdr
            row += 2

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        filename = f"rapport_importation_{safe_id}.xlsx"
        
        # Ampiasaina HttpResponse mba ho azo antoka ny download ho an'ny Axios
        response = HttpResponse(
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _generate_csv(self, employees, total_expected, total_processed, total_failed, safe_id):
        buf = io.StringIO()
        writer = csv_module.writer(buf)

        writer.writerow(["=== RAPPORT D'IMPORTATION & RÉCONCILIATION ==="])
        writer.writerow([])
        writer.writerow(["Indicateur", "Valeur"])
        writer.writerow(["Total attendu (pages)", total_expected])
        writer.writerow(["Total traités avec succès", total_processed])
        writer.writerow(["Total en échec", total_failed])
        writer.writerow(["Taux de succès", f"{total_processed / total_expected * 100:.1f}%" if total_expected > 0 else "N/A"])
        writer.writerow([])
        writer.writerow([])
        writer.writerow(["Matricule", "Nom du Fichier", "Statut", "Message Erreur"])

        for mat in sorted(employees.keys(), key=lambda x: (x.startswith("UNKNOWN"), x)):
            emp = employees[mat]
            for f in emp["files"]:
                writer.writerow([emp["matricule"], f["filename"], f["status"], f["error"] or ""])
            writer.writerow(["", "", "",
                             f"Total {emp['matricule']}: {emp['total']} fichier(s), {emp['success']} succès, {emp['failed']} échec(s)"])
            writer.writerow([])

        filename = f"rapport_importation_{safe_id}.csv"
        response = HttpResponse(buf.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response