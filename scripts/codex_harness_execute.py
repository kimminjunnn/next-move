#!/usr/bin/env python3
"""
Rupa Codex Harness step executor.

Runs phase steps from phases/<phase-dir>/ with Codex CLI while keeping project
documents local: prompts reference source files and compact summaries instead of
copying full docs into output artifacts.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parent.parent


class CodexHarnessExecutor:
    MAX_RETRIES = 3
    TZ = timezone(timedelta(hours=9))
    DEFAULT_CONTEXT_FILES = (
        "AGENTS.md",
        "docs/PRD.md",
        "docs/ARCHITECTURE.md",
        "docs/ADR.md",
        "docs/UI_GUIDE.md",
        "docs/product.md",
        "docs/ui.md",
        "docs/local-dev-runbook.md",
        "docs/route-detection-workplan.md",
        "docs/skeleton-movement-learning-notes.md",
    )

    def __init__(
        self,
        phase_dir_name: str,
        *,
        codex_bin: Optional[str] = None,
        model: Optional[str] = None,
        sandbox: str = "workspace-write",
        approval: str = "on-request",
        ephemeral: bool = True,
        auto_commit: bool = False,
        auto_push: bool = False,
        use_branch: bool = False,
    ):
        self._root = ROOT
        self._phases_dir = ROOT / "phases"
        self._phase_dir = self._phases_dir / phase_dir_name
        self._phase_dir_name = phase_dir_name
        self._index_file = self._phase_dir / "index.json"
        self._top_index_file = self._phases_dir / "index.json"
        self._codex_bin = codex_bin or self._resolve_codex_bin()
        self._model = model
        self._sandbox = sandbox
        self._approval = approval
        self._ephemeral = ephemeral
        self._auto_commit = auto_commit
        self._auto_push = auto_push
        self._use_branch = use_branch

        if not self._phase_dir.is_dir():
            raise SystemExit(f"ERROR: {self._phase_dir} not found")
        if not self._index_file.exists():
            raise SystemExit(f"ERROR: {self._index_file} not found")

        index = self._read_json(self._index_file)
        self._project = index.get("project", "Rupa")
        self._phase_name = index.get("phase", phase_dir_name)
        self._total = len(index.get("steps", []))

    @staticmethod
    def _resolve_codex_bin() -> str:
        return (
            shutil.which("codex")
            or "/Applications/Codex.app/Contents/Resources/codex"
        )

    @classmethod
    def _stamp(cls) -> str:
        return datetime.now(cls.TZ).strftime("%Y-%m-%dT%H:%M:%S%z")

    @staticmethod
    def _read_json(path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def _write_json(path: Path, data: dict) -> None:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    def run(self) -> None:
        self._print_header()
        self._check_blockers()
        if self._use_branch or self._auto_commit or self._auto_push:
            self._ensure_clean_before_git_mutation()
        self._ensure_created_at()
        if self._use_branch:
            self._checkout_branch()
        self._execute_all_steps()
        self._finalize()

    def _run_git(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", *args],
            cwd=self._root,
            capture_output=True,
            text=True,
        )

    def _ensure_clean_before_git_mutation(self) -> None:
        status = self._run_git("status", "--short")
        if status.returncode != 0:
            raise SystemExit(f"ERROR: git status failed: {status.stderr.strip()}")
        if status.stdout.strip():
            raise SystemExit(
                "ERROR: worktree is not clean. Commit, stash, or remove unrelated changes "
                "before using --branch, --commit, or --push."
            )

    def _checkout_branch(self) -> None:
        branch = f"codex/{self._phase_name}"
        current = self._run_git("branch", "--show-current")
        if current.returncode != 0:
            raise SystemExit(f"ERROR: git branch check failed: {current.stderr.strip()}")
        if current.stdout.strip() == branch:
            return

        exists = self._run_git("rev-parse", "--verify", branch)
        checkout = (
            self._run_git("checkout", branch)
            if exists.returncode == 0
            else self._run_git("checkout", "-b", branch)
        )
        if checkout.returncode != 0:
            raise SystemExit(
                "ERROR: branch checkout failed. Commit or stash unrelated changes first.\n"
                f"{checkout.stderr.strip()}"
            )
        print(f"Branch: {branch}")

    def _commit_step(self, step_num: int, step_name: str) -> None:
        add = self._run_git("add", "-A")
        if add.returncode != 0:
            print(f"WARN: git add failed: {add.stderr.strip()}")
            return
        if self._run_git("diff", "--cached", "--quiet").returncode == 0:
            return
        msg = f"chore(harness): run {self._phase_name} step {step_num} {step_name}"
        commit = self._run_git("commit", "-m", msg)
        if commit.returncode != 0:
            print(f"WARN: git commit failed: {commit.stderr.strip()}")
        else:
            print(f"Commit: {msg}")

    def _context_file_lines(self) -> str:
        lines = []
        for rel in self.DEFAULT_CONTEXT_FILES:
            if (self._root / rel).exists():
                lines.append(f"- `{rel}`")
        if (self._root / "docs" / "superpowers").is_dir():
            lines.append("- `docs/superpowers/specs/` and `docs/superpowers/plans/` when the task references a prior design or plan")
        return "\n".join(lines)

    def _completed_step_context(self) -> str:
        index = self._read_json(self._index_file)
        lines = [
            f"- Step {s['step']} ({s['name']}): {s['summary']}"
            for s in index.get("steps", [])
            if s.get("status") == "completed" and s.get("summary")
        ]
        if not lines:
            return "No completed step summaries yet."
        return "\n".join(lines)

    def _build_preamble(self, prev_error: Optional[str] = None) -> str:
        retry_section = ""
        if prev_error:
            retry_section = (
                "\n## Previous Attempt Failure\n"
                "Use this specific failure to correct the next attempt:\n\n"
                f"{prev_error}\n"
            )

        return f"""You are Codex working inside the Rupa repository.

