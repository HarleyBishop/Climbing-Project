"""
Leaderboard algorithm tests — the most business-critical logic in the app.

Three separate leaderboards each have non-trivial sorting rules:
  - Gym leaderboard:        grade-tiered points, archived sends excluded
  - Qualifier leaderboard:  points desc, then attempts asc (fewest attempts wins ties)
  - Finals leaderboard:     IFSC rules: tops → top_attempts → zones → zone_attempts

Run with: python manage.py test tests.test_views_leaderboard
"""
from django.test import TestCase
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from climbingAPI.models import (
    Gym, Wall, Climb, Send,
    Competition, CompClimb, CompRegistration, CompSend,
    FinalsResult,
)

User = get_user_model()


# ─── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username, is_setter=False):
    return User.objects.create_user(username=username, password='pass', is_verified_setter=is_setter)

def make_gym(setter):
    return Gym.objects.create(name='The Gym', location='Testville', added_by=setter)

def make_wall(gym):
    return Wall.objects.create(name='Wall', description='', gym=gym)

def make_climb(wall, setter, grade=5, archived=False, name=None):
    return Climb.objects.create(
        name=name or f'V{grade} problem',
        colour='Red',
        suggested_grade=grade,
        wall=wall,
        added_by=setter,
        is_archived=archived,
    )

def make_open_comp(gym, setter, top_x=None):
    """Competition that is currently open (started 1h ago, ends in 5h)."""
    now = timezone.now()
    return Competition.objects.create(
        title='Test Comp',
        comp_type=Competition.QUALIFIER,
        start_date=now - timedelta(hours=1),
        end_date=now + timedelta(hours=5),
        gym=gym,
        created_by=setter,
        top_x_advance=top_x,
    )

def make_finals_comp(gym, setter):
    now = timezone.now()
    return Competition.objects.create(
        title='Finals',
        comp_type=Competition.FINALS,
        start_date=now - timedelta(hours=1),
        end_date=now + timedelta(hours=5),
        gym=gym,
        created_by=setter,
    )


# ─── Gym leaderboard ────────────────────────────────────────────────────────────
# Points are tiered by grade — not linear — so a V7 is worth more than seven V0s.
# This is by design (encourages hard climbing over volume).
# The frontend mirrors this same formula in rankUtils.jsx's gradeToPoints().

class GymLeaderboardTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber1 = make_user('climber1')
        self.climber2 = make_user('climber2')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.client.force_authenticate(user=self.climber1)
        self.url = f'/api/gyms/{self.gym.id}/leaderboard/'

    def test_grade_to_points_mapping_is_correct(self):
        # Each grade bracket maps to specific points — tests the exact values
        # so frontend (rankUtils) and backend (views) stay in sync.
        expected = {0: 10, 2: 10, 3: 20, 4: 20, 5: 40, 6: 40, 7: 70, 8: 70, 9: 100, 10: 100, 11: 150}
        for grade, pts in expected.items():
            climb = make_climb(self.wall, self.setter, grade=grade, name=f'grade{grade}')
            Send.objects.create(climb=climb, user=self.climber1, attempts=1)

        res = self.client.get(self.url)
        entry = next(e for e in res.data if e['user_id'] == self.climber1.id)
        self.assertEqual(entry['points'], sum(expected.values()))

    def test_archived_sends_do_not_count_toward_points(self):
        # When a wall is reset, the archived climbs drop out of the leaderboard.
        # A climber's rank can go DOWN when a wall is reset — this is intentional.
        active = make_climb(self.wall, self.setter, grade=7, name='active')
        archived = make_climb(self.wall, self.setter, grade=7, name='archived', archived=True)
        Send.objects.create(climb=active, user=self.climber1, attempts=1)
        Send.objects.create(climb=archived, user=self.climber1, attempts=1)

        res = self.client.get(self.url)
        entry = next(e for e in res.data if e['user_id'] == self.climber1.id)
        self.assertEqual(entry['points'], 70)  # Only one V7 = 70pts; archived V7 = 0

    def test_leaderboard_sorted_descending_by_points(self):
        low_climb = make_climb(self.wall, self.setter, grade=2, name='easy')
        high_climb = make_climb(self.wall, self.setter, grade=8, name='hard')
        Send.objects.create(climb=low_climb, user=self.climber1, attempts=1)   # 10 pts
        Send.objects.create(climb=high_climb, user=self.climber2, attempts=1)  # 70 pts

        res = self.client.get(self.url)
        self.assertEqual(res.data[0]['user_id'], self.climber2.id)
        self.assertEqual(res.data[1]['user_id'], self.climber1.id)

    def test_rank_field_starts_at_1(self):
        climb = make_climb(self.wall, self.setter, grade=5)
        Send.objects.create(climb=climb, user=self.climber1, attempts=1)

        res = self.client.get(self.url)
        self.assertEqual(res.data[0]['rank'], 1)

    def test_send_count_is_included(self):
        c1 = make_climb(self.wall, self.setter, grade=5, name='p1')
        c2 = make_climb(self.wall, self.setter, grade=6, name='p2')
        Send.objects.create(climb=c1, user=self.climber1, attempts=1)
        Send.objects.create(climb=c2, user=self.climber1, attempts=1)

        res = self.client.get(self.url)
        entry = next(e for e in res.data if e['user_id'] == self.climber1.id)
        self.assertEqual(entry['send_count'], 2)


