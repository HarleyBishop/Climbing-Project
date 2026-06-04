"""
Auth and user endpoint tests — exercises the actual HTTP layer.

APIClient from DRF sends real requests through the Django URL router,
serializers, and views, so these tests catch issues that pure unit tests miss
(e.g. wrong URL, missing permission class, serializer validation gaps).

Run with: python manage.py test tests.test_views_auth
"""
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from climbingAPI.models import Follow

User = get_user_model()


def make_user(username='climber', password='testpass123', is_setter=False):
    return User.objects.create_user(
        username=username, password=password, is_verified_setter=is_setter
    )


# ─── Registration ──────────────────────────────────────────────────────────────
# The register endpoint is AllowAny — no token needed, obviously, since this IS
# how you get an account. Tests verify the happy path and the two most likely
# failures: duplicate username and password never leaking back in the response.

class RegistrationTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/user/register/'

    def test_register_creates_user(self):
        res = self.client.post(self.url, {'username': 'newclimber', 'password': 'securePa$$1'})
        self.assertEqual(res.status_code, 201)
        self.assertTrue(User.objects.filter(username='newclimber').exists())

    def test_register_hashes_password(self):
        # If create_user was accidentally replaced with create, the password would
        # be stored in plaintext and check_password would fail.
        self.client.post(self.url, {'username': 'newclimber', 'password': 'securePa$$1'})
        user = User.objects.get(username='newclimber')
        self.assertTrue(user.check_password('securePa$$1'))

    def test_register_does_not_expose_password_in_response(self):
        # UserSerializer marks password as write_only — verify that holds.
        res = self.client.post(self.url, {'username': 'newclimber', 'password': 'securePa$$1'})
        self.assertNotIn('password', res.data)

    def test_register_duplicate_username_returns_400(self):
        make_user('dupeuser')
        res = self.client.post(self.url, {'username': 'dupeuser', 'password': 'securePa$$1'})
        self.assertEqual(res.status_code, 400)

    def test_unauthenticated_can_register(self):
        # No token in headers — should still succeed.
        res = self.client.post(self.url, {'username': 'anon', 'password': 'securePa$$1'})
        self.assertEqual(res.status_code, 201)


# ─── Password change ───────────────────────────────────────────────────────────
# Requires authentication (IsAuthenticated). The view checks the current password
# before allowing the change — important to test that bypass is impossible.

class ChangePasswordTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user(password='OldPass123!')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/users/change-password/'

    def test_correct_current_password_allows_change(self):
        res = self.client.post(self.url, {
            'current_password': 'OldPass123!',
            'new_password': 'NewPass456!'
        })
        self.assertEqual(res.status_code, 200)
        # Reload from DB and verify the password was actually updated.
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass456!'))

    def test_wrong_current_password_rejected(self):
        res = self.client.post(self.url, {
            'current_password': 'WrongPassword',
            'new_password': 'NewPass456!'
        })
        self.assertEqual(res.status_code, 400)
        # The old password should still work — nothing was changed.
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('OldPass123!'))

    def test_new_password_too_short_rejected(self):
        # ChangePasswordSerializer enforces min_length=8 on new_password.
        res = self.client.post(self.url, {
            'current_password': 'OldPass123!',
            'new_password': 'short'
        })
        self.assertEqual(res.status_code, 400)

    def test_unauthenticated_cannot_change_password(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url, {
            'current_password': 'OldPass123!',
            'new_password': 'NewPass456!'
        })
        self.assertEqual(res.status_code, 401)


# ─── Follow / Unfollow ─────────────────────────────────────────────────────────
# Social graph management. Uses get_or_create so re-following is idempotent.
# The "can't follow yourself" guard is important to keep feed queries clean.

class FollowTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('follower')
        self.target = make_user('target_user')
        self.client.force_authenticate(user=self.user)

    def _follow_url(self, user_id):
        return f'/api/users/{user_id}/follow/'

    def test_follow_creates_relationship(self):
        res = self.client.post(self._follow_url(self.target.id))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Follow.objects.filter(follower=self.user, following=self.target).exists())

    def test_follow_is_idempotent(self):
        # Clicking "Follow" twice should not create two rows.
        self.client.post(self._follow_url(self.target.id))
        res = self.client.post(self._follow_url(self.target.id))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            Follow.objects.filter(follower=self.user, following=self.target).count(), 1
        )

    def test_cannot_follow_yourself(self):
        res = self.client.post(self._follow_url(self.user.id))
        self.assertEqual(res.status_code, 400)

    def test_unfollow_removes_relationship(self):
        Follow.objects.create(follower=self.user, following=self.target)
        res = self.client.delete(self._follow_url(self.target.id))
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Follow.objects.filter(follower=self.user, following=self.target).exists())

    def test_unfollow_when_not_following_is_safe(self):
        # Calling DELETE when there's no follow row should not crash — just no-op.
        res = self.client.delete(self._follow_url(self.target.id))
        self.assertEqual(res.status_code, 204)

    def test_follower_count_included_in_profile_response(self):
        Follow.objects.create(follower=self.user, following=self.target)
        res = self.client.get(f'/api/users/{self.target.id}/')
        self.assertEqual(res.data['follower_count'], 1)
        self.assertEqual(res.data['following_count'], 0)


# ─── User profile ──────────────────────────────────────────────────────────────
# Users can only edit their own bio — editing another's should return 403.
# The UserDetailView uses UserSerializer for GET (all fields) and
# UserProfileSerializer for PATCH (bio only).

class UserProfileTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('me')
        self.other = make_user('other')
        self.client.force_authenticate(user=self.user)

    def test_can_patch_own_bio(self):
        res = self.client.patch(f'/api/users/{self.user.id}/', {'bio': 'I love V5 problems'})
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.bio, 'I love V5 problems')

    def test_cannot_patch_another_users_bio(self):
        res = self.client.patch(f'/api/users/{self.other.id}/', {'bio': 'Hacked bio'})
        self.assertEqual(res.status_code, 403)
        self.other.refresh_from_db()
        self.assertNotEqual(self.other.bio, 'Hacked bio')

    def test_profile_get_includes_is_following_flag(self):
        # is_following tells the profile page whether to show Follow/Unfollow.
        Follow.objects.create(follower=self.user, following=self.other)
        res = self.client.get(f'/api/users/{self.other.id}/')
        self.assertTrue(res.data['is_following'])

    def test_is_following_false_when_not_following(self):
        res = self.client.get(f'/api/users/{self.other.id}/')
        self.assertFalse(res.data['is_following'])
