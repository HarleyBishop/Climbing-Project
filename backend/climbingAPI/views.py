from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from .serializers import (
    UserSerializer, ClimbSerializer, WallSerializer, GymSerializer,
    GradeVoteSerializer, SendSerializer, ReviewSerializer, VideoSerializer
)
from .models import Climb, Wall, Gym, GradeVote, Send, Review, Video

# NOTES FOR SELF:
# QuerySet: defines which objects the request operates on
# Serializer: validates incoming data and converts to correct format

User = get_user_model()


# ─── User ────────────────────────────────────────────────────────────────────

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveAPIView):
    # Returns a single user by id for the profile page
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "user_id"


# ─── Gym ─────────────────────────────────────────────────────────────────────

class GymListCreateView(generics.ListCreateAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Gym.objects.all()

    def perform_create(self, serializer):
        # added_by is read only in serializer so injected here from the logged in user
        serializer.save(added_by=self.request.user)


class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # any user can read a gym, only the creator can edit or delete
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return Gym.objects.all()
        return Gym.objects.filter(added_by=self.request.user)


# ─── Wall ────────────────────────────────────────────────────────────────────

class WallListCreateView(generics.ListCreateAPIView):
    serializer_class = WallSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        gym_id = self.kwargs.get("gym_id")
        return Wall.objects.filter(gym_id=gym_id)

    def perform_create(self, serializer):
        gym_id = self.kwargs.get("gym_id")
        gym = get_object_or_404(Gym, id=gym_id)
        serializer.save(gym=gym)


# ─── Climb ───────────────────────────────────────────────────────────────────

class ClimbListCreateView(generics.ListCreateAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        wall_id = self.kwargs.get("wall_id")
        # archived climbs are never returned to the frontend
        return Climb.objects.filter(wall_id=wall_id, is_archived=False)

    def perform_create(self, serializer):
        wall_id = self.kwargs.get("wall_id")
        wall = get_object_or_404(Wall, id=wall_id)
        serializer.save(added_by=self.request.user, wall=wall)


class ClimbDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # any user can read a climb, only the setter can edit or delete
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return Climb.objects.all()
        return Climb.objects.filter(added_by=self.request.user)


# ─── Grade Vote ──────────────────────────────────────────────────────────────

class GradeVoteListCreateView(generics.ListCreateAPIView):
    serializer_class = GradeVoteSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return GradeVote.objects.filter(climb_id=climb_id)

    def perform_create(self, serializer):
        climb_id = self.kwargs.get("climb_id")
        climb = get_object_or_404(Climb, id=climb_id)

        # update_or_create prevents duplicate votes from unique_together constraint
        GradeVote.objects.update_or_create(
            climb=climb,
            user=self.request.user,
            defaults={'grade': serializer.validated_data['grade']}
        )

        # recalculate and cache community grade on the climb after every vote
        avg = GradeVote.objects.filter(climb=climb).aggregate(Avg('grade'))['grade__avg']
        climb.community_grade = round(avg, 1) if avg else None
        climb.save()


class GradeVoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradeVoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        # users can only edit or delete their own votes
        return GradeVote.objects.filter(user=self.request.user, climb_id=climb_id)


# ─── Send ────────────────────────────────────────────────────────────────────

class SendListCreateView(generics.ListCreateAPIView):
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return Send.objects.filter(climb_id=climb_id)

    def perform_create(self, serializer):
        climb_id = self.kwargs.get("climb_id")
        climb = get_object_or_404(Climb, id=climb_id)

        # update_or_create prevents duplicate sends from unique_together constraint
        Send.objects.update_or_create(
            climb=climb,
            user=self.request.user,
            defaults={'attempts': serializer.validated_data['attempts']}
        )


class SendDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return Send.objects.filter(user=self.request.user, climb_id=climb_id)


class UserSendsView(generics.ListAPIView):
    # Returns all sends for a specific user — used on the profile page
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        return Send.objects.filter(user_id=user_id)


# ─── Review ──────────────────────────────────────────────────────────────────

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return Review.objects.filter(climb_id=climb_id)

    def perform_create(self, serializer):
        climb_id = self.kwargs.get("climb_id")
        climb = get_object_or_404(Climb, id=climb_id)
        serializer.save(climb=climb, user=self.request.user)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return Review.objects.filter(user=self.request.user, climb_id=climb_id)


class UserReviewsView(generics.ListAPIView):
    # Returns all reviews for a specific user — used on the profile page
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        return Review.objects.filter(user_id=user_id)


# ─── Video ───────────────────────────────────────────────────────────────────

class VideoListCreateView(generics.ListCreateAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return Video.objects.filter(climb_id=climb_id)

    def perform_create(self, serializer):
        climb_id = self.kwargs.get("climb_id")
        climb = get_object_or_404(Climb, id=climb_id)
        serializer.save(climb=climb, user=self.request.user)


class VideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        return Video.objects.filter(user=self.request.user, climb_id=climb_id)


class UserVideosView(generics.ListAPIView):
    # Returns all videos for a specific user — used on the profile page
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        return Video.objects.filter(user_id=user_id)


# ─── Leaderboard ─────────────────────────────────────────────────────────────

class GymLeaderboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, gym_id):

        def grade_to_points(grade):
            if grade <= 2: return 10
            elif grade <= 4: return 20
            elif grade <= 6: return 40
            elif grade <= 8: return 70
            elif grade <= 10: return 100
            else: return 150

        # only count sends on active non-archived climbs in this gym
        active_climbs = Climb.objects.filter(wall__gym_id=gym_id, is_archived=False)
        sends = Send.objects.filter(climb__in=active_climbs).select_related('user', 'climb')

        # calculate points per user
        user_points = {}
        for send in sends:
            uid = send.user.id
            pts = grade_to_points(send.climb.suggested_grade)
            if uid not in user_points:
                user_points[uid] = {
                    'user_id': uid,
                    'username': send.user.username,
                    'points': 0,
                    'send_count': 0,
                }
            user_points[uid]['points'] += pts
            user_points[uid]['send_count'] += 1

        # sort highest points first and add rank number
        ranked = sorted(user_points.values(), key=lambda x: x['points'], reverse=True)
        for i, entry in enumerate(ranked):
            entry['rank'] = i + 1

        return Response(ranked)