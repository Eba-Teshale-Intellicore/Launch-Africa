from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.user import User
from accounts.serializers.auth import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
)
from accounts.serializers.user import UserSerializer
from accounts.services.auth import change_password, reset_password


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(
                serializer.validated_data["refresh"]
            )

            # Only allow the authenticated user to blacklist
            # their own refresh token.
            if str(refresh["user_id"]) != str(request.user.pk):
                raise ValidationError({
                    "refresh": "Invalid refresh token."
                })

            refresh.blacklist()

        except TokenError:
            raise ValidationError({
                "refresh": "Invalid or expired refresh token."
            })

        return Response(
            {"detail": "Logout successful."},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        generic_response = {
            "detail": (
                "If an account with that email exists, "
                "a password reset link has been sent."
            )
        }

        if user is None:
            return Response(
                generic_response,
                status=status.HTTP_200_OK,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        frontend_url = settings.FRONTEND_URL.rstrip("/")
        reset_link = (
            f"{frontend_url}/reset-password/{uid}/{token}/"
        )

        send_mail(
            subject="Reset your LaunchAfrica password",
            message=(
                "We received a request to reset your password.\n\n"
                f"Use this link to reset it:\n{reset_link}\n\n"
                "If you did not request this, you can ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_decoded)

        except (
            TypeError,
            ValueError,
            OverflowError,
            UnicodeDecodeError,
            User.DoesNotExist,
        ):
            raise ValidationError({
                "detail": "Invalid or expired reset link."
            })

        if not user.is_active or not default_token_generator.check_token(
            user, token
        ):
            raise ValidationError({
                "detail": "Invalid or expired reset link."
            })

        try:
            reset_password(
                user=user,
                new_password=new_password,
            )
        except DjangoValidationError as exc:
            raise ValidationError({
                "new_password": exc.messages
            }) from exc

        return Response(
            {"detail": "Password reset successful."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            change_password(
                user=request.user,
                current_password=serializer.validated_data[
                    "current_password"
                ],
                new_password=serializer.validated_data[
                    "new_password"
                ],
            )
        except DjangoValidationError as exc:
            detail = getattr(
                exc,
                "message_dict",
                {"detail": exc.messages},
            )
            raise ValidationError(detail) from exc

        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )