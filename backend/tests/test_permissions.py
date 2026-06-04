"""
Permission class unit tests — test IsSetterOrReadOnly in isolation.

This permission class is the gatekeeper for all gym/wall/climb writes.
Testing it directly (without HTTP) lets us verify every branch cheaply.

Run with: python manage.py test tests.test_permissions
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from climbingAPI.views import IsSetterOrReadOnly

User = get_user_model()


class IsSetterOrReadOnlyTest(TestCase):
    """
    IsSetterOrReadOnly has two rules:
      1. Safe methods (GET, HEAD, OPTIONS) are always allowed — even for
         unauthenticated users, because browsing gyms/climbs is public.
      2. Mutating methods (POST, PUT, PATCH, DELETE) require is_verified_setter=True.

    We use RequestFactory to build fake request objects without a full
    HTTP round-trip so this test is fast and doesn't need URL routing.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsSetterOrReadOnly()
        self.climber = User.objects.create_user(
            'climber', password='pass', is_verified_setter=False
        )
        self.setter = User.objects.create_user(
            'setter', password='pass', is_verified_setter=True
        )

    def _check(self, method, user):
        """Build a fake request with the given method and user, then run the permission check."""
        request = getattr(self.factory, method.lower())('/')
        request.user = user
        return self.permission.has_permission(request, view=None)

    # ── GET is open to everyone ────────────────────────────────────────────────

    def test_get_allowed_for_anonymous_user(self):
        request = self.factory.get('/')
        request.user = AnonymousUser()
        # Anonymous users can list gyms/climbs — no login required to browse.
        self.assertTrue(self.permission.has_permission(request, view=None))

    def test_get_allowed_for_regular_climber(self):
        self.assertTrue(self._check('get', self.climber))

    def test_get_allowed_for_setter(self):
        self.assertTrue(self._check('get', self.setter))

    def test_head_allowed_for_anonymous(self):
        # HEAD is used by browsers for preflight checks — should be open.
        request = self.factory.head('/')
        request.user = AnonymousUser()
        self.assertTrue(self.permission.has_permission(request, view=None))

    # ── POST/PUT/DELETE require setter role ────────────────────────────────────

    def test_post_denied_for_regular_climber(self):
        # A climber trying to create a gym should get 403.
        self.assertFalse(self._check('post', self.climber))

    def test_post_allowed_for_setter(self):
        self.assertTrue(self._check('post', self.setter))

    def test_put_denied_for_climber(self):
        self.assertFalse(self._check('put', self.climber))

    def test_put_allowed_for_setter(self):
        self.assertTrue(self._check('put', self.setter))

    def test_delete_denied_for_climber(self):
        self.assertFalse(self._check('delete', self.climber))

    def test_delete_allowed_for_setter(self):
        self.assertTrue(self._check('delete', self.setter))

    def test_post_denied_for_anonymous(self):
        # Anonymous users can't create anything.
        request = self.factory.post('/')
        request.user = AnonymousUser()
        self.assertFalse(self.permission.has_permission(request, view=None))
