from django.db import models


class TotalPayroll(models.Model):
    id = models.AutoField(primary_key=True)
    previous_payroll = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    previous_paydate = models.DateField(null=True, blank=True)
    upcoming_payroll = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    upcoming_paydate = models.DateField(null=True, blank=True)


    def __str__(self):
        return f"{self.id} - {self.previous_payroll} - {self.previous_paydate} - {self.upcoming_payroll} - {self.upcoming_paydate}"
