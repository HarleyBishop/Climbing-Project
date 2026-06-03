from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('climbingAPI', '0005_gym_lat_gym_lng'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, default=''),
        ),
    ]
