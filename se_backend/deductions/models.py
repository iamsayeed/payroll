from django.db import models

from attendance_summary.models import AttendanceSummary
from users.models import CustomUser

class Deductions(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    wtax = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    nowork = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    loan = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    charges = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    msfcloan =models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f"{self.id} - {self.user_id}"