from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Admin
from .serializers import AdminSerializer


class AdminViewset(GenericViewset, viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAuthenticated]

    @role_required(["owner"])
    def create(self, request, *args, **kwargs):
        """Create an Admin instance. Only Owners can create Admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def list(self, request, *args, **kwargs):
        """List all Admin instances with pagination. Only Owners and Admins can access."""
        return super().list(request, *args, **kwargs)  # Call GenericViewset's list method

    @role_required(["owner", "admin"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve details of a single Admin. Only Owners and Admins can access."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update an Admin instance. Only Owners can update Admins."""
        partial = True
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner"])
    def destroy(self, request, *args, **kwargs):
        """Delete an Admin instance. Only Owners can delete Admins."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "Admin deleted."}, status=status.HTTP_204_NO_CONTENT)
