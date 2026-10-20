
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Public users may read active categories.
    Only authorized administrators may manage categories.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and (
                user.is_staff
                or (
                    user.is_superuser
                )
                or getattr(user, "role", None) == "admin"
            )
        )
