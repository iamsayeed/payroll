from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Earnings
from .serializers import EarningsSerializer

class EarningsViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    permissions = [IsAuthenticated]
    queryset = Earnings.objects.all()
    serializer_class = EarningsSerializer

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Earnings records with pagination. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Earnings record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create an Earnings record. Accessible by owners and admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update an Earnings record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Earnings record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete an Earnings record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
