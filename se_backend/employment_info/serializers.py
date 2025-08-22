from rest_framework import serializers
from employment_info.models import EmploymentInfo
from employees.models import Employee
from admins.models import Admin
from users.models import CustomUser
from django.db import transaction
from datetime import date


class UserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser to display user details."""
    class Meta:
        model = CustomUser
        fields = ["id", "email", "role"]


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for Employee to display employee details."""
    class Meta:
        model = Employee
        fields = ["id", "user", "employment_info"]


class AdminSerializer(serializers.ModelSerializer):
    """Serializer for Admin to display admin details."""
    class Meta:
        model = Admin
        fields = ["id", "user", "employment_info"]


class EmploymentInfoSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    user = UserSerializer(read_only=True)
    admin = AdminSerializer(source='admin_set', read_only=True, many=True)
    employee = EmployeeSerializer(source='employee_set', read_only=True, many=True)

    class Meta:
        model = EmploymentInfo
        fields = '__all__'


    # Field Validations


    def validate_employee_number(self, value):
        """Ensure employee number is a positive integer and unique."""
        if value <= 0:
            raise serializers.ValidationError("Employee number must be a positive integer.")
        if EmploymentInfo.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("Employee number must be unique.")
        return value

    def validate_first_name(self, value):
        """Ensure first name is not blank or null."""
        if not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value

    def validate_last_name(self, value):
        """Ensure last name is not blank or null."""
        if not value.strip():
            raise serializers.ValidationError("Last name cannot be empty.")
        return value

    def validate_position(self, value):
        """Ensure position is not blank or null."""
        if not value.strip():
            raise serializers.ValidationError("Position cannot be empty.")
        return value

    def validate_address(self, value):
        """Ensure address is not blank or null."""
        if not value.strip():
            raise serializers.ValidationError("Address cannot be empty.")
        return value

    def validate_hire_date(self, value):
        """Ensure hire date is a proper date and not in the future."""
        if value > date.today():
            raise serializers.ValidationError("Hire date cannot be in the future.")
        return value

    def validate_status(self, value):
        """Ensure status is not blank or null."""
        if not value.strip():
            raise serializers.ValidationError("Status cannot be empty.")
        return value

    def validate_active(self, value):
        """Ensure active is strictly a boolean value."""
        if not isinstance(value, bool):
            raise serializers.ValidationError("Active field must be a boolean value.")
        return value


    # Create Method Override

    def create(self, validated_data):
        role = validated_data.pop("role")
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        with transaction.atomic():
            # Create employment info
            employment_info = EmploymentInfo.objects.create(**validated_data)

            # Check if user already exists
            if CustomUser.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "A user with this email already exists."})

            # Get the next user ID
            next_user_id = (CustomUser.objects.latest('id').id + 1) if CustomUser.objects.exists() else 1

            # Create user with the next available ID
            user = CustomUser.objects.create(
                id=employment_info.employee_number,
                email=email,
                role=role
            )
            user.set_password(password)
            user.save()

            # Create role-specific instance
            if role == "admin":
                Admin.objects.create(user=user, employment_info=employment_info)
            elif role == "employee":
                Employee.objects.create(user=user, employment_info=employment_info)

            return employment_info


    # Custom Response Formatting

    def to_representation(self, instance):
        """Customize response to include user and role-specific details."""
        representation = super().to_representation(instance)

        # Check if an Admin or Employee is associated with the employment info
        admin = Admin.objects.filter(employment_info=instance).first()
        employee = Employee.objects.filter(employment_info=instance).first()

        if admin:
            representation["user"] = UserSerializer(admin.user).data
            representation["admin"] = AdminSerializer(admin).data

        if employee:
            representation["user"] = UserSerializer(employee.user).data
            representation["employee"] = EmployeeSerializer(employee).data

        return representation

