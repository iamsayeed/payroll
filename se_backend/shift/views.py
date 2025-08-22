from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from shared.utils import role_required
from .models import Shift
from .serializers import ShiftSerializer

class ShiftViewSet(viewsets.ModelViewSet):
    permissions = [IsAuthenticated]
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer

    # Apply role_required decorator to the viewset methods
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Shift instances."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Shift instance."""
        return super().retrieve(request, *args, **kwargs)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Handles both single and bulk shift creation."""
        is_bulk = isinstance(request.data, list)

        if is_bulk:
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if is_bulk:
                shifts = [Shift(**shift) for shift in serializer.validated_data]
                Shift.objects.bulk_create(shifts)  # Bulk insert shifts
            else:
                self.perform_create(serializer)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update a specific Shift instance."""
        return super().update(request, *args, **kwargs)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Shift record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete a specific Shift instance."""
        return super().destroy(request, *args, **kwargs)
