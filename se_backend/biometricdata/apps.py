from django.apps import AppConfig


class BiometricdataConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "biometricdata"

    def ready(self):
        import biometricdata.signals