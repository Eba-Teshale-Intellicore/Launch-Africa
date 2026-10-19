from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models.profile import Profile
from accounts.serializers.profile import ProfileSerializer
from accounts.services.auth import update_user_profile


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile(self, user):
        profile, _created = Profile.objects.get_or_create(
            user=user
        )
        return profile

    def get(self, request):
        profile = self.get_profile(request.user)

        serializer = ProfileSerializer(profile)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        profile = self.get_profile(request.user)

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        try:
            profile = update_user_profile(
                user=request.user,
                profile_data=serializer.validated_data,
            )
        except DjangoValidationError as exc:
            raise ValidationError(
                getattr(exc, "message_dict", {"detail": exc.messages})
            ) from exc

        return Response(
            ProfileSerializer(profile).data,
            status=status.HTTP_200_OK,
        )