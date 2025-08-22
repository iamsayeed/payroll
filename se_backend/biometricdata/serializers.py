from rest_framework import serializers
from .models import BiometricData

class BiometricDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricData
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, list):  # Handle list of objects
            return [super().to_internal_value(item) for item in data]
        return super().to_internal_value(data)
