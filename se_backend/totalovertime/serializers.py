from rest_framework import serializers
from .models import TotalOvertime

class TotalOvertimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotalOvertime
        fields = '__all__'