docker exec -it payslip_backend bash -c "python manage.py seed_employees"
docker exec -it payslip_backend bash -c "python manage.py createsuperuser"
chmod -R 755 pdf_separate_intelligent
chmod -R 777 pdf_separate_intelligent