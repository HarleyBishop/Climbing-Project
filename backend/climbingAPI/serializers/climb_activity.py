from rest_framework import serializers

from ..models import GradeVote, Send, Review, Video
from ..storage import MAX_VIDEO_BYTES, VIDEO_EXTENSIONS, public_video_prefix
from .common import ClimbContextFields


class GradeVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeVote
        fields = ['id', 'grade', 'created_at', 'climb', 'user']
        # climb and user are injected server-side — the client only sends grade.
        read_only_fields = ['created_at', 'climb', 'user']

    def create(self, validated_data):
        # One vote per user per climb (unique_together). update_or_create makes
        # POST idempotent — re-voting just changes the grade.
        vote, _ = GradeVote.objects.update_or_create(
            climb=validated_data['climb'],
            user=validated_data['user'],
            defaults={'grade': validated_data['grade']},
        )
        return vote


class SendSerializer(ClimbContextFields, serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    climb_colour = serializers.CharField(source='climb.colour', read_only=True)
    climb_grade = serializers.IntegerField(source='climb.suggested_grade', read_only=True)
    # Used by the frontend rank system to filter archived sends out of points
    # calculations — archived climbs shouldn't count toward your rank.
    climb_is_archived = serializers.BooleanField(source='climb.is_archived', read_only=True)

    class Meta:
        model = Send
        fields = [
            'id', 'attempts', 'sent_at',
            'climb', 'user', 'username',
            'climb_id', 'climb_name', 'climb_colour', 'climb_grade', 'climb_is_archived',
            'wall_id', 'wall_name',
            'gym_id', 'gym_name',
        ]
        read_only_fields = ['climb', 'user', 'sent_at']

    def create(self, validated_data):
        # Same pattern as GradeVote — logging a send twice just updates the
        # attempt count rather than creating a duplicate.
        send, _ = Send.objects.update_or_create(
            climb=validated_data['climb'],
            user=validated_data['user'],
            defaults={'attempts': validated_data.get('attempts', 1)},
        )
        return send


class ReviewSerializer(ClimbContextFields, serializers.ModelSerializer):
    # username is included so the climb page can display who wrote each review
    # without a separate user lookup per review.
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'comment', 'stars', 'attempts', 'created_at',
            'climb', 'user', 'username',
            'climb_id', 'climb_name',
            'wall_id', 'wall_name',
            'gym_id', 'gym_name',
        ]
        read_only_fields = ['climb', 'user', 'created_at']


class VideoSerializer(ClimbContextFields, serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = [
            'id', 'video_url', 'uploaded_at',
            'climb', 'user',
            'climb_id', 'climb_name',
            'wall_id', 'wall_name',
            'gym_id', 'gym_name',
        ]
        read_only_fields = ['uploaded_at', 'climb', 'user']

    def validate_video_url(self, value):
        # Only accept files from our own bucket (i.e. ones that came through
        # the upload-url flow). Arbitrary links were unreliable — YouTube and
        # Instagram pages aren't playable in a <video> tag.
        if not value.startswith(public_video_prefix()):
            raise serializers.ValidationError('Videos must be uploaded through the app.')
        return value


class VideoUploadRequestSerializer(serializers.Serializer):
    content_type = serializers.ChoiceField(choices=list(VIDEO_EXTENSIONS))
    # The client reports the size before uploading so oversized files are
    # rejected early. The bucket's own size limit is what actually enforces it.
    size = serializers.IntegerField(min_value=1, max_value=MAX_VIDEO_BYTES)


class VideoUploadResponseSerializer(serializers.Serializer):
    upload_url = serializers.URLField(help_text='PUT the file here (valid for 2 hours).')
    video_url = serializers.URLField(help_text='Public URL to save via POST .../videos/ once the upload finishes.')
