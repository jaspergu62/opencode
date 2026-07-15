import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

from harbor.models.agent.context import AgentContext

from script.pact_harbor_agent import PactOpenCodeAgent


class PactOpenCodeAgentTest(unittest.IsolatedAsyncioTestCase):
    async def test_uploads_only_runtime_harness_and_instruction_then_runs_glm_roles(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            runtime = root / "runtime"
            harness = root / "harness"
            logs = root / "logs"
            runtime.mkdir()
            harness.mkdir()
            environment = SimpleNamespace(
                exec=AsyncMock(
                    side_effect=[
                        SimpleNamespace(return_code=0, stdout="", stderr=""),
                        SimpleNamespace(return_code=0, stdout="", stderr=""),
                        SimpleNamespace(return_code=0, stdout="/app\n", stderr=""),
                        SimpleNamespace(return_code=0, stdout="", stderr=""),
                        SimpleNamespace(return_code=0, stdout="ok", stderr=""),
                        SimpleNamespace(return_code=0, stdout="", stderr=""),
                    ]
                ),
                upload_dir=AsyncMock(),
                upload_file=AsyncMock(),
            )
            agent = PactOpenCodeAgent(
                logs_dir=logs,
                model_name="openrouter/z-ai/glm-5.2",
                runtime_dir=str(runtime),
                harness_dir=str(harness),
            )
            await agent.setup(environment)
            await agent.run("Fix the requested behavior.", environment, AgentContext())

            network_command = environment.exec.await_args_list[1].kwargs["command"]
            self.assertIn("github.com", network_command)
            self.assertNotIn("openrouter.ai", network_command)

            uploaded_targets = [call.kwargs["target_dir"] for call in environment.upload_dir.await_args_list]
            self.assertEqual(uploaded_targets, ["/opt/pact/plugins", "/opt/pact/harness"])
            environment.upload_file.assert_awaited_once()
            command_call = environment.exec.await_args_list[4]
            command = command_call.kwargs["command"]
            self.assertIn("pact-harbor-run.ts", command)
            self.assertIn("export PATH=/opt/pact-runtime/bin:$PATH", command)
            self.assertIn("/opt/pact-runtime/bin/bun", command)
            self.assertIn("openrouter/z-ai/glm-5.2", command)
            self.assertIn("--worker-completion-grace-ms", command)
            self.assertIn("--reviewer-completion-grace-ms", command)
            self.assertIn("120000", command)
            self.assertNotIn("/tests", command)
            self.assertNotIn("/solution", command)
            config = json.loads(command_call.kwargs["env"]["OPENCODE_CONFIG_CONTENT"])
            self.assertEqual(config["model"], "openrouter/z-ai/glm-5.2")
            self.assertEqual(config["small_model"], "openrouter/z-ai/glm-5.2")
            self.assertFalse(config["snapshot"])
            self.assertEqual(config["permission"]["webfetch"], "deny")
            self.assertEqual(config["permission"]["websearch"], "deny")


if __name__ == "__main__":
    unittest.main()
