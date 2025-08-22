from django.urls import include, path
from rest_framework.routers import DefaultRouter

from owner.views import OwnerViewSet

app_name = "owner"

router = DefaultRouter()
router.register(r"", OwnerViewSet, basename="owner")

urlpatterns = [path("", include(router.urls))]