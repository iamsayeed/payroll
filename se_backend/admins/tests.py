from django.test import TestCase
from django.contrib.auth.models import Group
from users.models import CustomUser
from employment_info.models import EmploymentInfo
from .models import Admin
from datetime import date


class AdminModelCRUDTest(TestCase):
    def setUp(self):
        Group.objects.get_or_create(name="admin")

        self.user = CustomUser.objects.create_user(
            email="admin@example.com",
            password="securepassword",
            role="admin"
        )

        self.employment_info = EmploymentInfo.objects.create(
            employee_number=1001,
            first_name="John",
            last_name="Doe",
            position="HR Admin",
            address="123 Tech Street",
            hire_date=date(2023, 1, 1),
            birth_date=date(1990, 5, 15),
            marital_status="Single",
            other_info="N/A",
            active=True
        )

        self.admin = Admin.objects.create(
            user=self.user,
            employment_info=self.employment_info
        )

    def test_create_admin(self):
        self.assertEqual(Admin.objects.count(), 1)
        self.assertEqual(self.admin.user.email, "admin@example.com")
        self.assertEqual(self.admin.employment_info.first_name, "John")

    def test_read_admin(self):
        admin = Admin.objects.get(id=self.admin.id)
        self.assertEqual(str(admin), f"Admin: {self.user.email} ({self.user.role})")

    def test_update_admin_employment_info(self):
        self.admin.employment_info.first_name = "Jane"
        self.admin.employment_info.save()
        updated_admin = Admin.objects.get(id=self.admin.id)
        self.assertEqual(updated_admin.employment_info.first_name, "Jane")

    def test_update_admin_user_email(self):
        self.admin.user.email = "newadmin@example.com"
        self.admin.user.save()
        updated_admin = Admin.objects.get(id=self.admin.id)
        self.assertEqual(updated_admin.user.email, "newadmin@example.com")

    def test_delete_admin(self):
        self.admin.delete()
        self.assertEqual(Admin.objects.count(), 0)

    def test_cascade_delete_user(self):
        self.user.delete()
        self.assertEqual(Admin.objects.count(), 0)

    def test_cascade_delete_employment_info(self):
        self.employment_info.delete()
        self.assertEqual(Admin.objects.count(), 0)
