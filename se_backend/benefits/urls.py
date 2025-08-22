from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SSSViewSet, PhilhealthViewSet, PagibigViewSet

app_name = "benefits"

router = DefaultRouter()

router.register(r"sss", SSSViewSet, basename="sss")
router.register(r"philhealth", PhilhealthViewSet, basename="philhealth")
router.register(r"pagibig", PagibigViewSet, basename="pagibig")

urlpatterns = [
    path("", include(router.urls)),
]