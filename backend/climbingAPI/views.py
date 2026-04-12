from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import generics
from .serializers import UserSerializer, ClimbSerializer, WallSerializer, GymSerializer, GradeVoteSerializer, SendSerializer, ReviewSerializer, VideoSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from .models import Climb, Wall, Gym, GradeVote, Send, Review, Video

# If the object cannot be retrieved from db return 404 rather then crash api
from django.shortcuts import get_object_or_404

# Import non default User from Django
User = get_user_model()


# User Create 
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]




# Climb CRUD Operations

#GET POST
class ClimbListCreateView(generics.ListCreateAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # ID's stored in URL 
        wall_id = self.kwargs.get("wall_id")
        return Climb.objects.filter(wall_id=wall_id)

    def perform_create(self, serializer):
        wall_id = self.kwargs.get("wall_id")
        wall = get_object_or_404(Wall, id=wall_id)

        # Save values to DB object instance
        serializer.save(
            added_by=self.request.user,
            wall=wall
        )


#PUT DELETE
class ClimbDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClimbSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Only climbs created by the logged-in user can be operated on 
        return Climb.objects.filter(added_by=self.request.user)
    


# Gym CRUD Operations

#GET POST
class GymListCreateView(generics.ListCreateAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Gym.objects.all()
    

#PUT DELETE
class GymDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GymSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Only climbs created by the logged-in user can be operated on 
        return Gym.objects.filter(added_by=self.request.user)
    

#Wall CRUD Operations

#GET POST

class WallListCreateView(generics.ListCreateAPIView):
    serializer_class = WallSerializer
    permission_class = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # ID's stored in URL 
        gym_id = self.kwargs.get("gym_id")
        return Wall.objects.filter(gym_id=gym_id)
    
    
    def perform_create(self, serializer):
        gym_id = self.kwargs.get("gym_id")
        gym = get_object_or_404(Gym, id=gym_id)

        # Save values to DB object instance
        serializer.save(
            gym=gym
        )
    
#PUT DELETE NOT CURRENTLY NEEDED FOR WALLS


