from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Max, Q
from .serializers import (
    UserSerializer, ClimbSerializer, WallSerializer, GymSerializer,
    GradeVoteSerializer, SendSerializer, ReviewSerializer, VideoSerializer,
    CompetitionSerializer, DivisionSerializer, CompRoundSerializer,
    CompClimbSerializer, CompRegistrationSerializer, CompSendSerializer, FinalsResultSerializer,
)
from .models import (
    Climb, Wall, Gym, GradeVote, Send, Review, Video,
    Competition, Division, CompRound, CompClimb, CompRegistration, CompSend, FinalsResult,
)

# NOTES FOR SELF:
# QuerySet: defines which objects the request operates on
# Serializer: validates incoming data and converts to correct format

User = get_user_model()


# ─── Permissions ─────────────────────────────────────────────────────────────

class IsSetterOrReadOnly(BasePermission):
    """Read access for everyone; write access only for verified setters."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_verified_setter
        )


# ─── Shared gym queryset helper ───────────────────────────────────────────────
# Annotates wall_count and climb_count directly on the queryset so the
# serializer never fires extra queries per gym (fixes N+1).

def gym_queryset_with_counts():
    return Gym.objects.annotate(
        wall_count=Count('walls', distinct=True),
        climb_count=Count(
            'walls__climbs',
            filter=Q(walls__climbs__is_archived=False),
            distinct=True
        )
    )


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
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return gym_queryset_with_counts()

    def perform_create(self, serializer):
        # added_by is read only in serializer so injected here from the logged in user
        serializer.save(added_by=self.request.user)


class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # any user can read a gym, only the creator can edit or delete
        qs = gym_queryset_with_counts()
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return qs
        return qs.filter(added_by=self.request.user)


class MyGymsView(generics.ListAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return gym_queryset_with_counts().filter(
            walls__climbs__sends__user=self.request.user
        ).annotate(
            last_send=Max('walls__climbs__sends__sent_at')
        ).order_by('-last_send').distinct()


# ─── Wall ────────────────────────────────────────────────────────────────────

class WallListCreateView(generics.ListCreateAPIView):
    serializer_class = WallSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        gym_id = self.kwargs.get("gym_id")
        return Wall.objects.filter(gym_id=gym_id)

    def perform_create(self, serializer):
        gym_id = self.kwargs.get("gym_id")
        gym = get_object_or_404(Gym, id=gym_id)
        serializer.save(gym=gym)


class ArchiveWallClimbsView(APIView):
    """Archives every active climb on a wall in one action. Setters only."""
    permission_classes = [IsAuthenticated]

    def post(self, request, gym_id, wall_id):
        if not request.user.is_verified_setter:
            return Response(
                {"detail": "Only setters can archive climbs."},
                status=status.HTTP_403_FORBIDDEN,
            )
        wall = get_object_or_404(Wall, id=wall_id, gym_id=gym_id)
        updated = Climb.objects.filter(wall=wall, is_archived=False).update(is_archived=True)
        return Response({"archived": updated})


# ─── Climb ───────────────────────────────────────────────────────────────────

class ClimbListCreateView(generics.ListCreateAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        wall_id = self.kwargs.get("wall_id")
        # archived climbs are never returned to the frontend
        return Climb.objects.filter(wall_id=wall_id, is_archived=False)

    def perform_create(self, serializer):
        wall_id = self.kwargs.get("wall_id")
        wall = get_object_or_404(Wall, id=wall_id)
        serializer.save(added_by=self.request.user, wall=wall)


class ClimbArchivedListView(generics.ListAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        wall_id = self.kwargs.get("wall_id")
        return Climb.objects.filter(wall_id=wall_id, is_archived=True).order_by('-set_at')


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
        return Send.objects.filter(user_id=user_id).select_related(
            'climb', 'climb__wall', 'climb__wall__gym'
        )


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
        return Review.objects.filter(user_id=user_id).select_related(
            'climb', 'climb__wall', 'climb__wall__gym', 'user'
        )


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
        return Video.objects.filter(user_id=user_id).select_related(
            'climb', 'climb__wall', 'climb__wall__gym'
        )


# ─── Leaderboard ─────────────────────────────────────────────────────────────

class GymClimbsView(generics.ListAPIView):
    """All active climbs across every wall for a gym — used when building comp climb lists."""
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        gym_id = self.kwargs.get('gym_id')
        return Climb.objects.filter(
            wall__gym_id=gym_id, is_archived=False
        ).select_related('wall').order_by('wall__name', 'name')


# ─── Competition ─────────────────────────────────────────────────────────────

class CompetitionListCreateView(generics.ListCreateAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return Competition.objects.filter(
            gym_id=self.kwargs['gym_id']
        ).prefetch_related('divisions', 'rounds').order_by('-start_date')

    def perform_create(self, serializer):
        gym = get_object_or_404(Gym, id=self.kwargs['gym_id'])
        serializer.save(gym=gym, created_by=self.request.user)


class CompetitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'comp_id'

    def get_queryset(self):
        qs = Competition.objects.prefetch_related('divisions', 'rounds')
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return qs
        return qs.filter(created_by=self.request.user)


class DivisionListCreateView(generics.ListCreateAPIView):
    serializer_class = DivisionSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return Division.objects.filter(competition_id=self.kwargs['comp_id'])

    def perform_create(self, serializer):
        comp = get_object_or_404(Competition, id=self.kwargs['comp_id'])
        serializer.save(competition=comp)


class CompRoundListCreateView(generics.ListCreateAPIView):
    serializer_class = CompRoundSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return CompRound.objects.filter(competition_id=self.kwargs['comp_id'])

    def perform_create(self, serializer):
        comp = get_object_or_404(Competition, id=self.kwargs['comp_id'])
        serializer.save(competition=comp)


class CompClimbListCreateView(generics.ListCreateAPIView):
    serializer_class = CompClimbSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return CompClimb.objects.filter(
            competition_id=self.kwargs['comp_id']
        ).select_related('climb', 'climb__wall')

    def perform_create(self, serializer):
        comp = get_object_or_404(Competition, id=self.kwargs['comp_id'])
        serializer.save(competition=comp)


class CompClimbDetailView(generics.DestroyAPIView):
    serializer_class = CompClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompClimb.objects.filter(competition_id=self.kwargs['comp_id'])

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_verified_setter:
            return Response({'detail': 'Only setters can remove comp climbs.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CompRegistrationListView(generics.ListAPIView):
    serializer_class = CompRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompRegistration.objects.filter(
            competition_id=self.kwargs['comp_id']
        ).select_related('user', 'division')


class CompRegisterView(generics.CreateAPIView):
    serializer_class = CompRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        comp = get_object_or_404(Competition, id=self.kwargs['comp_id'])
        if comp.status == 'closed':
            return Response({'detail': 'This competition is closed for registration.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        obj, created = CompRegistration.objects.get_or_create(
            competition=comp,
            user=request.user,
            defaults={'division': serializer.validated_data.get('division')}
        )
        return Response(
            CompRegistrationSerializer(obj).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CompSendListView(generics.ListAPIView):
    """Returns the current user's sends in this competition."""
    serializer_class = CompSendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompSend.objects.filter(
            comp_climb__competition_id=self.kwargs['comp_id'],
            user=self.request.user,
        ).select_related('comp_climb', 'comp_climb__climb')


