from django.test import TestCase
from employment_info.models import EmploymentInfo
from datetime import date


class EmploymentInfoModelTestCase(TestCase):

    def setUp(self):
        # Creating a test EmploymentInfo instance
        self.employment_info = EmploymentInfo.objects.create(
            employee_number=12345,
            first_name="John",
            last_name="Doe",
            position="Developer",
            address="123 Street",
            hire_date=date(2021, 1, 1),
            active=True
        )

    def test_create_employment_info(self):
        self.assertEqual(EmploymentInfo.objects.count(), 1)
        self.assertEqual(self.employment_info.first_name, "John")
        self.assertEqual(self.employment_info.position, "Developer")
        self.assertEqual(str(self.employment_info), "John Doe (Developer)")

    def test_read_employment_info(self):
        emp_info = EmploymentInfo.objects.get(id=self.employment_info.id)
        self.assertEqual(emp_info.first_name, "John")
        self.assertEqual(emp_info.last_name, "Doe")

    def test_update_employment_info(self):
        self.employment_info.position = "Senior Developer"
        self.employment_info.save()
        updated_emp_info = EmploymentInfo.objects.get(id=self.employment_info.id)
        self.assertEqual(updated_emp_info.position, "Senior Developer")

    def test_delete_employment_info(self):
        self.employment_info.delete()
        self.assertEqual(EmploymentInfo.objects.count(), 0)
