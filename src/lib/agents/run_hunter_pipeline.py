"""CLI bridge for HunterAgent.

Reads JSON from stdin and prints JSON to stdout.
Input schema:
{
  "dominant": str,
  "secondary": str,
  "interests": str,
  "location": str,
  "listings": list
}
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict

try:
    from .hunter import HunterAgent
    from ._shared import get_provider_trace, reset_provider_trace
except ImportError:
    sys.path.append(os.path.dirname(__file__))
    from hunter import HunterAgent
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
        result = HunterAgent().run(
            dominant=str(payload.get("dominant") or ""),
            secondary=str(payload.get("secondary") or ""),
            interests=str(payload.get("interests") or ""),
            location=str(payload.get("location") or "Remote / Global"),
            listings=payload.get("listings") or [],
        )

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
