"""Offline Episode 7 workflow guards; stdlib only, never executes YAML.

This deliberately checks the repository's block-style trigger/permission mappings,
not general YAML syntax or GitHub expression semantics.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


def mapping_keys(text, heading, indent=0):
    lines = text.splitlines()
    anchor = " " * indent + heading + ":"
    start = lines.index(anchor) + 1
    keys = []
    for raw in lines[start:]:
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        depth = len(line) - len(line.lstrip())
        if depth <= indent:
            break
        if depth == indent + 2:
            match = re.fullmatch(r"\s*([\w-]+):(?:\s.*)?", line)
            if not match:
                raise ValueError("Unsupported mapping layout; review workflow manually")
            keys.append(match.group(1))
    return keys


class WorkflowGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = (ROOT / ".github/workflows/deploy.yml").read_text(encoding="utf-8")

    def test_automatic_release_is_main_only_with_manual_restore(self):
        self.assertEqual(mapping_keys(self.workflow, "on"), ["push", "workflow_dispatch"])
        self.assertEqual(mapping_keys(self.workflow, "push", 2), ["branches"])
        self.assertRegex(self.workflow, r"(?m)^    branches: \[main\]$")
        self.assertEqual(mapping_keys(self.workflow, "workflow_dispatch", 2), ["inputs"])
        self.assertEqual(mapping_keys(self.workflow, "inputs", 4), ["image_tag"])

    def test_custom_ci_checks_staging_and_runs_workflow_guards(self):
        ci = (ROOT / ".github/workflows/ci-docker.yml").read_text(encoding="utf-8")
        self.assertRegex(ci, r"(?m)^    branches: \[main, lab-5-staging, lab-6-staging, lab-7-staging\]$")
        self.assertIn("workflow_call", mapping_keys(ci, "on"))
        self.assertIn("unittest discover -s deploy/tests -p 'test_*.py'", ci)

    def test_releases_are_queued_and_main_only(self):
        self.assertRegex(self.workflow, r"(?m)^  cancel-in-progress: false$")
        test_job, deploy_job = self.workflow.split("\n  deploy:\n", 1)
        self.assertIn("if: github.ref == 'refs/heads/main' && !inputs.image_tag", test_job)
        self.assertIn("needs: test", deploy_job)
        self.assertIn("github.ref == 'refs/heads/main'", deploy_job)
        self.assertIn("needs.test.result == 'success'", deploy_job)
        self.assertIn("github.event_name == 'workflow_dispatch' && inputs.image_tag != '' && needs.test.result == 'skipped'", deploy_job)
        self.assertIn("if: env.ROLLBACK != 'true'", deploy_job)

    def test_oidc_permission_is_scoped_to_deploy_job(self):
        self.assertEqual(mapping_keys(self.workflow, "permissions"), ["contents"])
        jobs = self.workflow.split("\njobs:\n", 1)[1]
        test_job, deploy_job = jobs.split("\n  deploy:\n", 1)
        self.assertNotIn("id-token:", test_job)
        self.assertEqual(mapping_keys(deploy_job, "permissions", 4), ["contents", "id-token"])
        self.assertRegex(deploy_job, r"(?m)^      id-token: write(?:\s|$)")
        self.assertRegex(deploy_job, r"(?m)^    environment: demo$")


if __name__ == "__main__":
    unittest.main()
