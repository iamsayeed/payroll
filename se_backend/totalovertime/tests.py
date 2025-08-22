from django.test import TestCase
from totalovertime.models import TotalOvertime
from users.models import CustomUser
from datetime import date
from decimal import Decimal

class TotalOvertimeModelTestCase(TestCase):

    def setUp(self):
        # Create a sample user
        self.user = CustomUser.objects.create(email="testuser@example.com", password="password")

        # Create a sample TotalOvertime record
        self.total_overtime = TotalOvertime.objects.create(
            user=self.user,
            total_regularot=2.5,
            total_regularholiday=1.0,
            total_specialholiday=0.5,
            total_restday=1.0,
            total_nightdiff=0.0,
            total_backwage=0.0,
            total_late=5.0,  # Changed from 0.0 to 5.0 to match the test assertion
            total_undertime=0.0,
            biweek_start=date(2025, 4, 1)
        )
        # Refresh from database to ensure calculated fields are updated
        self.total_overtime.refresh_from_db()

    def test_create_total_late(self):
        """Test the creation of a TotalOvertime instance"""
        self.assertEqual(TotalOvertime.objects.count(), 1)
        self.assertEqual(self.total_overtime.total_late, 5.0)  # Now correctly set in setUp



    def test_update_total_overtime(self):
        """Test updating total_overtime after changing fields"""
        # Use Decimal instead of float
        self.total_overtime.total_regularot = Decimal('3.0')  # Changed from float to Decimal
        self.total_overtime.total_overtime = None  # Force recalculation
        self.total_overtime.save()
        self.total_overtime.refresh_from_db()  # Refresh to get updated values
        # Total should now be: 3.0 + 1.0 + 0.5 + 1.0 + 0.0 + 0.0 = 5.5
        self.assertEqual(self.total_overtime.total_overtime, Decimal('5.5'))

    def test_total_overtime_save_method(self):
        """Test if the save method correctly computes total_overtime"""
        # Setting ALL overtime values to 0 to compute total_overtime as 0
        self.total_overtime.total_regularot = 0
        self.total_overtime.total_regularholiday = 0
        self.total_overtime.total_specialholiday = 0  # Added
        self.total_overtime.total_restday = 0  # Added
        self.total_overtime.total_nightdiff = 0  # Added
        self.total_overtime.total_backwage = 0  # Added
        # Explicitly set total_overtime to None to trigger recalculation
        self.total_overtime.total_overtime = None
        self.total_overtime.save()
        self.total_overtime.refresh_from_db()
        self.assertEqual(self.total_overtime.total_overtime, 0)

    def test_total_overtime_str_method(self):
        """Test the __str__ method"""
        self.assertEqual(str(self.total_overtime), f"{self.total_overtime.id} - {self.total_overtime.user.email}")

    def test_delete_total_overtime(self):
        """Test deleting a TotalOvertime instance"""
        self.total_overtime.delete()
        self.assertEqual(TotalOvertime.objects.count(), 0)