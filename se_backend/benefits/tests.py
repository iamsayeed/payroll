from django.test import TestCase
from users.models import CustomUser
from benefits.models import SSS, Philhealth, Pagibig
from decimal import Decimal


class DeductionsModelTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="employee@test.com",
            password="securepassword",
            role="employee"
        )

    # SSS Model Tests
    def test_create_sss(self):
        sss = SSS.objects.create(
            user=self.user,
            basic_salary=Decimal("25000.00"),
            msc=Decimal("20000.00"),
            employee_share=Decimal("500.00"),
            employer_share=Decimal("1000.00"),
            ec_contribution=Decimal("10.00"),
            employer_mpf_contribution=Decimal("200.00"),
            employee_mpf_contribution=Decimal("100.00"),
            total_employer=Decimal("1210.00"),
            total_employee=Decimal("600.00"),
            total_contribution=Decimal("1810.00")
        )
        self.assertEqual(SSS.objects.count(), 1)
        self.assertEqual(sss.total_contribution, Decimal("1810.00"))

    def test_update_sss(self):
        sss = SSS.objects.create(user=self.user, total_contribution=Decimal("1000.00"))
        sss.total_contribution = Decimal("2000.00")
        sss.save()
        self.assertEqual(SSS.objects.get(id=sss.id).total_contribution, Decimal("2000.00"))

    def test_delete_sss(self):
        sss = SSS.objects.create(user=self.user)
        sss.delete()
        self.assertEqual(SSS.objects.count(), 0)

    # Philhealth Model Tests
    def test_create_philhealth(self):
        philhealth = Philhealth.objects.create(
            user=self.user,
            basic_salary=Decimal("25000.00"),
            total_contribution=Decimal("900.00")
        )
        self.assertEqual(Philhealth.objects.count(), 1)
        self.assertEqual(philhealth.total_contribution, Decimal("900.00"))

    def test_update_philhealth(self):
        philhealth = Philhealth.objects.create(user=self.user, total_contribution=Decimal("500.00"))
        philhealth.total_contribution = Decimal("750.00")
        philhealth.save()
        self.assertEqual(Philhealth.objects.get(id=philhealth.id).total_contribution, Decimal("750.00"))

    def test_delete_philhealth(self):
        philhealth = Philhealth.objects.create(user=self.user)
        philhealth.delete()
        self.assertEqual(Philhealth.objects.count(), 0)

    # Pagibig Model Tests
    def test_create_pagibig(self):
        pagibig = Pagibig.objects.create(
            user=self.user,
            basic_salary=Decimal("25000.00"),
            employee_share=Decimal("100.00"),
            employer_share=Decimal("100.00"),
            total_contribution=Decimal("200.00")
        )
        self.assertEqual(Pagibig.objects.count(), 1)
        self.assertEqual(pagibig.total_contribution, Decimal("200.00"))

    def test_update_pagibig(self):
        pagibig = Pagibig.objects.create(user=self.user, total_contribution=Decimal("150.00"))
        pagibig.total_contribution = Decimal("300.00")
        pagibig.save()
        self.assertEqual(Pagibig.objects.get(id=pagibig.id).total_contribution, Decimal("300.00"))

    def test_delete_pagibig(self):
        pagibig = Pagibig.objects.create(user=self.user)
        pagibig.delete()
        self.assertEqual(Pagibig.objects.count(), 0)
