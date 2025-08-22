import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from datetime import timedelta, date
from .models import Attendance
from attendance_summary.models import AttendanceSummary
from shift.models import Shift
from schedule.models import Schedule

logger = logging.getLogger(__name__)


def calculate_minutes(check_in, check_out):
    """Calculate total worked minutes, deducting a one-hour break if applicable."""
    if not check_in or not check_out:
        return 0

    total_minutes = (check_out.hour * 60 + check_out.minute) - (check_in.hour * 60 + check_in.minute)
    worked_minutes = max(0, total_minutes - 60)

    logger.debug(f"[calculate_minutes] Check-in: {check_in}, Check-out: {check_out}, Worked: {worked_minutes}")
    return worked_minutes


def get_biweekly_period(date, user):
    """
    Get the payroll_period_start of the schedule that includes the given date.
    Prioritizes schedules that start before or on the date, and end after or on the date.
    """
    schedule = Schedule.objects.filter(
        user_id=user,
        payroll_period_start__lte=date,
        payroll_period_end__gte=date
    ).order_by('-payroll_period_start').first()

    if not schedule:
        logger.warning(f"[get_biweekly_period] No matching schedule found for User: {user} on Date: {date}")
        return None

    return schedule.payroll_period_start



def get_shift_details(user, date):
    """Retrieve shift details for the given user and date based on the correct biweekly schedule."""
    schedule = Schedule.objects.filter(
        user_id=user,
        payroll_period_start__lte=date,
        payroll_period_end__gte=date
    ).order_by('-payroll_period_start').first()

    if not schedule:
        logger.warning(
            f"[get_shift_details] No schedule found for User: {user} that includes Date: {date}"
        )
        return None

    shift = Shift.objects.filter(date=date, id__in=schedule.shift_ids.all()).first()

    if not shift:
        logger.warning(
            f"[get_shift_details] No shift found for User: {user}, Date: {date}, in Schedule: {schedule.id}"
        )

    return shift


# add holidays sync. if shift is a special or regular holiday, the dates will be computed and placed in regular and special holidays
# based on the schedule of the employee, check if they have an attendance during the doy of a holiday, if they did, the hours they commited there
# would be placed in the respective fields in attendance summary but its computation won't be included in the other fields like:
# actual_hours = models.IntegerField()
# overtime_hours = models.IntegerField()
# late_minutes = models.IntegerField()
# undertime = models.IntegerField()

