from django.test import TestCase
from django.utils import timezone
from datetime import time, date

from users.models import CustomUser
from attendance.models import Attendance

class AttendanceModelTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="test@example.com",
            password="testpassword",
            role="employee"
        )

        self.attendance = Attendance.objects.create(
            user=self.user,
            date=date.today(),
            status="Present",
            check_in_time=time(9, 0),
            check_out_time=time(17, 0)
        )

    def test_create_attendance(self):
        self.assertEqual(Attendance.objects.count(), 1)
        self.assertEqual(self.attendance.status, "Present")

    def test_read_attendance(self):
        fetched = Attendance.objects.get(id=self.attendance.id)
        self.assertEqual(fetched.user, self.user)
        self.assertEqual(fetched.check_in_time, time(9, 0))

    def test_update_attendance(self):
        self.attendance.status = "Late"
        self.attendance.check_in_time = time(9, 30)
        self.attendance.save()

        updated = Attendance.objects.get(id=self.attendance.id)
        self.assertEqual(updated.status, "Late")
        self.assertEqual(updated.check_in_time, time(9, 30))

    def test_delete_attendance(self):
        self.attendance.delete()
        self.assertEqual(Attendance.objects.count(), 0)
