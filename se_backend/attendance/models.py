from django.db import models

from biometricdata.models import BiometricData

from users.models import CustomUser

class Attendance(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    date = models.DateField()
    status = models.CharField(max_length=255)
    check_in_time = models.TimeField()
    check_out_time = models.TimeField()

    def __str__(self):
        return f"{self.id} - {self.user_id}"