from rest_framework import serializers


class DetailSerializer(serializers.Serializer):
    """Shape of simple {"detail": "..."} responses — DRF's own error format."""
    detail = serializers.CharField()


class ClimbContextFields(serializers.Serializer):
    """
    Denormalised climb → wall → gym fields, mixed into any serializer whose
    model has a `climb` FK (sends, reviews, videos, feed items). The profile
    page and feed need these to display and link to the climb
    (/gym/:gymId/wall/:wallId/climb/:climbId) without one extra request per row.

    Declared fields on a Serializer subclass are inherited by DRF's metaclass,
    so a ModelSerializer can mix this in and just list the names in Meta.fields.
    Views using these should select_related('climb__wall__gym') to keep it to
    one query.
    """
    climb_id = serializers.IntegerField(source='climb.id', read_only=True)
    climb_name = serializers.CharField(source='climb.name', read_only=True)
    wall_id = serializers.IntegerField(source='climb.wall.id', read_only=True)
    wall_name = serializers.CharField(source='climb.wall.name', read_only=True)
    gym_id = serializers.IntegerField(source='climb.wall.gym.id', read_only=True)
    gym_name = serializers.CharField(source='climb.wall.gym.name', read_only=True)
