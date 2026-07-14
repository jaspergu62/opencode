from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any


def reward_from_result(result: dict[str, Any]) -> float:
    rewards = (result.get("verifier_result") or {}).get("rewards") or {}
    values = [float(value) for value in rewards.values() if isinstance(value, (int, float))]
    return min(values) if values else 0.0


def existing_result(case_dir: Path) -> Path | None:
    paths = sorted(case_dir.glob("**/result.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    return paths[0] if paths else None


def run_oracles(harbor_dir: Path, suite_paths: list[Path], output_dir: Path) -> dict[str, Any]:
    cases: list[tuple[str, dict[str, Any]]] = []
    for suite_path in suite_paths:
        suite = json.loads(suite_path.read_text(encoding="utf-8"))
        split = suite_path.stem.replace("-suite", "")
        cases.extend((split, case) for case in suite["cases"])

    records: list[dict[str, Any]] = []
    harbor = harbor_dir / ".venv" / "bin" / "harbor"
    for index, (split, case) in enumerate(cases, start=1):
        case_dir = output_dir / split / case["id"]
        case_dir.mkdir(parents=True, exist_ok=True)
        result_path = existing_result(case_dir)
        if result_path and reward_from_result(json.loads(result_path.read_text(encoding="utf-8"))) >= 1:
            status = 0
        else:
            log_path = case_dir / "oracle-runner.log"
            with log_path.open("w", encoding="utf-8") as log:
                completed = subprocess.run(
                    [
                        str(harbor),
                        "trial",
                        "start",
                        "--path",
                        case["task_path"],
                        "--agent",
                        "oracle",
                        "--trial-name",
                        f"oracle-{split}-{case['id']}",
                        "--trials-dir",
                        str(case_dir / "trials"),
                        "--no-force-build",
                    ],
                    cwd=harbor_dir,
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    check=False,
                )
            status = completed.returncode
            result_path = existing_result(case_dir)
        result = json.loads(result_path.read_text(encoding="utf-8")) if result_path else {}
        reward = reward_from_result(result)
        exception = result.get("exception_info") or {}
        record = {
            "index": index,
            "split": split,
            "case_id": case["id"],
            "instance_id": case["instance_id"],
            "reward": reward,
            "passed": status == 0 and reward >= 1 and not exception,
            "harbor_exit_code": status,
            "exception_type": exception.get("exception_type"),
            "exception_message": exception.get("exception_message"),
            "result_path": str(result_path) if result_path else None,
        }
        records.append(record)
        (case_dir / "oracle-case-result.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"progress": f"{index}/{len(cases)}", "case": case["id"], "reward": reward, "passed": record["passed"]}), flush=True)

    summary = {
        "schema": "pact-swebench-pro-oracle/v1",
        "total": len(records),
        "passed": sum(record["passed"] for record in records),
        "failed": sum(not record["passed"] for record in records),
        "cases": records,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "oracle-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Harbor Oracle parity for PACT SWE-bench Pro suites")
    parser.add_argument("--harbor-dir", type=Path, default=Path("/Users/gujiazhen/Documents/cc_codes/harbor"))
    parser.add_argument("--suite", type=Path, action="append", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    summary = run_oracles(args.harbor_dir.resolve(), [path.resolve() for path in args.suite], args.output.resolve())
    raise SystemExit(0 if summary["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
