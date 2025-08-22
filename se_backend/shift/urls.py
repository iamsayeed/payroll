from django.urls import include, path
from rest_framework.routers import DefaultRouter

from shift.views import ShiftViewSet

app_name = "shift"

router = DefaultRouter()

router.register(r"", ShiftViewSet, basename="shift")

urlpatterns = [
    path("", include(router.urls)),
]