from django.contrib import admin
from django.urls import path, include
from climbingAPI.views import CreateUserView
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView, TokenBlacklistView)

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT endpoints — provided by simplejwt, not written by hand.
    # /api/token/        → POST username+password, returns access+refresh tokens.
    # /api/token/refresh/ → POST refresh token, returns a new access token.
    # /api/token/blacklist/ → POST refresh token to invalidate it on logout.
    # TokenObtainPairView is the default; our custom serializer (configured in
    # SIMPLE_JWT settings) wraps it to embed username and is_setter in the payload.
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("api/token/refresh/", TokenRefreshView.as_view(), name='refresh'),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name='token_blacklist'),

    # All application routes are delegated to climbingAPI/urls.py under /api/.
    # Keeping the app's URLs in its own file means the app is self-contained
    # and easier to move or reuse.
    path("api/", include("climbingAPI.urls")),
]
