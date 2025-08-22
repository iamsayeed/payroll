from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group
from django.db import models
from django.utils.timezone import now
from django.core.exceptions import ValidationError


class CustomUserManager(BaseUserManager):
    def create_user(self, email=None, password=None, role="employee", **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)

        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        # Assign user to corresponding group
        group, _ = Group.objects.get_or_create(name=role)
        user.groups.add(group)

        return user

    def create_superuser(self, email=None, password=None, **extra_fields):
        # Enforce max 2 superusers
        existing = self.model.objects.filter(is_superuser=True).count()
        if existing >= 2:
            raise ValidationError("Cannot create more than 2 superusers.")

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "owner")

        return self.create_user(email=email, password=password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("employee", "Employee"),
    )

    id = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(default=now, editable=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "id"
    REQUIRED_FIELDS = ["email"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # keep groups in sync
        group, _ = Group.objects.get_or_create(name=self.role)
        self.groups.add(group)

    def __str__(self):
        return f"{self.id} - {self.email}"


class UserPasswordReset(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
