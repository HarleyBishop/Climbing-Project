"""
OAuth sign-in helpers. Kept out of the views so the view only orchestrates
(validate → fetch profile → find/create user → issue tokens) and each step
can be read and tested on its own.
"""
import re
import requests
from django.contrib.auth import get_user_model

from .serializers.users import CustomTokenObtainPairSerializer

User = get_user_model()

GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'


class OAuthError(Exception):
    pass


def fetch_google_profile(access_token):
    """
    Exchanges a Google access token for the user's profile info. We use the
    userinfo endpoint rather than verifying an ID token locally because it
    avoids needing the Google public keys.
    """
    try:
        resp = requests.get(
            GOOGLE_USERINFO_URL,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10,
        )
        resp.raise_for_status()
        info = resp.json()
    except (requests.RequestException, ValueError) as exc:
        raise OAuthError(f'Failed to verify Google token: {exc}')

    # 'sub' is Google's stable unique user identifier.
    if not info.get('sub'):
        raise OAuthError('Invalid Google token.')
    return info


def get_or_create_oauth_user(sub_field, sub_value, email):
    """
    Three-step lookup for OAuth sign-in:
    1. Find existing account by OAuth sub ID (fast path for returning users).
    2. If not found, try email — links the OAuth sub to an existing account
       created with username/password. Setters are blocked at this step.
    3. If still not found, create a new climber-role account with a derived
       username. set_unusable_password() means the account can't be used with
       the regular login form, only via OAuth.
    Raises PermissionError if the matching account isn't allowed to use OAuth.
    """
    user = User.objects.filter(**{sub_field: sub_value}).first()
    if user:
        return user

    if email:
        user = User.objects.filter(email=email).first()
        if user:
            if user.is_verified_setter:
                raise PermissionError('Setter accounts must log in with username and password.')
            setattr(user, sub_field, sub_value)
            user.save(update_fields=[sub_field])
            return user

    user = User(username=_unique_username_from_email(email), email=email or '')
    setattr(user, sub_field, sub_value)
    user.set_unusable_password()
    user.save()
    return user


def _unique_username_from_email(email):
    # Strip non-alphanumeric chars from the email local part, then increment a
    # counter suffix until it's unique.
    base = re.sub(r'[^a-zA-Z0-9]', '', (email or '').split('@')[0]) or 'climber'
    username, counter = base, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{counter}'
        counter += 1
    return username


def issue_tokens(user):
    """
    Issues a JWT pair using our custom serializer (which embeds username and
    is_setter in the payload) so OAuth logins get the same token structure as
    the normal login endpoint.
    """
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}
