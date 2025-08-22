from django.test import TestCase
from biometricdata.models import BiometricData
from django.utils import timezone
from datetime import datetime

class BiometricDataModelTestCase(TestCase):

    def setUp(self):
        self.biometric = BiometricData.objects.create(
            emp_id=1234,
            name="Juan Dela Cruz",
            time=timezone.make_aware(datetime(2025, 4, 5, 9, 0, 0)),
            work_code="IN",
            work_state="Present",
            terminal_name="Main Gate"
        )

    def test_create_biometric_data(self):
        self.assertEqual(BiometricData.objects.count(), 1)
        self.assertEqual(self.biometric.name, "Juan Dela Cruz")
        # Include the timezone information in the expected string
        self.assertEqual(str(self.biometric), "Juan Dela Cruz - 2025-04-05 09:00:00+00:00")

    def test_read_biometric_data(self):
        biometric = BiometricData.objects.get(id=self.biometric.id)
        self.assertEqual(biometric.work_code, "IN")

    def test_update_biometric_data(self):
        self.biometric.work_state = "Late"
        self.biometric.save()
        updated = BiometricData.objects.get(id=self.biometric.id)
        self.assertEqual(updated.work_state, "Late")

    def test_delete_biometric_data(self):
        self.biometric.delete()
        self.assertEqual(BiometricData.objects.count(), 0)
