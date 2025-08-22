from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import MasterCalendar, MasterCalendarPayroll


@receiver([post_save], sender=MasterCalendar)
def trigger_holiday_update(sender, instance, created, **kwargs):
    """
    Signal handler to trigger a Celery task when a holiday is added or updated.
    """
    from .tasks import update_schedules_for_holiday
    update_schedules_for_holiday.delay(instance.id)

@receiver([post_delete], sender=MasterCalendar)
def trigger_full_update_on_delete(sender, instance, **kwargs):
    """
    Signal handler to trigger a full update when a holiday is deleted
    since we need to remove it from all schedules.
    """
    from .tasks import sync_holidays_for_new_calendar_entries
    sync_holidays_for_new_calendar_entries.delay()

@receiver([post_save], sender=MasterCalendarPayroll)
def trigger_create_biweekly(sender, instance, **kwargs):
    from schedule.tasks import create_biweekly_schedules
    create_biweekly_schedules.delay()