class CompSendCreateView(generics.CreateAPIView):
    serializer_class = CompSendSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        comp = get_object_or_404(Competition, id=self.kwargs['comp_id'])

        if comp.status != 'open':
            return Response({'detail': 'Competition is not currently open.'}, status=status.HTTP_400_BAD_REQUEST)

        if not CompRegistration.objects.filter(competition=comp, user=request.user).exists():
            return Response({'detail': 'You must register before logging sends.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comp_climb = serializer.validated_data['comp_climb']
        if comp_climb.competition_id != comp.id:
            return Response({'detail': 'This climb is not part of this competition.'}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = CompSend.objects.update_or_create(
            comp_climb=comp_climb,
            user=request.user,
            defaults={'attempts': serializer.validated_data['attempts']},
        )
        return Response(
            CompSendSerializer(obj).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class QualifierLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, comp_id):
        comp = get_object_or_404(Competition, id=comp_id)
        sends = CompSend.objects.filter(
            comp_climb__competition=comp
        ).select_related('user', 'comp_climb')

        user_data = {}
        for send in sends:
            uid = send.user.id
            if uid not in user_data:
                user_data[uid] = {
                    'user_id': uid,
                    'username': send.user.username,
                    'points': 0,
                    'climbs_completed': 0,
                    'total_attempts': 0,
                }
            user_data[uid]['points'] += send.comp_climb.points_value
            user_data[uid]['climbs_completed'] += 1
            user_data[uid]['total_attempts'] += send.attempts

        ranked = sorted(user_data.values(), key=lambda x: (-x['points'], x['total_attempts']))
        for i, entry in enumerate(ranked):
            entry['rank'] = i + 1
            entry['advances'] = bool(comp.top_x_advance and entry['rank'] <= comp.top_x_advance)

        return Response(ranked)


class FinalsResultListCreateView(generics.ListCreateAPIView):
    serializer_class = FinalsResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FinalsResult.objects.filter(
            comp_climb__competition_id=self.kwargs['comp_id']
        ).select_related('user', 'comp_climb__climb')

    def create(self, request, *args, **kwargs):
        if not request.user.is_verified_setter:
            return Response({'detail': 'Only judges/setters can record finals results.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        obj, created = FinalsResult.objects.update_or_create(
            comp_climb=serializer.validated_data['comp_climb'],
            user=serializer.validated_data['user'],
            defaults={
                'topped': serializer.validated_data.get('topped', False),
                'top_attempts': serializer.validated_data.get('top_attempts'),
                'zoned': serializer.validated_data.get('zoned', False),
                'zone_attempts': serializer.validated_data.get('zone_attempts'),
                'recorded_by': request.user,
            },
        )
        return Response(
            FinalsResultSerializer(obj).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class FinalsLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, comp_id):
        comp = get_object_or_404(Competition, id=comp_id)
        results = FinalsResult.objects.filter(
            comp_climb__competition=comp
        ).select_related('user')

        user_data = {}
        for r in results:
            uid = r.user.id
            if uid not in user_data:
                user_data[uid] = {
                    'user_id': uid,
                    'username': r.user.username,
                    'tops': 0,
                    'top_attempts': 0,
                    'zones': 0,
                    'zone_attempts': 0,
                }
            if r.topped:
                user_data[uid]['tops'] += 1
                user_data[uid]['top_attempts'] += r.top_attempts or 1
            if r.zoned:
                user_data[uid]['zones'] += 1
                user_data[uid]['zone_attempts'] += r.zone_attempts or 1

        # IFSC ranking: most tops → fewest top attempts → most zones → fewest zone attempts
        ranked = sorted(user_data.values(), key=lambda x: (
            -x['tops'], x['top_attempts'], -x['zones'], x['zone_attempts']
        ))
        for i, entry in enumerate(ranked):
            entry['rank'] = i + 1

        return Response(ranked)


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
