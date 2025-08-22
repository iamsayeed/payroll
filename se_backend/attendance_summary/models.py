from django.db import models

from attendance.models import Attendance
from users.models import CustomUser


class AttendanceSummary(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    attendance_id = models.ForeignKey(Attendance, on_delete=models.CASCADE)
    date = models.DateField()
    actual_hours = models.IntegerField()
    overtime_hours = models.IntegerField()
    late_minutes = models.IntegerField()
    undertime = models.IntegerField()
    specialholiday = models.IntegerField(null=True)
    regularholiday = models.IntegerField(null=True)

    def __str__(self):
        return f"{self.id} - {self.user_id}"