from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    Technicians and others can only read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users full access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsTechnicianOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow both technicians and admin users.
    """
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and
                request.user.role in ['admin', 'technician'])


class AllowAuthenticatedReadAndCreateElseAdmin(permissions.BasePermission):
    """
    Allow any authenticated user to:
    - READ (GET, HEAD, OPTIONS)
    - CREATE (POST) complaints

    Only admin can modify or delete existing records (PUT/PATCH/DELETE).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Allow any authenticated user to create (POST)
        if request.method == 'POST':
            return request.user and request.user.is_authenticated
        # Only admin can modify/delete (PUT/PATCH/DELETE)
        return request.user and request.user.is_authenticated and request.user.role == 'admin'