# ─── Qualifier leaderboard ────────────────────────────────────────────────────
# Points sum all CompSend.comp_climb.points_value for each user.
# Tiebreaker: fewer total attempts wins. This reflects real comp scoring.

class QualifierLeaderboardTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber1 = make_user('climber1')
        self.climber2 = make_user('climber2')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.client.force_authenticate(user=self.climber1)

    def _register(self, comp, user):
        CompRegistration.objects.create(competition=comp, user=user)

    def test_sorted_by_points_descending(self):
        comp = make_open_comp(self.gym, self.setter)
        c1 = make_climb(self.wall, self.setter, grade=5, name='p1')
        c2 = make_climb(self.wall, self.setter, grade=5, name='p2')
        cc1 = CompClimb.objects.create(competition=comp, climb=c1, points_value=100)
        cc2 = CompClimb.objects.create(competition=comp, climb=c2, points_value=200)

        self._register(comp, self.climber1)
        self._register(comp, self.climber2)
        CompSend.objects.create(comp_climb=cc1, user=self.climber1, attempts=1)  # 100pts
        CompSend.objects.create(comp_climb=cc1, user=self.climber2, attempts=1)
        CompSend.objects.create(comp_climb=cc2, user=self.climber2, attempts=1)  # 300pts total

        res = self.client.get(f'/api/competitions/{comp.id}/leaderboard/')
        self.assertEqual(res.data[0]['user_id'], self.climber2.id)
        self.assertEqual(res.data[0]['points'], 300)
        self.assertEqual(res.data[1]['user_id'], self.climber1.id)
        self.assertEqual(res.data[1]['points'], 100)

    def test_tiebreak_by_fewer_total_attempts(self):
        # Same points but climber2 used fewer attempts → climber2 wins.
        comp = make_open_comp(self.gym, self.setter)
        climb = make_climb(self.wall, self.setter, grade=5)
        cc = CompClimb.objects.create(competition=comp, climb=climb, points_value=100)

        self._register(comp, self.climber1)
        self._register(comp, self.climber2)
        CompSend.objects.create(comp_climb=cc, user=self.climber1, attempts=5)
        CompSend.objects.create(comp_climb=cc, user=self.climber2, attempts=1)

        res = self.client.get(f'/api/competitions/{comp.id}/leaderboard/')
        self.assertEqual(res.data[0]['user_id'], self.climber2.id)

    def test_advances_flag_set_for_top_n_users(self):
        # top_x_advance=1 means only rank 1 advances to finals.
        comp = make_open_comp(self.gym, self.setter, top_x=1)
        climb = make_climb(self.wall, self.setter, grade=5)
        cc = CompClimb.objects.create(competition=comp, climb=climb, points_value=100)

        self._register(comp, self.climber1)
        self._register(comp, self.climber2)
        CompSend.objects.create(comp_climb=cc, user=self.climber1, attempts=1)
        CompSend.objects.create(comp_climb=cc, user=self.climber2, attempts=3)

        res = self.client.get(f'/api/competitions/{comp.id}/leaderboard/')
        # Tied on points; climber1 has fewer attempts → rank 1 → advances.
        self.assertTrue(res.data[0]['advances'])
        self.assertFalse(res.data[1]['advances'])

    def test_advances_false_when_top_x_is_null(self):
        # If top_x_advance is None (no advancement mechanic), everyone is False.
        comp = make_open_comp(self.gym, self.setter, top_x=None)
        climb = make_climb(self.wall, self.setter, grade=5)
        cc = CompClimb.objects.create(competition=comp, climb=climb, points_value=100)

        self._register(comp, self.climber1)
        CompSend.objects.create(comp_climb=cc, user=self.climber1, attempts=1)

        res = self.client.get(f'/api/competitions/{comp.id}/leaderboard/')
        self.assertFalse(res.data[0]['advances'])

    def test_rank_numbers_are_sequential(self):
        comp = make_open_comp(self.gym, self.setter)
        c1 = make_climb(self.wall, self.setter, grade=5, name='p1')
        c2 = make_climb(self.wall, self.setter, grade=5, name='p2')
        cc1 = CompClimb.objects.create(competition=comp, climb=c1, points_value=200)
        cc2 = CompClimb.objects.create(competition=comp, climb=c2, points_value=100)

        self._register(comp, self.climber1)
        self._register(comp, self.climber2)
        CompSend.objects.create(comp_climb=cc1, user=self.climber1, attempts=1)
        CompSend.objects.create(comp_climb=cc2, user=self.climber2, attempts=1)

        res = self.client.get(f'/api/competitions/{comp.id}/leaderboard/')
        ranks = [e['rank'] for e in res.data]
        self.assertEqual(ranks, [1, 2])


