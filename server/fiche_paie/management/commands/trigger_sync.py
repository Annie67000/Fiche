from django.core.management.base import BaseCommand
from fiche_paie.tasks import sync_bpm_users_task

class Command(BaseCommand):
    help = 'Trigger BPM user sync via Celery (async)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--now',
            action='store_true',
            help='Run sync directly (not via Celery)',
        )

    def handle(self, *args, **options):
        if options['now']:
            self.stdout.write('Running sync directly...')
            from django.core.management import call_command
            call_command('sync_bpm_users')
        else:
            self.stdout.write('Queueing BPM users sync task to Celery...')
            task = sync_bpm_users_task.delay()
            self.stdout.write(
                self.style.SUCCESS(f'Task queued with ID: {task.id}')
            )
            self.stdout.write('Check task status with: celery -A Backend inspect active')
