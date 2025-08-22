from django.test import TestCase
from users.models import CustomUser
from salary.models import Salary
from payroll.models import Payroll
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime
from benefits.models import SSS, Philhealth, Pagibig
from datetime import date

class PayrollModelTestCase(TestCase):

    def setUp(self):
        # Create test CustomUser instance
        self.user = CustomUser.objects.create_user(
            email="employee@example.com", password="password", role="employee"
        )

        # Create instances for related models
        earnings = Earnings.objects.create(
            user=self.user,
            basic_rate=1000.00,
            basic=800.00,
            allowance=100.00
        )
        deductions = Deductions.objects.create(
            user=self.user,
            wtax=50.00,
            nowork=0.00,
            loan=20.00,
            charges=10.00
        )
        overtime = TotalOvertime.objects.create(
            user=self.user,
            total_regularot=10,
            total_regularholiday=5
        )
        sss = SSS.objects.create(user=self.user, basic_salary=800.00)
        philhealth = Philhealth.objects.create(user=self.user, basic_salary=800.00)
        pagibig = Pagibig.objects.create(user=self.user, basic_salary=800.00)

        # Create Salary instance (dependency for Payroll)
        self.salary = Salary.objects.create(
            user_id=self.user,
            earnings_id=earnings,
            deductions_id=deductions,
            overtime_id=overtime,
            sss_id=sss,
            philhealth_id=philhealth,
            pagibig_id=pagibig,
            pay_date=date(2025, 4, 5)
        )

        # Create Payroll instance
        self.payroll = Payroll.objects.create(
            user_id=self.user,
            salary_id=self.salary,
            gross_pay=900.00,
            total_deductions=80.00,
            net_pay=820.00,
            pay_date=date(2025, 4, 5)
        )

    def test_create_payroll(self):
        self.assertEqual(Payroll.objects.count(), 1)
        self.assertEqual(self.payroll.gross_pay, 900.00)
        self.assertEqual(self.payroll.net_pay, 820.00)
        self.assertEqual(str(self.payroll), f"{self.payroll.id} - {self.payroll.user_id}")

    def test_read_payroll(self):
        payroll = Payroll.objects.get(id=self.payroll.id)
        self.assertEqual(payroll.gross_pay, 900.00)
        self.assertEqual(payroll.net_pay, 820.00)

    def test_update_payroll(self):
        self.payroll.gross_pay = 950.00
        self.payroll.total_deductions = 85.00
        self.payroll.net_pay = 865.00
        self.payroll.save()
        updated_payroll = Payroll.objects.get(id=self.payroll.id)
        self.assertEqual(updated_payroll.gross_pay, 950.00)
        self.assertEqual(updated_payroll.net_pay, 865.00)

    def test_delete_payroll(self):
        self.payroll.delete()
        self.assertEqual(Payroll.objects.count(), 0)
