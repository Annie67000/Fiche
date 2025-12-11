import csv
from django.core.management.base import BaseCommand
from fiche_paie.models import Employe
from django.contrib.auth.models import User
import os

class Command(BaseCommand):
    help = 'Seed the database with employees from CSV file'

    def handle(self, *args, **options):
        self.stdout.write('Seeding employees from CSV...')

        # Path to CSV file (assuming it's in the server directory)
        csv_file_path = os.path.join(os.path.dirname(__file__), '../../../employee_data.csv')

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file_path}'))
            return

        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header

            for row_num, row in enumerate(reader):
                if len(row) < 6:
                    self.stdout.write(self.style.WARNING(f'Row {row_num+1}: Insufficient columns, skipping'))
                    continue

                username, first_name, last_name, email, poste, matricule = row[:6]

                # Skip if matricule or email is empty
                if not matricule or not email:
                    self.stdout.write(self.style.WARNING(f'Row {row_num+1}: Missing matricule or email, skipping'))
                    continue

                # Prepare data
                prenom = first_name.strip()
                nom = last_name.strip()
                poste_clean = poste.strip()
                matricule_clean = matricule.strip()
                email_clean = email.strip()

                # Use username from CSV, or matricule if username is empty
                username_clean = username.strip() if username.strip() else matricule_clean

                try:
                    # Create or get user
                    user, user_created = User.objects.get_or_create(
                        username=username_clean,
                        defaults={
                            'email': email_clean,
                            'first_name': prenom,
                            'last_name': nom,
                        }
                    )
                    if user_created:
                        user.set_password('defaultpassword2025')
                        user.save()
                        self.stdout.write(f'Created user: {username_clean}')

                    # Create or get employee
                    employee, emp_created = Employe.objects.get_or_create(
                        matricule=matricule_clean,
                        defaults={
                            'user': user,
                            'nom': nom,
                            'prenom': prenom,
                            'email': email_clean,
                            'poste': poste_clean,
                            'actif': True,
                        }
                    )
                    if emp_created:
                        self.stdout.write(self.style.SUCCESS(f'Created employee: {employee}'))
                    elif not employee.user:
                        employee.user = user
                        employee.save()
                        self.stdout.write(self.style.SUCCESS(f'Linked user to existing employee: {employee}'))
                    else:
                        self.stdout.write(f'Employee {employee} already exists with user')

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Row {row_num+1}: Error - {str(e)}'))

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
