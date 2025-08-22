from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EarningsViewSet

app_name = "earnings"

router = DefaultRouter()

router.register(r"", EarningsViewSet, basename="earnings")

urlpatterns = [
    path("", include(router.urls)),
]