from django.db import models


class Shift(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateField()
    shift_start = models.TimeField()
    shift_end = models.TimeField()
    expected_hours = models.IntegerField()

    def __str__(self):
        return f"{self.id} - {self.shift_start} - {self.shift_end}"