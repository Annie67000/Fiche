docker exec -it payslip_backend bash -c "python manage.py seed_employees"
docker exec -it payslip_backend bash -c "python manage.py createsuperuser"