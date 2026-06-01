from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import os
import dj_database_url

# load_dotenv reads a .env file from the project root into os.environ.
# In production the host (e.g. Render) injects env vars directly, so there's
# no .env file — load_dotenv simply does nothing in that case.
load_dotenv()

# Tells Django to use our custom User model instead of the built-in one.
# This must be set before any migration that touches auth, which is why it's
# near the top of settings — changing it after the first migration is painful.
AUTH_USER_MODEL = 'climbingAPI.User'

BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY should always come from the environment — never hardcode it.
# The .env file holds it locally; the hosting platform injects it in production.
SECRET_KEY = os.environ.get("SECRET_KEY")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

# DEBUG defaults True locally (no env var set), False in production where the
# host sets DEBUG=False. Running DEBUG=True in production leaks stack traces.
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# Comma-separated string in the env var, split into a list here.
# Locally defaults to localhost; in production set to your deployed domain.
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# DRF global config — all endpoints require JWT authentication by default.
# Individual views can override this with their own permission_classes.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# Access tokens expire in 60 minutes; refresh tokens in 1 day.
# The custom serializer class embeds username and is_setter into the token
# payload so the frontend can read role info without a separate /me call.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'TOKEN_OBTAIN_SERIALIZER': 'climbingAPI.serializers.CustomTokenObtainPairSerializer',
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    "corsheaders",
    "climbingAPI",
    # token_blacklist enables the /api/token/blacklist/ endpoint so logout
    # can invalidate refresh tokens server-side rather than just clearing
    # them from localStorage.
    'rest_framework_simplejwt.token_blacklist',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise serves static files directly from Django in production,
    # eliminating the need for a separate static file server (e.g. Nginx).
    # Must come directly after SecurityMiddleware.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # CorsMiddleware must come before any middleware that generates responses
    # so CORS headers are added to all responses including early rejections.
    "corsheaders.middleware.CorsMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# ─── Database ────────────────────────────────────────────────────────────────
# Environment-driven database config: if DATABASE_URL is set (production on
# Render/Railway/Heroku), use Postgres via dj_database_url. Otherwise fall
# back to SQLite for local development — no extra setup needed.
# conn_max_age=600 enables persistent connections on the Postgres path so
# Django doesn't open a new DB connection on every request.

if os.getenv('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(default=os.getenv('DATABASE_URL'), conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─── Static files ─────────────────────────────────────────────────────────────
# collectstatic copies all static files into STATIC_ROOT.
# CompressedManifestStaticFilesStorage adds a content hash to filenames so
# browsers can cache files indefinitely without stale-cache issues.
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ─── CORS ────────────────────────────────────────────────────────────────────
# CORS_ALLOW_ALL_ORIGINS=False means only origins in CORS_ALLOWED_ORIGINS can
# make cross-origin requests. Locally that's the Vite dev server; in production
# set the env var to your deployed frontend URL.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://localhost:8000').split(',')]
# Credentials (cookies, auth headers) are forwarded in cross-origin requests.
# Required so the Authorization header is sent with Axios requests from React.
CORS_ALLOW_CREDENTIALS = True
