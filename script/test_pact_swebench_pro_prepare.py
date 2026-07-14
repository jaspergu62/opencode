import unittest

from script.pact_swebench_pro_prepare import configure_task, inject_pact_runtime, official_base_image


class PrepareSWEbenchProTest(unittest.TestCase):
    def test_extracts_real_official_image_and_injects_amd64_runtime_once(self):
        original = """FROM jefzda/sweap-images:owner.repo-case\nENTRYPOINT []\nWORKDIR /app\n"""
        runtime = "pact/harbor-runtime:test-amd64"
        prepared = inject_pact_runtime(original, runtime)
        self.assertEqual(official_base_image(prepared), "jefzda/sweap-images:owner.repo-case")
        self.assertEqual(prepared.count("AS pact-runtime"), 1)
        self.assertIn("FROM --platform=linux/amd64 jefzda/sweap-images:owner.repo-case", prepared)
        self.assertIn("/opt/pact-runtime/bin:${PATH}", prepared)
        self.assertIn("/usr/local/bin/opencode", prepared)
        self.assertEqual(inject_pact_runtime(prepared, runtime).count("AS pact-runtime"), 1)

    def test_configures_phase_network_boundaries_without_agent_timeout(self):
        source = """schema_version = \"1.0\"\n
[task]
name = \"scaleai/example\"
authors = []
keywords = []

[metadata]
difficulty = \"medium\"
category = \"debugging\"

[verifier]
network_mode = \"public\"
timeout_sec = 3000

[agent]
network_mode = \"public\"
timeout_sec = 3000

[environment]
build_timeout_sec = 1800
cpus = 1
memory_mb = 4096
storage_mb = 10240
gpus = 0
"""
        prepared = configure_task(source)
        self.assertIn('schema_version = "1.3"', prepared)
        self.assertIn('[agent]\nnetwork_mode = "allowlist"', prepared)
        self.assertIn('allowed_hosts = [ "openrouter.ai", "*.openrouter.ai",]', prepared)
        agent_section = prepared.split("[agent]", 1)[1].split("[environment]", 1)[0]
        self.assertNotIn("timeout_sec", agent_section)
        self.assertIn('[verifier]\nnetwork_mode = "no-network"', prepared)
        self.assertIn('[environment]\nnetwork_mode = "no-network"', prepared)

    def test_docker_desktop_fallback_uses_public_harbor_policy_for_agent_host_blocking(self):
        source = """schema_version = \"1.0\"\n
[task]
name = \"scaleai/example\"
authors = []
keywords = []
[verifier]
network_mode = \"public\"
[agent]
network_mode = \"public\"
[environment]
network_mode = \"public\"
"""
        prepared = configure_task(
            source,
            network_mode="docker-desktop-host-block",
            docker_image="pact/swebench-pro:case-runtimehash",
        )
        self.assertEqual(prepared.count('network_mode = "public"'), 3)
        self.assertNotIn("allowed_hosts", prepared)
        self.assertIn('docker_image = "pact/swebench-pro:case-runtimehash"', prepared)


if __name__ == "__main__":
    unittest.main()
