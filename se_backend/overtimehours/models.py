from django.db import models
from attendance_summary.models import AttendanceSummary
from users.models import CustomUser

class OvertimeHours(models.Model):
    id = models.AutoField(primary_key=True)
    attendancesummary = models.ForeignKey(AttendanceSummary, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    actualhours = models.IntegerField(null=True, blank=True)
    regularot = models.IntegerField(default=0)
    regularholiday = models.IntegerField(default=0)
    specialholiday = models.IntegerField(default=0)
    restday = models.IntegerField(default=0)
    nightdiff = models.IntegerField(default=0)
    backwage = models.IntegerField(default=0)
    late = models.IntegerField(default=0)
    undertime = models.IntegerField(default=0)
    biweek_start = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.id} - {self.user} - {self.biweek_start}"