@receiver(post_save, sender=Attendance)
def generate_attendance_summary(sender, instance, **kwargs):
    user = instance.user
    date = instance.date
    check_in = instance.check_in_time
    check_out = instance.check_out_time

    logger.debug(f"[generate_attendance_summary] Processing attendance for User: {user}, Date: {date}")

    if not check_in or not check_out or check_in == check_out:
        logger.warning(f"[generate_attendance_summary] Skipping invalid attendance for User: {user}, Date: {date}")
        return

    biweekly_start = get_biweekly_period(date, user)
    shift = get_shift_details(user, date)
    schedule = Schedule.objects.filter(user_id=user, bi_weekly_start=biweekly_start).first()

    if not shift or not schedule:
        logger.warning(f"[generate_attendance_summary] No shift or schedule for User: {user}, Date: {date}. Skipping.")
        return

    actual_minutes = calculate_minutes(check_in, check_out)
    expected_minutes = shift.expected_hours * 60

    logger.debug(f"[generate_attendance_summary] Check-in: {check_in}, Check-out: {check_out}, "
                 f"Actual: {actual_minutes}m, Expected: {expected_minutes}m")

    # Check for holidays
    logger.debug(f"[generate_attendance_summary] Checking for holiday on {date} for User: {user}")
    is_special = date in (schedule.specialholiday or [])
    is_regular = date in (schedule.regularholiday or [])
    logger.debug(f"[generate_attendance_summary] is_special: {is_special}, is_regular: {is_regular}")

    special_minutes = 0
    regular_minutes = 0

    if is_special:
        special_minutes = actual_minutes
        logger.info(f"[generate_attendance_summary] SPECIAL HOLIDAY on {date} — Worked: {special_minutes} minutes")
    elif is_regular:
        regular_minutes = actual_minutes
        logger.info(f"[generate_attendance_summary] REGULAR HOLIDAY on {date} — Worked: {regular_minutes} minutes")

    # If it's a holiday, exclude from regular computations
    if is_special or is_regular:
        actual_minutes = 0
        expected_minutes = 0
        late_minutes = 0
        overtime_minutes = 0
        undertime_minutes = 0
    else:
        shift_start_minutes = shift.shift_start.hour * 60 + shift.shift_start.minute
        check_in_minutes = check_in.hour * 60 + check_in.minute
        late_minutes = max(0, check_in_minutes - shift_start_minutes)
        overtime_minutes = max(0, actual_minutes - expected_minutes)
        undertime_minutes = max(0, expected_minutes - actual_minutes)

        logger.debug(f"[generate_attendance_summary] Late: {late_minutes}m, OT: {overtime_minutes}m, "
                     f"UT: {undertime_minutes}m")

    # Sum up totals for biweekly
    biweekly_attendance = Attendance.objects.filter(
        user=user,
        date__gte=biweekly_start,
        date__lt=biweekly_start + timedelta(days=15)
    )

    total_actual_minutes = 0
    total_overtime_minutes = 0
    total_late_minutes = 0
    total_undertime_minutes = 0
    total_special_minutes = 0
    total_regular_minutes = 0

    for att in biweekly_attendance:
        att_shift = get_shift_details(user, att.date)
        att_schedule = Schedule.objects.filter(user_id=user, bi_weekly_start=biweekly_start).first()

        if not att_shift or not att_schedule:
            logger.warning(f"[generate_attendance_summary] Skipping attendance on {att.date} due to missing shift or schedule.")
            continue

        worked_minutes = calculate_minutes(att.check_in_time, att.check_out_time)

        logger.debug(f"[generate_attendance_summary] Processing {att.date} — Worked: {worked_minutes}m")

        if att.date in (att_schedule.specialholiday or []):
            total_special_minutes += worked_minutes
            logger.info(f"[generate_attendance_summary] Adding {worked_minutes}m to SPECIAL HOLIDAY total for {att.date}")
            continue

        if att.date in (att_schedule.regularholiday or []):
            total_regular_minutes += worked_minutes
            logger.info(f"[generate_attendance_summary] Adding {worked_minutes}m to REGULAR HOLIDAY total for {att.date}")
            continue

        expected = att_shift.expected_hours * 60
        total_actual_minutes += worked_minutes
        total_overtime_minutes += max(0, worked_minutes - expected)
        total_late_minutes += max(0, (att.check_in_time.hour * 60 + att.check_in_time.minute) -
                                   (att_shift.shift_start.hour * 60 + att_shift.shift_start.minute))
        total_undertime_minutes += max(0, expected - worked_minutes)

    logger.debug(f"[generate_attendance_summary] FINAL BIWEEKLY TOTALS — "
                 f"Actual: {total_actual_minutes}m, OT: {total_overtime_minutes}m, "
                 f"Late: {total_late_minutes}m, UT: {total_undertime_minutes}m, "
                 f"Special: {total_special_minutes}m, Regular: {total_regular_minutes}m")

    # Save summary
    summary, _ = AttendanceSummary.objects.update_or_create(
        user_id=user,
        date=biweekly_start,
        defaults={
            'actual_hours': total_actual_minutes // 60,
            'overtime_hours': total_overtime_minutes // 60,
            'late_minutes': total_late_minutes,
            'undertime': total_undertime_minutes // 60,
            'specialholiday': total_special_minutes // 60,
            'regularholiday': total_regular_minutes // 60,
            'attendance_id': instance
        }
    )

    logger.info(f"[generate_attendance_summary] AttendanceSummary UPDATED for User: {user}, Start: {biweekly_start}")
