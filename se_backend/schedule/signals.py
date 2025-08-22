from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Schedule


@receiver(post_save, sender=Schedule)
def update_holidays_on_schedule_change(sender, instance, created, **kwargs):
    """
    When a schedule is created or its payroll period changes,
    queue a Celery task to update its holidays.
    """
    from master_calendar.tasks import update_schedule_holidays

    # Check if it's a new schedule or if payroll period fields were updated
    if created or kwargs.get('update_fields') and any(field in kwargs.get('update_fields', [])
                                                      for field in ['payroll_period_start', 'payroll_period_end']):
        update_schedule_holidays.delay(instance.id)