from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Use this instead of Django's default User
class User(AbstractUser):
    is_verified_setter = models.BooleanField(default=False)
    google_id = models.CharField(max_length=200, blank=True, null=True, unique=True)

    def __str__(self):
        return self.username

# GYM TABLE
class Gym(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)  
    added_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='owner')
    def __str__(self):
        return self.name


# WALL TABLE
class Wall(models.Model):  
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    gym = models.ForeignKey('Gym', on_delete=models.CASCADE, related_name='walls')

    def __str__(self):
        return self.name

#CLIMB TABLE
class Climb(models.Model):  
    name = models.CharField(max_length=100)
    colour = models.CharField(max_length=50)
    image_url = models.URLField(blank=True)        # URLField validates it's a real URL
    suggested_grade = models.IntegerField()        
    community_grade = models.FloatField(null=True, blank=True)  
    is_archived = models.BooleanField(default=False)
    set_at = models.DateTimeField(auto_now_add=True)  # auto set on creation

    wall = models.ForeignKey('Wall', on_delete=models.CASCADE, related_name='climbs')
    added_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='climbs_set')

    def __str__(self):
        return self.name


#GRADE TABLE
class GradeVote(models.Model):  # Model not Models
    grade = models.IntegerField()                  # grade is a number not a string
    created_at = models.DateTimeField(auto_now_add=True)  # auto set on creation

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='grade_votes')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='grade_votes')

    class Meta:
        unique_together = ['climb', 'user']  # one vote per user per climb

    def __str__(self):
        return f"{self.user} voted {self.grade} on {self.climb}"

#SEND TABLE
class Send(models.Model):
    attempts = models.IntegerField(default=1)
    sent_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='sends')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='sends')

    class Meta:
        unique_together = ['climb', 'user']  # one send log per user per climb

    def __str__(self):
        return f"{self.user} sent {self.climb}"

# REVIEW TABLE
class Review(models.Model):
    comment = models.TextField()
    stars = models.IntegerField()
    attempts = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f"{self.user} reviewed {self.climb}"


# VIDEO TABLE
class Video(models.Model):
    video_url = models.URLField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='videos')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='videos')

    def __str__(self):
        return f"{self.user} video on {self.climb}"


# ─── Competition System ───────────────────────────────────────────────────────

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
    top_x_advance = models.IntegerField(null=True, blank=True)

    gym = models.ForeignKey('Gym', on_delete=models.CASCADE, related_name='competitions')
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='created_comps')
    # Finals competitions can reference the qualifier they follow
    linked_qualifier = models.OneToOneField(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='linked_finals'
    )

    @property
    def status(self):
        now = timezone.now()
        if now < self.start_date:
            return 'upcoming'
        elif now <= self.end_date:
            return 'open'
        return 'closed'

    def __str__(self):
        return f"{self.title} ({self.comp_type})"


class Division(models.Model):
    name = models.CharField(max_length=100)
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='divisions')

    def __str__(self):
        return f"{self.name} – {self.competition.title}"


class CompRound(models.Model):
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=1)
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='rounds')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} – {self.competition.title}"


class CompClimb(models.Model):
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='comp_climbs')
    climb = models.ForeignKey('Climb', on_delete=models.CASCADE, related_name='comp_entries')
    points_value = models.IntegerField(default=100)
    comp_round = models.ForeignKey('CompRound', null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        unique_together = ['competition', 'climb']

    def __str__(self):
        return f"{self.climb.name} in {self.competition.title}"


class CompRegistration(models.Model):
    competition = models.ForeignKey('Competition', on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comp_registrations')
    division = models.ForeignKey('Division', null=True, blank=True, on_delete=models.SET_NULL)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['competition', 'user']

    def __str__(self):
        return f"{self.user.username} in {self.competition.title}"


class CompSend(models.Model):
    comp_climb = models.ForeignKey('CompClimb', on_delete=models.CASCADE, related_name='comp_sends')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comp_sends')
    attempts = models.IntegerField(default=1)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['comp_climb', 'user']

    def __str__(self):
        return f"{self.user.username} sent {self.comp_climb.climb.name} (comp)"


class FinalsResult(models.Model):
    comp_climb = models.ForeignKey('CompClimb', on_delete=models.CASCADE, related_name='finals_results')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='finals_results')
    topped = models.BooleanField(default=False)
    top_attempts = models.IntegerField(null=True, blank=True)
    zoned = models.BooleanField(default=False)
    zone_attempts = models.IntegerField(null=True, blank=True)
    recorded_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='judged_results')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['comp_climb', 'user']

    def __str__(self):
        return f"{self.user.username} – {self.comp_climb.climb.name} finals"