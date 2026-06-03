from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Max, Q
import re
import requests as http_requests
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer, UserProfileSerializer, ChangePasswordSerializer,
    ClimbSerializer, WallSerializer, GymSerializer,
    GradeVoteSerializer, SendSerializer, ReviewSerializer, VideoSerializer,
    CompetitionSerializer, DivisionSerializer, CompRoundSerializer,
    CompClimbSerializer, CompRegistrationSerializer, CompSendSerializer, FinalsResultSerializer,
)
from .models import (
    Climb, Wall, Gym, GradeVote, Send, Review, Video,
    Competition, Division, CompRound, CompClimb, CompRegistration, CompSend, FinalsResult,
)

User = get_user_model()


# ─── Permissions ─────────────────────────────────────────────────────────────

class IsSetterOrReadOnly(BasePermission):
    """
    Safe HTTP methods (GET, HEAD, OPTIONS) are open to any authenticated user.
    Mutating methods (POST, PUT, PATCH, DELETE) require is_verified_setter=True.
    This is applied to Gym, Wall, Climb, and Competition list/create views so
    regular climbers can browse but only setters can manage the gym's content.
    """
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_verified_setter
        )


# ─── Shared gym queryset helper ───────────────────────────────────────────────

def gym_queryset_with_counts():
    """
    Returns a Gym queryset with wall_count and climb_count annotated directly
    onto each row. Annotating at the queryset level means the DB computes the
    counts in one query rather than one extra query per gym (N+1 problem).
    GymSerializer reads these annotations via SerializerMethodField.
    """
    return Gym.objects.annotate(
        wall_count=Count('walls', distinct=True),
        climb_count=Count(
            'walls__climbs',
            # Only count climbs that haven't been archived.
            filter=Q(walls__climbs__is_archived=False),
            distinct=True
        )
    )


# ─── OAuth helpers ───────────────────────────────────────────────────────────

def _get_or_create_oauth_user(sub_field, sub_value, email):
    """
    Three-step lookup for OAuth sign-in:
    1. Find existing account by OAuth sub ID (fast path for returning users).
    2. If not found, try email — links the OAuth sub to an existing account
       created with username/password. Setters are blocked at this step.
    3. If still not found, create a new climber-role account with a derived
       username. set_unusable_password() means the account can't be used with
       the regular login form, only via OAuth.
    Returns (user, error_string) — error is None on success.
    """
    if sub_value:
        user = User.objects.filter(**{sub_field: sub_value}).first()
        if user:
            return user, None

    if email:
        user = User.objects.filter(email=email).first()
        if user:
            if user.is_verified_setter:
                return None, 'Setter accounts must log in with username and password.'
            setattr(user, sub_field, sub_value)
            user.save()
            return user, None

    # Strip non-alphanumeric chars from the email local part to build a username,
    # then increment a counter suffix until it's unique.
    base = re.sub(r'[^a-zA-Z0-9]', '', (email or '').split('@')[0]) or 'climber'
    username, counter = base, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{counter}'
        counter += 1

    user = User.objects.create_user(
        username=username,
        email=email or '',
        is_verified_setter=False,
    )
    setattr(user, sub_field, sub_value)
    user.set_unusable_password()
    user.save()
    return user, None


def _oauth_response(user):
    """
    Issues a JWT pair using our custom serializer (which embeds username and
    is_setter in the payload) so the frontend gets the same token structure as
    the normal login endpoint.
    """
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


