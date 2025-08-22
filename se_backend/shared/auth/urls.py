from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from shared.auth.views import (
    ChangeEmailView,
    ChangePasswordView,
    LoginView,
    ResetPasswordView,
    SendResetPasswordLink,
    ValidateResetPasswordTokenView,
)
urlpatterns = [
    path("login/", LoginView.as_view(), name="global-login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="global-refresh"),
    path("logout/", TokenBlacklistView.as_view(), name="token-blacklist"),
    path("change-email/", ChangeEmailView.as_view(), name="change-email"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path(
        "send-password-reset-link/",
        SendResetPasswordLink.as_view(),
        name="send-password-reset-link",
        ),
        path(
            "reset-password/<str:token>/",
            ResetPasswordView.as_view(),
            name="reset-password",
        ),
        path(
            "validate-reset-password-token/",
            ValidateResetPasswordTokenView.as_view(),
            name="validate-reset-password-token",
        ),
]
