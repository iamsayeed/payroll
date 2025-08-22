from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PayslipViewSet

app_name = "payslip"

router = DefaultRouter()

router.register(r"", PayslipViewSet, basename="payslip")

urlpatterns = [
    path("", include(router.urls)),]