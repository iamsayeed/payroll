from django.urls import include, path
from rest_framework.routers import DefaultRouter

from attendance_summary.views import AttendanceSummaryViewSet

app_name = "attendance_summary"

router = DefaultRouter()

router.register(r"", AttendanceSummaryViewSet, basename="attendance_summary")

urlpatterns = [
    path("", include(router.urls)),
]