from django.urls import include, path
from rest_framework.routers import DefaultRouter

from admins.views import AdminViewset

app_name = "admins"

router = DefaultRouter()
router.register(r"", AdminViewset, basename="admins")

urlpatterns = [path("", include(router.urls))]