# ─── Finals leaderboard (IFSC algorithm) ──────────────────────────────────────
# IFSC boulder finals ranking:
#   1. Most tops wins.
#   2. Tie on tops → fewest top attempts.
#   3. Tie again → most zones.
#   4. Tie again → fewest zone attempts.
#
# FinalsResult records are entered by judges (setters), not self-reported.

class FinalsLeaderboardTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.c1 = make_user('climber1')
        self.c2 = make_user('climber2')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.client.force_authenticate(user=self.c1)

    def _result(self, comp_climb, user, topped=False, top_attempts=None, zoned=False, zone_attempts=None):
        return FinalsResult.objects.create(
            comp_climb=comp_climb, user=user,
            topped=topped, top_attempts=top_attempts,
            zoned=zoned, zone_attempts=zone_attempts,
            recorded_by=self.setter,
        )

    def test_more_tops_wins(self):
        comp = make_finals_comp(self.gym, self.setter)
        p1 = make_climb(self.wall, self.setter, grade=7, name='p1')
        p2 = make_climb(self.wall, self.setter, grade=7, name='p2')
        cc1 = CompClimb.objects.create(competition=comp, climb=p1)
        cc2 = CompClimb.objects.create(competition=comp, climb=p2)

        # c1 tops both problems; c2 only tops one.
        self._result(cc1, self.c1, topped=True, top_attempts=2)
        self._result(cc2, self.c1, topped=True, top_attempts=1)
        self._result(cc1, self.c2, topped=True, top_attempts=1)

        res = self.client.get(f'/api/competitions/{comp.id}/finals-leaderboard/')
        self.assertEqual(res.data[0]['user_id'], self.c1.id)
        self.assertEqual(res.data[0]['tops'], 2)
        self.assertEqual(res.data[1]['tops'], 1)

    def test_fewest_top_attempts_breaks_equal_tops_tie(self):
        comp = make_finals_comp(self.gym, self.setter)
        p = make_climb(self.wall, self.setter, grade=8, name='p1')
        cc = CompClimb.objects.create(competition=comp, climb=p)

        # Both topped; c2 used fewer attempts.
        self._result(cc, self.c1, topped=True, top_attempts=5)
        self._result(cc, self.c2, topped=True, top_attempts=1)

        res = self.client.get(f'/api/competitions/{comp.id}/finals-leaderboard/')
        self.assertEqual(res.data[0]['user_id'], self.c2.id)

    def test_more_zones_breaks_tie_when_tops_and_attempts_equal(self):
        comp = make_finals_comp(self.gym, self.setter)
        p = make_climb(self.wall, self.setter, grade=8)
        cc = CompClimb.objects.create(competition=comp, climb=p)

        # Neither topped; c2 has a zone.
        self._result(cc, self.c1, topped=False, zoned=False)
        self._result(cc, self.c2, topped=False, zoned=True, zone_attempts=2)

        res = self.client.get(f'/api/competitions/{comp.id}/finals-leaderboard/')
        self.assertEqual(res.data[0]['user_id'], self.c2.id)

    def test_fewest_zone_attempts_is_final_tiebreaker(self):
        comp = make_finals_comp(self.gym, self.setter)
        p = make_climb(self.wall, self.setter, grade=8)
        cc = CompClimb.objects.create(competition=comp, climb=p)

        # Same tops (0) and zones (1); c2 reached zone in fewer attempts.
        self._result(cc, self.c1, zoned=True, zone_attempts=5)
        self._result(cc, self.c2, zoned=True, zone_attempts=1)

        res = self.client.get(f'/api/competitions/{comp.id}/finals-leaderboard/')
        self.assertEqual(res.data[0]['user_id'], self.c2.id)

    def test_rank_field_assigned_correctly(self):
        comp = make_finals_comp(self.gym, self.setter)
        p = make_climb(self.wall, self.setter, grade=8)
        cc = CompClimb.objects.create(competition=comp, climb=p)

        self._result(cc, self.c1, topped=True, top_attempts=1)
        self._result(cc, self.c2, topped=False)

        res = self.client.get(f'/api/competitions/{comp.id}/finals-leaderboard/')
        self.assertEqual(res.data[0]['rank'], 1)
        self.assertEqual(res.data[1]['rank'], 2)


