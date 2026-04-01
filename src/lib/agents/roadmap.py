"""Roadmap agent.

Generates practical weekly roadmap from CV context and target role.
Uses hybrid provider routing with reliable fallback.
"""

from __future__ import annotations

from typing import Any, Dict, List

try:
    from ._shared import request_llm_json, sanitize_input
except ImportError:
    from _shared import request_llm_json, sanitize_input


class RoadmapAgent:
    """Create a learning roadmap based on CV and target role/job description."""

    def build(
        self,
        cv_text: str,
        job_description: str,
        missing_keywords: List[str] | None = None,
        weeks: int = 4,
    ) -> Dict[str, Any]:
        clean_cv = sanitize_input(cv_text)
        clean_job = sanitize_input(job_description)

        if not clean_cv:
            raise ValueError("cv_text is empty")
        if not clean_job:
            raise ValueError("job_description is empty")

        kw = missing_keywords or []

        system_prompt = (
            "You are The HR Expert, a senior HR Technology specialist. "
            "Be concrete, practical, concise, and output only JSON."
        )
        user_prompt = (
            "Analyze this CV against the target role and build a weekly roadmap. "
            "Return this schema exactly: "
            "{\"matchScore\":number,\"atsScore\":number,\"strengths\":[str],"
            "\"gaps\":[{\"area\":str,\"importance\":\"high\"|\"medium\"|\"low\",\"suggestion\":str}],"
            "\"sentenceImprovements\":[{\"original\":str,\"improved\":str,\"reason\":str}],"
            "\"missingKeywords\":[str],"
            "\"roadmap\":[{\"week\":number,\"focus\":str,\"resources\":[str],\"milestone\":str}],"
            "\"quickWins\":[str]}.\n\n"
            "Constraints: keep concise output. strengths max 5; gaps max 6; sentenceImprovements max 3; "
            "missingKeywords max 12; roadmap exactly 4 weeks; each week max 2 resources; quickWins max 3.\n\n"
            f"Weeks: {weeks}\n"
            f"Provided missing keywords: {kw}\n\n"
            f"CV:\n{clean_cv}\n\n"
            f"Job Description:\n{clean_job}"
        )

        # Use critical profile because roadmap quality directly impacts user outcomes.
        result = request_llm_json(
            system_prompt,
            user_prompt,
            temperature=0.25,
            task_profile="gemini_first",
            max_output_tokens=700,
            task_name="roadmap_audit",
        )

        # Normalize expected UI shape to reduce frontend breakage when providers are inconsistent.
        result.setdefault("matchScore", 0)
        result.setdefault("atsScore", 0)
        result.setdefault("strengths", [])
        result.setdefault("gaps", [])
        result.setdefault("sentenceImprovements", [])
        result.setdefault("missingKeywords", [])
        result.setdefault("roadmap", [])
        result.setdefault("quickWins", [])
        return result
