from django.test import TestCase
from totalpayroll.models import TotalPayroll
from datetime import date

class TotalPayrollModelTestCase(TestCase):

    def setUp(self):
        # Create a sample TotalPayroll record
        self.total_payroll = TotalPayroll.objects.create(
            previous_payroll=1500.00,
            previous_paydate=date(2025, 3, 31),
            upcoming_payroll=1600.00,
            upcoming_paydate=date(2025, 4, 30)
        )

    def test_create_total_payroll(self):
        """Test the creation of a TotalPayroll instance"""
        self.assertEqual(TotalPayroll.objects.count(), 1)
        self.assertEqual(self.total_payroll.previous_payroll, 1500.00)
        self.assertEqual(self.total_payroll.upcoming_payroll, 1600.00)

    def test_total_payroll_str_method(self):
        """Test the __str__ method"""
        expected_str = f"{self.total_payroll.id} - {self.total_payroll.previous_payroll} - {self.total_payroll.previous_paydate} - {self.total_payroll.upcoming_payroll} - {self.total_payroll.upcoming_paydate}"
        self.assertEqual(str(self.total_payroll), expected_str)

    def test_update_total_payroll(self):
        """Test updating a TotalPayroll record"""
        self.total_payroll.previous_payroll = 1550.00
        self.total_payroll.save()
        self.assertEqual(self.total_payroll.previous_payroll, 1550.00)

    def test_delete_total_payroll(self):
        """Test deleting a TotalPayroll instance"""
        self.total_payroll.delete()
        self.assertEqual(TotalPayroll.objects.count(), 0)
