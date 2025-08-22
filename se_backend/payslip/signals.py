from django.db.models.signals import post_save
from django.dispatch import receiver
from payroll.models import Payroll
from .tasks import generate_payslip_for_payroll

@receiver(post_save, sender=Payroll)
def trigger_payslip_task(sender, instance, created, **kwargs):
    generate_payslip_for_payroll.delay(instance.id)
