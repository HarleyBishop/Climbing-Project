from django.urls import path
from .views import users, gyms, climb_activity, competitions, leaderboards

# Climb sub-resources all hang off the same nested prefix.
CLIMB = 'gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>'

urlpatterns = [
    # ─── Auth ────────────────────────────────────────────────────────────────
    path('user/register/', users.RegisterView.as_view(), name='register'),
    path('auth/google/', users.GoogleLoginView.as_view(), name='google-login'),

    # ─── Users ───────────────────────────────────────────────────────────────
    # Separate endpoints per data type so the profile page can load them in
    # parallel (Promise.all) rather than waiting for one big response.
    path('users/<int:user_id>/', users.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/sends/', climb_activity.UserSendsView.as_view(), name='user-sends'),
    path('users/<int:user_id>/reviews/', climb_activity.UserReviewsView.as_view(), name='user-reviews'),
    path('users/<int:user_id>/videos/', climb_activity.UserVideosView.as_view(), name='user-videos'),
    path('users/<int:user_id>/follow/', users.FollowView.as_view(), name='user-follow'),
    path('users/change-password/', users.ChangePasswordView.as_view(), name='change-password'),
    path('feed/', users.ActivityFeedView.as_view(), name='activity-feed'),

    # ─── Gyms ────────────────────────────────────────────────────────────────
    path('gyms/', gyms.GymListCreateView.as_view(), name='gym-list'),
    # my-gyms MUST come before gyms/<int:pk>/ — Django's URL resolver matches
    # patterns in order, so if the pk pattern came first it would try to cast
    # "my-gyms" as an integer and raise a 404 before reaching this view.
    path('gyms/my-gyms/', gyms.MyGymsView.as_view(), name='my-gyms'),
    path('gyms/<int:pk>/', gyms.GymDetailView.as_view(), name='gym-detail'),
    path('gyms/<int:gym_id>/leaderboard/', leaderboards.GymLeaderboardView.as_view(), name='leaderboard'),
    # Every active climb in the gym across all walls — used when a setter is
    # picking climbs to add to a competition.
    path('gyms/<int:gym_id>/all-climbs/', gyms.GymClimbsView.as_view(), name='gym-all-climbs'),

    # ─── Walls ───────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/', gyms.WallListCreateView.as_view(), name='wall-list'),
    # Bulk archive action — flips is_archived=True on all active climbs of a
    # wall at once, rather than patching each climb individually.
    path('gyms/<int:gym_id>/walls/<int:wall_id>/archive-climbs/', gyms.ArchiveWallClimbsView.as_view(), name='archive-wall-climbs'),

    # ─── Climbs ──────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/', gyms.ClimbListCreateView.as_view(), name='climb-list'),
    # archived/ is a sub-path of climbs/ to make the intent clear at the URL
    # level — you're asking for the archived subset of this wall's climbs.
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/archived/', gyms.ClimbArchivedListView.as_view(), name='climb-archived'),
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:pk>/', gyms.ClimbDetailView.as_view(), name='climb-detail'),

    # ─── Climb activity ──────────────────────────────────────────────────────
    path(f'{CLIMB}/votes/', climb_activity.GradeVoteListCreateView.as_view(), name='grade-vote-list'),
    path(f'{CLIMB}/votes/<int:pk>/', climb_activity.GradeVoteDetailView.as_view(), name='grade-vote-detail'),
    path(f'{CLIMB}/sends/', climb_activity.SendListCreateView.as_view(), name='send-list'),
    path(f'{CLIMB}/sends/<int:pk>/', climb_activity.SendDetailView.as_view(), name='send-detail'),
    path(f'{CLIMB}/reviews/', climb_activity.ReviewListCreateView.as_view(), name='review-list'),
    path(f'{CLIMB}/reviews/<int:pk>/', climb_activity.ReviewDetailView.as_view(), name='review-detail'),
    path(f'{CLIMB}/videos/', climb_activity.VideoListCreateView.as_view(), name='video-list'),
    path(f'{CLIMB}/videos/<int:pk>/', climb_activity.VideoDetailView.as_view(), name='video-detail'),

    # ─── Competitions ────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/competitions/', competitions.CompetitionListCreateView.as_view(), name='competition-list'),
    path('competitions/<int:comp_id>/', competitions.CompetitionDetailView.as_view(), name='competition-detail'),
    path('competitions/<int:comp_id>/divisions/', competitions.DivisionListCreateView.as_view(), name='division-list'),
    path('competitions/<int:comp_id>/rounds/', competitions.CompRoundListCreateView.as_view(), name='round-list'),
    path('competitions/<int:comp_id>/climbs/', competitions.CompClimbListCreateView.as_view(), name='comp-climb-list'),
    path('competitions/<int:comp_id>/climbs/<int:pk>/', competitions.CompClimbDetailView.as_view(), name='comp-climb-detail'),
    path('competitions/<int:comp_id>/registrations/', competitions.CompRegistrationListView.as_view(), name='comp-registrations'),
    path('competitions/<int:comp_id>/register/', competitions.CompRegisterView.as_view(), name='comp-register'),
    path('competitions/<int:comp_id>/sends/', competitions.CompSendListView.as_view(), name='comp-sends'),
    path('competitions/<int:comp_id>/log-send/', competitions.CompSendCreateView.as_view(), name='comp-log-send'),
    path('competitions/<int:comp_id>/finals-results/', competitions.FinalsResultListCreateView.as_view(), name='finals-results'),
    path('competitions/<int:comp_id>/leaderboard/', leaderboards.QualifierLeaderboardView.as_view(), name='qualifier-leaderboard'),
    path('competitions/<int:comp_id>/finals-leaderboard/', leaderboards.FinalsLeaderboardView.as_view(), name='finals-leaderboard'),
]
