import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from .models import AttendanceSummary
from overtimehours.models import OvertimeHours
from schedule.models import Schedule

# Initialize logger
logger = logging.getLogger(__name__)


def update_overtime_hours(attendance_summary):
    """
    Function to create or update an OvertimeHours instance for each new biweekly period.
    """
    attendance_summary.refresh_from_db()

    user = attendance_summary.user_id
    overtime_hours = attendance_summary.overtime_hours
    late = attendance_summary.late_minutes
    undertime = attendance_summary.undertime
    regularholiday_hours = attendance_summary.regularholiday
    specialholiday_hours = attendance_summary.specialholiday
    biweek_start = attendance_summary.date
    actual_hours = attendance_summary.actual_hours

    logger.info(f"Processing OvertimeHours for User {user.id} | AttendanceSummary ID {attendance_summary.id} | "
                f"Biweek Start: {biweek_start} | Overtime Hours: {overtime_hours} | Late: {late} | Undertime: {undertime}")

    # Fetch Schedule for the same user
    schedule = Schedule.objects.filter(
        user_id=user,
        payroll_period_start__lte=biweek_start,
        payroll_period_end__gte=biweek_start
    ).order_by('-payroll_period_start').first()

    if schedule:
        logger.info(f"Schedule found for User {user.id}: Schedule ID {schedule.id}")
    else:
        logger.warning(f"No Schedule found for User {user.id}. Skipping holiday calculations.")


    # night differential hours
    nightdiff_hours = len(schedule.nightdiff) * 8 if schedule and schedule.nightdiff else 0
    restday_hours = schedule.restday if schedule and schedule.restday else 0


    logger.info(f"Computed Overtime Details for User {user.id}:"
                f"Actual Hours: {actual_hours},"
                f"Regular Holiday Hours: {regularholiday_hours}, "
                f"Special Holiday Hours: {specialholiday_hours}, "
                f"Night Differential Hours: {nightdiff_hours}, "
                f"Rest Day Hours: {restday_hours}")

    # Check if an OvertimeHours instance exists for the current biweekly period
    overtime, created = OvertimeHours.objects.get_or_create(
        attendancesummary=attendance_summary,
        user=user,
        biweek_start=biweek_start,
        defaults={
            "actualhours": actual_hours,
            "regularot": overtime_hours,
            "regularholiday": regularholiday_hours,
            "specialholiday": specialholiday_hours,
            "nightdiff": nightdiff_hours,
            "restday": restday_hours,
            "late": late,
            "undertime": undertime
        }
    )

    if created:
        logger.info(f"Created new OvertimeHours ID {overtime.id} for AttendanceSummary ID {attendance_summary.id} | Biweek Start: {biweek_start}")
    else:
        # If the record already exists, update it
        overtime.actualhours = actual_hours
        overtime.regularot = overtime_hours
        overtime.regularholiday = regularholiday_hours
        overtime.specialholiday = specialholiday_hours
        overtime.nightdiff = nightdiff_hours
        overtime.restday = restday_hours
        overtime.late = late
        overtime.undertime = undertime
        overtime.save()
        logger.info(f"Updated OvertimeHours ID {overtime.id} with new overtime values.")

@receiver(post_save, sender=AttendanceSummary)
def handle_attendance_summary_save(sender, instance, update_fields=None, **kwargs):
    """
    Signal triggered when AttendanceSummary is created or updated.
    Only updates if overtime_hours is actually modified.
    """
    if update_fields is None or "overtime_hours" in update_fields:
        update_overtime_hours(instance)

@receiver(post_save, sender=Schedule)
def handle_schedule_update(sender, instance, **kwargs):
    """
    Signal triggered when a Schedule is updated.
    It creates or updates OvertimeHours entries for the new biweekly period without modifying past ones.
    """
    logger.info(f"Schedule updated for User {instance.user_id.id}: Processing OvertimeHours for the new biweekly period...")

    # Get all attendance summaries for the user
    attendance_summaries = AttendanceSummary.objects.filter(user_id=instance.user_id)

    for attendance_summary in attendance_summaries:
        update_overtime_hours(attendance_summary)

    logger.info(f"OvertimeHours updated for the new biweekly period for User {instance.user_id.id}")
