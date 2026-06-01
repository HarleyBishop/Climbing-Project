from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# Extending AbstractUser rather than using a OneToOne profile model keeps auth
# and app-level user data in a single table and works cleanly with DRF's
# request.user throughout the codebase.
class User(AbstractUser):
    # Drives the IsSetterOrReadOnly permission — all write access to gyms/walls/
    # climbs is gated on this flag. Set at registration, not changeable via API.
    is_verified_setter = models.BooleanField(default=False)
    # Nullable because most users won't have OAuth linked. unique=True prevents
    # two accounts accidentally sharing the same Google sub ID.
    google_id = models.CharField(max_length=200, blank=True, null=True, unique=True)

    def __str__(self):
        return self.username


class Gym(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    # Nullable so existing gyms don't break — setters fill these in when creating
    # or editing a gym. Only gyms with both fields set appear on the map.
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    # SET_NULL so deleting the setter account doesn't cascade-delete the gym.
    added_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='owner')

    def __str__(self):
        return self.name


class Wall(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    # CASCADE: a wall only exists within a gym, so deleting the gym should
    # remove all its walls (and by extension all climbs via Wall→Climb cascade).
    gym = models.ForeignKey('Gym', on_delete=models.CASCADE, related_name='walls')

    def __str__(self):
        return self.name


class Climb(models.Model):
    name = models.CharField(max_length=100)
    colour = models.CharField(max_length=50)
    # URLField validates format but doesn't verify the URL is reachable.
    image_url = models.URLField(blank=True)
    # suggested_grade is set by the setter at creation and never changes.
    # community_grade is the rolling average of GradeVote entries, recalculated
    # on every vote submission in views.py rather than being computed on-the-fly,
    # so it can be returned cheaply without aggregating on each request.
    suggested_grade = models.IntegerField()
    community_grade = models.FloatField(null=True, blank=True)
    # Soft-delete pattern: archived climbs stay in the DB (preserving send
    # history) but are filtered out of the active climb lists and leaderboard.
    is_archived = models.BooleanField(default=False)
    set_at = models.DateTimeField(auto_now_add=True)

    wall = models.ForeignKey('Wall', on_delete=models.CASCADE, related_name='climbs')
    # SET_NULL: if a setter account is deleted, their climbs stay in the DB.
    added_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='climbs_set')

    def __str__(self):
        return self.name


class GradeVote(models.Model):
    grade = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='grade_votes')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='grade_votes')

    class Meta:
        # Enforced at DB level — the view uses update_or_create to handle
        # re-votes gracefully instead of raising an IntegrityError.
        unique_together = ['climb', 'user']

    def __str__(self):
        return f"{self.user} voted {self.grade} on {self.climb}"


class Send(models.Model):
    attempts = models.IntegerField(default=1)
    sent_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='sends')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='sends')

    class Meta:
        # One send record per user per climb — a user can edit their attempt
        # count but not create a second send. The view uses update_or_create.
        unique_together = ['climb', 'user']

    def __str__(self):
        return f"{self.user} sent {self.climb}"


class Review(models.Model):
    comment = models.TextField()
    stars = models.IntegerField()
    attempts = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f"{self.user} reviewed {self.climb}"


class Video(models.Model):
    video_url = models.URLField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='videos')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='videos')

    def __str__(self):
        return f"{self.user} video on {self.climb}"


# ─── Competition System ───────────────────────────────────────────────────────
# Competitions are gym-scoped and come in two flavours: qualifier (points-based,
# open to all registered climbers) and finals (IFSC-style judged results, setter
# only). A qualifier can be linked to a finals via linked_qualifier so the UI
# can show "advances to finals" banners and navigate between them.

class Competition(models.Model):
    QUALIFIER = 'qualifier'
    FINALS = 'finals'
    TYPE_CHOICES = [(QUALIFIER, 'Qualifier'), (FINALS, 'Finals')]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    rules = models.TextField(blank=True)
    comp_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    # How many qualifier places advance to finals. Null means no advancement
    # mechanic (e.g. standalone event).
    top_x_advance = models.IntegerField(null=True, blank=True)

    gym = models.ForeignKey('Gym', on_delete=models.CASCADE, related_name='competitions')
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='created_comps')
    # OneToOne so there can only be one finals per qualifier and vice versa.
    linked_qualifier = models.OneToOneField(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='linked_finals'
    )

    @property
    def status(self):
        # Computed on-the-fly from real time — no need to store or update a
        # status field, which would require a background job to stay current.
        now = timezone.now()
        if now < self.start_date:
            return 'upcoming'
        elif now <= self.end_date:
            return 'open'
        return 'closed'

    def __str__(self):
        return f"{self.title} ({self.comp_type})"


class Division(models.Model):
    # Organisational groupings within a comp (e.g. Open, Youth, Masters).
    # Climbers pick a division at registration; divisions don't affect scoring.
    name = models.CharField(max_length=100)
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='divisions')

    def __str__(self):
        return f"{self.name} – {self.competition.title}"


class CompRound(models.Model):
    # Named stages within a competition (e.g. "Route 1", "Boulder 2").
    # order drives the sort in Meta so the frontend receives them sequentially.
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=1)
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='rounds')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} – {self.competition.title}"


class CompClimb(models.Model):
    # Join table between a Competition and a Climb, with a custom points_value
    # so the setter can weight specific problems differently per event.
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='comp_climbs')
    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='comp_entries')
    points_value = models.IntegerField(default=100)
    # Optional — a climb can belong to a specific round within the comp.
    comp_round = models.ForeignKey('CompRound', null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        # A climb can only appear once per competition.
        unique_together = ['competition', 'climb']

    def __str__(self):
        return f"{self.climb.name} in {self.competition.title}"


class CompRegistration(models.Model):
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comp_registrations')
    # Division is optional at registration — can be null if the comp has none.
    division = models.ForeignKey('Division', null=True, blank=True, on_delete=models.SET_NULL)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One registration per user per competition — the view uses
        # get_or_create so re-registering is idempotent rather than an error.
        unique_together = ['competition', 'user']

    def __str__(self):
        return f"{self.user.username} in {self.competition.title}"


class CompSend(models.Model):
    comp_climb = models.ForeignKey('CompClimb', on_delete=models.CASCADE, related_name='comp_sends')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comp_sends')
    attempts = models.IntegerField(default=1)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One send per user per comp-climb, same pattern as the regular Send
        # model. The view uses update_or_create to allow attempt count updates.
        unique_together = ['comp_climb', 'user']

    def __str__(self):
        return f"{self.user.username} sent {self.comp_climb.climb.name} (comp)"


class FinalsResult(models.Model):
    # Stores IFSC-style judged outcomes for finals events. Unlike qualifier
    # sends (self-reported), these are entered by a setter/judge via the judging
    # panel. The separate 'topped' and 'zoned' booleans with attempt counts are
    # the standard IFSC data model for boulder finals scoring.
    comp_climb = models.ForeignKey('CompClimb', on_delete=models.CASCADE, related_name='finals_results')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='finals_results')
    topped = models.BooleanField(default=False)
    top_attempts = models.IntegerField(null=True, blank=True)
    zoned = models.BooleanField(default=False)
    zone_attempts = models.IntegerField(null=True, blank=True)
    # Audit trail — who recorded this result, useful if a result is contested.
    recorded_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='judged_results')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['comp_climb', 'user']

    def __str__(self):
        return f"{self.user.username} – {self.comp_climb.climb.name} finals"
