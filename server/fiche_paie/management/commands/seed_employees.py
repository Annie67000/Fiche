from django.core.management.base import BaseCommand
from fiche_paie.models import Employe
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Seed the database with sample employees'

    def handle(self, *args, **options):
        self.stdout.write('Seeding employees...')
        employees = [
            {
                'matricule': '90',
                'nom': 'RALOVA',
                'prenom': 'KATTY',
                'email': 'katty.ralova@example.com',
                'departement': 'IT',
                'poste': 'Développeur',
                'actif': True,
            },
            {
                'matricule': '1678',
                'nom': 'FANIRINIAINA',
                'prenom': 'ANJA',
                'email': 'anja.faniriniana@example.com',
                'departement': 'Finance',
                'poste': 'Comptable',
                'actif': True,
            },
            {
                'matricule': '1680',
                'nom': 'LOVATIANA',
                'prenom': 'ANITA',
                'email': 'anita.lovatiana@example.com',
                'departement': 'HR',
                'poste': 'RH Manager',
                'actif': True,
            },
            {
                'matricule': '100',
                'nom': 'RAKOTONIRINA',
                'prenom': 'NOELLAH',
                'email': 'noellah.rakotonirina@example.com',
                'departement': 'Marketing',
                'poste': 'Designer',
                'actif': True,
            },
            {
                'matricule': '1540',
                'nom': 'RAMANANJANAHARY',
                'prenom': 'VANIALA',
                'email': 'vaniala.ramananjanahary@example.com',
                'departement': 'Operations',
                'poste': 'Manager',
                'actif': True,
            },
        ]

        for emp_data in employees:
            matricule = emp_data.pop('matricule')
            nom = emp_data['nom']
            prenom = emp_data['prenom']
            email = emp_data['email']

            # Create user
            username = matricule
            user, user_created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': prenom,
                    'last_name': nom,
                }
            )
            if user_created:
                user.set_password('defaultpassword2025')
                user.save()

            employee, created = Employe.objects.get_or_create(
                matricule=matricule,
                defaults={'user': user, **emp_data}
            )
            if not created and not employee.user:
                employee.user = user
                employee.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully linked user to existing employee {employee}')
                )
            elif created:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created employee {employee}')
                )
            else:
                self.stdout.write(f'Employee {employee} already exists and has user')

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
