from django_filters import rest_framework as filters
from easyaudit.models import ContentType, CRUDEvent, LoginEvent
from rest_framework import permissions, viewsets

from .filters import CRUDEventFilter
from .serializers import CRUDEventSerializer, LoginEventSerializer

from shared.utils import role_required

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from datetime import datetime

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 100

class CRUDEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CRUDEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = CRUDEventFilter
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or user.role not in ["admin", "owner"]:
            return CRUDEvent.objects.none()

        included_models = {
            "admin", "attendance", "attendancesummary", "employee", "employmentinfo",
            "totalovertime", "payslip", "schedule", "shift", "customuser", "owner"
        }
        content_types = ContentType.objects.filter(model__in=included_models)

        # Exclude logs where user is None, inactive, or has invalid data (empty email/role)
        return CRUDEvent.objects.filter(
            content_type__in=content_types
        ).exclude(
            user__isnull=True,  # Exclude logs with no user
            user__is_active=False,  # Exclude logs with inactive users
            user__email="",  # Exclude logs with empty email addresses (invalid users)
            user__role__isnull=True  # Exclude logs with missing roles
        ).order_by("-datetime")

    @action(detail=False, methods=["delete"], permission_classes=[IsAuthenticated])
    def delete_logs(self, request):
        """
        Delete a single or all CRUDEvent logs.
        If no `ids` parameter is provided, all logs will be deleted.
        """
        ids = request.query_params.getlist('ids', [])

        if ids:
            # Delete specific logs by ids
            CRUDEvent.objects.filter(id__in=ids).delete()
            return Response({"detail": "Selected logs have been deleted."}, status=status.HTTP_204_NO_CONTENT)
        else:
            # Delete all logs
            CRUDEvent.objects.all().delete()
            return Response({"detail": "All logs have been deleted."}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["delete"], permission_classes=[IsAuthenticated])
    def delete_invalid_user_logs(self, request):
        """
        Delete CRUDEvent logs with no user or invalid user (inactive, missing email, or missing role).
        """
        # Delete logs with invalid or missing user data
        invalid_logs = CRUDEvent.objects.filter(
            user__isnull=True
        ).exclude(
            user__is_active=True,  # Exclude logs with inactive users
            user__email="",  # Exclude logs with empty email addresses (invalid users)
            user__role__isnull=True  # Exclude logs with missing roles
        )

        # Count how many records are being deleted
        deleted_count, _ = invalid_logs.delete()

        if deleted_count > 0:
            return Response(
                {"detail": f"{deleted_count} logs with invalid users have been deleted."},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            return Response(
                {"detail": "No logs with invalid users found."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["delete"], permission_classes=[IsAuthenticated])
    def delete_by_date(self, request):
        """
        Delete CRUDEvent logs for a specific date.
        Date should be provided in the query parameter `date` in YYYY-MM-DD format.
        """
        date_str = request.query_params.get("date")

        if not date_str:
            return Response(
                {"detail": "A date must be provided in the query parameters (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Parse the date from the query parameters
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete logs for the specific date
        deleted_count, _ = CRUDEvent.objects.filter(datetime__date=target_date).delete()

        if deleted_count > 0:
            return Response(
                {"detail": f"{deleted_count} logs from {target_date} have been deleted."},
                status=status.HTTP_204_NO_CONTENT
            )
        else:
            return Response(
                {"detail": f"No logs found for {target_date}."},
                status=status.HTTP_404_NOT_FOUND
            )


class LoginEventViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = LoginEvent.objects.all()
    serializer_class = LoginEventSerializer
    permission_classes = [permissions.IsAuthenticated]