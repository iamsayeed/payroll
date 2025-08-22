from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from .models import Salary
from .serializers import SalarySerializer
from salary.tasks import generate_salary_entries

class SalaryViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all Salary records. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific Salary record. Accessible by owners, admins, and employees."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create Salary record. Only Owners and Admins can create Salary records."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """Update Salary record. Only Owners and Admins can update Salary records."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update Salary record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner", "admin"])
    def destroy(self, request, *args, **kwargs):
        """Delete Salary record. Only Owners and Admins can delete Salary records."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TriggerSalaryTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        task = generate_salary_entries.delay()  # Call task directly
        return Response({"message": "Salary generation task triggered.", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)