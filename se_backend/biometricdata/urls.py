from django.urls import include, path
from rest_framework.routers import DefaultRouter

from biometricdata.views import BiometricDataViewSet

app_name = "biometricdata"

router = DefaultRouter()

router.register(r"", BiometricDataViewSet, basename="biometricdata")

urlpatterns = [
    path("", include(router.urls)),
    # path("fetch-biometric/", FetchBiometricData.as_view(), name="fetch-biometric"),
]