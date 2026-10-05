from rest_framework import serializers

from ..models import Gym, Wall, Climb


class GymSerializer(serializers.ModelSerializer):
    # Read from the annotations added by Gym.objects.with_counts(), so listing
    # many gyms costs one query rather than two extra COUNTs per gym.
    wall_count = serializers.SerializerMethodField()
    climb_count = serializers.SerializerMethodField()

    class Meta:
        model = Gym
        fields = ['id', 'name', 'location', 'is_active', 'wall_count', 'climb_count', 'lat', 'lng']

    def get_wall_count(self, obj) -> int:
        # Fallback to a live query for gyms that didn't come from with_counts()
        # (e.g. the instance returned after a create).
        if hasattr(obj, 'wall_count'):
            return obj.wall_count
        return obj.walls.count()

    def get_climb_count(self, obj) -> int:
        if hasattr(obj, 'climb_count'):
            return obj.climb_count
        return Climb.objects.filter(wall__gym=obj, is_archived=False).count()


class WallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wall
        fields = ['id', 'name', 'gym', 'description']
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
        fields = [
            'id', 'name', 'colour', 'image_url', 'suggested_grade', 'community_grade',
            'is_archived', 'set_at', 'wall', 'wall_name', 'added_by', 'added_by_username',
        ]
        read_only_fields = ['wall', 'added_by']


class ArchiveClimbsResultSerializer(serializers.Serializer):
    archived = serializers.IntegerField(help_text='Number of climbs archived.')
