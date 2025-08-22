from django.db import models

from payroll.models import Payroll
from users.models import CustomUser

class Payslip(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    payroll_id = models.ForeignKey(Payroll, on_delete=models.CASCADE, null=True)
    status = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    employee_generated_at = models.DateTimeField(null=True, blank=True)
    is_protected = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.id} - {self.user_id}"