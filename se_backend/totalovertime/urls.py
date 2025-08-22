from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TotalOvertimeViewSet

app_name = "totalovertime"

router = DefaultRouter()

router.register(r"", TotalOvertimeViewSet, basename="totalovertime")

urlpatterns = [
    path("", include(router.urls)),
]