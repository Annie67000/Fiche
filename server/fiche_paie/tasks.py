from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

@shared_task
def sync_bpm_users_task():
    """
    Celery task to sync BPM users asynchronously
    """
    try:
        logger.info("Starting BPM users sync task...")
        call_command('sync_bpm_users')
        logger.info("BPM users sync task completed successfully.")
        return {"status": "SUCCESS", "message": "Sync completed"}
    except Exception as e:
        logger.error(f"Error in BPM users sync task: {e}")
        raise
