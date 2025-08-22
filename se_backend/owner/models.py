from django.db import models
from users.models import CustomUser

class Owner(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    permissions = models.CharField(max_length=255) # holds tentative value, may change in later stages

    def __str__(self):
        return f"Owner: {self.user.email} ({self.permissions})"