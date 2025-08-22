from django.urls import include, path
from rest_framework.routers import DefaultRouter

from employees.views import EmployeeViewset

app_name = "employees"

router = DefaultRouter()
router.register(r"", EmployeeViewset, basename="employees")

urlpatterns = [path("", include(router.urls))]