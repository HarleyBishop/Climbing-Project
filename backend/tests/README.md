# Backend Tests

Run all tests:

```
# From the backend/ directory, with the venv activated:
python manage.py test tests.test_models tests.test_permissions tests.test_views_auth tests.test_views_gym tests.test_views_leaderboard
```

Run a single file:

```
python manage.py test tests.test_models
```

Django creates a temporary SQLite test database automatically, runs all tests,
then destroys it. No extra setup needed.
