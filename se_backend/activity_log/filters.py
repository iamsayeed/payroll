from django_filters import rest_framework as filters
from easyaudit.models import CRUDEvent


class CRUDEventFilter(filters.FilterSet):
    event_type = filters.NumberFilter(field_name="event_type")
    user_role = filters.CharFilter(field_name="user__role", lookup_expr="iexact")
    model_name = filters.CharFilter(
        field_name="content_type__model", lookup_expr="iexact"
    )

    class Meta:
        model = CRUDEvent
        fields = ["event_type", "user_role", "model_name"]