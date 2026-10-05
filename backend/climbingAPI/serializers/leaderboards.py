"""
Leaderboard rows. Each leaderboard view returns a User queryset annotated with
its scoring fields (points, tops, rank, ...), so these serializers read those
annotations directly off the User objects.
"""
from rest_framework import serializers


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.IntegerField(source='id')
    username = serializers.CharField()


class GymLeaderboardEntrySerializer(LeaderboardEntrySerializer):
    points = serializers.IntegerField()
    send_count = serializers.IntegerField()


class QualifierLeaderboardEntrySerializer(LeaderboardEntrySerializer):
    points = serializers.IntegerField()
    climbs_completed = serializers.IntegerField()
    total_attempts = serializers.IntegerField()
    advances = serializers.SerializerMethodField(
        help_text='True if within the top_x_advance cutoff for finals.',
    )

    def get_advances(self, obj) -> bool:
        top_x = self.context['competition'].top_x_advance
        return bool(top_x and obj.rank <= top_x)


class FinalsLeaderboardEntrySerializer(LeaderboardEntrySerializer):
    tops = serializers.IntegerField()
    top_attempts = serializers.IntegerField()
    zones = serializers.IntegerField()
    zone_attempts = serializers.IntegerField()
