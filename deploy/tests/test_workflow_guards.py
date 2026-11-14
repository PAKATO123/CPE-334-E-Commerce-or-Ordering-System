"""Offline Episode 7 preparation guards; stdlib only, never executes YAML.

This deliberately checks the repository's block-style trigger/permission mappings,
not general YAML syntax or GitHub expression semantics. Update the manual-only
expectation deliberately when Episode 7 activation is approved.
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


class WorkflowPreparationGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = (ROOT / ".github/workflows/deploy.yml").read_text(encoding="utf-8")

    def test_automatic_triggers_remain_disabled_until_activation(self):
        self.assertEqual(mapping_keys(self.workflow, "on"), ["workflow_dispatch"])

    def test_trigger_guard_detects_accidental_push_enablement(self):
        candidate = self.workflow.replace("on:\n", "on:\n  push:\n    branches: [main]\n", 1)
        self.assertIn("push", mapping_keys(candidate, "on"))
        self.assertNotEqual(mapping_keys(candidate, "on"), ["workflow_dispatch"])

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
