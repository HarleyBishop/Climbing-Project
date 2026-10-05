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
