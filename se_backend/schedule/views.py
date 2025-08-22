from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Schedule
from .serializers import ScheduleSerializer

class ScheduleViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Schedule records. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Schedule record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create Schedule record. Only Owners and Admins can create Schedule records."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Schedule record. Only Owners and Admins can update Schedule records."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Extract special shift handling keys before serialization
        add_shift_ids = request.data.pop("add_shift_ids", [])
        remove_shift_ids = request.data.pop("remove_shift_ids", [])

        # Handle full update of the schedule
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Handle adding new shifts
        if add_shift_ids:
            instance.shift_ids.add(*add_shift_ids)
        # Handle removing shifts
        if remove_shift_ids:
            instance.shift_ids.remove(*remove_shift_ids)

        # Return updated serialized data
        updated_serializer = self.get_serializer(instance)
        return Response(updated_serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Schedule record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Schedule record. Only Owners and Admins can delete Schedule records."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
