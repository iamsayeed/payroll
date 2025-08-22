from celery import shared_task
from django.utils.timezone import now
from payslip.models import Payslip
from payroll.models import Payroll

@shared_task
def generate_payslip_for_payroll(payroll_id):
    try:
        payroll = Payroll.objects.get(id=payroll_id)
    except Payroll.DoesNotExist:
        return f"Payroll ID {payroll_id} not found."

    if Payslip.objects.filter(payroll_id=payroll).exists():
        return f"Payslip already exists for Payroll ID {payroll_id}."

    Payslip.objects.create(
        user_id=payroll.user_id,
        payroll_id=payroll,
        status=False,
        approved_at=None,
        generated_at=None,
        is_protected=True
    )

    return f"Payslip created for Payroll ID {payroll_id}."
