"""
Gym, Wall, and Climb endpoint tests.

These cover the core content-management flows: who can create/archive/list
what, and that the annotated counts (wall_count, climb_count) are correct.

Run with: python manage.py test tests.test_views_gym
"""
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from climbingAPI.models import Gym, Wall, Climb, Send, Review, Video

User = get_user_model()


# ─── Helpers ───────────────────────────────────────────────────────────────────

def make_user(username, is_setter=False):
    return User.objects.create_user(username=username, password='pass', is_verified_setter=is_setter)

def make_gym(setter, name='Boulder Co'):
    return Gym.objects.create(name=name, location='Denver', added_by=setter)

def make_wall(gym, name='Main Wall'):
    return Wall.objects.create(name=name, description='', gym=gym)

def make_climb(wall, setter, name='Problem', grade=5, archived=False):
    return Climb.objects.create(
        name=name, colour='Blue', suggested_grade=grade,
        wall=wall, added_by=setter, is_archived=archived,
    )


# ─── Gym list and create ────────────────────────────────────────────────────────
# GymListCreateView uses IsSetterOrReadOnly:
#   - GET: open to everyone (even unauthenticated)
#   - POST: setter only

class GymListCreateTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.climber = make_user('climber')
        self.setter = make_user('setter', is_setter=True)

    def test_unauthenticated_can_list_gyms(self):
        # Gym browsing is public — no login required.
        res = self.client.get('/api/gyms/')
        self.assertEqual(res.status_code, 200)

    def test_setter_can_create_gym(self):
        self.client.force_authenticate(user=self.setter)
        res = self.client.post('/api/gyms/', {'name': 'New Gym', 'location': 'Test City'})
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Gym.objects.filter(name='New Gym').exists())

    def test_gym_added_by_is_set_to_request_user(self):
        # perform_create injects added_by from request.user, not from the POST body.
        self.client.force_authenticate(user=self.setter)
        self.client.post('/api/gyms/', {'name': 'My Gym', 'location': 'Testville'})
        gym = Gym.objects.get(name='My Gym')
        self.assertEqual(gym.added_by, self.setter)

    def test_climber_cannot_create_gym(self):
        self.client.force_authenticate(user=self.climber)
        res = self.client.post('/api/gyms/', {'name': 'Sneaky Gym', 'location': 'Test City'})
        self.assertEqual(res.status_code, 403)

    def test_gym_response_includes_wall_count(self):
        # GymSerializer reads wall_count from the annotated queryset (not a live query).
        gym = make_gym(self.setter)
        make_wall(gym, 'Wall A')
        make_wall(gym, 'Wall B')

        self.client.force_authenticate(user=self.climber)
        res = self.client.get('/api/gyms/')
        gym_data = next(g for g in res.data if g['id'] == gym.id)
        self.assertEqual(gym_data['wall_count'], 2)

    def test_gym_response_climb_count_excludes_archived(self):
        # Only non-archived climbs should count — archived ones dropped off the wall.
        gym = make_gym(self.setter)
        wall = make_wall(gym)
        make_climb(wall, self.setter, name='Active')
        make_climb(wall, self.setter, name='Old', archived=True)

        self.client.force_authenticate(user=self.climber)
        res = self.client.get('/api/gyms/')
        gym_data = next(g for g in res.data if g['id'] == gym.id)
        self.assertEqual(gym_data['climb_count'], 1)


# ─── Gym detail (ownership check) ─────────────────────────────────────────────
# Any authenticated user can GET a gym, but only the creator can PATCH or DELETE.
# GymDetailView filters the queryset on added_by for mutating methods.

class GymDetailPermissionsTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.other_setter = make_user('other_setter', is_setter=True)
        self.gym = make_gym(self.setter)

    def test_any_authenticated_user_can_get_gym(self):
        climber = make_user('climber')
        self.client.force_authenticate(user=climber)
        res = self.client.get(f'/api/gyms/{self.gym.pk}/')
        self.assertEqual(res.status_code, 200)

    def test_creator_can_update_gym(self):
        self.client.force_authenticate(user=self.setter)
        res = self.client.patch(f'/api/gyms/{self.gym.pk}/', {'name': 'Renamed'})
        self.assertEqual(res.status_code, 200)
        self.gym.refresh_from_db()
        self.assertEqual(self.gym.name, 'Renamed')

    def test_non_creator_cannot_update_gym(self):
        # The queryset for mutating methods filters on added_by=request.user,
        # so another setter sees a 404 (the gym is just not in their queryset).
        self.client.force_authenticate(user=self.other_setter)
        res = self.client.patch(f'/api/gyms/{self.gym.pk}/', {'name': 'Hacked'})
        self.assertEqual(res.status_code, 404)


# ─── Climb list (active vs archived) ──────────────────────────────────────────
# ClimbListCreateView filters is_archived=False so only the current set shows.
# Archived climbs live at the separate /climbs/archived/ endpoint.

class ClimbListTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.client.force_authenticate(user=self.climber)
        self.url = f'/api/gyms/{self.gym.id}/walls/{self.wall.id}/climbs/'

    def test_active_climbs_are_returned(self):
        make_climb(self.wall, self.setter, name='Active')
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Active')

    def test_archived_climbs_not_in_active_list(self):
        make_climb(self.wall, self.setter, name='Active')
        make_climb(self.wall, self.setter, name='Old Route', archived=True)
        res = self.client.get(self.url)
        names = [c['name'] for c in res.data]
        self.assertIn('Active', names)
        self.assertNotIn('Old Route', names)

    def test_archived_endpoint_returns_only_archived(self):
        make_climb(self.wall, self.setter, name='Active')
        make_climb(self.wall, self.setter, name='Old Route', archived=True)
        archived_url = f'/api/gyms/{self.gym.id}/walls/{self.wall.id}/climbs/archived/'
        res = self.client.get(archived_url)
        names = [c['name'] for c in res.data]
        self.assertNotIn('Active', names)
        self.assertIn('Old Route', names)

    def test_setter_can_create_climb(self):
        self.client.force_authenticate(user=self.setter)
        res = self.client.post(self.url, {
            'name': 'New Problem', 'colour': 'Red', 'suggested_grade': 5
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Climb.objects.filter(name='New Problem', wall=self.wall).exists())

    def test_climber_cannot_create_climb(self):
        res = self.client.post(self.url, {
            'name': 'Sneaky Problem', 'colour': 'Blue', 'suggested_grade': 3
        })
        self.assertEqual(res.status_code, 403)


# ─── Wall create ────────────────────────────────────────────────────────────────

class WallCreateTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.gym = make_gym(self.setter)
        self.client.force_authenticate(user=self.setter)
        self.url = f'/api/gyms/{self.gym.id}/walls/'

    def test_description_can_be_blank(self):
        # The create-gym form sends '' when the optional description is left empty.
        res = self.client.post(self.url, {'name': 'Cave', 'description': ''})
        self.assertEqual(res.status_code, 201)

    def test_description_can_be_omitted(self):
        res = self.client.post(self.url, {'name': 'Cave'})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Wall.objects.get(name='Cave').description, '')


# ─── Archive all wall climbs ───────────────────────────────────────────────────
# ArchiveWallClimbsView bulk-sets is_archived=True using a single .update() call.
# Only setters can do this; already-archived climbs must not be double-counted.

class ArchiveWallTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.url = f'/api/gyms/{self.gym.id}/walls/{self.wall.id}/archive-climbs/'

    def test_setter_archives_all_active_climbs(self):
        make_climb(self.wall, self.setter, name='C1')
        make_climb(self.wall, self.setter, name='C2')

        self.client.force_authenticate(user=self.setter)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 200)
        # Response tells us how many climbs were flipped.
        self.assertEqual(res.data['archived'], 2)
        # All climbs on the wall should now be archived.
        self.assertEqual(Climb.objects.filter(wall=self.wall, is_archived=False).count(), 0)

    def test_already_archived_climbs_not_counted_again(self):
        make_climb(self.wall, self.setter, name='Active')
        make_climb(self.wall, self.setter, name='Already Archived', archived=True)

        self.client.force_authenticate(user=self.setter)
        res = self.client.post(self.url)
        # Only the one active climb gets archived.
        self.assertEqual(res.data['archived'], 1)

    def test_climber_cannot_archive_wall(self):
        self.client.force_authenticate(user=self.climber)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 403)


