from django.db import models

from attendance_summary.models import AttendanceSummary
from users.models import CustomUser

class Earnings(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    basic_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    basic = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    allowance = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ntax = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    vacationleave = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sickleave = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)


    def __str__(self):
        return f"{self.id} - {self.user_id}"