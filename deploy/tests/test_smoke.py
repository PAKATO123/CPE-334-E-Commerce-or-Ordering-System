"""Offline unit tests for deploy/smoke_test.py (the network is mocked).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers: public checks pass + login skipped without credentials; a DB that is not
ready fails even if HTTP answers; the session is logged out even if a check fails.
CHANGE ME: if you change the endpoints in smoke_test.py, update `response()` below.
"""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def response(self, base, path, data=None, opener=None):
        return {
            '/api/health': b'{"status":"ok"}',
            '/api/ready': b'{"db":"connected"}',
            '/': b'<html></html>',
            '/api/categories': b'{"data":["Smartphones","Tablets"]}',
            '/api/auth/login': b'{"user":{"id":1,"role":"CUSTOMER","mustChangePassword":false}}',
            '/api/auth/me': b'{"user":{"id":1,"role":"CUSTOMER"}}',
            '/api/auth/logout': b'{}',
        }[path]

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            self.assertEqual(req.call_count, 4)

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def disconnected(base, path, **kwargs):
            return b'{"db":"disconnected"}' if path == '/api/ready' else self.response(base, path)
        with patch.object(smoke, 'request', side_effect=disconnected), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_session_is_logged_out_even_if_me_fails(self):
        def broken_me(base, path, data=None, opener=None):
            if path == '/api/auth/me':
                raise ValueError('Broken response')
            return self.response(base, path, data, opener)
        with patch.object(smoke, 'request', side_effect=broken_me) as req:
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://demo.test')
            self.assertEqual(req.call_args.args[1], '/api/auth/logout')


    @patch.dict('os.environ', {}, clear=True)
    def test_rejects_legacy_or_empty_categories(self):
        for payload in (b'[]', b'{"data":[]}', b'{"data":[1]}', b'{}'):
            self.assertFalse(smoke.categories_ready(payload))

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test'}, clear=True)
    def test_requires_both_optional_credentials(self):
        with patch.object(smoke, 'request', side_effect=self.response):
            with self.assertRaisesRegex(RuntimeError, 'Set both'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'admin@example.com', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_rejects_administrator_before_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            with self.assertRaisesRegex(RuntimeError, 'dedicated'):
                smoke.check('https://demo.test')
            self.assertEqual(req.call_count, 4)

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_cookie_session_opener_is_shared(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            login, me, logout = req.call_args_list[-3:]
            self.assertIs(login.kwargs['opener'], me.kwargs['opener'])
            self.assertIs(me.kwargs['opener'], logout.kwargs['opener'])
            self.assertIsNotNone(login.kwargs['opener'])


if __name__ == '__main__':
    unittest.main()
