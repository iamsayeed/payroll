from datetime import datetime
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.shortcuts import get_object_or_404,render
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import generics, permissions, status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from users.models import CustomUser, UserPasswordReset

from shared.auth.serializers import ChangeEmailSerializer, ChangePasswordSerializer, LoginSerializer, ResetPasswordRequestSerializer, ResetPasswordSerializer
from shared.tasks import send_resend_email


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class ChangeEmailView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangeEmailSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        self.perform_update(serializer)

        return Response(
            {
                "message": "Password changed successfully!",
            },
            status=status.HTTP_200_OK,
        )


class SendResetPasswordLink(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = get_object_or_404(CustomUser, email=email)
        token = PasswordResetTokenGenerator().make_token(user)
        reset = UserPasswordReset(email=email, token=token)
        reset.save()

        reset_link = f"{settings.FRONTEND_DOMAIN}reset-password/{token}"

        # Call Celery task to send email asynchronously
        send_resend_email.delay(
            "[Fresco]: Password Reset Request",
            user.email,
            render_to_string(
                "reset_password_email.html",
                {
                    "reset_link": reset_link,
                    "id": user.id,
                },
            ),
        )

        return Response({"message": "Reset link has been sent to your email."})
class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = []

    def post(self, request, token):
        print(f"Received request with token: {token}")  # Debugging
        print(f"Request data: {request.data}")  # Debugging

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer Errors: {serializer.errors}")  # Debugging
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reset_obj = UserPasswordReset.objects.filter(token=token).first()
        if not reset_obj:
            return Response(
                {"error": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.filter(email=reset_obj.email).first()
        if not user:
            return Response(
                {"error": "No user found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer.update(user, serializer.validated_data)
        reset_obj.delete()

        return Response(
            {"success": "Password has been updated."}, status=status.HTTP_200_OK
        )

class ValidateResetPasswordTokenView(views.APIView):
    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        reset_obj = UserPasswordReset.objects.filter(token=token).first()
        current_time = timezone.now()
        token_created_date: datetime = reset_obj.created_at
        password_timeout_duration = 3600  # 1 hour in seconds
        is_expired = (
            abs(current_time - token_created_date)
        ).total_seconds() > password_timeout_duration

        if is_expired or not reset_obj:
            return Response(
                {"error": "Token has expired or is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Token is valid."}, status=status.HTTP_200_OK)