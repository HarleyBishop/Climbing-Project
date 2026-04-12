from django.db import models
from django.contrib.auth.models import AbstractUser

# Use this instead of Django's default User
class User(AbstractUser):
    is_verified_setter = models.BooleanField(default=False)

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