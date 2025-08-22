from rest_framework import serializers
from .models import MasterCalendar, MasterCalendarPayroll

class MasterCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterCalendar
        fields = '__all__'


class MasterCalendarPayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterCalendarPayroll
        fields = '__all__'