class GoogleLoginView(APIView):
    # AllowAny because this IS the authentication step — no token yet.
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'detail': 'access_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange the Google access token for the user's profile info.
        # We use the userinfo endpoint rather than verifying an ID token locally
        # because it avoids needing the Google public keys.
        try:
            resp = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            resp.raise_for_status()
            info = resp.json()
        except Exception as exc:
            return Response({'detail': f'Failed to verify Google token: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

        # 'sub' is Google's stable unique user identifier.
        sub = info.get('sub')
        if not sub:
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        user, error = _get_or_create_oauth_user(
            sub_field='google_id',
            sub_value=sub,
            email=info.get('email', ''),
        )
        if error:
            return Response({'detail': error}, status=status.HTTP_403_FORBIDDEN)
        return _oauth_response(user)


# ─── User ────────────────────────────────────────────────────────────────────

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # AllowAny — registration must work before a token exists.
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveUpdateAPIView):
    # GET: returns profile info for any authenticated user.
    # PATCH: allows a user to update only their own bio.
    # lookup_url_kwarg maps the URL param 'user_id' to the model field 'id'
    # since the URL uses user_id but the default lookup_field is 'pk'.
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "user_id"
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UserProfileSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id != request.user.id:
            return Response({'detail': 'You can only edit your own profile.'}, status=status.HTTP_403_FORBIDDEN)
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(serializer.validated_data['current_password']):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


# ─── Gym ─────────────────────────────────────────────────────────────────────

class GymListCreateView(generics.ListCreateAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return gym_queryset_with_counts()

    def perform_create(self, serializer):
        # added_by is read_only on the serializer so it can't be spoofed by
        # the client — we inject it from the authenticated request here.
        serializer.save(added_by=self.request.user)


class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Any authenticated user can view a gym. Only the creator can edit or
        # delete — filtering by added_by on mutating methods is the ownership check.
        qs = gym_queryset_with_counts()
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return qs
        return qs.filter(added_by=self.request.user)


class MyGymsView(generics.ListAPIView):
    """
    Returns gyms where the logged-in user has logged at least one send,
    ordered by most recent send. Used on the home page to surface gyms
    the user actually climbs at rather than all gyms.
    The chain of FK traversals (walls__climbs__sends__user) means Django
    generates a JOIN rather than Python-level filtering, which keeps it
    a single DB query. distinct() prevents duplicates when a user has
    multiple sends at the same gym.
    """
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
        # gym is read_only on WallSerializer, so we resolve it from the URL
        # and inject it. get_object_or_404 returns a clean 404 if the gym
        # doesn't exist rather than a confusing FK integrity error.
        gym_id = self.kwargs.get("gym_id")
        gym = get_object_or_404(Gym, id=gym_id)
        serializer.save(gym=gym)


class ArchiveWallClimbsView(APIView):
    """
    Bulk-archives all active climbs on a wall in one API call. This is what
    a setter does when resetting a wall with new routes. Using .update() issues
    a single UPDATE statement rather than loading and saving each climb object,
    which matters when walls have many climbs.
    """
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
        # is_archived=False means the gym page only shows the current set.
        # Archived climbs are accessible via ClimbArchivedListView.
        return Climb.objects.filter(wall_id=wall_id, is_archived=False)

    def perform_create(self, serializer):
        wall_id = self.kwargs.get("wall_id")
        wall = get_object_or_404(Wall, id=wall_id)
        serializer.save(added_by=self.request.user, wall=wall)


class ClimbArchivedListView(generics.ListAPIView):
    # Separate endpoint for the archive view — keeps the main climb list clean
    # and makes it explicit that accessing archived climbs is intentional.
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        wall_id = self.kwargs.get("wall_id")
        return Climb.objects.filter(wall_id=wall_id, is_archived=True).order_by('-set_at')


class ClimbDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Read is open to all authenticated users. Writes are restricted to the
        # setter who created the climb — this prevents one setter from editing
        # another's routes.
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

        # update_or_create handles the unique_together constraint gracefully:
        # if the user has already voted it updates their grade, otherwise creates.
        # This means POST is idempotent — re-voting just changes the grade.
        GradeVote.objects.update_or_create(
            climb=climb,
            user=self.request.user,
            defaults={'grade': serializer.validated_data['grade']}
        )

        # Recalculate and cache the community grade on the climb itself after
        # every vote. Caching it avoids re-aggregating on every climb page load.
        avg = GradeVote.objects.filter(climb=climb).aggregate(Avg('grade'))['grade__avg']
        climb.community_grade = round(avg, 1) if avg else None
        climb.save()


class GradeVoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradeVoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        # Users can only access their own votes — no shared vote editing.
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
        # Same update_or_create pattern as GradeVote — logging a send twice
        # just updates the attempt count rather than creating a duplicate.
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
    """
    Returns all sends for a specific user — used by the profile page.
    select_related pre-fetches the climb, wall, and gym in a single JOIN query
    so the serializer can traverse those relationships without triggering
    extra queries for each send.
    """
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
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        return Video.objects.filter(user_id=user_id).select_related(
            'climb', 'climb__wall', 'climb__wall__gym'
        )


# ─── Gym Climbs (for comp building) ──────────────────────────────────────────

class GymClimbsView(generics.ListAPIView):
    """
    Returns all active climbs across every wall for a gym. Used by the
    competition page when a setter is picking which climbs to add to an event.
    Ordered by wall then climb name for predictable list display.
    """
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
        # prefetch_related fetches divisions and rounds with separate optimised
        # queries (not JOINs) to avoid row multiplication when both are included.
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

        # get_or_create so re-registering returns 200 rather than a duplicate
        # key error. The frontend uses the status code to distinguish new vs
        # existing registrations.
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
    """Returns only the current user's sends for this competition, not all
    sends, so a climber can't see other competitors' progress mid-event."""
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

        # Guard rails: the competition must be open, the user must be registered,
        # and the climb must belong to this specific competition.
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


# ─── Qualifier Leaderboard ───────────────────────────────────────────────────

class QualifierLeaderboardView(APIView):
    """
    Aggregates CompSend entries into a per-user points tally. Secondary sort
    on total_attempts means ties are broken by who used fewer attempts — the
    standard tiebreaker for points-based comps.
    advances flag is True for the top top_x_advance users, used by the frontend
    to show "advances to finals" badges.
    """
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
        # Finals results are judge-entered, not self-reported — setter check here
        # rather than on the permission class so the list (GET) is open to all.
        if not request.user.is_verified_setter:
            return Response({'detail': 'Only judges/setters can record finals results.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # update_or_create so a judge can correct a result without it becoming
        # a duplicate — the judging panel calls POST on every save.
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
    """
    Implements the IFSC boulder finals ranking algorithm:
      1. Most tops (completed problems) wins.
      2. Tie on tops → fewest top attempts.
      3. Tie again → most zones (reaching the intermediate hold).
      4. Tie again → fewest zone attempts.
    The sort key tuple (-tops, top_attempts, -zones, zone_attempts) encodes
    this directly — negative values invert the sort direction.
    """
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

        ranked = sorted(user_data.values(), key=lambda x: (
            -x['tops'], x['top_attempts'], -x['zones'], x['zone_attempts']
        ))
        for i, entry in enumerate(ranked):
            entry['rank'] = i + 1

        return Response(ranked)


# ─── Gym Leaderboard ─────────────────────────────────────────────────────────

class GymLeaderboardView(generics.ListAPIView):
    """
    Points-per-grade ranking for the persistent gym leaderboard (separate from
    competition leaderboards). Points are intentionally tiered rather than
    linear so V7+ climbs are significantly more rewarding — this stops a climber
    who logs every V0 from outranking someone who climbs hard routes infrequently.

    Only sends on currently active (non-archived) climbs count. When a wall is
    reset, archived climbs drop out of the calculation, which can lower everyone's
    points — this is intentional and drives the "rank resets with the gym" feel.
    The frontend mirrors this same grade_to_points mapping in rankUtils.jsx.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, gym_id):

        def grade_to_points(grade):
            if grade <= 2: return 10
            elif grade <= 4: return 20
            elif grade <= 6: return 40
            elif grade <= 8: return 70
            elif grade <= 10: return 100
            else: return 150

        active_climbs = Climb.objects.filter(wall__gym_id=gym_id, is_archived=False)
        sends = Send.objects.filter(climb__in=active_climbs).select_related('user', 'climb')

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

        ranked = sorted(user_points.values(), key=lambda x: x['points'], reverse=True)
        for i, entry in enumerate(ranked):
            entry['rank'] = i + 1

        return Response(ranked)
