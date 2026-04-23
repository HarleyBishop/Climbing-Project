from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Gym, Wall, Climb, GradeVote, Send, Review, Video
from django.contrib.auth import get_user_model

User = get_user_model()


# Checks data passed ot seralizer and if the data is valid passes the data to create where a user can then be created
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'is_verified_setter', 'is_staff', 'date_joined']
        read_only_fields = ['is_verified_setter', 'is_staff', 'date_joined']

        # Read_only_fields is similar to extra kwargs it does the same ting however extra kwargs is used for a range of configs like max lenght read and write only 
        extra_kwargs = {
            'password': {'write_only': True}
        }

    # Create function only needed for user class as django .create_user function is used to hash the password field
    #Create function only used when something needs to occur before creation such as validating data 
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    


class GymSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gym
        fields = ["id", "name", "location", "is_active"]
        read_only_fields = ['added_by']
        
class WallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wall
        fields = ["id", "name", "gym", "description"]
        read_only_fields = ['gym']

class ClimbSerializer(serializers.ModelSerializer):
    class Meta:
        model = Climb
        fields = ["id", "name", "colour", "image_url", "suggested_grade", "community_grade", "is_archived", "set_at", "wall", "added_by"]
        read_only_fields = ['wall', 'added_by']

class GradeVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeVote
        fields = ["id", "grade", "created_at", "climb", "user"]
        read_only_fields = ['created_at', 'climb', 'user']

class SendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Send
        fields = ["id", "attempts", "sent_at", "climb", "user"]
        read_only_fields = ['climb', 'user', 'sent_at']

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "comment", "stars", "attempts", "created_at", "climb", "user"]
        read_only_fields = ['climb', 'user', 'created_at']

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ["id", "video_url", "uploaded_at", "climb", "user"]
        read_only_fields = ['uploaded_at', 'climb', 'user']

