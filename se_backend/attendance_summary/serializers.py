from rest_framework import serializers
from .models import AttendanceSummary

class AttendanceSummarySerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceSummary
        fields = '__all__'