from django.contrib.auth.models import User
from rest_framework import serializers


# Checks data passed ot seralizer and if the data is valid passes the data to create where a user can then be created
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        extra_kwargs = {
            'password': {'write_only': True}
        }


        def create(self, validated_data):
            user = User.objects.create_user(**validated_data)
            return user