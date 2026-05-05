# Docker Commands for User Sync

## Prerequisites

Make sure all required environment variables are set in `server/.env`:
```env
BPM_DB_NAME=bpm_db_name
BPM_DB_USER=bpm_user
BPM_DB_PASSWORD=bpm_password
BPM_DB_HOST=bpm_host_ip
BPM_DB_PORT=5432
REDIS_URL=redis://redis:6379/2
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

## Docker Commands

### 1. Start all services (including the Celery worker)
```bash
docker-compose up -d --build
```

This will start:
- `postgres` - PostgreSQL database
- `redis` - Redis for Celery broker and caching
- `backend` - Django backend
- `backend-worker` - Celery worker for async tasks
- `frontend` - React frontend
- `pdf-separate` - PDF processor
- `worker` - PDF processor Celery worker

### 2. Run user sync via Celery (Async - Recommended)
```bash
# Trigger sync task via management command (queues to Celery)
docker-compose exec backend python manage.py trigger_sync

# Or trigger directly using Django shell
docker-compose exec backend python manage.py shell -c "from fiche_paie.tasks import sync_bpm_users_task; sync_bpm_users_task.delay()"
```

### 3. Run sync directly (Synchronous)
```bash
# Run sync directly without Celery
docker-compose exec backend python manage.py sync_bpm_users

# Or use the trigger_sync command with --now flag
docker-compose exec backend python manage.py trigger_sync --now
```

### 4. Monitor Celery Worker
```bash
# Check Celery worker logs
docker-compose logs -f backend-worker

# Check active tasks
docker-compose exec backend-worker celery -A Backend inspect active

# Check worker status
docker-compose exec backend-worker celery -A Backend status
```

### 5. Check Redis Cache
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check cached user sync keys
redis-cli> KEYS bpm_user_sync:*

# Check specific user cache
redis-cli> GET bpm_user_sync:123
```

### 6. Example Output

**Successful sync via Celery:**
```
Starting BPM user sync...
✓ Redis connected
✓ BPMDB connected
Found 150 active users in BPMDB

==================================================
Sync complete!
Synced (new): 12
Updated: 3
Skipped (unchanged): 135
==================================================
```

## Troubleshooting

### Celery worker not picking up tasks:
```bash
# Restart the worker
docker-compose restart backend-worker

# Check if Redis is running
docker-compose ps redis
```

### Database connection issues:
```bash
# Test BPMDB connection from backend container
docker-compose exec backend python -c "import psycopg2; conn = psycopg2.connect(dbname='bpm_db', user='bpm_user', password='xxx', host='bpm_host'); print('Connected!')"
```

### Check environment variables in container:
```bash
docker-compose exec backend env | grep BPM_
docker-compose exec backend env | grep REDIS
```
