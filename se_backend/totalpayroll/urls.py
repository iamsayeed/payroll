from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TotalPayrollViewSet

app_name = "totalpayroll"

router = DefaultRouter()

router.register(r"", TotalPayrollViewSet, basename="totalpayroll")

urlpatterns = [
    path("", include(router.urls)),
]