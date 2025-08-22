from rest_framework import serializers
from .models import OvertimeHours
from employment_info.models import EmploymentInfo  # Import the EmploymentInfo model

class OvertimeHoursSerializer(serializers.ModelSerializer):
    employment_info = serializers.SerializerMethodField()

    class Meta:
        model = OvertimeHours
        fields = '__all__'

    def get_employment_info(self, obj):
        # Fetch the EmploymentInfo object associated with the user in OvertimeHours
        try:
            employment_info = EmploymentInfo.objects.get(employee_number=obj.user.id)
            # Return the required fields
            return {
                'employee_number': employment_info.employee_number,
                'first_name': employment_info.first_name,
                'last_name': employment_info.last_name,
            }
        except EmploymentInfo.DoesNotExist:
            return None