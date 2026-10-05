"""
API views, split by domain (mirrors the serializers package):

  users           auth, registration, profiles, follows, activity feed
  gyms            gyms, walls, climbs
  climb_activity  grade votes, sends, reviews, videos
  competitions    comps, divisions, rounds, registrations, comp sends, finals
  leaderboards    gym, qualifier and finals rankings

Conventions used throughout:
  - Generic DRF views + serializers for every endpoint, so request/response
    shapes are declared in one place and show up in the API docs.
  - Setter-only writes use the IsSetterOrReadOnly permission class.
  - "Only the owner can edit" is enforced by filtering the queryset on write
    methods, so other users get a 404 rather than learning the object exists.
    Profiles are the exception (IsSelfOrReadOnly → 403) since every profile
    is public anyway.
  - Business-rule failures raise BadRequest / PermissionDenied rather than
    returning early Responses.
"""
