from rest_framework.permissions import IsAuthenticated
from rest_framework import status, viewsets
from rest_framework.response import Response
from shared.utils import role_required
from .models import SSS, Pagibig, Philhealth
from .serializers import SSSSerializer, PhilhealthSerializer, PagibigSerializer

class SSSViewSet(viewsets.ModelViewSet):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    queryset = SSS.objects.all()
    serializer_class = SSSSerializer
    permission_classes = [IsAuthenticated]  # Default permission for authenticated users

    # Apply the role_required decorator to the CRUD methods
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Admin instances with pagination. Only Owners and Admins can access."""
        return super().list(request, *args, **kwargs)  # Call GenericViewset's list method

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create SSS record. Accessible by owners and admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sss = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update SSS record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update SSS record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve SSS record. Accessible by owners and admins."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete SSS record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PhilhealthViewSet(viewsets.ModelViewSet):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    queryset = Philhealth.objects.all()
    serializer_class = PhilhealthSerializer
    permission_classes = [IsAuthenticated]  # Default permission for authenticated users

    # Apply the role_required decorator to the CRUD methods
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Philhealth records. Accessible by owners, admins, and employees."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create Philhealth record. Accessible by owners and admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        philhealth = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Philhealth record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update SSS record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve Philhealth record. Accessible by owners and admins."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Philhealth record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PagibigViewSet(viewsets.ModelViewSet):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy", "list"]
    queryset = Pagibig.objects.all()
    serializer_class = PagibigSerializer
    permission_classes = [IsAuthenticated]  # Default permission for authenticated users

    # Apply the role_required decorator to the CRUD methods
    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Pagibig records. Accessible by owners, admins, and employees."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create Pagibig record. Accessible by owners and admins."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pagibig = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Pagibig record. Accessible by owners and admins."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update SSS record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve Pagibig record. Accessible by owners and admins."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Pagibig record. Accessible by owners and admins."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
