from rest_framework.permissions import IsAuthenticated
from rest_framework import status, viewsets
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import MasterCalendar, MasterCalendarPayroll
from .serializers import MasterCalendarSerializer,MasterCalendarPayrollSerializer


class MasterCalendarViewSet(GenericViewset, viewsets.ModelViewSet):
    queryset = MasterCalendar.objects.all()
    serializer_class = MasterCalendarSerializer
    permission_classes = [IsAuthenticated]
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all MasterCalendar records with pagination. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific MasterCalendar record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        data = request.data
        is_bulk = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=is_bulk)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update MasterCalendar record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update MasterCalendar record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete MasterCalendar record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MasterCalendarPayrollViewSet(GenericViewset, viewsets.ModelViewSet):
    queryset = MasterCalendarPayroll.objects.all()
    serializer_class = MasterCalendarPayrollSerializer
    permission_classes = [IsAuthenticated]
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all MasterCalendarPayroll records with pagination. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific MasterCalendarPayroll record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        data = request.data
        is_bulk = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=is_bulk)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update MasterCalendarPayroll record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update MasterCalendarPayroll record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete MasterCalendarPayroll record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)