from django.db import models
from users.models import CustomUser

class OvertimeBase(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    backwage_base = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.id} - {self.user_id}"