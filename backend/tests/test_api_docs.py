"""
API documentation tests — guards the OpenAPI schema against silent rot.

drf-spectacular skips views it can't introspect rather than failing, so a new
APIView without @extend_schema would quietly vanish from the docs. Running the
`spectacular` command with --fail-on-warn turns those skips into test failures.

Run with: python manage.py test tests.test_api_docs
"""
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient


class SchemaGenerationTest(TestCase):

    def test_schema_generates_without_warnings(self):
        # --validate also checks the output against the OpenAPI 3 spec.
        call_command('spectacular', '--fail-on-warn', '--validate', stdout=StringIO(), stderr=StringIO())


class DocsEndpointsTest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_docs_are_public(self):
        # Docs must be reachable without a token so they can be shared/linked.
        for url in ['/api/schema/', '/api/docs/', '/api/redoc/']:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)
