import jwt
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from functools import wraps


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


def role_required(allowed_roles):
    """
    Decorator for checking user roles in API views.
    Usage: @role_required(["admin", "owner"])
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            role = get_role_from_token(request)

            if role not in allowed_roles:
                raise PermissionDenied("You do not have permission to access this resource.")

            return view_func(self, request, *args, **kwargs)

        return wrapper

    return decorator
