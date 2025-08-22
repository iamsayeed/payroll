from rest_framework import serializers
from .models import Deductions

class DeductionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deductions
        fields = '__all__'