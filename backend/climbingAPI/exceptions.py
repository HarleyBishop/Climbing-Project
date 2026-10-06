from rest_framework.exceptions import APIException


class BadRequest(APIException):
    """
    400 with a plain {"detail": "..."} body, matching DRF's PermissionDenied and
    NotFound. Used for business-rule failures (e.g. "competition is closed").
    DRF's ValidationError is for field errors and wraps messages in lists,
    which the frontend doesn't expect for these.
    """
    status_code = 400
    default_detail = 'Bad request.'
    default_code = 'bad_request'


class StorageUnavailable(APIException):
    # 503 rather than 500: the request was fine, but an upstream service
    # (Supabase Storage) is missing or down.
    status_code = 503
    default_detail = 'Video storage is unavailable.'
    default_code = 'storage_unavailable'
