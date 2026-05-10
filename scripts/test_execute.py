import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from test_codex_harness_execute import CodexHarnessExecutorTest


if __name__ == "__main__":
    unittest.main()
