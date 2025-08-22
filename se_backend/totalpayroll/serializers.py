from rest_framework import serializers
from totalpayroll.models import TotalPayroll

class TotalPayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotalPayroll
        fields = '__all__'