# ─── Grade voting (update_or_create behaviour) ────────────────────────────────
# A user can vote on a climb's grade. Submitting a second vote updates rather
# than duplicating. The community_grade on the climb is recalculated after every vote.

class GradeVoteTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.user1 = make_user('voter1')
        self.user2 = make_user('voter2')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.climb = make_climb(self.wall, self.setter, grade=5)
        self.url = (
            f'/api/gyms/{self.gym.id}/walls/{self.wall.id}'
            f'/climbs/{self.climb.id}/votes/'
        )

    def test_first_vote_sets_community_grade(self):
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url, {'grade': 6})
        self.climb.refresh_from_db()
        self.assertEqual(self.climb.community_grade, 6.0)

    def test_second_vote_from_same_user_updates_not_duplicates(self):
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url, {'grade': 4})
        self.client.post(self.url, {'grade': 6})
        from climbingAPI.models import GradeVote
        self.assertEqual(GradeVote.objects.filter(climb=self.climb, user=self.user1).count(), 1)

    def test_community_grade_averages_multiple_votes(self):
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.url, {'grade': 4})
        self.client.force_authenticate(user=self.user2)
        self.client.post(self.url, {'grade': 6})
        self.climb.refresh_from_db()
        # Average of 4 and 6 = 5.0
        self.assertEqual(self.climb.community_grade, 5.0)

    def test_deleting_vote_recalculates_community_grade(self):
        self.client.force_authenticate(user=self.user1)
        vote_id = self.client.post(self.url, {'grade': 4}).data['id']
        self.client.force_authenticate(user=self.user2)
        self.client.post(self.url, {'grade': 6})

        self.client.force_authenticate(user=self.user1)
        res = self.client.delete(f'{self.url}{vote_id}/')
        self.assertEqual(res.status_code, 204)
        self.climb.refresh_from_db()
        # Only user2's vote of 6 is left.
        self.assertEqual(self.climb.community_grade, 6.0)


# ─── My Gyms (gyms where the user has sends) ──────────────────────────────────
# MyGymsView returns gyms where the logged-in user has at least one send,
# ordered by most recent send. It's used on the home page.

class MyGymsTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        self.client.force_authenticate(user=self.climber)

    def test_returns_gym_where_user_has_a_send(self):
        gym = make_gym(self.setter)
        wall = make_wall(gym)
        climb = make_climb(wall, self.setter)
        Send.objects.create(climb=climb, user=self.climber, attempts=2)

        res = self.client.get('/api/gyms/my-gyms/')
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], gym.id)

    def test_gym_without_user_sends_not_returned(self):
        # Create a gym but no send for this user.
        make_gym(self.setter)
        res = self.client.get('/api/gyms/my-gyms/')
        self.assertEqual(len(res.data), 0)

    def test_no_duplicates_when_user_has_multiple_sends(self):
        # A user can send multiple climbs at the same gym — the gym should
        # still only appear once in the list.
        gym = make_gym(self.setter)
        wall = make_wall(gym)
        c1 = make_climb(wall, self.setter, name='C1')
        c2 = make_climb(wall, self.setter, name='C2')
        Send.objects.create(climb=c1, user=self.climber, attempts=1)
        Send.objects.create(climb=c2, user=self.climber, attempts=1)

        res = self.client.get('/api/gyms/my-gyms/')
        self.assertEqual(len(res.data), 1)



# ─── Video upload URL ───────────────────────────────────────────────────────────
# Supabase is mocked out: these tests check our validation and wiring, not the
# Storage API itself.

