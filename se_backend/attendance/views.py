from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework import status, viewsets
from rest_framework.response import Response
from shared.utils import role_required
from .models import Attendance
from .serializers import AttendanceSerializer
from shared.generic_viewset import GenericViewset


class AttendanceViewSet(GenericViewset, viewsets.ModelViewSet):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]  # Default permission for authenticated users

    # Apply the role_required decorator to the CRUD methods
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Admin instances with pagination. Only Owners and Admins can access."""
        return super().list(request, *args, **kwargs)  # Call GenericViewset's list method

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Attendance record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create Attendance record. Accessible by owners and admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attendance = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Attendance record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Attendance record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Attendance record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='filter')
    @role_required(["owner", "admin"])
    def filter_attendance(self, request, *args, **kwargs):
        """
        Filter attendance records by user ID and date range:
        - Filter by user ID: ?user=${userId}
        - Filter by date range: ?date_after=${firstDay}&date_before=${lastDay}
        """
        queryset = self.queryset

        # Filter by user ID if provided
        user_id = request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by date range if provided
        date_after = request.query_params.get('date_after', None)
        if date_after:
            queryset = queryset.filter(date__gte=date_after)

        date_before = request.query_params.get('date_before', None)
        if date_before:
            queryset = queryset.filter(date__lte=date_before)

        # Set the filtered queryset
        self.queryset = queryset

        # Use the existing pagination and serialization from list method
        return super().list(request, *args, **kwargs)

