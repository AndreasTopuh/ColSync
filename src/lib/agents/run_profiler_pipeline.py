"""CLI bridge for ProfilerAgent.

Reads JSON from stdin and prints JSON to stdout.
Input schema is QuizResult-like payload used by /api/analyze.
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict

try:
    from .proflier import ProfilerAgent
    from ._shared import get_provider_trace, reset_provider_trace
except ImportError:
    sys.path.append(os.path.dirname(__file__))
    from proflier import ProfilerAgent
    from _shared import get_provider_trace, reset_provider_trace


def _read_stdin_json() -> Dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    return json.loads(raw)


def main() -> int:
    try:
        reset_provider_trace()
        payload = _read_stdin_json()
        result = ProfilerAgent().run(payload)
        sys.stdout.write(
            json.dumps(
                {"ok": True, "result": result, "meta": {"providerTrace": get_provider_trace()}},
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as exc:  # noqa: BLE001
        sys.stdout.write(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
