from rest_framework import serializers
from .models import CustomUser, EmploymentInfo, Employee

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = "__all__"

"""
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "is_active", "is_staff", "role", "created_at"]


class EmploymentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmploymentInfo
        fields = [
            "id",
            "employee_number",
            "first_name",
            "last_name",
            "position",
            "address",
            "hire_date",
            "status",
            "active",
        ]


class EmployeeSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)  # Nesting CustomUser details
    employment_info = EmploymentInfoSerializer(read_only=True)  # Nesting EmploymentInfo details
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), write_only=True
    )
    employment_info_id = serializers.PrimaryKeyRelatedField(
        queryset=EmploymentInfo.objects.all(), write_only=True)

    class Meta:
        model = Employee
        fields = ["id", "user", "employment_info", "user_id", "employment_info_id"]
"""
