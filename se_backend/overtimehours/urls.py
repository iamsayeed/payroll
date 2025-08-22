from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OvertimeHoursViewSet

app_name = "overtimehours"

router = DefaultRouter()

router.register(r"", OvertimeHoursViewSet, basename="overtimehours")

urlpatterns = [
    path("", include(router.urls)),
]