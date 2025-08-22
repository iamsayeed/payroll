from rest_framework import serializers
from payslip.models import Payslip
from payroll.models import Payroll
from salary.models import Salary
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime
from benefits.models import SSS, Philhealth, Pagibig
from schedule.models import Schedule
from employment_info.models import EmploymentInfo

class EarningsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Earnings
        fields = '__all__'

class DeductionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deductions
        fields = '__all__'

class TotalOvertimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotalOvertime
        fields = '__all__'


class SSSSerializer(serializers.ModelSerializer):
    class Meta:
        model = SSS
        fields = '__all__'


class PhilhealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Philhealth
        fields = '__all__'


class PagibigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagibig
        fields = '__all__'


class SalarySerializer(serializers.ModelSerializer):
    earnings_id = EarningsSerializer()
    deductions_id = DeductionsSerializer()
    overtime_id = TotalOvertimeSerializer()
    sss_id = SSSSerializer()
    philhealth_id = PhilhealthSerializer()
    pagibig_id = PagibigSerializer()

    class Meta:
        model = Salary
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ['user_id','payroll_period_start', 'payroll_period_end', 'hours']


class EmploymentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmploymentInfo
        fields = ['employee_number','first_name', 'last_name', 'position', 'profile_picture']

class PayrollSerializer(serializers.ModelSerializer):
    salary_id = SalarySerializer()
    schedule_id = ScheduleSerializer(read_only=True)
    employment_info_id = EmploymentInfoSerializer(read_only=True)

    class Meta:
        model = Payroll
        fields = '__all__'


class PayslipSerializer(serializers.ModelSerializer):
    payroll_id = PayrollSerializer()

    class Meta:
        model = Payslip
        fields = '__all__'
