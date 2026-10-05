from rest_framework import serializers

from ..models import (
    Competition, Division, CompRound, CompClimb, CompRegistration, CompSend, FinalsResult,
)


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
    # status is a @property computed from the current time, not a DB column.
    status = serializers.ChoiceField(
        choices=[Competition.UPCOMING, Competition.OPEN, Competition.CLOSED], read_only=True,
    )
    # Nested read-only — divisions and rounds are written via their own
    # endpoints, but embedded here so one GET returns the full competition.
    divisions = DivisionSerializer(many=True, read_only=True)
    rounds = CompRoundSerializer(many=True, read_only=True)
    registration_count = serializers.IntegerField(source='registrations.count', read_only=True)
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

    # Return type hints let drf-spectacular emit the correct OpenAPI types for
    # SerializerMethodFields instead of defaulting them to string.
    def get_is_registered(self, obj) -> bool:
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user).exists()
        return False

    def get_has_linked_finals(self, obj) -> bool:
        # linked_finals is the reverse of the OneToOneField on linked_qualifier.
        # hasattr is needed because accessing it on an unlinked qualifier
        # raises RelatedObjectDoesNotExist rather than returning None.
        return hasattr(obj, 'linked_finals')


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

    def create(self, validated_data):
        # get_or_create so re-registering is idempotent rather than a
        # duplicate-key error.
        registration, _ = CompRegistration.objects.get_or_create(
            competition=validated_data['competition'],
            user=validated_data['user'],
            defaults={'division': validated_data.get('division')},
        )
        return registration


class CompSendSerializer(serializers.ModelSerializer):
    climb_name = serializers.CharField(source='comp_climb.climb.name', read_only=True)
    points_value = serializers.IntegerField(source='comp_climb.points_value', read_only=True)

    class Meta:
        model = CompSend
        fields = ['id', 'comp_climb', 'user', 'attempts', 'logged_at', 'climb_name', 'points_value']
        read_only_fields = ['user', 'logged_at']

    def create(self, validated_data):
        # Re-logging the same comp climb updates the attempt count.
        comp_send, _ = CompSend.objects.update_or_create(
            comp_climb=validated_data['comp_climb'],
            user=validated_data['user'],
            defaults={'attempts': validated_data.get('attempts', 1)},
        )
        return comp_send


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
        # comp_climb and user are both writable here, so DRF would auto-add a
        # UniqueTogetherValidator and reject a second POST for the same pair
        # before create() ran. Disabling it lets create() upsert instead.
        validators = []

    def create(self, validated_data):
        # update_or_create so a judge can correct a result — the judging panel
        # POSTs on every save rather than tracking whether a result exists.
        comp_climb = validated_data.pop('comp_climb')
        user = validated_data.pop('user')
        result, _ = FinalsResult.objects.update_or_create(
            comp_climb=comp_climb, user=user, defaults=validated_data,
        )
        return result
