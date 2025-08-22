from django.db import models
from employment_info.models import EmploymentInfo
from users.models import CustomUser

class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    employment_info = models.OneToOneField(EmploymentInfo, on_delete=models.CASCADE)

    def __str__(self):
        return f"Employee: {self.user.email} ({self.user.role})"