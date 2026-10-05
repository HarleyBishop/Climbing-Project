from itertools import chain
from operator import attrgetter

from django.contrib.auth import get_user_model
from django.db.models import F, Value
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..exceptions import BadRequest
from ..models import Follow, Send, Review
from ..oauth import OAuthError, fetch_google_profile, get_or_create_oauth_user, issue_tokens
from ..permissions import IsSelfOrReadOnly
from ..serializers.common import DetailSerializer
from ..serializers.users import (
    TokenPairSerializer, GoogleLoginSerializer,
    UserRegistrationSerializer, UserProfileSerializer, ChangePasswordSerializer,
    ActivityFeedItemSerializer,
)

User = get_user_model()

FEED_SIZE = 50


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    # AllowAny — registration must work before a token exists.
    permission_classes = [AllowAny]


class GoogleLoginView(generics.GenericAPIView):
    serializer_class = GoogleLoginSerializer
    # AllowAny because this IS the authentication step — no token yet.
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: TokenPairSerializer, 400: DetailSerializer, 403: DetailSerializer},
        auth=[],
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            profile = fetch_google_profile(serializer.validated_data['access_token'])
            user = get_or_create_oauth_user(
                sub_field='google_id',
                sub_value=profile['sub'],
                email=profile.get('email', ''),
            )
        except OAuthError as exc:
            raise BadRequest(str(exc))
        except PermissionError as exc:
            raise PermissionDenied(str(exc))

        return Response(TokenPairSerializer(issue_tokens(user)).data)


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DetailSerializer})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'})


# ─── Profiles & follows ──────────────────────────────────────────────────────

class UserDetailView(generics.RetrieveUpdateAPIView):
    # GET: profile info for any authenticated user.
    # PATCH: a user can update their own bio (IsSelfOrReadOnly).
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsSelfOrReadOnly]
    # The URL uses user_id but the default lookup kwarg is 'pk'.
    lookup_url_kwarg = 'user_id'
    http_method_names = ['get', 'patch', 'head', 'options']


class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: DetailSerializer, 400: DetailSerializer})
    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        if target == request.user:
            raise BadRequest('You cannot follow yourself.')
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response({'detail': 'Followed.'})

    @extend_schema(responses={204: None})
    def delete(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityFeedView(generics.ListAPIView):
    """
    Recent sends and reviews from users you follow, newest first.

    Sends and reviews are different models, so each queryset is annotated with
    the same `feed_type` and `timestamp` attributes; that lets them be merged,
    sorted and serialized as one list. Taking the newest FEED_SIZE of each is
    enough to guarantee the newest FEED_SIZE overall.
    """
    serializer_class = ActivityFeedItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        following = Follow.objects.filter(follower=self.request.user).values('following')
        related = ('user', 'climb__wall__gym')

        sends = (
            Send.objects.filter(user__in=following)
            .select_related(*related)
            .annotate(feed_type=Value('send'), timestamp=F('sent_at'))
            .order_by('-sent_at')[:FEED_SIZE]
        )
        reviews = (
            Review.objects.filter(user__in=following)
            .select_related(*related)
            .annotate(feed_type=Value('review'), timestamp=F('created_at'))
            .order_by('-created_at')[:FEED_SIZE]
        )
        return sorted(chain(sends, reviews), key=attrgetter('timestamp'), reverse=True)[:FEED_SIZE]
