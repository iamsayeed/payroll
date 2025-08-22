from django.urls import include, path
from rest_framework.routers import DefaultRouter

from schedule.views import ScheduleViewSet

app_name = "schedule"

router = DefaultRouter()

router.register(r"", ScheduleViewSet, basename="schedule")

urlpatterns = [
    path("", include(router.urls)),
]