## Harness Scope

- Project: {self._project}
- Phase: {self._phase_name}
- Phase directory: `phases/{self._phase_dir_name}`
- Run only the current step. Do not implement future steps.
- Preserve unrelated user work. Do not revert files you did not change.
- Do not commit, push, or create PRs unless the step explicitly asks and the user has approved it.

## Local Context Files

Read the relevant files locally before editing. Do not paste their full contents into status fields,
step output summaries, commits, or new docs. Summarize only the minimum needed context.

{self._context_file_lines()}

## Rupa Product Summary

Rupa is an Expo React Native bouldering simulator. The active surfaces are the mobile app in
`app/` and `src/`, the Nest API in `nest-api/`, and the FastAPI vision service in
`vision-service/`. Route detection contracts must stay aligned across all three layers.

## Completed Step Summaries

{self._completed_step_context()}
{retry_section}
## Step Completion Contract

After performing the step and verification, update `phases/{self._phase_dir_name}/index.json`:

- success: set this step to `"status": "completed"` and add a concise `"summary"`
- blocked: set `"status": "blocked"` and add `"blocked_reason"`
- failed after your own fix attempts: set `"status": "error"` and add `"error_message"`

Keep generated artifacts out of git unless the step explicitly says they are deliverables.

---

"""

    def _invoke_codex(self, step: dict, preamble: str) -> dict:
        step_file = self._phase_dir / f"step{step['step']}.md"
        if not step_file.exists():
            raise SystemExit(f"ERROR: {step_file} not found")

        prompt = preamble + step_file.read_text(encoding="utf-8")
        cmd = [
            self._codex_bin,
            "exec",
            "--cd",
            str(self._root),
            "--sandbox",
            self._sandbox,
            "--ask-for-approval",
            self._approval,
        ]
        if self._ephemeral:
            cmd.append("--ephemeral")
        cmd.append("-")
        if self._model:
            cmd[2:2] = ["--model", self._model]

        result = subprocess.run(
            cmd,
            cwd=self._root,
            input=prompt,
            capture_output=True,
            text=True,
            timeout=1800,
        )
        return {
            "step": step["step"],
            "name": step["name"],
            "exitCode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }

    def _save_step_output(self, step: dict, output: dict) -> None:
        out_path = self._phase_dir / f"step{step['step']}-output.json"
        self._write_json(out_path, output)

    def _check_blockers(self) -> None:
        index = self._read_json(self._index_file)
        for step in reversed(index.get("steps", [])):
            status = step.get("status", "pending")
            if status == "error":
                raise SystemExit(
                    f"ERROR: Step {step['step']} ({step['name']}) is error: "
                    f"{step.get('error_message', 'unknown')}"
                )
            if status == "blocked":
                raise SystemExit(
                    f"BLOCKED: Step {step['step']} ({step['name']}) is blocked: "
                    f"{step.get('blocked_reason', 'unknown')}"
                )
            if status != "pending":
                break

    def _ensure_created_at(self) -> None:
        index = self._read_json(self._index_file)
        if "created_at" not in index:
            index["created_at"] = self._stamp()
            self._write_json(self._index_file, index)

    def _mark_started(self, step: dict) -> None:
        index = self._read_json(self._index_file)
        for item in index.get("steps", []):
            if item.get("step") == step["step"] and "started_at" not in item:
                item["started_at"] = self._stamp()
        self._write_json(self._index_file, index)

    def _execute_single_step(self, step: dict) -> bool:
        prev_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            preamble = self._build_preamble(prev_error=prev_error)
            print(f"Step {step['step']}: {step['name']} attempt {attempt}/{self.MAX_RETRIES}")
            started = time.monotonic()
            output = self._invoke_codex(step, preamble)
            output["durationSeconds"] = round(time.monotonic() - started, 2)
            self._save_step_output(step, output)

            index = self._read_json(self._index_file)
            current = next(
                (item for item in index.get("steps", []) if item.get("step") == step["step"]),
                None,
            )
            status = current.get("status", "pending") if current else "pending"

            if status == "completed":
                current["completed_at"] = self._stamp()
                self._write_json(self._index_file, index)
                if self._auto_commit:
                    self._commit_step(step["step"], step["name"])
                print(f"Completed step {step['step']}: {step['name']}")
                return True

            if status == "blocked":
                current["blocked_at"] = self._stamp()
                self._write_json(self._index_file, index)
                self._update_top_index("blocked")
                raise SystemExit(f"BLOCKED: {current.get('blocked_reason', 'unknown')}")

            err_msg = "Step did not update its status."
            if current and current.get("error_message"):
                err_msg = current["error_message"]
            elif output.get("exitCode") != 0:
                err_msg = (output.get("stderr") or output.get("stdout") or err_msg)[-2000:]

            if attempt < self.MAX_RETRIES:
                if current:
                    current["status"] = "pending"
                    current.pop("error_message", None)
                self._write_json(self._index_file, index)
                prev_error = err_msg
                print(f"Retrying step {step['step']}: {err_msg}")
                continue

            if current:
                current["status"] = "error"
                current["error_message"] = f"[{self.MAX_RETRIES} attempts failed] {err_msg}"
                current["failed_at"] = self._stamp()
            self._write_json(self._index_file, index)
            self._update_top_index("error")
            if self._auto_commit:
                self._commit_step(step["step"], step["name"])
            raise SystemExit(f"ERROR: step {step['step']} failed after {self.MAX_RETRIES} attempts")
        return False

    def _execute_all_steps(self) -> None:
        while True:
            index = self._read_json(self._index_file)
            pending = next(
                (step for step in index.get("steps", []) if step.get("status") == "pending"),
                None,
            )
            if not pending:
                print("All steps completed.")
                return
            self._mark_started(pending)
            self._execute_single_step(pending)

    def _update_top_index(self, status: str) -> None:
        if not self._top_index_file.exists():
            return
        top = self._read_json(self._top_index_file)
        ts_key = {
            "completed": "completed_at",
            "error": "failed_at",
            "blocked": "blocked_at",
        }.get(status)
        for phase in top.get("phases", []):
            if phase.get("dir") == self._phase_dir_name:
                phase["status"] = status
                if ts_key:
                    phase[ts_key] = self._stamp()
                break
        self._write_json(self._top_index_file, top)

    def _finalize(self) -> None:
        index = self._read_json(self._index_file)
        index["completed_at"] = self._stamp()
        self._write_json(self._index_file, index)
        self._update_top_index("completed")

        if self._auto_commit:
            self._commit_step(-1, "phase-complete")
        if self._auto_push:
            branch = self._run_git("branch", "--show-current").stdout.strip()
            pushed = self._run_git("push", "-u", "origin", branch)
            if pushed.returncode != 0:
                raise SystemExit(f"ERROR: git push failed: {pushed.stderr.strip()}")

    def _print_header(self) -> None:
        print("=" * 60)
        print("Rupa Codex Harness")
        print(f"Phase: {self._phase_name} | Steps: {self._total}")
        print(f"Codex: {self._codex_bin}")
        print("Git mutation: disabled" if not self._auto_commit else "Git mutation: commit enabled")
        print("=" * 60)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a Rupa Codex Harness phase.")
    parser.add_argument("phase_dir", help="Phase directory under phases/, for example 0-mvp")
    parser.add_argument("--codex-bin", default=os.environ.get("CODEX_BIN"), help="Codex CLI path")
    parser.add_argument("--model", default=None, help="Optional Codex model override")
    parser.add_argument("--sandbox", default="workspace-write", choices=["read-only", "workspace-write", "danger-full-access"])
    parser.add_argument("--approval", default="on-request", choices=["untrusted", "on-request", "never"])
    parser.add_argument("--persist-session", action="store_true", help="Allow Codex exec to persist a session. Default is ephemeral.")
    parser.add_argument("--branch", action="store_true", help="Create or checkout codex/<phase> before running")
    parser.add_argument("--commit", action="store_true", help="Commit harness results after each step")
    parser.add_argument("--push", action="store_true", help="Push after completion. Requires --commit.")
    args = parser.parse_args()

    if args.push and not args.commit:
        raise SystemExit("ERROR: --push requires --commit")

    CodexHarnessExecutor(
        args.phase_dir,
        codex_bin=args.codex_bin,
        model=args.model,
        sandbox=args.sandbox,
        approval=args.approval,
        ephemeral=not args.persist_session,
        auto_commit=args.commit,
        auto_push=args.push,
        use_branch=args.branch,
    ).run()


if __name__ == "__main__":
    main()
