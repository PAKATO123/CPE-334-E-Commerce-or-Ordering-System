"""Public deployment checks. Credentials/tokens are never printed.

WHAT THIS SCRIPT DOES
    Called by .github/workflows/deploy.yml after a deployment:
        python3 deploy/smoke_test.py SERVICE_URL
    It checks the live service and exits non-zero (failing the workflow) if any
    check fails. Each public check is retried up to 5 times, 3 seconds apart, to
    tolerate Cloud Run cold starts.

    Checks (in order)
      1. GET /api/health      -> {"status": "ok"}
      2. GET /api/ready       -> {"db": "connected"}   (proves the DB works)
      3. GET /                -> HTML page (the built React app is served)
      4. GET /api/categories  -> {"data": [...]} with categories (migration + seed worked)
      5. OPTIONAL login test  -> login, /api/auth/me, logout. Runs only if BOTH
         env vars SMOKE_EMAIL and SMOKE_PASSWORD are set (set both or neither).
         The session is always logged out, even if a check fails.

IMPORTANT
    Uses only the Python standard library (no pip install needed).
    Offline unit tests: deploy/tests/test_smoke.py

REFERENCES
    - urllib.request : https://docs.python.org/3/library/urllib.request.html
    - unittest.mock  : https://docs.python.org/3/library/unittest.mock.html

CHANGE ME (groups using another tech stack):
    - the endpoint paths and expected responses in check() below
      (/api/health, /api/ready, /, /api/categories, /api/auth/*)
    - TechTent uses cookie sessions, not bearer tokens.
"""
import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.request


# --- HTTP helper --------------------------------------------------------------
# Returns the response body (bytes). Raises on HTTP errors / timeouts.
def request(base, path, data=None, opener=None):
    headers = {}
    if data is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, headers=headers,
        data=json.dumps(data).encode() if data is not None else None)
    with (opener.open(req, timeout=30) if opener else urllib.request.urlopen(req, timeout=30)) as response:
        return response.read()


def categories_ready(body):
    payload = json.loads(body)
    data = payload.get('data') if isinstance(payload, dict) else None
    return isinstance(data, list) and bool(data) and all(isinstance(c, str) and bool(c) for c in data)


def check(base):
    # --- Public checks (CHANGE ME: paths + predicates for your own API) -------
    for path, predicate in (
        ('/api/health', lambda b: json.loads(b).get('status') == 'ok'),
        ('/api/ready', lambda b: json.loads(b).get('db') == 'connected'),
        ('/', lambda b: b'<html' in b.lower()),
        ('/api/categories', categories_ready),
    ):
        # Retry: a cold Cloud Run instance may need a few seconds to start.
        for attempt in range(5):
            try:
                if not predicate(request(base, path)):
                    raise ValueError('Unexpected response')
                break
            except (urllib.error.URLError, TimeoutError, ValueError):
                if attempt == 4:
                    raise RuntimeError('Smoke check failed: ' + path) from None
                time.sleep(3)
        print('PASS ' + path)

    # --- Optional login check (only when both credentials are provided) -------
    email, password = os.getenv('SMOKE_EMAIL'), os.getenv('SMOKE_PASSWORD')
    if bool(email) != bool(password):
        raise RuntimeError('Set both SMOKE_EMAIL and SMOKE_PASSWORD, or neither.')
    if not email:
        print('SKIP login: optional smoke credentials not configured')
        return
    # Only explicitly configured dedicated CUSTOMER accounts may be used.
    if email.lower() == 'admin@example.com' or email.lower() in {
        'customer1@example.com', 'customer2@example.com', 'customer3@example.com',
        'operator1@example.com', 'deactivated@example.com',
    }:
        raise RuntimeError('Use a dedicated low-privilege smoke account, not a seed account.')
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    logged_in = False
    try:
        login = json.loads(request(base, '/api/auth/login', {'email': email, 'password': password}, opener=opener))
        logged_in = True
        user = login['user']
        if user.get('role') != 'CUSTOMER' or user.get('mustChangePassword'):
            raise ValueError('Smoke account must be a CUSTOMER with its password already changed')
        me = json.loads(request(base, '/api/auth/me', opener=opener))['user']
        if me.get('id') != user.get('id') or me.get('role') != 'CUSTOMER':
            raise ValueError('Unexpected session identity')
        print('PASS login and authenticated /api/auth/me')
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError, TypeError, AttributeError):
        raise RuntimeError('Login smoke check failed') from None
    finally:
        if logged_in:
            try:
                request(base, '/api/auth/logout', data={}, opener=opener)
            except (urllib.error.URLError, TimeoutError, ValueError):
                raise RuntimeError('Logout smoke check failed') from None
            print('PASS logout')


# --- Entry point ----------------------------------------------------------------
if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL')
    check(sys.argv[1].rstrip('/'))
