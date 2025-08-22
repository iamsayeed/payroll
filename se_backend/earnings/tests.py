from django.test import TestCase
from users.models import CustomUser
from earnings.models import Earnings


class EarningsModelTestCase(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="employee1@example.com",
            password="testpass123",
            role="employee"
        )

        self.earnings = Earnings.objects.create(
            user=self.user,
            basic_rate=500.00,
            basic=10000.00,
            allowance=1500.00,
            ntax=800.00,
            vacationleave=2,
            sickleave=1
        )

    def test_create_earnings(self):
        self.assertEqual(Earnings.objects.count(), 1)
        self.assertEqual(self.earnings.basic, 10000.00)
        self.assertEqual(str(self.earnings), f"{self.earnings.id} - {self.user.id}")

    def test_read_earnings(self):
        earnings = Earnings.objects.get(id=self.earnings.id)
        self.assertEqual(earnings.allowance, 1500.00)

    def test_update_earnings(self):
        self.earnings.ntax = 1000.00
        self.earnings.save()
        updated = Earnings.objects.get(id=self.earnings.id)
        self.assertEqual(updated.ntax, 1000.00)

    def test_delete_earnings(self):
        self.earnings.delete()
        self.assertEqual(Earnings.objects.count(), 0)
