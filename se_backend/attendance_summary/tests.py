from django.test import TestCase
from datetime import date, time

from users.models import CustomUser
from attendance.models import Attendance
from attendance_summary.models import AttendanceSummary


class AttendanceSummaryModelTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com",
            password="securepassword",
            role="employee"
        )

        self.attendance = Attendance.objects.create(
            user=self.user,
            date=date.today(),
            status="Present",
            check_in_time=time(9, 0),
            check_out_time=time(18, 0)
        )

        self.summary = AttendanceSummary.objects.create(
            user_id=self.user,
            attendance_id=self.attendance,
            date=date.today(),
            actual_hours=8,
            overtime_hours=1,
            late_minutes=15,
            undertime=0
        )

    def test_create_attendance_summary(self):
        self.assertEqual(AttendanceSummary.objects.count(), 1)
        self.assertEqual(self.summary.overtime_hours, 1)

    def test_read_attendance_summary(self):
        summary = AttendanceSummary.objects.get(id=self.summary.id)
        self.assertEqual(summary.user_id, self.user)
        self.assertEqual(summary.attendance_id, self.attendance)

    def test_update_attendance_summary(self):
        self.summary.overtime_hours = 2
        self.summary.late_minutes = 0
        self.summary.save()

        updated = AttendanceSummary.objects.get(id=self.summary.id)
        self.assertEqual(updated.overtime_hours, 2)
        self.assertEqual(updated.late_minutes, 0)

    def test_delete_attendance_summary(self):
        self.summary.delete()
        self.assertEqual(AttendanceSummary.objects.count(), 0)
