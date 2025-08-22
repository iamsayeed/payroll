from django.test import TestCase
from users.models import CustomUser
from deductions.models import Deductions


class DeductionsModelTestCase(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com",
            password="testpass123",
            role="employee"
        )

        self.deduction = Deductions.objects.create(
            user=self.user,
            wtax=100.50,
            nowork=200.00,
            loan=300.00,
            charges=50.00,
            msfcloan=120.00
        )

    def test_create_deductions(self):
        self.assertEqual(Deductions.objects.count(), 1)
        self.assertEqual(self.deduction.loan, 300.00)
        self.assertEqual(str(self.deduction), f"{self.deduction.id} - {self.user.id}")

    def test_read_deductions(self):
        deduction = Deductions.objects.get(id=self.deduction.id)
        self.assertEqual(deduction.nowork, 200.00)

    def test_update_deductions(self):
        self.deduction.wtax = 150.00
        self.deduction.save()
        updated = Deductions.objects.get(id=self.deduction.id)
        self.assertEqual(updated.wtax, 150.00)

    def test_delete_deductions(self):
        self.deduction.delete()
        self.assertEqual(Deductions.objects.count(), 0)
