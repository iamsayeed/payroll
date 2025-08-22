from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CRUDEventViewSet, LoginEventViewSet

app_name = "activity_log"

router = DefaultRouter()
router.register(r"login", LoginEventViewSet, basename="login-logs")
router.register(r"", CRUDEventViewSet, basename="activity-log")

urlpatterns = [
    path("", include(router.urls)),
]