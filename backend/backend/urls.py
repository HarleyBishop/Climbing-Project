from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView, TokenBlacklistView)
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView)

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

    # API docs — the schema is generated on request from the live URLconf, so
    # it can't drift out of sync with the code. Registered before the
    # climbingAPI include so these paths aren't shadowed.
    # /api/schema/ → raw OpenAPI 3 YAML (importable into Postman etc.)
    # /api/docs/   → interactive Swagger UI
    # /api/redoc/  → read-only ReDoc rendering
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # All application routes are delegated to climbingAPI/urls.py under /api/.
    # Keeping the app's URLs in its own file means the app is self-contained
    # and easier to move or reuse.
    path("api/", include("climbingAPI.urls")),
]
