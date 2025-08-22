import logging
from celery import shared_task
from django.utils import timezone
from users.models import CustomUser
from .models import Schedule
from employment_info.models import EmploymentInfo
from master_calendar.models import MasterCalendarPayroll

# Configure logger
logger = logging.getLogger(__name__)

@shared_task
def create_biweekly_schedules():
    active_employees = EmploymentInfo.objects.filter(active=True)
    logger.info(f"Creating bi-weekly schedules for {active_employees.count()} active employees.")

    # Get all payroll periods from the master calendar (no filtering by today's date)
    starts_and_ends = MasterCalendarPayroll.objects.all().order_by('payroll_period_start')

    # Debug: Log the result of the query
    logger.info(f"Found {starts_and_ends.count()} payroll period entries in MasterCalendar.")

    if not starts_and_ends:
        logger.warning("No payroll period entries found in MasterCalendar.")
        return

    # Ensure there is at least one period, and pair the payroll start and end dates together
    periods = [(entry.payroll_period_start, entry.payroll_period_end) for entry in starts_and_ends]

    # If only one period is found, use that period for all employees
    if len(periods) == 1:
        periods.append(periods[0])  # Add the same period again to ensure two pairs are generated

    for employee in active_employees:
        try:
            user = CustomUser.objects.get(id=employee.employee_number)
        except CustomUser.DoesNotExist:
            logger.warning(f"CustomUser not found for employee number: {employee.employee_number}")
            continue

        for start, end in periods:
            exists = Schedule.objects.filter(
                user_id=user,
                payroll_period_start=start,
                payroll_period_end=end
            ).exists()

            if not exists:
                Schedule.objects.create(
                    user_id=user,
                    payroll_period_start=start,
                    payroll_period_end=end,
                    bi_weekly_start=start,
                    hours=0
                )
                logger.info(f"Created schedule for user {user.id}: {start} - {end}")
            else:
                logger.debug(f"Schedule already exists for user {user.id}: {start} - {end}")
