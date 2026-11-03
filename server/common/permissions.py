
from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_admin(user):
    """
    Return True if the user is authenticated, active,
    and has administrator privileges.
    """
    return (
        user.is_authenticated
        and user.is_active
        and (
            user.is_staff
            or user.is_superuser
            or getattr(user, "role", None) == "admin"
        )
    )


class IsAdminOrReadOnly(BasePermission):
    """
    Anyone may read categories.
    Only active administrators may create, update, or delete categories.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return is_admin(request.user)


class IsOwnerOrAdminOrReadOnly(BasePermission):
    """
    Anyone may read products that the view makes visible.
    Only the product owner or an active administrator may modify a product.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.is_authenticated and request.user.is_active

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        user = request.user

        if not user.is_authenticated or not user.is_active:
            return False

        return (
            is_admin(user)
            or getattr(obj, "owner_id", None) == user.pk
        )


class IsAdminUserRole(BasePermission):
    """
    Only active administrators may perform moderation actions.
    """

    def has_permission(self, request, view):
        return is_admin(request.user)
