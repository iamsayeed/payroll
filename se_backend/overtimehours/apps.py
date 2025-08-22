from django.apps import AppConfig


class OvertimehoursConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'overtimehours'

    def ready(self):
        import overtimehours.signals