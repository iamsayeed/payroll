from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OvertimeBaseViewSet

app_name = "overtimebase"

router = DefaultRouter()

router.register(r"", OvertimeBaseViewSet, basename="overtimebase")

urlpatterns = [
    path("", include(router.urls)),
]