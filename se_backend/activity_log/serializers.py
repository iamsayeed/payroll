import json

from easyaudit.models import ContentType, CRUDEvent, LoginEvent
from rest_framework import serializers

from admins.serializers import AdminSerializer
from attendance.serializers import AttendanceSerializer
from attendance_summary.serializers import AttendanceSummarySerializer
from employees.serializers import EmployeeSerializer
from employment_info.serializers import EmploymentInfoSerializer
from totalovertime.serializers import TotalOvertimeSerializer
from payslip.serializers import PayslipSerializer
from schedule.serializers import ScheduleSerializer
from shift.serializers import ShiftSerializer
from users.serializers import CustomUserSerializer
from owner.serializers import OwnerSerializer

EVENT_TYPE_CHOICES = {
    1: "CREATE",
    2: "UPDATE",
    3: "DELETE",
}

FORMATTED_MODEL_KEYS = {
    "admin": "Admin",
    "attendance": "Attendance",
    "attendancesummary": "Attendance Summary",
    "employee": "Employee",
    "employmentinfo": "Employment Info",
    "totalovertime": "TotalOvertime",
    "payslip": "Payslip",
    "schedule": "Schedule",
    "shift": "Shift",
    "customuser": "Users",
    "owner": "Owner",
}

MODEL_SERIALIZERS = {
    "admins": AdminSerializer,
    "attendance": AttendanceSerializer,
    "attendancesummary": AttendanceSummarySerializer,
    "employees": EmployeeSerializer,
    "employmentinfo": EmploymentInfoSerializer,
    "totalovertime": TotalOvertimeSerializer,
    "payslip": PayslipSerializer,
    "schedule": ScheduleSerializer,
    "shift": ShiftSerializer,
    "users": CustomUserSerializer,
    "owner": OwnerSerializer,
}


class ContentTypeSerializer(serializers.ModelSerializer):
    model = serializers.SerializerMethodField()

    class Meta:
        model = ContentType
        fields = ["app_label", "model"]

    def get_model(self, obj):
        return FORMATTED_MODEL_KEYS.get(obj.model, obj.model)


class CRUDEventSerializer(serializers.ModelSerializer):
    module = ContentTypeSerializer(source="content_type", read_only=True)
    type = serializers.SerializerMethodField()

    class Meta:
        model = CRUDEvent
        exclude = [
            "content_type",
            "event_type",
            "object_id",
            "object_repr",
            "object_json_repr",
            "user_pk_as_string",
            "changed_fields",
        ]

    def get_type(self, obj):
        return EVENT_TYPE_CHOICES.get(obj.event_type, "UNKNOWN")

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        user = instance.user
        module = ContentTypeSerializer(instance.content_type).data["model"]

        representation["user"] = CustomUserSerializer(user).data
        representation["module"] = module

        try:
            json_obj = json.loads(instance.object_json_repr)
        except Exception:
            json_obj = None

        representation["object"] = json_obj

        try:
            changes = json.loads(instance.changed_fields)
            representation["changes"] = changes
        except (json.JSONDecodeError, TypeError):
            representation["changes"] = {}

        return representation


class LoginEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginEvent
        fields = "__all__"