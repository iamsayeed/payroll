from django.urls import include, path
from rest_framework.routers import DefaultRouter

from employment_info.views import EmploymentInfoViewset

app_name = "employment-info"

router = DefaultRouter()
router.register(r"", EmploymentInfoViewset, basename="employment-info")

urlpatterns = [path("", include(router.urls))]