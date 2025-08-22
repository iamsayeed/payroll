from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Payroll
from .serializers import PayrollSerializer
from shared.pagination import StandardPagination

class PayrollViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    permissions = [IsAuthenticated]
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    pagination_class = StandardPagination

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Payroll records with pagination. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Payroll record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create a Payroll record. Only Owners and Admins can create Payroll records."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update a Payroll record. Only Owners and Admins can update Payroll records."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Payroll record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete a Payroll record. Only Owners and Admins can delete Payroll records."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
