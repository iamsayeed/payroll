from rest_framework import serializers
from .models import SSS, Philhealth, Pagibig

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