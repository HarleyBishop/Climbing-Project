"""
Leaderboards. Each one is a User queryset annotated with its scores and a rank,
so all the aggregation and sorting happens in a single SQL query instead of
looping over every send in Python.

Filtering on a relation *before* annotating restricts the aggregates to the
filtered rows — e.g. filtering comp_sends to one competition means
Sum('comp_sends__...') only adds up that competition's sends.
"""
from django.contrib.auth import get_user_model
from django.db.models import Case, Count, F, Q, Sum, Value, When, Window
from django.db.models.functions import Coalesce, RowNumber
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..serializers.leaderboards import (
    GymLeaderboardEntrySerializer, QualifierLeaderboardEntrySerializer, FinalsLeaderboardEntrySerializer,
)
from .competitions import CompetitionChildMixin

User = get_user_model()

# (max grade, points) brackets for the gym leaderboard; anything harder than
# the last bracket is worth TOP_GRADE_POINTS. Tiered rather than linear so a
# V7+ is worth far more than a pile of V0s. The frontend mirrors this mapping
# in rankUtils.jsx — keep them in sync.
GRADE_POINTS = ((2, 10), (4, 20), (6, 40), (8, 70), (10, 100))
TOP_GRADE_POINTS = 150


def ranked(users, *ordering):
    """
    Orders the queryset and annotates a 1-based `rank` in the same query.
    ROW_NUMBER gives sequential ranks; exact ties are broken by user id so
    the order is stable between requests.
    """
    ordering = [*ordering, F('id').asc()]
    return users.annotate(rank=Window(RowNumber(), order_by=ordering)).order_by(*ordering)


class GymLeaderboardView(generics.ListAPIView):
    """
    Persistent per-gym ranking (separate from competitions). Only sends on
    active climbs count: when a wall is reset its archived climbs drop out,
    which can lower everyone's points — intentional, so rank resets with the gym.
    """
    serializer_class = GymLeaderboardEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        points_per_send = Case(
            *[When(sends__climb__suggested_grade__lte=grade, then=Value(points))
              for grade, points in GRADE_POINTS],
            default=Value(TOP_GRADE_POINTS),
        )
        users = (
            User.objects
            .filter(sends__climb__wall__gym_id=self.kwargs['gym_id'], sends__climb__is_archived=False)
            .annotate(points=Sum(points_per_send), send_count=Count('sends'))
        )
        return ranked(users, F('points').desc())


class QualifierLeaderboardView(CompetitionChildMixin, generics.ListAPIView):
    """
    Points-based qualifier ranking. Ties on points are broken by fewer total
    attempts — the standard tiebreaker for points-based comps. Users in the top
    `top_x_advance` get advances=True for the "advances to finals" badge.
    """
    serializer_class = QualifierLeaderboardEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        users = (
            User.objects
            .filter(comp_sends__comp_climb__competition=self.get_competition())
            .annotate(
                points=Sum('comp_sends__comp_climb__points_value'),
                climbs_completed=Count('comp_sends'),
                total_attempts=Sum('comp_sends__attempts'),
            )
        )
        return ranked(users, F('points').desc(), F('total_attempts').asc())

    def get_serializer_context(self):
        # The serializer needs top_x_advance to work out `advances`.
        return {**super().get_serializer_context(), 'competition': self.get_competition()}


class FinalsLeaderboardView(CompetitionChildMixin, generics.ListAPIView):
    """
    IFSC boulder finals ranking:
      1. Most tops (completed problems) wins.
      2. Tie on tops → fewest top attempts.
      3. Tie again → most zones (reaching the intermediate hold).
      4. Tie again → fewest zone attempts.
    A top/zone with no recorded attempt count is treated as 1 attempt.
    """
    serializer_class = FinalsLeaderboardEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        topped = Q(finals_results__topped=True)
        zoned = Q(finals_results__zoned=True)
        users = (
            User.objects
            .filter(finals_results__comp_climb__competition=self.get_competition())
            .annotate(
                tops=Count('finals_results', filter=topped),
                top_attempts=Coalesce(Sum(Coalesce('finals_results__top_attempts', 1), filter=topped), 0),
                zones=Count('finals_results', filter=zoned),
                zone_attempts=Coalesce(Sum(Coalesce('finals_results__zone_attempts', 1), filter=zoned), 0),
            )
        )
        return ranked(
            users,
            F('tops').desc(), F('top_attempts').asc(), F('zones').desc(), F('zone_attempts').asc(),
        )
