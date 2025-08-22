from celery import shared_task
from django.utils.timezone import now
from datetime import datetime, timedelta
import logging
from users.models import CustomUser
from salary.models import Salary
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime
from benefits.models import SSS, Philhealth, Pagibig
from schedule.models import Schedule

# Configure logging
logger = logging.getLogger(__name__)


@shared_task
def generate_salary_entries():
    today = now().date()
    logger.info(f"Starting salary entry generation process on {today}")
    users = CustomUser.objects.filter(is_active=True)
    logger.info(f"Found {users.count()} active users.")

    for user in users:
        logger.info(f"Processing salary for user: {user.id} - {user.email}")

        latest_earnings = Earnings.objects.filter(user=user).order_by('-id').first()
        latest_deductions = Deductions.objects.filter(user=user).order_by('-id').first()
        latest_sss = SSS.objects.filter(user=user).order_by('-id').first()
        latest_philhealth = Philhealth.objects.filter(user=user).order_by('-id').first()
        latest_pagibig = Pagibig.objects.filter(user=user).order_by('-id').first()

        if not latest_earnings:
            logger.warning(f"No earnings found for user: {user.id}")
        if not latest_deductions:
            logger.warning(f"No deductions found for user: {user.id}")
        if not latest_sss:
            logger.warning(f"No sss found for user: {user.id}")
        if not latest_philhealth:
            logger.warning(f"No philhealth found for user: {user.id}")
        if not latest_pagibig:
            logger.warning(f"No pagibig found for user: {user.id}")

        overtime_entries = TotalOvertime.objects.filter(user=user).order_by('-biweek_start')[:2]
        logger.info(f"Found {overtime_entries.count()} overtime entries for user: {user.id}")

        for overtime in overtime_entries:
            biweek_start = overtime.biweek_start

            # Find the schedule with the matching bi_weekly_start
            try:
                schedule = Schedule.objects.filter(
                    user_id=user,
                    bi_weekly_start=biweek_start
                ).first()

                if not schedule:
                    logger.warning(f"No schedule found for user {user.id} with bi_weekly_start {biweek_start}")
                    continue

                payroll_period_end = schedule.payroll_period_end
                if not payroll_period_end:
                    logger.warning(f"Schedule for user {user.id} has no payroll_period_end")
                    continue

                # Determine pay date based on payroll_period_end
                if payroll_period_end.day < 15:
                    # If before the 15th, pay date is the 15th of the same month
                    pay_date = datetime(payroll_period_end.year, payroll_period_end.month, 15).date()
                else:
                    # If on or after the 15th, pay date is the last day of the month
                    next_month = datetime(payroll_period_end.year, payroll_period_end.month, 1) + timedelta(days=32)
                    pay_date = next_month.replace(day=1) - timedelta(days=1)

                logger.info(
                    f"Determined pay date {pay_date} for user: {user.id} (payroll period end: {payroll_period_end})")

            except Exception as e:
                logger.error(f"Error determining pay date for user {user.id}: {str(e)}")
                continue

            if Salary.objects.filter(user_id=user.id, pay_date=pay_date).exists():
                logger.info(f"Salary entry already exists for user: {user.id} on {pay_date}. Skipping.")
                continue

            Salary.objects.create(
                user_id=user,
                earnings_id=latest_earnings,
                deductions_id=latest_deductions,
                overtime_id=overtime,
                sss_id=latest_sss,
                philhealth_id=latest_philhealth,
                pagibig_id=latest_pagibig,
                pay_date=pay_date
            )
            logger.info(f"Salary entry created for user: {user.id} on {pay_date}")

    logger.info("Salary entry generation process completed.")
    return "Salary entries checked and generated."