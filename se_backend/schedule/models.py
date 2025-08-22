from django.db import models

from users.models import CustomUser
from shift.models import Shift

from django.contrib.postgres.fields import ArrayField

class Schedule(models.Model):
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    shift_ids = models.ManyToManyField(Shift)
    days = ArrayField(models.CharField(max_length=10, choices=DAYS_OF_WEEK), default=list)
    sickleave = models.DateField(null=True, blank=True)
    regularholiday = ArrayField(models.DateField(), null=True, blank=True)
    specialholiday = ArrayField(models.DateField(), null=True, blank=True)
    nightdiff = ArrayField(models.DateField(), null=True, blank=True)
    oncall = ArrayField(models.DateField(), null=True, blank=True)
    vacationleave = ArrayField(models.DateField(), null=True, blank=True)
    payroll_period_start = models.DateField(null=True, blank=True)
    payroll_period_end = models.DateField(null=True, blank=True)
    hours = models.IntegerField()
    bi_weekly_start = models.DateField()
    restday = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Schedule {self.id} for User {self.user_id}"