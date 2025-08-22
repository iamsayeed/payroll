from django.urls import include, path
from rest_framework.routers import DefaultRouter

from users.views import UserViewset

app_name = "user"

router = DefaultRouter()
router.register(r"", UserViewset, basename="user")

urlpatterns = [path("", include(router.urls))]