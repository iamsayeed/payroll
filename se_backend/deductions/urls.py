from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DeductionsViewSet

app_name = "deductions"

router = DefaultRouter()

router.register(r"", DeductionsViewSet, basename="deductions")

urlpatterns = [
    path("", include(router.urls)),
]