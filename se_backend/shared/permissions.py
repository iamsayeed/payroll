from rest_framework import permissions
import jwt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


def get_role_from_token(request):
    """Extract and decode the JWT token to retrieve the user's role."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise AuthenticationFailed("No valid token provided.")

    token = auth_header.split(" ")[1]  # Extract token after "Bearer"

    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token.get("role")
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token has expired.")
    except jwt.DecodeError:
        raise AuthenticationFailed("Invalid token.")


class RoleRequiredPermission(permissions.BasePermission):
    """
    Custom permission to check if the user has one of the required roles.
    Usage: permission_classes = [RoleRequiredPermission(["admin", "owner"])]
    """

    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def has_permission(self, request, view):
        role = get_role_from_token(request)

        if role not in self.allowed_roles:
            raise PermissionDenied("You do not have permission to access this resource.")

        return True