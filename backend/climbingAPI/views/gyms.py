from django.db.models import Max
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Gym, Wall, Climb
from ..permissions import IsSetterOrReadOnly
from ..serializers.gyms import GymSerializer, WallSerializer, ClimbSerializer, ArchiveClimbsResultSerializer


# ─── Gym ─────────────────────────────────────────────────────────────────────

class GymListCreateView(generics.ListCreateAPIView):
    queryset = Gym.objects.with_counts()
    serializer_class = GymSerializer
    permission_classes = [IsSetterOrReadOnly]

    def perform_create(self, serializer):
        # added_by isn't a serializer field so it can't be spoofed by the
        # client — we inject it from the authenticated request here.
        serializer.save(added_by=self.request.user)


class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Any authenticated user can view a gym; only its creator can edit or
        # delete it.
        gyms = Gym.objects.with_counts()
        if self.request.method in SAFE_METHODS:
            return gyms
        return gyms.filter(added_by=self.request.user)


class MyGymsView(generics.ListAPIView):
    """
    Gyms where the logged-in user has logged at least one send, ordered by most
    recent send. Used on the home page to surface gyms the user actually climbs
    at. The walls__climbs__sends__user traversal becomes a JOIN, so this is a
    single query; distinct() removes duplicates from multiple sends per gym.
    """
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Gym.objects.with_counts()
            .filter(walls__climbs__sends__user=self.request.user)
            .annotate(last_send=Max('walls__climbs__sends__sent_at'))
            .order_by('-last_send')
            .distinct()
        )


# ─── Wall ────────────────────────────────────────────────────────────────────

class WallListCreateView(generics.ListCreateAPIView):
    serializer_class = WallSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        return Wall.objects.filter(gym_id=self.kwargs['gym_id'])

    def perform_create(self, serializer):
        # get_object_or_404 returns a clean 404 if the gym doesn't exist rather
        # than a confusing FK integrity error.
        gym = get_object_or_404(Gym, id=self.kwargs['gym_id'])
        serializer.save(gym=gym)


class ArchiveWallClimbsView(APIView):
    """
    Bulk-archives all active climbs on a wall — what a setter does when
    resetting a wall with new routes. .update() issues a single UPDATE rather
    than loading and saving each climb.
    """
    permission_classes = [IsSetterOrReadOnly]

    @extend_schema(request=None, responses=ArchiveClimbsResultSerializer)
    def post(self, request, gym_id, wall_id):
        wall = get_object_or_404(Wall, id=wall_id, gym_id=gym_id)
        archived = Climb.objects.filter(wall=wall, is_archived=False).update(is_archived=True)
        return Response(ArchiveClimbsResultSerializer({'archived': archived}).data)


# ─── Climb ───────────────────────────────────────────────────────────────────

class ClimbListCreateView(generics.ListCreateAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsSetterOrReadOnly]

    def get_queryset(self):
        # Only the current set — archived climbs have their own endpoint.
        return Climb.objects.filter(wall_id=self.kwargs['wall_id'], is_archived=False)

    def perform_create(self, serializer):
        wall = get_object_or_404(Wall, id=self.kwargs['wall_id'])
        serializer.save(added_by=self.request.user, wall=wall)


class ClimbArchivedListView(generics.ListAPIView):
    # Separate endpoint so the main climb list stays the current set and
    # fetching archived climbs is explicit.
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Climb.objects.filter(wall_id=self.kwargs['wall_id'], is_archived=True).order_by('-set_at')


class ClimbDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Writes are restricted to the setter who created the climb so one
        # setter can't edit another's routes.
        if self.request.method in SAFE_METHODS:
            return Climb.objects.all()
        return Climb.objects.filter(added_by=self.request.user)


class GymClimbsView(generics.ListAPIView):
    """
    All active climbs across every wall in a gym. Used when a setter is picking
    climbs to add to a competition. Ordered by wall then name for a stable list.
    """
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Climb.objects.filter(wall__gym_id=self.kwargs['gym_id'], is_archived=False)
            .select_related('wall')
            .order_by('wall__name', 'name')
        )
