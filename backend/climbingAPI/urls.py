from django.urls import path
from . import views

urlpatterns = [
    # ─── User ────────────────────────────────────────────────────────────────
    path('user/register/', views.CreateUserView.as_view(), name='register'),
    path('auth/google/', views.GoogleLoginView.as_view(), name='google-login'),

    # ─── Gym ─────────────────────────────────────────────────────────────────
    path('gyms/', views.GymListCreateView.as_view(), name='gym-list'),
    # my-gyms MUST come before gyms/<int:pk>/ — Django's URL resolver matches
    # patterns in order, so if the pk pattern came first it would try to cast
    # "my-gyms" as an integer and raise a 404 before reaching this view.
    path('gyms/my-gyms/', views.MyGymsView.as_view(), name='my-gyms'),
    path('gyms/<int:pk>/', views.GymDetailView.as_view(), name='gym-detail'),

    # ─── Wall ────────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/', views.WallListCreateView.as_view(), name='wall-list'),
    # Bulk archive action — POST to this to flip is_archived=True on all active
    # climbs of a wall at once, rather than patching each climb individually.
    path('gyms/<int:gym_id>/walls/<int:wall_id>/archive-climbs/', views.ArchiveWallClimbsView.as_view(), name='archive-wall-climbs'),

    # ─── Climb ───────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/', views.ClimbListCreateView.as_view(), name='climb-list'),
    # archived/ is a sub-path of climbs/ to make the intent clear at the URL
    # level — you're asking for the archived subset of this wall's climbs.
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/archived/', views.ClimbArchivedListView.as_view(), name='climb-archived'),
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:pk>/', views.ClimbDetailView.as_view(), name='climb-detail'),

    # ─── Grade Vote ──────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/votes/', views.GradeVoteListCreateView.as_view(), name='grade-vote-list'),
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/votes/<int:pk>/', views.GradeVoteDetailView.as_view(), name='grade-vote-detail'),

    # ─── Send ─────────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/sends/', views.SendListCreateView.as_view(), name='send-list'),
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/sends/<int:pk>/', views.SendDetailView.as_view(), name='send-detail'),

    # ─── Review ───────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/reviews/', views.ReviewListCreateView.as_view(), name='review-list'),
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/reviews/<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),

    # ─── Video ────────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/videos/', views.VideoListCreateView.as_view(), name='video-list'),
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>/videos/<int:pk>/', views.VideoDetailView.as_view(), name='video-detail'),

    # ─── Profile page endpoints ────────────────────────────────────────────────
    # Separate endpoints per data type so the profile page can load them in
    # parallel (Promise.all) rather than waiting for one big response.
    path('users/<int:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/sends/', views.UserSendsView.as_view(), name='user-sends'),
    path('users/<int:user_id>/reviews/', views.UserReviewsView.as_view(), name='user-reviews'),
    path('users/<int:user_id>/videos/', views.UserVideosView.as_view(), name='user-videos'),
    path('users/<int:user_id>/follow/', views.FollowView.as_view(), name='user-follow'),
    path('users/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('feed/', views.ActivityFeedView.as_view(), name='activity-feed'),

    # ─── Leaderboard ──────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/leaderboard/', views.GymLeaderboardView.as_view(), name='leaderboard'),

    # ─── All active gym climbs (for comp building) ─────────────────────────────
    # Used when a setter is adding climbs to a competition — returns every
    # active climb in the gym across all walls so they can search and pick.
    path('gyms/<int:gym_id>/all-climbs/', views.GymClimbsView.as_view(), name='gym-all-climbs'),

    # ─── Competition ──────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/competitions/', views.CompetitionListCreateView.as_view(), name='competition-list'),
    path('competitions/<int:comp_id>/', views.CompetitionDetailView.as_view(), name='competition-detail'),
    path('competitions/<int:comp_id>/divisions/', views.DivisionListCreateView.as_view(), name='division-list'),
    path('competitions/<int:comp_id>/rounds/', views.CompRoundListCreateView.as_view(), name='round-list'),
    path('competitions/<int:comp_id>/climbs/', views.CompClimbListCreateView.as_view(), name='comp-climb-list'),
    path('competitions/<int:comp_id>/climbs/<int:pk>/', views.CompClimbDetailView.as_view(), name='comp-climb-detail'),
    path('competitions/<int:comp_id>/registrations/', views.CompRegistrationListView.as_view(), name='comp-registrations'),
    path('competitions/<int:comp_id>/register/', views.CompRegisterView.as_view(), name='comp-register'),
    path('competitions/<int:comp_id>/sends/', views.CompSendListView.as_view(), name='comp-sends'),
    path('competitions/<int:comp_id>/log-send/', views.CompSendCreateView.as_view(), name='comp-log-send'),
    path('competitions/<int:comp_id>/leaderboard/', views.QualifierLeaderboardView.as_view(), name='qualifier-leaderboard'),
    path('competitions/<int:comp_id>/finals-results/', views.FinalsResultListCreateView.as_view(), name='finals-results'),
    path('competitions/<int:comp_id>/finals-leaderboard/', views.FinalsLeaderboardView.as_view(), name='finals-leaderboard'),
]
