from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views.auth import (
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    RegisterView,
    ResetPasswordView,
)
from accounts.views.profile import ProfileView
from accounts.views.user import UserView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("me/", UserView.as_view(), name="me"),
    path("me/profile/", ProfileView.as_view(), name="my-profile"),

    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]