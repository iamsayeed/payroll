from django.db.models.signals import post_save
from django.dispatch import receiver
from salary.models import Salary
from .tasks import generate_payroll_for_salary

@receiver(post_save, sender=Salary)
def trigger_payroll_task(sender, instance, created, **kwargs):
    generate_payroll_for_salary.delay(instance.id)
