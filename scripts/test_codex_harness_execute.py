import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch


MODULE_PATH = Path(__file__).with_name("codex_harness_execute.py")


def load_module():
    spec = importlib.util.spec_from_file_location("codex_harness_execute", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_project(tmp_path):
    (tmp_path / "phases" / "0-mvp").mkdir(parents=True)
    (tmp_path / "AGENTS.md").write_text("SECRET AGENTS CONTENT", encoding="utf-8")
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs" / "product.md").write_text("SECRET PRODUCT CONTENT", encoding="utf-8")
    (tmp_path / "docs" / "ui.md").write_text("SECRET UI CONTENT", encoding="utf-8")
    index = {
        "project": "Rupa",
        "phase": "0-mvp",
        "steps": [
            {"step": 0, "name": "setup", "status": "completed", "summary": "기초 구조 완료"},
            {"step": 1, "name": "feature", "status": "pending"},
        ],
    }
    phase_dir = tmp_path / "phases" / "0-mvp"
    (phase_dir / "index.json").write_text(json.dumps(index), encoding="utf-8")
    (phase_dir / "step1.md").write_text("# Step 1\n\n기능을 구현하라.", encoding="utf-8")
    return phase_dir


class CodexHarnessExecutorTest(unittest.TestCase):
    def test_build_preamble_references_docs_without_copying_contents(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            phase_dir = make_project(tmp_path)
            module = load_module()

            with patch.object(module, "ROOT", tmp_path):
                executor = module.CodexHarnessExecutor("0-mvp")

            preamble = executor._build_preamble(prev_error=None)

            self.assertIn("AGENTS.md", preamble)
            self.assertIn("docs/product.md", preamble)
            self.assertIn("docs/ui.md", preamble)
            self.assertIn("기초 구조 완료", preamble)
            self.assertNotIn("SECRET AGENTS CONTENT", preamble)
            self.assertNotIn("SECRET PRODUCT CONTENT", preamble)
            self.assertNotIn("SECRET UI CONTENT", preamble)
            self.assertIn(phase_dir.name, preamble)

    def test_invoke_codex_uses_exec_with_workspace_sandbox_and_stdin_prompt(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            make_project(tmp_path)
            module = load_module()

            with patch.object(module, "ROOT", tmp_path):
                executor = module.CodexHarnessExecutor("0-mvp")

            completed = MagicMock(returncode=0, stdout="done", stderr="")
            with patch("subprocess.run", return_value=completed) as run:
                output = executor._invoke_codex({"step": 1, "name": "feature"}, "PREAMBLE\n")

            cmd = run.call_args.args[0]
            kwargs = run.call_args.kwargs
            self.assertEqual(cmd[:2], [executor._codex_bin, "exec"])
            self.assertIn("--cd", cmd)
            self.assertIn(str(tmp_path), cmd)
            self.assertIn("--sandbox", cmd)
            self.assertIn("workspace-write", cmd)
            self.assertIn("--ask-for-approval", cmd)
            self.assertIn("on-request", cmd)
            self.assertIn("--ephemeral", cmd)
            self.assertEqual(cmd[-1], "-")
            self.assertIn("PREAMBLE", kwargs["input"])
            self.assertIn("기능을 구현하라", kwargs["input"])
            self.assertEqual(output["exitCode"], 0)

    def test_execute_completed_step_updates_timestamp_and_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            phase_dir = make_project(tmp_path)
            module = load_module()

            with patch.object(module, "ROOT", tmp_path):
                executor = module.CodexHarnessExecutor("0-mvp")

            def fake_invoke(step, preamble):
                index = json.loads((phase_dir / "index.json").read_text(encoding="utf-8"))
                for item in index["steps"]:
                    if item["step"] == step["step"]:
                        item["status"] = "completed"
                        item["summary"] = "기능 구현 완료"
                (phase_dir / "index.json").write_text(json.dumps(index), encoding="utf-8")
                return {"step": step["step"], "name": step["name"], "exitCode": 0, "stdout": "ok", "stderr": ""}

            executor._invoke_codex = fake_invoke
            executor._execute_single_step({"step": 1, "name": "feature"})

            index = json.loads((phase_dir / "index.json").read_text(encoding="utf-8"))
            step = index["steps"][1]
            self.assertEqual(step["status"], "completed")
            self.assertEqual(step["summary"], "기능 구현 완료")
            self.assertIn("completed_at", step)
            self.assertTrue((phase_dir / "step1-output.json").exists())

    def test_git_mutation_requires_clean_worktree(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            make_project(tmp_path)
            module = load_module()

            with patch.object(module, "ROOT", tmp_path):
                executor = module.CodexHarnessExecutor("0-mvp", auto_commit=True)

            executor._run_git = MagicMock(return_value=MagicMock(returncode=0, stdout=" M AGENTS.md\n", stderr=""))

            with self.assertRaises(SystemExit) as raised:
                executor._ensure_clean_before_git_mutation()

            self.assertIn("worktree is not clean", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
