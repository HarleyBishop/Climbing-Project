from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Gym, Wall, Climb, GradeVote, Send, Review, Video,
    Competition, Division, CompRound, CompClimb, CompRegistration, CompSend, FinalsResult,
)
from django.contrib.auth import get_user_model

User = get_user_model()

#Class to add username to the JWT token https://django-rest-framework-simplejwt.readthedocs.io/en/latest/customizing_token_claims.html
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_setter'] = user.is_verified_setter
        return token


# Checks data passed to serializer and if the data is valid passes the data to create where a user can then be created
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'is_verified_setter', 'is_staff', 'date_joined']
        read_only_fields = ['is_staff', 'date_joined']

        # Read_only_fields is similar to extra kwargs it does the same thing however extra kwargs is used for a range of configs like max length read and write only
        extra_kwargs = {
            'password': {'write_only': True}
        }

    # Create function only needed for user class as django .create_user function is used to hash the password field
    # Create function only used when something needs to occur before creation such as validating data
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class GymSerializer(serializers.ModelSerializer):
    # SerializerMethodFields read from annotated values on the queryset (set in views.py).
    # This avoids N+1 queries — no extra DB hit per gym.
    wall_count = serializers.SerializerMethodField()
    climb_count = serializers.SerializerMethodField()

    class Meta:
        model = Gym
        fields = ["id", "name", "location", "is_active", "wall_count", "climb_count"]
        read_only_fields = ['added_by']

    def get_wall_count(self, obj):
        # Use the annotated value if present, otherwise fall back to a query
        if hasattr(obj, 'wall_count'):
            return obj.wall_count
        return obj.walls.count()

    def get_climb_count(self, obj):
        # Use the annotated value if present, otherwise fall back to a query
        if hasattr(obj, 'climb_count'):
            return obj.climb_count
        return Climb.objects.filter(wall__gym=obj, is_archived=False).count()


class WallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wall
        fields = ["id", "name", "gym", "description"]
        read_only_fields = ['gym']


class ClimbSerializer(serializers.ModelSerializer):
    wall_name = serializers.CharField(source='wall.name', read_only=True)

    class Meta:
        model = Climb
        fields = ["id", "name", "colour", "image_url", "suggested_grade", "community_grade", "is_archived", "set_at", "wall", "wall_name", "added_by"]
        read_only_fields = ['wall', 'added_by']


class GradeVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeVote
        fields = ["id", "grade", "created_at", "climb", "user"]
        read_only_fields = ['created_at', 'climb', 'user']


class SendSerializer(serializers.ModelSerializer):
    # Extra fields needed for profile page to display climb info and navigate to the climb
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    climb_colour = serializers.CharField(source='climb.colour', read_only=True)
    climb_grade = serializers.IntegerField(source='climb.suggested_grade', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
    # FK ids needed so profile page can build navigate URL to the climb
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = Send
        fields = [
            "id", "attempts", "sent_at",
            "climb", "user",
            # profile page fields
            "climb_id", "climb_name", "climb_colour", "climb_grade",
            "wall_id", "wall_name",
            "gym_id", "gym_name",
        ]
        read_only_fields = ['climb', 'user', 'sent_at']


class ReviewSerializer(serializers.ModelSerializer):
    # Added so that username can be accessed for reviews in climb ui
    username = serializers.CharField(source='user.username', read_only=True)
    # Extra fields needed for profile page
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
    # FK ids needed so profile page can build navigate URL to the climb
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "comment", "stars", "attempts", "created_at",
            "climb", "user", "username",
            # profile page fields
            "climb_id", "climb_name",
            "wall_id", "wall_name",
            "gym_id", "gym_name",
        ]
        read_only_fields = ['climb', 'user', 'created_at']


class VideoSerializer(serializers.ModelSerializer):
    # Extra fields needed for profile page
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
    # FK ids needed so profile page can build navigate URL to the climb
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = Video
        fields = [
            "id", "video_url", "uploaded_at",
            "climb", "user",
            # profile page fields
            "climb_id", "climb_name",
            "wall_id", "wall_name",
            "gym_id", "gym_name",
        ]
        read_only_fields = ['uploaded_at', 'climb', 'user']


# ─── Competition Serializers ──────────────────────────────────────────────────

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name', 'competition']
        read_only_fields = ['competition']


class CompRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompRound
        fields = ['id', 'name', 'order', 'competition']
        read_only_fields = ['competition']


class CompetitionSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    divisions = DivisionSerializer(many=True, read_only=True)
    rounds = CompRoundSerializer(many=True, read_only=True)
    registration_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    has_linked_finals = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = [
            'id', 'title', 'description', 'rules', 'comp_type',
            'start_date', 'end_date', 'gym', 'created_by',
            'top_x_advance', 'linked_qualifier',
            'status', 'divisions', 'rounds',
            'registration_count', 'is_registered', 'has_linked_finals',
        ]
        read_only_fields = ['created_by', 'gym']

    def get_status(self, obj):
        return obj.status

    def get_registration_count(self, obj):
        return obj.registrations.count()

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user).exists()
        return False

    def get_has_linked_finals(self, obj):
        return hasattr(obj, 'linked_finals') and obj.linked_finals is not None


class CompClimbSerializer(serializers.ModelSerializer):
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    climb_colour = serializers.CharField(source='climb.colour', read_only=True)
    climb_grade = serializers.IntegerField(source='climb.suggested_grade', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = CompClimb
        fields = [
            'id', 'competition', 'climb', 'points_value', 'comp_round',
            'climb_name', 'climb_colour', 'climb_grade',
            'wall_name', 'wall_id', 'gym_id',
        ]
        read_only_fields = ['competition']


class CompRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)

    class Meta:
        model = CompRegistration
        fields = ['id', 'competition', 'user', 'username', 'division', 'division_name', 'registered_at']
        read_only_fields = ['competition', 'user', 'registered_at']


class CompSendSerializer(serializers.ModelSerializer):
    climb_name = serializers.CharField(source='comp_climb.climb.name', read_only=True)
    points_value = serializers.IntegerField(source='comp_climb.points_value', read_only=True)

    class Meta:
        model = CompSend
        fields = ['id', 'comp_climb', 'user', 'attempts', 'logged_at', 'climb_name', 'points_value']
        read_only_fields = ['user', 'logged_at']


class FinalsResultSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    climb_name = serializers.CharField(source='comp_climb.climb.name', read_only=True)
    climb_id = serializers.IntegerField(source='comp_climb.climb.id', read_only=True)

    class Meta:
        model = FinalsResult
        fields = [
            'id', 'comp_climb', 'user', 'username', 'climb_name', 'climb_id',
            'topped', 'top_attempts', 'zoned', 'zone_attempts',
            'recorded_by', 'recorded_at',
        ]
        read_only_fields = ['recorded_by', 'recorded_at']
