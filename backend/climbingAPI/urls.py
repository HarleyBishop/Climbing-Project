from django.urls import path
from . import views

urlpatterns = [
    # ─── User ────────────────────────────────────────────────────────────────
    path('user/register/', views.CreateUserView.as_view(), name='register'),

    # ─── Gym ─────────────────────────────────────────────────────────────────
    path('gyms/', views.GymListCreateView.as_view(), name='gym-list'),
    path('gyms/<int:pk>/', views.GymDetailView.as_view(), name='gym-detail'),

    # ─── Wall ────────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/', views.WallListCreateView.as_view(), name='wall-list'),
    #path('gyms/<int:gym_id>/walls/<int:pk>/', views.WallDetailView.as_view(), name='wall-detail'),

    # ─── Climb ───────────────────────────────────────────────────────────────
    path('gyms/<int:gym_id>/walls/<int:wall_id>/climbs/', views.ClimbListCreateView.as_view(), name='climb-list'),
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
]