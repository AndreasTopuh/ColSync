"""CV Reader agent.

- Uses Gemini for document extraction (PDF/image/text file payload).
- Uses hybrid LLM strategy for summary and roadmap orchestration.
"""

from __future__ import annotations

import base64
from typing import Any, Dict, List, Optional

try:
    from ._shared import extract_cv_text_with_gemini, request_llm_json, sanitize_input
    from .roadmap import RoadmapAgent
except ImportError:
    from _shared import extract_cv_text_with_gemini, request_llm_json, sanitize_input
    from roadmap import RoadmapAgent

ALLOWED_UPLOAD_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "image/png",
    "image/jpeg",
    "image/webp",
}

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024


def _approx_base64_size(base64_data: str) -> int:
    return int((len(base64_data) * 3) / 4)


def _decode_text_payload(base64_data: str) -> str:
    raw = base64.b64decode(base64_data, validate=True)
    return raw.decode("utf-8", errors="replace").strip()


class CVReaderAgent:
    """Read and summarize CV documents."""

    def extract_text(self, uploaded_doc: Dict[str, Any]) -> str:
        """Extract text from uploaded document payload.

        Expected keys in uploaded_doc:
        - name: str
        - mimeType: str
        - base64: str
        """
        required = ["name", "mimeType", "base64"]
        missing = [k for k in required if not uploaded_doc.get(k)]
        if missing:
            raise ValueError(f"Missing uploaded_doc fields: {', '.join(missing)}")

        mime_type = str(uploaded_doc["mimeType"]).strip().lower()
        base64_data = str(uploaded_doc["base64"]).strip()

        if mime_type not in ALLOWED_UPLOAD_TYPES:
            raise ValueError(
                f"Unsupported file type: {mime_type}. "
                "Use PDF, TXT/Markdown, or image files."
            )

        if _approx_base64_size(base64_data) > MAX_UPLOAD_SIZE_BYTES:
            raise ValueError("File too large. Maximum size is 5 MB.")

        # For plain text payloads, decode locally to avoid unnecessary LLM calls.
        if mime_type.startswith("text/"):
            text = _decode_text_payload(base64_data)
            if not text:
                raise ValueError("Uploaded text file is empty.")
            return text

        return extract_cv_text_with_gemini(uploaded_doc)

    def summarize_cv(self, cv_text: str) -> Dict[str, Any]:
        """Cheap summary path: HF first, Gemini/OpenAI fallback."""
        clean = sanitize_input(cv_text)
        if not clean:
            raise ValueError("cv_text is empty")

        system_prompt = (
            "You are The CV Reader. Summarize a resume clearly and structurally. "
            "Output only JSON."
        )
        user_prompt = (
            "Summarize the following CV text. Return this JSON schema exactly: "
            "{\"headline\":str,\"skills\":[str],\"experienceHighlights\":[str],\"education\":[str],"
            "\"suggestedRoles\":[str],\"seniorityGuess\":str}.\n\n"
            f"CV:\n{clean}"
        )

        result = request_llm_json(
            system_prompt,
            user_prompt,
            temperature=0.2,
            task_profile="light",  # HF first, then Gemini/OpenAI fallback
            max_output_tokens=380,
            task_name="cv_summary",
        )

        # Defensive shape normalization for downstream flow.
        result.setdefault("headline", "")
        result.setdefault("skills", [])
        result.setdefault("experienceHighlights", [])
        result.setdefault("education", [])
        result.setdefault("suggestedRoles", [])
        result.setdefault("seniorityGuess", "")
        return result

    def run_pipeline(
        self,
        *,
        cv_text: str = "",
        uploaded_doc: Optional[Dict[str, Any]] = None,
        job_description: str = "",
        target_roles: Optional[List[str]] = None,
        weeks: int = 4,
    ) -> Dict[str, Any]:
        """Agents-only CV flow: extract -> summarize -> roadmap.

        Returns a unified payload for frontend or API usage.
        """
        effective_cv = (cv_text or "").strip()

        if not effective_cv and uploaded_doc:
            effective_cv = self.extract_text(uploaded_doc)

        if not effective_cv:
            raise ValueError("Provide cv_text or uploaded_doc.")

        summary = self.summarize_cv(effective_cv)

        roles = [r.strip() for r in (target_roles or []) if r and r.strip()]
        if not roles:
            inferred = summary.get("suggestedRoles", [])
            if isinstance(inferred, list):
                roles = [str(item).strip() for item in inferred if str(item).strip()][:3]

        explicit_job = (job_description or "").strip()

        if explicit_job:
            resolved_job_description = explicit_job
        elif roles:
            job_description = (
                f"Target positions: {', '.join(roles)}. "
                "Evaluate fit, identify ATS gaps, and generate a practical learning roadmap."
            )
            resolved_job_description = job_description
        else:
            resolved_job_description = (
                "Run a general CV audit for modern digital and knowledge-work roles. "
                "Identify strengths, ATS gaps, and generate a practical learning roadmap."
            )

        roadmap_agent = RoadmapAgent()
        roadmap = roadmap_agent.build(
            cv_text=effective_cv,
            job_description=resolved_job_description,
            missing_keywords=summary.get("skills", []) if isinstance(summary.get("skills"), list) else [],
            weeks=weeks,
        )

        return {
            "source": "python_agents_flow",
            "cvText": effective_cv,
            "jobDescription": resolved_job_description,
            "summary": summary,
            "audit": roadmap,
        }
