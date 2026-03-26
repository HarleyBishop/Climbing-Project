from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Climb(models.Model):
    colour = models.CharField(max_length=100)
    wall = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.colour