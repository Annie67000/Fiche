import os
import hashlib
import json
import psycopg2
import redis
from dotenv import load_dotenv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from fiche_paie.models import Employe


class Command(BaseCommand):
    help = "Sync active users from BPMDB auth_user to Payslip annie_db (with Redis caching)"

    def handle(self, *args, **options):
        # Load .env from server/.env (BASE_DIR is server/)
        BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
        load_dotenv(BASE_DIR / ".env")

        self.stdout.write(self.style.SUCCESS("Starting BPM user sync..."))

        # 1. Connect to Redis for caching
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/2")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            self.stdout.write("✓ Redis connected")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Redis connection failed: {e}"))
            self.redis_client = None

        # 2. Connect to source BPMDB and fetch active users
        source_users = self.fetch_bpm_active_users()
        if not source_users:
            self.stdout.write(self.style.WARNING("No active users found in BPMDB"))
            return

        self.stdout.write(f"Found {len(source_users)} active users in BPMDB")

        # 3. Sync each user to target DB
        synced_count = 0
        updated_count = 0
        skipped_count = 0

        for user_data in source_users:
            try:
                result = self.sync_single_user(user_data)
                if result == "synced":
                    synced_count += 1
                elif result == "updated":
                    updated_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error syncing user {user_data.get("username")}: {e}'
                    )
                )

        # 4. Print summary
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS(f"Sync complete!"))
        self.stdout.write(f"Synced (new): {synced_count}")
        self.stdout.write(f"Updated: {updated_count}")
        self.stdout.write(f"Skipped (unchanged): {skipped_count}")
        self.stdout.write("=" * 50)

    def fetch_bpm_active_users(self):
        """Fetch all active users from BPMDB auth_user table"""
        try:
            # Read source DB config from .env
            conn = psycopg2.connect(
                dbname=os.getenv("BPM_DB_NAME"),
                user=os.getenv("BPM_DB_USER"),
                password=os.getenv("BPM_DB_PASSWORD"),
                host=os.getenv("BPM_DB_HOST"),
                port=os.getenv("BPM_DB_PORT", 5432),
            )
            self.stdout.write("✓ BPMDB connected")

            with conn.cursor() as cursor:
                # Only fetch active users as requested
                cursor.execute("""
                    SELECT id, username, first_name, last_name, email,
                           is_active, is_staff, date_joined, last_login
                    FROM auth_user 
                    WHERE is_active = TRUE
                """)
                columns = [desc[0] for desc in cursor.description]
                users = [dict(zip(columns, row)) for row in cursor.fetchall()]

            conn.close()
            return users

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ BPMDB connection failed: {e}"))
            return []

    def sync_single_user(self, user_data):
        """Sync a single user with Redis caching for performance"""
        user_id = user_data["id"]

        # 1. Compute hash of current user data for change detection
        user_hash = hashlib.md5(json.dumps(user_data, default=str).encode()).hexdigest()

        # 2. Check Redis cache if available
        cache_key = f"bpm_user_sync:{user_id}"
        if self.redis_client:
            cached_hash = self.redis_client.get(cache_key)
            if cached_hash == user_hash:
                return "skipped"  # No changes, skip

        # 3. Sync to Django User model (target DB)
        user, created = User.objects.update_or_create(
            id=user_id,
            defaults={
                "username": user_data["username"],
                "first_name": user_data["first_name"] or "",
                "last_name": user_data["last_name"] or "",
                "email": user_data["email"] or "",
                "is_active": user_data["is_active"],
                "is_staff": user_data["is_staff"],
                "date_joined": user_data["date_joined"],
                "last_login": user_data["last_login"] or user_data["date_joined"],
            },
        )

        # 4. Sync Employe profile
        Employe.objects.update_or_create(
            user=user,
            defaults={
                "matricule": user.username,
                "nom": user.last_name or user.username,
                "prenom": user.first_name or "",
                "email": user.email or "",
                "actif": user.is_active,
                "departement": "",  # Add if available in source
                "poste": "",  # Add if available in source
            },
        )

        # 5. Update Redis cache
        if self.redis_client:
            self.redis_client.set(cache_key, user_hash, ex=86400)  # Cache for 24h

        return "synced" if created else "updated"
