from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import BiometricData
from .serializers import BiometricDataSerializer

class BiometricDataViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    permissions = [IsAuthenticated]
    queryset = BiometricData.objects.all()
    serializer_class = BiometricDataSerializer

    # Apply the role_required decorator to the list method
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Admin instances with pagination. Only Owners and Admins can access."""
        return super().list(request, *args, **kwargs)  # Call GenericViewset's list method

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        data = request.data
        is_bulk = isinstance(data, list)  # Check if request contains a list

        serializer = self.get_serializer(data=data, many=is_bulk)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Biometric Data record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Biometric Data record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Biometric Data record. Accessible by owners and admins."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Biometric Data record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
