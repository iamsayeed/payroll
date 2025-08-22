from django.db import models
from overtimehours.models import OvertimeHours
from users.models import CustomUser


class TotalOvertime(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    total_regularot = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_regularholiday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_specialholiday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_restday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_nightdiff = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_backwage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_overtime = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    total_late = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_undertime = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    biweek_start = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.total_overtime is None:
            self.total_overtime = (
                self.total_regularot +
                self.total_regularholiday +
                self.total_specialholiday +
                self.total_restday +
                self.total_nightdiff +
                self.total_backwage
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id} - {self.user.email}"