# ─── Competition send guards ───────────────────────────────────────────────────
# CompSendCreateView has three guards before accepting a send:
#   1. Competition must be 'open'.
#   2. User must be registered.
#   3. The CompClimb must belong to this competition.
# All three rejection paths need a test.

class CompSendGuardsTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.client.force_authenticate(user=self.climber)

    def _log_send_url(self, comp_id):
        return f'/api/competitions/{comp_id}/log-send/'

    def test_cannot_log_send_to_closed_competition(self):
        now = timezone.now()
        closed_comp = Competition.objects.create(
            title='Old Comp', comp_type=Competition.QUALIFIER,
            start_date=now - timedelta(hours=10),
            end_date=now - timedelta(hours=1),
            gym=self.gym, created_by=self.setter,
        )
        climb = make_climb(self.wall, self.setter)
        cc = CompClimb.objects.create(competition=closed_comp, climb=climb)

        res = self.client.post(self._log_send_url(closed_comp.id), {
            'comp_climb': cc.id, 'attempts': 1
        })
        self.assertEqual(res.status_code, 400)

    def test_unregistered_user_cannot_log_send(self):
        comp = make_open_comp(self.gym, self.setter)
        climb = make_climb(self.wall, self.setter)
        cc = CompClimb.objects.create(competition=comp, climb=climb)

        # No CompRegistration for self.climber.
        res = self.client.post(self._log_send_url(comp.id), {
            'comp_climb': cc.id, 'attempts': 1
        })
        self.assertEqual(res.status_code, 403)

    def test_registered_user_can_log_send(self):
        comp = make_open_comp(self.gym, self.setter)
        climb = make_climb(self.wall, self.setter)
        cc = CompClimb.objects.create(competition=comp, climb=climb)
        CompRegistration.objects.create(competition=comp, user=self.climber)

        res = self.client.post(self._log_send_url(comp.id), {
            'comp_climb': cc.id, 'attempts': 2
        })
        self.assertIn(res.status_code, [200, 201])
