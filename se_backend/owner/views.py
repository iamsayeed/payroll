from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Owner
from .serializers import OwnerSerializer
from shared.pagination import StandardPagination

class OwnerViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    permissions = [IsAuthenticated]
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer
    pagination_class = StandardPagination

    @role_required(["owner"])
    def list(self, request, *args, **kwargs):
        """List all Owner records with pagination. Only Owners can access."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Owner record. Only Owners can access."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner"])
    def create(self, request, *args, **kwargs):
        """Create an Owner instance using an existing user. Only Owners can create Owners."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data.pop("user_id")
        permissions = serializer.validated_data.get("permissions", "")

        owner = Owner.objects.create(user=user, permissions=permissions)

        return Response(self.get_serializer(owner).data, status=status.HTTP_201_CREATED)

    @role_required(["owner"])
    def update(self, request, *args, **kwargs):
        """Update the Owner instance, allowing user and permissions changes. Only Owners can update Owners."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if "user_id" in serializer.validated_data:
            instance.user = serializer.validated_data.pop("user_id")

        if "permissions" in serializer.validated_data:
            instance.permissions = serializer.validated_data["permissions"]

        instance.save()

        return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)

    @role_required(["owner"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Owner record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner"])
    def destroy(self, request, *args, **kwargs):
        """Delete an Owner record. Only Owners can delete Owners."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
