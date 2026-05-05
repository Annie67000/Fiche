from django.core.management.base import BaseCommand, CommandError

from fiche_paie.ldap_auth import (
    LDAPUnavailable,
    fetch_all_ldap_users,
    sync_user_from_ldap,
)


class Command(BaseCommand):
    help = "Import all LDAP users into auth_user and Employe tables."

    def add_arguments(self, parser):
        parser.add_argument(
            '--filter',
            default='(mail=*)',
            help='LDAP search filter (default: (mail=*))',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='List entries without writing to the database',
        )

    def handle(self, *args, **options):
        try:
            entries = fetch_all_ldap_users(options['filter'])
        except LDAPUnavailable as exc:
            raise CommandError(f'LDAP unavailable: {exc}')

        self.stdout.write(f'Found {len(entries)} LDAP entries')

        if options['dry_run']:
            for entry in entries:
                self.stdout.write(
                    f"- {entry.get('mail')} | uid={entry.get('uid')} "
                    f"| matricule={entry.get('employeeNumber')} "
                    f"| poste={entry.get('employeeType') or entry.get('title')}"
                )
            return

        created = updated = skipped = 0
        for entry in entries:
            if not entry.get('mail'):
                skipped += 1
                continue
            try:
                _, _, was_created = sync_user_from_ldap(entry)
                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception as exc:
                skipped += 1
                self.stderr.write(f"skipped {entry.get('mail')}: {exc}")

        self.stdout.write(self.style.SUCCESS(
            f'Done. created={created} updated={updated} skipped={skipped}'
        ))
