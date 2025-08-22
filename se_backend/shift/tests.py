from django.test import TestCase
from shift.models import Shift
from datetime import date, time

class ShiftModelTestCase(TestCase):

    def setUp(self):
        # Create a sample shift
        self.shift = Shift.objects.create(
            date=date(2025, 4, 5),
            shift_start=time(9, 0),
            shift_end=time(17, 0),
            expected_hours=8
        )

    def test_create_shift(self):
        """Test the creation of a Shift instance"""
        self.assertEqual(Shift.objects.count(), 1)
        self.assertEqual(self.shift.date, date(2025, 4, 5))
        self.assertEqual(self.shift.shift_start, time(9, 0))
        self.assertEqual(self.shift.shift_end, time(17, 0))
        self.assertEqual(self.shift.expected_hours, 8)

    def test_read_shift(self):
        """Test reading a Shift instance"""
        shift = Shift.objects.get(id=self.shift.id)
        self.assertEqual(shift.date, date(2025, 4, 5))
        self.assertEqual(shift.shift_start, time(9, 0))
        self.assertEqual(shift.shift_end, time(17, 0))
        self.assertEqual(shift.expected_hours, 8)

    def test_update_shift(self):
        """Test updating a Shift instance"""
        self.shift.expected_hours = 9
        self.shift.save()
        updated_shift = Shift.objects.get(id=self.shift.id)
        self.assertEqual(updated_shift.expected_hours, 9)

    def test_delete_shift(self):
        """Test deleting a Shift instance"""
        self.shift.delete()
        self.assertEqual(Shift.objects.count(), 0)

    def test_shift_str_method(self):
        """Test the __str__ method"""
        self.assertEqual(str(self.shift), f"{self.shift.id} - {self.shift.shift_start} - {self.shift.shift_end}")
