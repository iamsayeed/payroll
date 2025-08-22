from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SalaryViewSet, TriggerSalaryTaskView

app_name = "salary"

router = DefaultRouter()

router.register(r"", SalaryViewSet, basename="salary")

urlpatterns = [
    path("", include(router.urls)),
    path("generate-salary/", TriggerSalaryTaskView.as_view(), name="generate-salary"),
]