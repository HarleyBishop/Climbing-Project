from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Gym(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    Is_Active = models.BooleanField()

    def __str__(self):
        return self.name
    
class Wall(models.Models):
    name = models.CharField(max_length=100)
    gym = models.ForeignKey('Gym', on_delete=models.CASCADE, related_name='walls')

    def __str__(self):
        return self.name
    
