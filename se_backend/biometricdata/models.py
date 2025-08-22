from django.db import models

class BiometricData(models.Model):
    id = models.AutoField(primary_key=True)
    emp_id = models.IntegerField()
    name = models.CharField(max_length=255)
    time = models.DateTimeField()
    work_code = models.CharField(max_length=50)
    work_state = models.CharField(max_length=50)
    terminal_name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} - {self.time}"