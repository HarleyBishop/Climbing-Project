from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS

from ..exceptions import BadRequest
from ..models import (
    Gym, Competition, Division, CompRound, CompClimb, CompRegistration, CompSend, FinalsResult,
)
from ..permissions import IsSetterOrReadOnly
from ..serializers.competitions import (
    CompetitionSerializer, DivisionSerializer, CompRoundSerializer, CompClimbSerializer,
    CompRegistrationSerializer, CompSendSerializer, FinalsResultSerializer,
)


class CompetitionChildMixin:
    """For views nested under /competitions/<comp_id>/."""

    def get_competition(self):
        # Cached on the view instance (one per request) so calling it from
        # several hooks only hits the DB once.
        if not hasattr(self, '_competition'):
            self._competition = get_object_or_404(Competition, id=self.kwargs['comp_id'])
        return self._competition


# ─── Competition setup (setters) ─────────────────────────────────────────────

class CompetitionListCreateView(generics.ListCreateAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        # prefetch_related fetches divisions and rounds with separate queries
        # (not JOINs) to avoid row multiplication when both are included.
        return (
            Competition.objects.filter(gym_id=self.kwargs['gym_id'])
            .prefetch_related('divisions', 'rounds')
            .order_by('-start_date')
        )

    def perform_create(self, serializer):
        gym = get_object_or_404(Gym, id=self.kwargs['gym_id'])
        serializer.save(gym=gym, created_by=self.request.user)


class CompetitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'comp_id'

    def get_queryset(self):
        # Only the creator can edit or delete a competition.
        comps = Competition.objects.prefetch_related('divisions', 'rounds')
        if self.request.method in SAFE_METHODS:
            return comps
        return comps.filter(created_by=self.request.user)


class DivisionListCreateView(CompetitionChildMixin, generics.ListCreateAPIView):
    serializer_class = DivisionSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return Division.objects.filter(competition_id=self.kwargs['comp_id'])

    def perform_create(self, serializer):
        serializer.save(competition=self.get_competition())


class CompRoundListCreateView(CompetitionChildMixin, generics.ListCreateAPIView):
    serializer_class = CompRoundSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return CompRound.objects.filter(competition_id=self.kwargs['comp_id'])

    def perform_create(self, serializer):
        serializer.save(competition=self.get_competition())


class CompClimbListCreateView(CompetitionChildMixin, generics.ListCreateAPIView):
    serializer_class = CompClimbSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return (
            CompClimb.objects.filter(competition_id=self.kwargs['comp_id'])
            .select_related('climb__wall__gym')
        )

    def perform_create(self, serializer):
        serializer.save(competition=self.get_competition())


class CompClimbDetailView(generics.DestroyAPIView):
    serializer_class = CompClimbSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return CompClimb.objects.filter(competition_id=self.kwargs['comp_id'])


# ─── Taking part (climbers) ──────────────────────────────────────────────────

class CompRegistrationListView(generics.ListAPIView):
    serializer_class = CompRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            CompRegistration.objects.filter(competition_id=self.kwargs['comp_id'])
            .select_related('user', 'division')
        )


class CompRegisterView(CompetitionChildMixin, generics.CreateAPIView):
    serializer_class = CompRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        comp = self.get_competition()
        if comp.status == Competition.CLOSED:
            raise BadRequest('This competition is closed for registration.')
        serializer.save(competition=comp, user=self.request.user)


class CompSendListView(generics.ListAPIView):
    """
    Only the current user's sends for this competition, so a climber can't see
    other competitors' progress mid-event.
    """
    serializer_class = CompSendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            CompSend.objects.filter(
                comp_climb__competition_id=self.kwargs['comp_id'],
                user=self.request.user,
            )
            .select_related('comp_climb__climb')
        )


class CompSendCreateView(CompetitionChildMixin, generics.CreateAPIView):
    serializer_class = CompSendSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Guard rails: the competition must be open, the user must be
        # registered, and the climb must belong to this competition.
        comp = self.get_competition()
        if comp.status != Competition.OPEN:
            raise BadRequest('Competition is not currently open.')
        if not comp.registrations.filter(user=self.request.user).exists():
            raise PermissionDenied('You must register before logging sends.')
        if serializer.validated_data['comp_climb'].competition_id != comp.id:
            raise BadRequest('This climb is not part of this competition.')

        serializer.save(user=self.request.user)


# ─── Finals judging ──────────────────────────────────────────────────────────

class FinalsResultListCreateView(CompetitionChildMixin, generics.ListCreateAPIView):
    """
    Finals results are judge-entered, not self-reported — anyone can read them,
    only setters can record them.
    """
    serializer_class = FinalsResultSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return (
            FinalsResult.objects.filter(comp_climb__competition_id=self.kwargs['comp_id'])
            .select_related('user', 'comp_climb__climb')
        )

    def perform_create(self, serializer):
        comp = self.get_competition()
        if serializer.validated_data['comp_climb'].competition_id != comp.id:
            raise BadRequest('This climb is not part of this competition.')
        serializer.save(recorded_by=self.request.user)
