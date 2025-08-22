from rest_framework import serializers
from .models import OvertimeBase

class OvertimeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeBase
        fields = '__all__'