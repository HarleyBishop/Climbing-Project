from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Gym, Wall, Climb, GradeVote, Send, Review, Video,
    Competition, Division, CompRound, CompClimb, CompRegistration, CompSend, FinalsResult,
)
from django.contrib.auth import get_user_model

# get_user_model() is preferred over importing User directly because it
# respects the AUTH_USER_MODEL setting — safe to call even after the line above.
User = get_user_model()

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# Adds custom claims to the JWT payload so the frontend can read username and
# role from the token itself without a separate /me API call.
# The token is decoded client-side in auth.js using jwt-decode.
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_setter'] = user.is_verified_setter
        return token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'is_verified_setter', 'is_staff', 'date_joined']
        read_only_fields = ['is_staff', 'date_joined']
        extra_kwargs = {
            # write_only ensures password is never returned in a response,
            # only accepted on create/update.
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # create_user (not create) hashes the password before saving.
        # Calling plain .create() would store it in plaintext.
        return User.objects.create_user(**validated_data)


class GymSerializer(serializers.ModelSerializer):
    # SerializerMethodField reads from values annotated onto the queryset in
    # gym_queryset_with_counts(). This avoids an extra query per gym when
    # listing many gyms — the count is computed once in the DB with COUNT().
    wall_count = serializers.SerializerMethodField()
    climb_count = serializers.SerializerMethodField()

    class Meta:
        model = Gym
        fields = ["id", "name", "location", "is_active", "wall_count", "climb_count", "lat", "lng"]
        read_only_fields = ['added_by']

    def get_wall_count(self, obj):
        # hasattr check: if the queryset was annotated, use that value.
        # Fallback to a live query for cases where a single Gym is fetched
        # without going through gym_queryset_with_counts (e.g. nested serializers).
        if hasattr(obj, 'wall_count'):
            return obj.wall_count
        return obj.walls.count()

    def get_climb_count(self, obj):
        if hasattr(obj, 'climb_count'):
            return obj.climb_count
        return Climb.objects.filter(wall__gym=obj, is_archived=False).count()


class WallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wall
        fields = ["id", "name", "gym", "description"]
        # gym is injected in perform_create from the URL kwarg — it's not
        # something the client should be able to set directly.
        read_only_fields = ['gym']


class ClimbSerializer(serializers.ModelSerializer):
    # Denormalising wall_name here avoids a second request from the frontend
    # just to display which wall a climb is on.
    wall_name = serializers.CharField(source='wall.name', read_only=True)
    added_by_username = serializers.CharField(source='added_by.username', read_only=True)

    class Meta:
        model = Climb
        fields = ["id", "name", "colour", "image_url", "suggested_grade", "community_grade", "is_archived", "set_at", "wall", "wall_name", "added_by", "added_by_username"]
        read_only_fields = ['wall', 'added_by']


class GradeVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeVote
        fields = ["id", "grade", "created_at", "climb", "user"]
        # climb and user are injected server-side — the client only sends grade.
        read_only_fields = ['created_at', 'climb', 'user']


class SendSerializer(serializers.ModelSerializer):
    # These fields traverse FK relationships (send → climb → wall → gym) to
    # give the profile page everything it needs in a single response. Without
    # them the frontend would need one extra request per send to get climb info.
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    climb_colour = serializers.CharField(source='climb.colour', read_only=True)
    climb_grade = serializers.IntegerField(source='climb.suggested_grade', read_only=True)
    # Used by the frontend rank system to filter archived sends out of points
    # calculations — archived climbs shouldn't count toward your rank.
    climb_is_archived = serializers.BooleanField(source='climb.is_archived', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
    # IDs are needed so the profile page can build a navigation URL to the
    # climb detail page (/gym/:gymId/wall/:wallId/climb/:climbId).
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = Send
        fields = [
            "id", "attempts", "sent_at",
            "climb", "user",
            "climb_id", "climb_name", "climb_colour", "climb_grade", "climb_is_archived",
            "wall_id", "wall_name",
            "gym_id", "gym_name",
        ]
        read_only_fields = ['climb', 'user', 'sent_at']


class ReviewSerializer(serializers.ModelSerializer):
    # username is included so the climb page can display who wrote each review
    # without a separate user lookup per review.
    username = serializers.CharField(source='user.username', read_only=True)
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "comment", "stars", "attempts", "created_at",
            "climb", "user", "username",
            "climb_id", "climb_name",
            "wall_id", "wall_name",
            "gym_id", "gym_name",
        ]
        read_only_fields = ['climb', 'user', 'created_at']


class VideoSerializer(serializers.ModelSerializer):
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)

    class Meta:
        model = Video
        fields = [
            "id", "video_url", "uploaded_at",
            "climb", "user",
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
    # status is a @property on the model so it needs SerializerMethodField —
    # it's computed from real time, not a DB column.
    status = serializers.SerializerMethodField()
    # Nested read-only — divisions and rounds are written via their own
    # endpoints, but embedded here so one GET returns the full competition.
    divisions = DivisionSerializer(many=True, read_only=True)
    rounds = CompRoundSerializer(many=True, read_only=True)
    registration_count = serializers.SerializerMethodField()
    # is_registered is per-request-user, so it needs access to request context.
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
        # self.context['request'] is populated when the serializer is
        # instantiated via a DRF view — always check it exists for safety.
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user).exists()
        return False

    def get_has_linked_finals(self, obj):
        # linked_finals is the reverse of the OneToOneField on linked_qualifier.
        # hasattr check is needed because accessing it on an unlinked qualifier
        # raises RelatedObjectDoesNotExist rather than returning None.
        return hasattr(obj, 'linked_finals') and obj.linked_finals is not None


class CompClimbSerializer(serializers.ModelSerializer):
    # Denormalised climb fields so the competition climbs list doesn't need
    # follow-up requests to display climb name, colour, grade, and location.
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
