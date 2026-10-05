from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from ..models import Follow
from .common import ClimbContextFields

User = get_user_model()


# ─── Auth ────────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Adds custom claims to the JWT payload so the frontend can read username and
    role from the token itself without a separate /me API call. The token is
    decoded client-side in auth.js using jwt-decode.
    Wired up via SIMPLE_JWT['TOKEN_OBTAIN_SERIALIZER'] in settings.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_setter'] = user.is_verified_setter
        return token


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class GoogleLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(help_text='OAuth access token from Google Sign-In.')


# ─── Users ───────────────────────────────────────────────────────────────────

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'bio', 'is_verified_setter', 'is_staff', 'date_joined']
        read_only_fields = ['is_staff', 'date_joined']
        extra_kwargs = {
            # write_only ensures password is never returned in a response,
            # only accepted on create.
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # create_user (not create) hashes the password before saving.
        # Calling plain .create() would store it in plaintext.
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Profile page data for GET and PATCH /api/users/{id}/. Only bio is writable;
    everything else is display data.
    """
    # source can point at a method — DRF calls it, so these run COUNT queries.
    follower_count = serializers.IntegerField(source='followers.count', read_only=True)
    following_count = serializers.IntegerField(source='following.count', read_only=True)
    # Relative to whoever is viewing the profile, so it needs the request.
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'bio', 'is_verified_setter', 'is_staff', 'date_joined',
            'follower_count', 'following_count', 'is_following',
        ]
        read_only_fields = ['id', 'username', 'is_verified_setter', 'is_staff', 'date_joined']

    def get_is_following(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        # Checked here rather than in the view so a wrong password comes back
        # as a normal field error alongside any other validation errors.
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


# ─── Activity feed ───────────────────────────────────────────────────────────

class ActivityFeedItemSerializer(ClimbContextFields, serializers.Serializer):
    """
    One row of the feed — either a Send or a Review. The view annotates both
    querysets with `feed_type` and `timestamp` so the two models share a shape
    and can be merged and sorted together.
    """
    type = serializers.CharField(source='feed_type')
    id = serializers.IntegerField()
    user_id = serializers.IntegerField(source='user.id')
    username = serializers.CharField(source='user.username')
    timestamp = serializers.DateTimeField()
    climb_colour = serializers.CharField(source='climb.colour')
    climb_grade = serializers.IntegerField(source='climb.suggested_grade')
    attempts = serializers.IntegerField()
    # Reviews only. required=False makes DRF skip the field (instead of
    # erroring) when the object doesn't have the attribute, i.e. for sends.
    comment = serializers.CharField(required=False)
    stars = serializers.IntegerField(required=False)
