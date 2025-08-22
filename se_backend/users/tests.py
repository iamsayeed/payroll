from django.test import TestCase
from users.models import CustomUser, UserPasswordReset
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

class CustomUserModelTestCase(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com", password="password123", role="employee"
        )

    def test_create_user(self):
        """Test creating a user with email and password"""
        self.assertEqual(CustomUser.objects.count(), 1)
        self.assertEqual(self.user.email, "testuser@example.com")
        self.assertTrue(self.user.check_password("password123"))

    def test_create_superuser(self):
        """Test creating a superuser"""
        superuser = CustomUser.objects.create_superuser(
            email="superuser@example.com", password="superpassword"
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_user_group_assignment(self):
        """Test that user is assigned to a group based on role"""
        self.assertTrue(self.user.groups.filter(name="employee").exists())

    def test_superuser_limit_enforced(self):
        """Test that creating more than two superusers raises ValidationError."""
        # First superuser (expected: success)
        CustomUser.objects.create_superuser(
            email="super1@example.com", password="pass1234"
        )

        # Second superuser (expected: success)
        CustomUser.objects.create_superuser(
            email="super2@example.com", password="pass5678"
        )

        # Third superuser (should prompt the fail/error)
        with self.assertRaises(ValidationError) as cm:
            CustomUser.objects.create_superuser(
                email="super3@example.com", password="pass9012"
            )
        self.assertIn("Cannot create more than 2 superusers", str(cm.exception))

class UserPasswordResetModelTestCase(TestCase):

    def setUp(self):
        self.password_reset = UserPasswordReset.objects.create(
            email="testuser@example.com", token="reset-token-123"
        )

    def test_password_reset_expiry(self):
        """Test that the token expires after 24 hours"""
        # Check that a newly created token is not expired (less than 24 hours old)
        self.assertFalse(
            timezone.now() > self.password_reset.created_at + timezone.timedelta(hours=24)
        )

        # Simulate passing 25 hours by modifying created_at
        self.password_reset.created_at = self.password_reset.created_at - timezone.timedelta(hours=25)
        self.password_reset.save()

        # Check that the token is now expired (more than 24 hours old)
        self.assertTrue(
            timezone.now() > self.password_reset.created_at + timezone.timedelta(hours=24)
        )