@override_settings(SUPABASE_URL='https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY='test-key')
class VideoUploadURLTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        self.gym = make_gym(self.setter)
        self.wall = make_wall(self.gym)
        self.climb = make_climb(self.wall, self.setter)
        self.client.force_authenticate(user=self.climber)
        self.url = f'/api/gyms/{self.gym.id}/walls/{self.wall.id}/climbs/{self.climb.id}/videos/upload-url/'

    @patch('climbingAPI.storage.create_video_upload', return_value=('https://up', 'https://public/v.mp4'))
    def test_returns_signed_and_public_urls(self, mock_create):
        res = self.client.post(self.url, {'content_type': 'video/mp4', 'size': 1000})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {'upload_url': 'https://up', 'video_url': 'https://public/v.mp4'})
        mock_create.assert_called_once_with(self.climb.id, 'video/mp4')
        # Nothing is saved until the client confirms the upload finished.
        self.assertFalse(Video.objects.exists())

    @patch('climbingAPI.storage.create_video_upload')
    def test_rejects_non_video_type(self, mock_create):
        res = self.client.post(self.url, {'content_type': 'image/png', 'size': 1000})
        self.assertEqual(res.status_code, 400)
        mock_create.assert_not_called()

    @patch('climbingAPI.storage.create_video_upload')
    def test_rejects_oversized_file(self, mock_create):
        res = self.client.post(self.url, {'content_type': 'video/mp4', 'size': 51 * 1024 * 1024})
        self.assertEqual(res.status_code, 400)
        mock_create.assert_not_called()

    def test_unauthenticated_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url, {'content_type': 'video/mp4', 'size': 1000})
        self.assertEqual(res.status_code, 401)

    @override_settings(SUPABASE_URL='', SUPABASE_SERVICE_ROLE_KEY='')
    def test_503_when_storage_not_configured(self):
        res = self.client.post(self.url, {'content_type': 'video/mp4', 'size': 1000})
        self.assertEqual(res.status_code, 503)


@override_settings(SUPABASE_URL='https://example.supabase.co', SUPABASE_VIDEO_BUCKET='climb-videos')
class VideoCreateTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        gym = make_gym(setter)
        wall = make_wall(gym)
        self.climb = make_climb(wall, setter)
        self.client.force_authenticate(user=self.climber)
        self.url = f'/api/gyms/{gym.id}/walls/{wall.id}/climbs/{self.climb.id}/videos/'

    def test_climber_can_save_uploaded_video(self):
        url = 'https://example.supabase.co/storage/v1/object/public/climb-videos/climbs/1/abc.mp4'
        res = self.client.post(self.url, {'video_url': url})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Video.objects.get().user, self.climber)

    def test_external_url_rejected(self):
        res = self.client.post(self.url, {'video_url': 'https://youtube.com/watch?v=abc'})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(Video.objects.exists())

    def test_title_and_uploader_returned(self):
        url = 'https://example.supabase.co/storage/v1/object/public/climb-videos/climbs/1/abc.mp4'
        self.client.post(self.url, {'video_url': url, 'title': 'Crux heel hook'})
        res = self.client.get(self.url)
        self.assertEqual(res.data[0]['title'], 'Crux heel hook')
        self.assertEqual(res.data[0]['username'], 'climber')


# ─── Reviews ────────────────────────────────────────────────────────────────────

class ReviewCreateTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        setter = make_user('setter', is_setter=True)
        self.climber = make_user('climber')
        gym = make_gym(setter)
        wall = make_wall(gym)
        climb = make_climb(wall, setter)
        self.client.force_authenticate(user=self.climber)
        self.url = f'/api/gyms/{gym.id}/walls/{wall.id}/climbs/{climb.id}/reviews/'

    def test_rating_without_comment_allowed(self):
        # The log-climb sheet lets climbers leave just a star rating.
        res = self.client.post(self.url, {'stars': 4})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Review.objects.get().comment, '')

    def test_stars_out_of_range_rejected(self):
        for stars in (0, 6):
            res = self.client.post(self.url, {'stars': stars, 'comment': 'x'})
            self.assertEqual(res.status_code, 400)
        self.assertFalse(Review.objects.exists())
