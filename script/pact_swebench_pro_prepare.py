from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

from harbor.models.task.config import NetworkMode, TaskConfig


DEFAULT_RUNTIME_IMAGE = "pact/harbor-runtime:opencode-1.17.14-bun-1.3.14-amd64"
BASE_FROM_RE = re.compile(r"^FROM(?:\s+--platform=\S+)?\s+(\S+)(?:\s+AS\s+\S+)?\s*$", re.IGNORECASE | re.MULTILINE)


def official_base_image(dockerfile: str) -> str:
    matches = BASE_FROM_RE.findall(dockerfile)
    if not matches:
        raise ValueError("Dockerfile has no FROM instruction")
    for image in matches:
        if image != DEFAULT_RUNTIME_IMAGE and not image.startswith("pact/harbor-runtime:"):
            return image
    raise ValueError("Dockerfile has no benchmark base image")


def inject_pact_runtime(dockerfile: str, runtime_image: str) -> str:
    base_image = official_base_image(dockerfile)
    cleaned = re.sub(
        r"^FROM(?:\s+--platform=\S+)?\s+pact/harbor-runtime:\S+\s+AS\s+pact-runtime\s*\n+",
        "",
        dockerfile,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    cleaned = re.sub(
        rf"^FROM(?:\s+--platform=\S+)?\s+{re.escape(base_image)}",
        f"FROM --platform=linux/amd64 {base_image}",
        cleaned,
        count=1,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    marker = "# PACT Harbor runtime"
    if marker in cleaned:
        cleaned = cleaned.split(marker, 1)[0].rstrip() + "\n"
    return (
        f"FROM --platform=linux/amd64 {runtime_image} AS pact-runtime\n\n"
        f"{cleaned.rstrip()}\n\n"
        f"{marker}\n"
        "COPY --from=pact-runtime /opt/pact-runtime /opt/pact-runtime\n"
        'ENV PATH="/opt/pact-runtime/bin:${PATH}"\n'
        "RUN ln -sf /opt/pact-runtime/bin/node /usr/local/bin/node \\\n"
        "    && ln -sf /opt/pact-runtime/bin/bun /usr/local/bin/bun \\\n"
        "    && ln -sf /opt/pact-runtime/bin/opencode /usr/local/bin/opencode \\\n"
        "    && ln -sf /opt/pact-runtime/bin/rg /usr/local/bin/rg \\\n"
        "    && bun --version && opencode --version && rg --version\n"
    )


def configure_task(task_toml: str, network_mode: str = "strict", docker_image: str | None = None) -> str:
    config = TaskConfig.model_validate_toml(task_toml)
    config.schema_version = "1.3"
    strict = network_mode == "strict"
    config.environment.network_mode = NetworkMode.NO_NETWORK if strict else NetworkMode.PUBLIC
    config.environment.allowed_hosts = None
    config.environment.build_timeout_sec = max(config.environment.build_timeout_sec, 3600.0)
    config.environment.docker_image = docker_image
    config.agent.network_mode = NetworkMode.ALLOWLIST if strict else NetworkMode.PUBLIC
    config.agent.allowed_hosts = ["openrouter.ai", "*.openrouter.ai"] if strict else None
    config.agent.timeout_sec = None
    config.verifier.network_mode = NetworkMode.NO_NETWORK if strict else NetworkMode.PUBLIC
    config.verifier.allowed_hosts = None
    return config.model_dump_toml()


def load_suite(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data.get("cases"), list) or not data["cases"]:
        raise ValueError(f"Suite has no cases: {path}")
    return data


def task_index(tasks_root: Path) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for config_path in sorted(tasks_root.glob("*/tests/config.json")):
        data = json.loads(config_path.read_text(encoding="utf-8"))
        instance_id = data.get("instance_id")
        if isinstance(instance_id, str):
            result[instance_id] = config_path.parent.parent
    return result


def prepare_suite(
    suite_path: Path,
    tasks_root: Path,
    output_path: Path,
    runtime_image: str,
    network_mode: str,
) -> list[dict[str, Any]]:
    source = load_suite(suite_path)
    indexed = task_index(tasks_root)
    harbor_cases: list[dict[str, Any]] = []
    images: list[dict[str, Any]] = []
    for case in source["cases"]:
        instance_id = case["instance_id"]
        task_path = indexed.get(instance_id)
        if task_path is None:
            raise ValueError(f"No generated Harbor task for {instance_id}")
        dockerfile_path = task_path / "environment" / "Dockerfile"
        task_toml_path = task_path / "task.toml"
        original_dockerfile = dockerfile_path.read_text(encoding="utf-8")
        base_image = official_base_image(original_dockerfile)
        prepared_dockerfile = inject_pact_runtime(original_dockerfile, runtime_image)
        dockerfile_path.write_text(prepared_dockerfile, encoding="utf-8")
        runtime_hash = hashlib.sha256(prepared_dockerfile.encode()).hexdigest()[:12]
        derived_image = f"pact/swebench-pro:{slug(case['id'])}-{runtime_hash}"
        task_toml_path.write_text(
            configure_task(
                task_toml_path.read_text(encoding="utf-8"),
                network_mode=network_mode,
                docker_image=derived_image,
            ),
            encoding="utf-8",
        )
        harbor_cases.append(
            {
                "id": case["id"],
                "instance_id": instance_id,
                "task_path": str(task_path.resolve()),
                "language": str(case.get("language", "unknown")).lower(),
                "repo": str(case.get("repo", "unknown")),
                "max_rounds": int(source.get("max_rounds", 3)),
                "tags": list(case.get("tags", [])),
            }
        )
        images.append(
            {
                "case_id": case["id"],
                "instance_id": instance_id,
                "task_path": str(task_path.resolve()),
                "official_base_image": base_image,
                "runtime_image": runtime_image,
                "runtime_hash": runtime_hash,
                "derived_image": derived_image,
            }
        )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            {
                "name": source.get("name", output_path.stem),
                "benchmark": "swebench-pro-harbor",
                "max_rounds": int(source.get("max_rounds", 3)),
                "cases": harbor_cases,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return images


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9_.-]+", "-", value.lower()).strip("-")[:80]


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare GPT-certified SWE-bench Pro Harbor tasks for PACT")
    parser.add_argument("--suite-dir", required=True, type=Path)
    parser.add_argument("--runtime-image", default=DEFAULT_RUNTIME_IMAGE)
    parser.add_argument("--network-mode", choices=("strict", "docker-desktop-host-block"), default="strict")
    args = parser.parse_args()
    suite_dir = args.suite_dir.expanduser().resolve()
    harbor_root = suite_dir / "harbor"
    records: list[dict[str, Any]] = []
    for split in ("evolution", "holdout"):
        records.extend(
            prepare_suite(
                suite_dir / f"{split}-suite.json",
                harbor_root / "tasks" / split,
                harbor_root / f"{split}-suite.json",
                args.runtime_image,
                args.network_mode,
            )
        )
    manifest = {
        "schema": "pact-swebench-pro-images/v1",
        "platform": "linux/amd64",
        "runtime_image": args.runtime_image,
        "network_enforcement": args.network_mode,
        "tasks": records,
    }
    (harbor_root / "image-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"tasks": len(records), "manifest": str(harbor_root / "image-manifest.json")}))


if __name__ == "__main__":
    main()
