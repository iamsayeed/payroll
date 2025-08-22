from django.db import models
from users.models import CustomUser

class SSS(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    msc = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employee_share = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employer_share = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ec_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employer_mpf_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employee_mpf_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_employer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_employee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"user: {self.user.email} ({self.total_contribution})"

class Philhealth(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"user: {self.user.email} ({self.total_contribution})"

class Pagibig(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employee_share = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employer_share = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_contribution = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"user: {self.user.email} ({self.total_contribution})"


