"""CLI bridge for CVReaderAgent pipeline.

Reads JSON from stdin and prints JSON to stdout.
Input schema:
{
  "cvText": "...",
  "jobDescription": "...",
  "uploadedDoc": {"name": str, "mimeType": str, "base64": str} | null
}
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict

try:
    from .cv_reader import CVReaderAgent
    from ._shared import get_provider_trace, reset_provider_trace
except ImportError:
    # Support direct execution: python src/lib/agents/run_cv_pipeline.py
    sys.path.append(os.path.dirname(__file__))
    from cv_reader import CVReaderAgent
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

        cv_text = str(payload.get("cvText") or "")
        job_description = str(payload.get("jobDescription") or "")
        uploaded_doc = payload.get("uploadedDoc")

        agent = CVReaderAgent()
        result = agent.run_pipeline(
            cv_text=cv_text,
            job_description=job_description,
            uploaded_doc=uploaded_doc,
            target_roles=None,
            weeks=4,
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
