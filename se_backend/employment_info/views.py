from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.response import Response

from shared.generic_viewset import GenericViewset
from shared.utils import role_required
from users.models import CustomUser
from admins.models import Admin
from employees.models import Employee
from .models import EmploymentInfo
from .serializers import EmploymentInfoSerializer


class EmploymentInfoViewset(GenericViewset, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = EmploymentInfo.objects.all()
    serializer_class = EmploymentInfoSerializer

    @role_required(["owner", "admin", "employee"])
    def list(self, request, *args, **kwargs):
        """List all EmployeeInfo records with pagination. Accessible by owners, admins, and employees."""
        return super().list(request, *args, **kwargs)

    @role_required(["owner", "admin", "employee"])
    def retrieve(self, request, *args, **kwargs):
        """Retrieve details of a single EmploymentInfo record."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @role_required(["owner", "admin"])
    def create(self, request, *args, **kwargs):
        """Create EmploymentInfo with user creation handled by the serializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employment_info = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @role_required(["owner", "admin"])
    def update(self, request, *args, **kwargs):
        """
        Update EmploymentInfo and corresponding role-based instance.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Retrieve associated user
        admin = Admin.objects.filter(employment_info=instance).first()
        employee = Employee.objects.filter(employment_info=instance).first()

        user = admin.user if admin else employee.user if employee else None
        if not user:
            return Response(
                {"detail": "No user associated with this employment info."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle update process
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update user if email, password, or role changes
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role")

        if email and email != user.email:
            user.email = email
        if password:
            user.set_password(password)
        if role and role != user.role:
            # Delete old role instance and create new one
            if user.role == "admin":
                Admin.objects.filter(user=user).delete()
            elif user.role == "employee":
                Employee.objects.filter(user=user).delete()

            user.role = role
            user.save()

            if role == "admin":
                Admin.objects.create(user=user, employment_info=instance)
            elif role == "employee":
                Employee.objects.create(user=user, employment_info=instance)

        user.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @role_required(["owner", "admin"])
    def partial_update(self, request, *args, **kwargs):
        """Partially update EmployeeInfo record. Accessible by owners and admins."""
        return self.update(request, *args, partial=True, **kwargs)

    @role_required(["owner"])
    def destroy(self, request, *args, **kwargs):
        """Delete EmploymentInfo. Only owners can delete."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "Employment info deleted."}, status=status.HTTP_204_NO_CONTENT)

    from rest_framework.decorators import action
    from rest_framework.response import Response
    from rest_framework import status

    @role_required(["owner", "admin", "employee"])
    @action(detail=False, methods=["get"], url_path="employee-number/(?P<employee_number>[^/.]+)")
    def lookup_by_employee_number(self, request, employee_number=None):
        """Custom endpoint to retrieve EmploymentInfo by employee_number."""
        try:
            employment_info = EmploymentInfo.objects.get(employee_number=employee_number)
        except EmploymentInfo.DoesNotExist:
            return Response({"detail": "Employment info not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(employment_info)
        return Response(serializer.data)
