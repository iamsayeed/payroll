import uuid

from django.db import models


class BaseModel(models.Model):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def readable_created_at(self):
        return self.created_at.strftime('%Y-%m-%d %H:%M:%S')

    def readable_updated_at(self):
        return self.updated_at.strftime('%Y-%m-%d %H:%M:%S')

    class Meta:
        abstract = True
