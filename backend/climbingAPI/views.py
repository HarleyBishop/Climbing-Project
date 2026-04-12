from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import generics
from .serializers import UserSerializer, ClimbSerializer, WallSerializer, GymSerializer, GradeVoteSerializer, SendSerializer, ReviewSerializer, VideoSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from .models import Climb, Wall, Gym, GradeVote, Send, Review, Video
from django.shortcuts import get_object_or_404
from django.db.models import Avg

# NOTES FOR SELF:
# QuerySet: The quesry set is simply defining which objects the request should be in relation to. e.g. a generic post will include all as there is not specific object required and nothing is being retrieved
# Serializer: When a request comes through DRF passes request data through the Serializer to ensure the data is valid and matches the models defined params and also converts data tyo correct data format



# Use the User set in the settings not the defualt Django User model
User = get_user_model()


# ─── User ────────────────────────────────────────────────────────────────────

class CreateUserView(generics.CreateAPIView):
    # QuerySet is which db objects to work with
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


# ─── Gym ─────────────────────────────────────────────────────────────────────

class GymListCreateView(generics.ListCreateAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    # Query set defined here is what should be returned on a get request
    def get_queryset(self):
        return Gym.objects.all()

    def perform_create(self, serializer):
        # Serializer save is needed to inject the data not included in the post request as it is read only in the serializer
        serializer.save(added_by=self.request.user)


# the get here is used to get a single record
class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
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


#class WallDetailView(generics.RetrieveUpdateDestroyAPIView):
#   serializer_class = WallSerializer
#    permission_classes = [IsAuthenticated]
#
#    def get_queryset(self):
#        # Wall has no added_by so just let any authenticated user edit for now
        # you can tighten this later when you add added_by to Wall
#        gym_id = self.kwargs.get("gym_id")
#        return Wall.objects.filter(gym_id=gym_id)


# ─── Climb ───────────────────────────────────────────────────────────────────

class ClimbListCreateView(generics.ListCreateAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        wall_id = self.kwargs.get("wall_id")
        return Climb.objects.filter(wall_id=wall_id, is_archived=False)

    def perform_create(self, serializer):
        wall_id = self.kwargs.get("wall_id")
        wall = get_object_or_404(Wall, id=wall_id)
        serializer.save(added_by=self.request.user, wall=wall)


class ClimbDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
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

        # update_or_create means if this user already voted, update their grade
        # rather than throwing a unique_together error
        vote, created = GradeVote.objects.update_or_create(
            climb=climb,
            user=self.request.user,
            defaults={'grade': serializer.validated_data['grade']}
        )

        # recalculate community grade on the climb every time a vote changes
        avg = GradeVote.objects.filter(climb=climb).aggregate(Avg('grade'))['grade__avg']
        climb.community_grade = round(avg, 1) if avg else None
        climb.save()


class GradeVoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradeVoteSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        climb_id = self.kwargs.get("climb_id")
        # users can only edit or delete their own votes
        return GradeVote.objects.filter(user=self.request.user,
                                        climb_id=climb_id
                                        )
    


# ─── Send  ──────────────────────────────────────────────────────────────
class SendListCreateView(generics.ListCreateAPIView):
    serializer_class = SendSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
 #       return Send.objects.filter(climb)