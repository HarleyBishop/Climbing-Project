"""
Things climbers attach to a climb: grade votes, sends, reviews and videos.

Each follows the same two-view shape:
  ...ListCreateView  — anyone can list; logged-in users can add. climb and
                       user are injected from the URL / request, never the body.
  ...DetailView      — only ever sees the current user's own rows, so users
                       can edit/delete their own entries and nobody else's.
"""
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from ..models import Climb, GradeVote, Send, Review, Video
from ..serializers.climb_activity import GradeVoteSerializer, SendSerializer, ReviewSerializer, VideoSerializer

# Everything ClimbContextFields reads, fetched in one JOIN.
CLIMB_CONTEXT = ('climb__wall__gym',)


# ─── Grade votes ─────────────────────────────────────────────────────────────

class GradeVoteListCreateView(generics.ListCreateAPIView):
    serializer_class = GradeVoteSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return GradeVote.objects.filter(climb_id=self.kwargs['climb_id'])

    def perform_create(self, serializer):
        climb = get_object_or_404(Climb, id=self.kwargs['climb_id'])
        serializer.save(climb=climb, user=self.request.user)
        climb.recalculate_community_grade()


class GradeVoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradeVoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GradeVote.objects.filter(user=self.request.user, climb_id=self.kwargs['climb_id'])

    # Changing or removing a vote changes the average, so keep the cached
    # community_grade in sync here too.
    def perform_update(self, serializer):
        vote = serializer.save()
        vote.climb.recalculate_community_grade()

    def perform_destroy(self, instance):
        climb = instance.climb
        instance.delete()
        climb.recalculate_community_grade()


# ─── Sends ───────────────────────────────────────────────────────────────────

class SendListCreateView(generics.ListCreateAPIView):
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Send.objects.filter(climb_id=self.kwargs['climb_id']).select_related('user', *CLIMB_CONTEXT)

    def perform_create(self, serializer):
        climb = get_object_or_404(Climb, id=self.kwargs['climb_id'])
        serializer.save(climb=climb, user=self.request.user)


class SendDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Send.objects.filter(user=self.request.user, climb_id=self.kwargs['climb_id'])


class UserSendsView(generics.ListAPIView):
    """All sends for a user — used by the profile page."""
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Send.objects.filter(user_id=self.kwargs['user_id']).select_related('user', *CLIMB_CONTEXT)


# ─── Reviews ─────────────────────────────────────────────────────────────────

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Review.objects.filter(climb_id=self.kwargs['climb_id']).select_related('user', *CLIMB_CONTEXT)

    def perform_create(self, serializer):
        climb = get_object_or_404(Climb, id=self.kwargs['climb_id'])
        serializer.save(climb=climb, user=self.request.user)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user, climb_id=self.kwargs['climb_id'])


class UserReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user_id=self.kwargs['user_id']).select_related('user', *CLIMB_CONTEXT)


# ─── Videos ──────────────────────────────────────────────────────────────────

class VideoListCreateView(generics.ListCreateAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Video.objects.filter(climb_id=self.kwargs['climb_id']).select_related(*CLIMB_CONTEXT)

    def perform_create(self, serializer):
        climb = get_object_or_404(Climb, id=self.kwargs['climb_id'])
        serializer.save(climb=climb, user=self.request.user)


class VideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Video.objects.filter(user=self.request.user, climb_id=self.kwargs['climb_id'])


class UserVideosView(generics.ListAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Video.objects.filter(user_id=self.kwargs['user_id']).select_related(*CLIMB_CONTEXT)
