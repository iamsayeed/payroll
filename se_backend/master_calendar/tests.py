from django.test import TestCase
from .models import MasterCalendar, MasterCalendarPayroll
from datetime import date


class MasterCalendarModelTest(TestCase):

    def setUp(self):
        self.holiday = MasterCalendar.objects.create(
            name="New Year's Day",
            date=date(2025, 1, 1),
            holiday_type="regular",
            description="Celebration of the New Year"
        )

    def test_create_master_calendar(self):
        self.assertEqual(MasterCalendar.objects.count(), 1)
        self.assertEqual(self.holiday.name, "New Year's Day")
        self.assertEqual(self.holiday.holiday_type, "regular")
        self.assertEqual(str(self.holiday), "New Year's Day (Regular Holiday) - 2025-01-01")

    def test_duplicate_holiday_same_date_and_type_not_allowed(self):
        with self.assertRaises(Exception):  # IntegrityError can be used for more specific handling
            MasterCalendar.objects.create(
                name="Duplicate New Year",
                date=date(2025, 1, 1),
                holiday_type="regular"
            )

    def test_duplicate_holiday_same_date_but_different_type_allowed(self):
        special_holiday = MasterCalendar.objects.create(
            name="Special New Year",
            date=date(2025, 1, 1),
            holiday_type="special"
        )
        self.assertEqual(MasterCalendar.objects.count(), 2)
        self.assertEqual(str(special_holiday), "Special New Year (Special Holiday) - 2025-01-01")


class MasterCalendarPayrollModelTest(TestCase):

    def setUp(self):
        self.payroll = MasterCalendarPayroll.objects.create(
            payroll_period_start=date(2025, 4, 1),
            payroll_period_end=date(2025, 4, 15)
        )

    def test_create_payroll_period(self):
        self.assertEqual(MasterCalendarPayroll.objects.count(), 1)
        self.assertEqual(str(self.payroll), "2025-04-01 - 2025-04-15")

    def test_duplicate_payroll_period_not_allowed(self):
        with self.assertRaises(Exception):
            MasterCalendarPayroll.objects.create(
                payroll_period_start=date(2025, 4, 1),
                payroll_period_end=date(2025, 4, 15)
            )

    def test_different_payroll_period_allowed(self):
        payroll2 = MasterCalendarPayroll.objects.create(
            payroll_period_start=date(2025, 4, 16),
            payroll_period_end=date(2025, 4, 30)
        )
        self.assertEqual(MasterCalendarPayroll.objects.count(), 2)
        self.assertEqual(str(payroll2), "2025-04-16 - 2025-04-30")
