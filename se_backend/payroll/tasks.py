import logging
from celery import shared_task
from django.utils.timezone import now
from payroll.models import Payroll
from salary.models import Salary
from earnings.models import Earnings
from totalovertime.models import TotalOvertime
from schedule.models import Schedule
from employment_info.models import EmploymentInfo

logger = logging.getLogger(__name__)

def calculate_gross_pay(earnings, overtime):
    return (
        (overtime.total_overtime if overtime else 0) +
        (earnings.basic_rate if earnings else 0) +
        (earnings.allowance if earnings else 0) +
        (earnings.ntax if earnings else 0)
    )

def calculate_total_deductions(deductions, overtime, sss, philhealth, pagibig):
    return (
        sum([
            (sss.total_employee if sss else 0),
            (philhealth.total_contribution if philhealth else 0),
            (pagibig.employee_share if pagibig else 0),
            (deductions.wtax if deductions else 0),
            (deductions.nowork if deductions else 0),
            (deductions.loan if deductions else 0),
            (deductions.charges if deductions else 0),
            (deductions.msfcloan if deductions else 0)
        ])
    ) + (
        (overtime.total_late if overtime else 0) +
        (overtime.total_undertime if overtime else 0)
    )


@shared_task
def generate_payroll_for_salary(salary_id):
    try:
        salary = Salary.objects.get(id=salary_id)
    except Salary.DoesNotExist:
        logger.error(f"Salary ID {salary_id} not found.")
        return f"Salary ID {salary_id} not found."

    # Now use salary directly (instead of looping)
    earnings = salary.earnings_id
    overtime = salary.overtime_id
    deductions = salary.deductions_id
    sss = salary.sss_id
    philhealth = salary.philhealth_id
    pagibig = salary.pagibig_id
    user_id = salary.user_id
    pay_date = salary.pay_date

    gross_pay = calculate_gross_pay(earnings, overtime)
    total_deductions = calculate_total_deductions(deductions, overtime, sss, philhealth, pagibig)
    net_pay = gross_pay - total_deductions

    schedule = Schedule.objects.filter(
        user_id=user_id,
        payroll_period_end__lt=pay_date
    ).order_by('-payroll_period_end').first()

    employment_info = EmploymentInfo.objects.filter(
        employee_number=user_id.id
    ).first()

    payroll, created = Payroll.objects.update_or_create(
        salary_id=salary,
        defaults={
            "user_id": user_id,
            "gross_pay": gross_pay,
            "total_deductions": total_deductions,
            "net_pay": net_pay,
            "pay_date": pay_date,
            "schedule_id": schedule,
            "employment_info_id": employment_info
        }
    )

    return f"Payroll {'created' if created else 'updated'} for Salary ID {salary.id}"
