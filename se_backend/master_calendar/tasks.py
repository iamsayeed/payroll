from celery import shared_task
from django.db.models import Q
from django.utils import timezone
from .models import MasterCalendar
from schedule.models import Schedule
from datetime import datetime, timedelta

@shared_task
def update_schedule_holidays(schedule_id=None):
    """
    Updates a single schedule's holiday arrays based on the master calendar.
    If schedule_id is None, update all schedules.
    """

    if schedule_id:
        schedules = Schedule.objects.filter(id=schedule_id)
    else:
        schedules = Schedule.objects.filter(
            Q(payroll_period_start__isnull=False) &
            Q(payroll_period_end__isnull=False)
        )

    updated_count = 0
    for schedule in schedules:
        # Get all holidays within the schedule's payroll period
        holidays = MasterCalendar.objects.filter(
            date__gte=schedule.payroll_period_start,
            date__lte=schedule.payroll_period_end
        )

        # Reset holiday arrays
        schedule.regularholiday = []
        schedule.specialholiday = []

        # Fill in the arrays with appropriate holidays
        for holiday in holidays:
            if holiday.holiday_type == 'regular':
                if schedule.regularholiday is None:
                    schedule.regularholiday = [holiday.date]
                else:
                    schedule.regularholiday.append(holiday.date)
            elif holiday.holiday_type == 'special':
                if schedule.specialholiday is None:
                    schedule.specialholiday = [holiday.date]
                else:
                    schedule.specialholiday.append(holiday.date)

        # Save the updated schedule
        schedule.save(update_fields=['regularholiday', 'specialholiday'])
        updated_count += 1

    return f"Updated holidays for {updated_count} schedules"


@shared_task
def sync_holidays_for_new_calendar_entries():
    """
    Check for holiday calendar entries created in the last 24 hours and
    update all relevant schedules.
    This task should be scheduled to run daily.
    """

    one_day_ago = timezone.now().date() - timezone.timedelta(days=1)
    recent_holidays = MasterCalendar.objects.filter(
        Q(date__gte=one_day_ago) | Q(date_modified__gte=one_day_ago)
    )

    for holiday in recent_holidays:
        update_schedules_for_holiday.delay(holiday.id)

    return f"Processed {recent_holidays.count()} recent holiday updates"


@shared_task
def update_schedules_for_holiday(holiday_id):
    """
    Update all schedules that should include a specific holiday.
    """

    try:
        holiday = MasterCalendar.objects.get(id=holiday_id)
    except MasterCalendar.DoesNotExist:
        return "Holiday not found"

    # Find all schedules that include this holiday's date in their payroll period
    affected_schedules = Schedule.objects.filter(
        payroll_period_start__lte=holiday.date,
        payroll_period_end__gte=holiday.date
    )

    for schedule in affected_schedules:
        update_schedule_holidays.delay(schedule.id)

    return f"Triggered updates for {affected_schedules.count()} schedules"