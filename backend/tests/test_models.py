"""
Model unit tests — these test the database layer in isolation, no HTTP requests.

Run with: python manage.py test tests.test_models
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from climbingAPI.models import Gym, Wall, Climb, GradeVote, Send, Follow, Competition

User = get_user_model()


# ─── Shared helpers ────────────────────────────────────────────────────────────
# Creating objects through helpers keeps each test method short and focused
# on the ONE behaviour it's testing rather than lots of setup boilerplate.

def make_user(username='climber', is_setter=False):
    return User.objects.create_user(
        username=username, password='testpass123', is_verified_setter=is_setter
    )

def make_gym(setter):
    return Gym.objects.create(name='Test Gym', location='Testville', added_by=setter)

def make_wall(gym, name='Slab Wall'):
    return Wall.objects.create(name=name, description='Slabby', gym=gym)

def make_climb(wall, added_by, grade=5, name='Project', archived=False):
    return Climb.objects.create(
        name=name, colour='Red', suggested_grade=grade,
        wall=wall, added_by=added_by, is_archived=archived,
    )


# ─── Competition.status ────────────────────────────────────────────────────────
# This is a @property on the model — no DB column, computed live from timezone.now().
# Critical to test because the CompRegisterView and CompSendCreateView both use it
# as a guard: you can't register or log sends to a closed competition.

class CompetitionStatusTest(TestCase):

    def setUp(self):
        self.setter = make_user('setter', is_setter=True)
        self.gym = make_gym(self.setter)

    def _make_comp(self, start_offset_hours, end_offset_hours):
        """Creates a competition whose window is offset from now by the given hours."""
        now = timezone.now()
        return Competition.objects.create(
            title='Test Comp',
            comp_type=Competition.QUALIFIER,
            start_date=now + timedelta(hours=start_offset_hours),
            end_date=now + timedelta(hours=end_offset_hours),
            gym=self.gym,
            created_by=self.setter,
        )

    def test_upcoming_when_start_is_in_the_future(self):
        # start_date=+1h, end_date=+5h → competition hasn't started yet
        comp = self._make_comp(1, 5)
        self.assertEqual(comp.status, 'upcoming')

    def test_open_during_the_registration_window(self):
        # start_date=-1h, end_date=+5h → we're inside the window right now
        comp = self._make_comp(-1, 5)
        self.assertEqual(comp.status, 'open')

    def test_closed_after_end_date(self):
        # start_date=-10h, end_date=-1h → competition finished an hour ago
        comp = self._make_comp(-10, -1)
        self.assertEqual(comp.status, 'closed')

    def test_open_at_exact_start_boundary(self):
        # The condition is `now <= end_date`, so start == now is 'open', not 'upcoming'.
        # Using a 1-second buffer so the test doesn't flap on slow machines.
        now = timezone.now()
        comp = Competition.objects.create(
            title='Boundary Comp',
            comp_type=Competition.QUALIFIER,
            start_date=now - timedelta(seconds=1),
            end_date=now + timedelta(hours=5),
            gym=self.gym,
            created_by=self.setter,
        )
        self.assertEqual(comp.status, 'open')


# ─── GradeVote unique constraint ───────────────────────────────────────────────
# The DB enforces one vote per (climb, user) pair. The view uses update_or_create
# so normal re-votes don't hit the constraint — but we verify the constraint exists
# so there's no way to bypass it by calling the DB directly.

class GradeVoteUniqueTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.setter = make_user('setter', is_setter=True)
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.climb = make_climb(self.wall, self.setter)

    def test_duplicate_vote_raises_integrity_error(self):
        GradeVote.objects.create(climb=self.climb, user=self.user, grade=5)
        # The second create on the same (climb, user) pair must fail at the DB level.
        with self.assertRaises(IntegrityError):
            GradeVote.objects.create(climb=self.climb, user=self.user, grade=6)

    def test_different_users_can_vote_on_same_climb(self):
        other = make_user('other')
        GradeVote.objects.create(climb=self.climb, user=self.user, grade=5)
        # Should not raise — different user, same climb is allowed.
        GradeVote.objects.create(climb=self.climb, user=other, grade=6)
        self.assertEqual(GradeVote.objects.filter(climb=self.climb).count(), 2)


# ─── Send unique constraint ────────────────────────────────────────────────────
# Same pattern as GradeVote: one send record per (climb, user). The view uses
# update_or_create so logging a send twice just updates the attempt count.

class SendUniqueTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.setter = make_user('setter', is_setter=True)
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.climb = make_climb(self.wall, self.setter)

    def test_duplicate_send_raises_integrity_error(self):
        Send.objects.create(climb=self.climb, user=self.user, attempts=1)
        with self.assertRaises(IntegrityError):
            Send.objects.create(climb=self.climb, user=self.user, attempts=2)

    def test_different_users_can_send_same_climb(self):
        other = make_user('other')
        Send.objects.create(climb=self.climb, user=self.user, attempts=1)
        Send.objects.create(climb=self.climb, user=other, attempts=3)
        self.assertEqual(Send.objects.filter(climb=self.climb).count(), 2)


# ─── Climb archival ────────────────────────────────────────────────────────────
# is_archived is the "soft delete" flag. When a wall is reset, climbs get archived
# instead of deleted so that send history is preserved. Active climb lists filter
# on is_archived=False, so archived climbs should be invisible to those queries.

class ClimbArchiveTest(TestCase):

    def setUp(self):
        self.setter = make_user('setter', is_setter=True)
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)

    def test_new_climb_is_not_archived(self):
        climb = make_climb(self.wall, self.setter)
        self.assertFalse(climb.is_archived)

    def test_archived_climb_excluded_by_active_filter(self):
        active = make_climb(self.wall, self.setter, name='Active')
        archived = make_climb(self.wall, self.setter, name='Old Route', archived=True)

        active_qs = Climb.objects.filter(wall=self.wall, is_archived=False)
        self.assertIn(active, active_qs)
        self.assertNotIn(archived, active_qs)

    def test_archived_climb_appears_in_archived_filter(self):
        make_climb(self.wall, self.setter, name='Active')
        archived = make_climb(self.wall, self.setter, name='Old Route', archived=True)

        archived_qs = Climb.objects.filter(wall=self.wall, is_archived=True)
        self.assertIn(archived, archived_qs)


# ─── Follow unique constraint ─────────────────────────────────────────────────
# A user can only follow another user once. The FollowView uses get_or_create so
# double-clicking "Follow" is idempotent — but the DB constraint is the real guard.

class FollowTest(TestCase):

    def setUp(self):
        self.user1 = make_user('user1')
        self.user2 = make_user('user2')

    def test_duplicate_follow_raises_integrity_error(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        with self.assertRaises(IntegrityError):
            Follow.objects.create(follower=self.user1, following=self.user2)

    def test_reverse_follow_is_allowed(self):
        # user1→user2 and user2→user1 are two separate rows — not a duplicate.
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user2, following=self.user1)
        self.assertEqual(Follow.objects.count(), 2)

    def test_str_includes_both_usernames(self):
        follow = Follow.objects.create(follower=self.user1, following=self.user2)
        s = str(follow)
        self.assertIn('user1', s)
        self.assertIn('user2', s)


# ─── Cascade / SET_NULL deletion behaviour ─────────────────────────────────────
# Gym uses SET_NULL on added_by: deleting the setter keeps the gym.
# Wall uses CASCADE on gym: deleting the gym removes the walls.
# These are easy to get wrong during migrations, so worth an explicit test.

class CascadeTest(TestCase):

    def setUp(self):
        self.setter = make_user('setter', is_setter=True)
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        make_climb(self.wall, self.setter)

    def test_deleting_setter_nulls_gym_added_by_not_deletes_gym(self):
        self.setter.delete()
        self.gym.refresh_from_db()
        self.assertIsNone(self.gym.added_by)

    def test_deleting_gym_cascades_to_walls(self):
        gym_id = self.gym.id
        wall_id = self.wall.id
        self.gym.delete()
        self.assertFalse(Wall.objects.filter(id=wall_id).exists())

    def test_deleting_wall_cascades_to_climbs(self):
        climb_count_before = Climb.objects.filter(wall=self.wall).count()
        self.assertGreater(climb_count_before, 0)
        self.wall.delete()
        self.assertEqual(Climb.objects.filter(wall__gym=self.gym).count(), 0)
