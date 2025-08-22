from django.apps import AppConfig


class AttendanceSummaryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'attendance_summary'

    def ready(self):
        import attendance_summary.signals