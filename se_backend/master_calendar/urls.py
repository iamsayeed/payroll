from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import MasterCalendarViewSet, MasterCalendarPayrollViewSet

app_name = "mastercalendar"

# Create a new router
router = DefaultRouter()

# Register the MasterCalendarViewSet under a unique endpoint
router.register(r"holiday", MasterCalendarViewSet, basename="mastercalendar")

# Register the MasterCalendarPayrollViewSet under a unique endpoint
router.register(r"payrollperiod", MasterCalendarPayrollViewSet, basename="mastercalendarpayroll")

# Define the urlpatterns with both viewsets
urlpatterns = [
    path("", include(router.urls)),
]
