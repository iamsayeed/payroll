from django.db import models

class EmploymentInfo(models.Model):
    id = models.AutoField(primary_key=True)
    employee_number = models.IntegerField()
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    hire_date = models.DateField()
    birth_date = models.DateField(blank=True, null=True)
    marital_status = models.CharField(max_length=50, blank=True, null=True)
    other_info = models.CharField(max_length=255, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    active = models.BooleanField()
    resignation_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.position})"
