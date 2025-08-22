from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Deductions
from .serializers import DeductionsSerializer

class DeductionsViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    permissions = [IsAuthenticated]
    queryset = Deductions.objects.all()
    serializer_class = DeductionsSerializer

    # Apply the role_required decorator to the list method
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Admin instances with pagination. Only Owners and Admins can access."""
        return super().list(request, *args, **kwargs)  # Call GenericViewset's list method

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Deductions record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create Deductions record. Accessible by owners and admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Deductions record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Deductions record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Deductions record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
