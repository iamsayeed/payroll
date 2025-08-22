from django.apps import AppConfig


class MastercalendarConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "master_calendar"

    def ready(self):
        import master_calendar.signals
