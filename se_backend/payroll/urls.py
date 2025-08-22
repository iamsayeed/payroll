from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PayrollViewSet

app_name = "payroll"

router = DefaultRouter()

router.register(r"", PayrollViewSet, basename="payroll")

urlpatterns = [
    path("", include(router.urls)),]