from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSetterOrReadOnly(BasePermission):
    """
    Safe HTTP methods (GET, HEAD, OPTIONS) are open to everyone, so browsing
    gyms/climbs/comps doesn't require an account. Mutating methods (POST, PUT,
    PATCH, DELETE) require is_verified_setter=True.

    Applied to every setter-managed resource (gyms, walls, climbs, comps,
    finals results) so the "only setters can change this" rule lives in one
    place rather than as ad-hoc checks inside individual views.
    """
    message = 'Only setters can perform this action.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_verified_setter
        )


class IsSelfOrReadOnly(BasePermission):
    """Object-level: anyone can read a user's profile, only they can edit it."""
    message = 'You can only edit your own profile.'

    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or obj == request.user
