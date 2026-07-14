from __future__ import annotations

import json
import shlex
from pathlib import Path

from harbor.agents.base import BaseAgent
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext


BLOCKED_NETWORK_HOSTS = (
    "github.com",
    "api.github.com",
    "raw.githubusercontent.com",
    "codeload.github.com",
    "gist.github.com",
    "gist.githubusercontent.com",
    "objects.githubusercontent.com",
    "gitlab.com",
    "bitbucket.org",
    "pypi.org",
    "files.pythonhosted.org",
    "registry.npmjs.org",
    "npmjs.com",
    "docs.python.org",
)


class PactOpenCodeAgent(BaseAgent):
    """Runs a deterministic PACT Round00 followed by OpenCode worker/reviewer rounds."""

    def __init__(
        self,
        *args,
        runtime_dir: str,
        harness_dir: str,
        max_rounds: int | str = 3,
        worker_agent: str = "build",
        reviewer_agent: str = "build",
        reviewer_model: str = "openrouter/z-ai/glm-5.2",
        **kwargs,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.runtime_dir = Path(runtime_dir).expanduser().resolve()
        self.harness_dir = Path(harness_dir).expanduser().resolve()
        self.max_rounds = int(max_rounds)
        self.worker_agent = worker_agent
        self.reviewer_agent = reviewer_agent
        self.reviewer_model = reviewer_model

    @staticmethod
    def name() -> str:
        return "pact-opencode"

    def version(self) -> str:
        return "swebench-pro-v1"

    async def setup(self, environment: BaseEnvironment) -> None:
        if not self.runtime_dir.is_dir():
            raise FileNotFoundError(f"PACT runtime directory not found: {self.runtime_dir}")
        if not self.harness_dir.is_dir():
            raise FileNotFoundError(f"PACT harness directory not found: {self.harness_dir}")
        await environment.exec(command="mkdir -p /opt/pact/plugins /opt/pact/harness /logs/agent", user="root")
        host_lines = "\\n".join(f"127.0.0.1 {host}" for host in BLOCKED_NETWORK_HOSTS)
        await environment.exec(
            command=f"printf '%s\\n' {shlex.quote(host_lines)} >> /etc/hosts",
            user="root",
        )
        await environment.upload_dir(source_dir=self.runtime_dir, target_dir="/opt/pact/plugins")
        await environment.upload_dir(source_dir=self.harness_dir, target_dir="/opt/pact/harness")

    async def run(
        self,
        instruction: str,
        environment: BaseEnvironment,
        context: AgentContext,
    ) -> None:
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        local_instruction = self.logs_dir / "instruction.md"
        local_instruction.write_text(instruction, encoding="utf-8")
        await environment.upload_file(local_instruction, "/opt/pact/instruction.md")

        repo = await environment.exec(command="git rev-parse --show-toplevel", cwd="/app")
        if repo.return_code != 0 or not (repo.stdout or "").strip():
            raise RuntimeError("SWE-bench Pro task does not contain a Git repository under /app")
        project_root = (repo.stdout or "").strip().splitlines()[-1]
        await environment.exec(
            command="git remote | xargs -r -n1 git remote remove",
            cwd=project_root,
        )

        model = self.model_name or "openrouter/z-ai/glm-5.2"
        config = {
            "provider": {
                "openrouter": {
                    "npm": "@openrouter/ai-sdk-provider",
                    "models": {"z-ai/glm-5.2": {"name": "Z.ai GLM 5.2"}},
                }
            },
            "permission": {"webfetch": "deny", "websearch": "deny"},
            "mcp": {},
        }
        loop_id = str(self.context_id or self.session_id or "harbor-trial").replace("/", "-")
        command = " ".join(
            shlex.quote(part)
            for part in [
                "bun",
                "/opt/pact/plugins/pact-harbor-run.ts",
                "--project-root",
                project_root,
                "--instruction-file",
                "/opt/pact/instruction.md",
                "--harness-dir",
                "/opt/pact/harness",
                "--max-rounds",
                str(self.max_rounds),
                "--model",
                model,
                "--reviewer-model",
                self.reviewer_model,
                "--worker-agent",
                self.worker_agent,
                "--reviewer-agent",
                self.reviewer_agent,
                "--loop-id",
                loop_id,
            ]
        )
        result = await environment.exec(
            command=f"bash -o pipefail -c {shlex.quote(f'{command} 2>&1 | tee /logs/agent/pact-driver.log')}",
            cwd=project_root,
            env={
                "OPENROUTER_BASE_URL": "https://openrouter.ai/api/v1",
                "OPENCODE_CONFIG_CONTENT": json.dumps(config, separators=(",", ":")),
            },
            timeout_sec=None,
        )
        await environment.exec(
            command=(
                "mkdir -p /logs/agent/pact && "
                "cp -R .pact/loops /logs/agent/pact/ 2>/dev/null || true; "
                "git diff --binary --no-ext-diff > /logs/agent/final.patch"
            ),
            cwd=project_root,
        )
        context.metadata = {
            "pact_driver_exit_code": result.return_code,
            "pact_model": model,
            "pact_reviewer_model": self.reviewer_model,
            "pact_max_rounds": self.max_rounds,
        }
        if result.return_code != 0:
            raise RuntimeError(f"PACT driver exited with code {result.return_code}")
