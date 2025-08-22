from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Payslip
from .serializers import PayslipSerializer

class PayslipViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Payslip records. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Payslip record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create a Payslip record. Only Owners and Admins can create Payslip records."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin", "employee"])
    def update(self, request, *args, **kwargs):
        """Update a Payslip record. Only Owners and Admins can update Payslip records."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin","employee"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Payslip record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete a Payslip record. Only Owners and Admins can delete Payslip records."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='user-all/(?P<user_id>[^/.]+)')
    @role_required(["owner", "admin", "employee"])
    def user_all(self, request, user_id=None):
        """Get all Payslips for a specific user."""
        payslips = Payslip.objects.filter(user_id=user_id)
        serializer = self.get_serializer(payslips, many=True)
        return Response(serializer.data)