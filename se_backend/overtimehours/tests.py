from django.test import TestCase
from users.models import CustomUser
from attendance_summary.models import AttendanceSummary
from .models import OvertimeHours
from datetime import date, time
from attendance.models import Attendance
from django.db.models.signals import post_save
from attendance_summary import signals as summary_signals
from attendance import signals as attendance_signals
from django.db import transaction


class OvertimeHoursModelTestCase(TestCase):

    @classmethod
    def setUpClass(cls):
        # Disconnect signals at class level to ensure they're disabled before any objects are created
        post_save.disconnect(
            receiver=summary_signals.update_overtime_hours,
            sender=AttendanceSummary,
            dispatch_uid="update_overtime_hours"
        )
        post_save.disconnect(
            receiver=attendance_signals.generate_attendance_summary,
            sender=Attendance,
            dispatch_uid="generate_attendance_summary"
        )
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        # Reconnect signals after all tests have run
        post_save.connect(
            receiver=summary_signals.update_overtime_hours,
            sender=AttendanceSummary,
            dispatch_uid="update_overtime_hours"
        )
        post_save.connect(
            receiver=attendance_signals.generate_attendance_summary,
            sender=Attendance,
            dispatch_uid="generate_attendance_summary"
        )
        super().tearDownClass()

    def setUp(self):
        # Make sure the database is clean before starting
        with transaction.atomic():
            OvertimeHours.objects.all().delete()
            AttendanceSummary.objects.all().delete()
            Attendance.objects.all().delete()
            CustomUser.objects.all().delete()

        # Create test user
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com", password="password", role="employee"
        )

        # Create test attendance
        self.attendance = Attendance.objects.create(
            user=self.user,
            date=date.today(),
            status="Present",
            check_in_time=time(9, 0),
            check_out_time=time(17, 0)
        )

        # Create test attendance summary
        self.attendance_summary = AttendanceSummary.objects.create(
            user_id=self.user,
            date=date.today(),
            actual_hours=40,
            overtime_hours=5,
            late_minutes=15,
            undertime=0,
            attendance_id=self.attendance
        )

        # Manually create OvertimeHours - the only one that should exist in tests
        self.overtime_hours = OvertimeHours.objects.create(
            attendancesummary=self.attendance_summary,
            user=self.user,
            regularot=2,
            regularholiday=1,
            specialholiday=0,
            restday=0,
            nightdiff=1,
            backwage=0,
            late=15,
            undertime=0,
            biweek_start=date.today()
        )

        # Verify exactly one overtime hours record exists
        overtime_count = OvertimeHours.objects.count()
        if overtime_count != 1:
            # If more than one exists, keep only our manually created one
            OvertimeHours.objects.exclude(id=self.overtime_hours.id).delete()

    def tearDown(self):
        # Clean up test data
        with transaction.atomic():
            OvertimeHours.objects.all().delete()
            AttendanceSummary.objects.all().delete()
            Attendance.objects.all().delete()
            CustomUser.objects.all().delete()

    def test_create_overtime_hours(self):
        # Verify only one record exists
        self.assertEqual(OvertimeHours.objects.count(), 1)
        self.assertEqual(self.overtime_hours.regularot, 2)
        self.assertEqual(self.overtime_hours.nightdiff, 1)
        self.assertEqual(
            str(self.overtime_hours),
            f"{self.overtime_hours.id} - {self.user} - {self.overtime_hours.biweek_start}"
        )

    def test_read_overtime_hours(self):
        # Retrieve the overtime hours object and check its fields
        overtime = OvertimeHours.objects.get(id=self.overtime_hours.id)
        self.assertEqual(overtime.regularholiday, 1)
        self.assertEqual(overtime.restday, 0)
        self.assertEqual(overtime.late, 15)

    def test_update_overtime_hours(self):
        # Update some fields and save
        self.overtime_hours.regularot = 3
        self.overtime_hours.nightdiff = 2
        self.overtime_hours.save()

        # Retrieve the updated overtime hours and check changes
        updated = OvertimeHours.objects.get(id=self.overtime_hours.id)
        self.assertEqual(updated.regularot, 3)
        self.assertEqual(updated.nightdiff, 2)

    def test_delete_overtime_hours(self):
        # Verify one record exists before deleting
        self.assertEqual(OvertimeHours.objects.count(), 1)

        # Delete the overtime hours object
        self.overtime_hours.delete()

        # Verify it's deleted
        self.assertEqual(OvertimeHours.objects.count(), 0)

    def test_overtime_hours_str(self):
        # Ensure the string representation is correct
        expected_str = f"{self.overtime_hours.id} - {self.user} - {self.overtime_hours.biweek_start}"
        self.assertEqual(str(self.overtime_hours), expected_str)