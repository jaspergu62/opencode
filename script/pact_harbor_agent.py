from __future__ import annotations

import json
import shlex
import tempfile
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
        worker_completion_grace_ms: int | str = 120_000,
        reviewer_completion_grace_ms: int | str = 120_000,
        **kwargs,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.runtime_dir = Path(runtime_dir).expanduser().resolve()
        self.harness_dir = Path(harness_dir).expanduser().resolve()
        self.max_rounds = int(max_rounds)
        self.worker_agent = worker_agent
        self.reviewer_agent = reviewer_agent
        self.reviewer_model = reviewer_model
        self.worker_completion_grace_ms = int(worker_completion_grace_ms)
        self.reviewer_completion_grace_ms = int(reviewer_completion_grace_ms)

    @staticmethod
    def name() -> str:
        return "pact-opencode"

    def version(self) -> str:
        return "swebench-pro-v2"

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

        loop_id = str(self.context_id or self.session_id or "harbor-trial").replace("/", "-")
        git_archive = f"/opt/pact/original-git-{loop_id}.tar"
        with tempfile.TemporaryDirectory(prefix="pact-git-history-") as archive_dir:
            local_git_archive = Path(archive_dir) / "original-git.tar"
            archive_git = await environment.exec(
                command=self._archive_git_command(git_archive),
                cwd=project_root,
            )
            if archive_git.return_code != 0:
                raise RuntimeError("Failed to archive task git history before the PACT agent phase")
            await environment.download_file(git_archive, local_git_archive)

            isolate_git = await environment.exec(
                command=self._activate_isolated_git_command(git_archive),
                cwd=project_root,
            )
            if isolate_git.return_code != 0:
                await self._restore_git_history(
                    environment,
                    project_root,
                    local_git_archive,
                    git_archive,
                )
                raise RuntimeError("Failed to isolate task git history before the PACT agent phase")

            model = self.model_name or "openrouter/z-ai/glm-5.2"
            config = {
                "model": model,
                "small_model": model,
                "snapshot": False,
                "provider": {
                    "openrouter": {
                        "npm": "@openrouter/ai-sdk-provider",
                        "models": {"z-ai/glm-5.2": {"name": "Z.ai GLM 5.2"}},
                    }
                },
                "permission": {"webfetch": "deny", "websearch": "deny"},
                "mcp": {},
            }
            command = " ".join(
                shlex.quote(part)
                for part in [
                    "/opt/pact-runtime/bin/bun",
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
                    "--worker-completion-grace-ms",
                    str(self.worker_completion_grace_ms),
                    "--reviewer-completion-grace-ms",
                    str(self.reviewer_completion_grace_ms),
                    "--loop-id",
                    loop_id,
                ]
            )
            pact_command = (
                f"export PATH=/opt/pact-runtime/bin:$PATH; {command} "
                "2>&1 | tee /logs/agent/pact-driver.log"
            )
            result = None
            try:
                result = await environment.exec(
                    command=f"bash -o pipefail -c {shlex.quote(pact_command)}",
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
            finally:
                await self._restore_git_history(
                    environment,
                    project_root,
                    local_git_archive,
                    git_archive,
                )

        assert result is not None
        context.metadata = {
            "pact_driver_exit_code": result.return_code,
            "pact_model": model,
            "pact_reviewer_model": self.reviewer_model,
            "pact_max_rounds": self.max_rounds,
            "pact_worker_completion_grace_ms": self.worker_completion_grace_ms,
            "pact_reviewer_completion_grace_ms": self.reviewer_completion_grace_ms,
        }
        if result.return_code != 0:
            raise RuntimeError(f"PACT driver exited with code {result.return_code}")

    @staticmethod
    def _archive_git_command(git_archive: str) -> str:
        archive = shlex.quote(git_archive)
        return (
            "set -euo pipefail; "
            "test -d .git; "
            f"rm -f {archive}; "
            f"tar -cf {archive} .git; "
            f"test -s {archive}"
        )

    @staticmethod
    def _activate_isolated_git_command(git_archive: str) -> str:
        archive = shlex.quote(git_archive)
        return (
            "set -euo pipefail; "
            f"test -s {archive}; "
            f"rm -f {archive}; "
            "rm -rf .git; "
            "git init -q; "
            "git config user.email pact-harbor@localhost; "
            "git config user.name 'PACT Harbor'; "
            "git add -A; "
            "git commit -q --no-gpg-sign -m 'PACT isolated baseline'; "
            "test \"$(git rev-list --all --count)\" = 1"
        )

    @staticmethod
    def _restore_git_command(git_archive: str) -> str:
        archive = shlex.quote(git_archive)
        return (
            "set -euo pipefail; "
            f"test -s {archive}; "
            "rm -rf .git; "
            f"tar -xf {archive}; "
            f"rm -f {archive}; "
            "test -d .git; "
            "exclude=$(git rev-parse --git-path info/exclude); "
            "mkdir -p \"$(dirname \"$exclude\")\"; "
            "grep -qxF '.pact/' \"$exclude\" 2>/dev/null || printf '%s\\n' '.pact/' >> \"$exclude\""
        )

    async def _restore_git_history(
        self,
        environment: BaseEnvironment,
        project_root: str,
        local_git_archive: Path,
        git_archive: str,
    ) -> None:
        await environment.upload_file(local_git_archive, git_archive)
        restore_git = await environment.exec(
            command=self._restore_git_command(git_archive),
            cwd=project_root,
        )
        if restore_git.return_code != 0:
            raise RuntimeError("Failed to restore task git history for the Harbor verifier phase")
