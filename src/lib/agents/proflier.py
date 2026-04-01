"""Profiler agent (intentionally named proflier.py to match requested filename)."""

from __future__ import annotations

from typing import Any, Dict

try:
    from ._shared import request_llm_json
except ImportError:
    from _shared import request_llm_json


class ProfilerAgent:
    """Analyze personality quiz results into professional persona."""

    def run(self, result: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = (
            "You are The Profiler, a senior career psychologist. "
            "Return only JSON and keep recommendations realistic."
        )

        user_prompt = (
            "Analyze the personality result and return this schema exactly: "
            "{\"persona\":{\"title\":str,\"summary\":str,\"dominantTraits\":[str],"
            "\"workStyle\":str,\"communicationStyle\":str,\"leadershipStyle\":str,\"stressResponse\":str},"
            "\"careerCategories\":[{\"field\":str,\"fitScore\":number,\"reason\":str,\"exampleRoles\":[str]}],"
            "\"advice\":str}.\n\n"
            f"Input:\n{result}"
        )

        # Lightweight reasoning is enough here, so cheap-first profile is used.
        data = request_llm_json(
            system_prompt,
            user_prompt,
            temperature=0.45,
            task_profile="light",  # HF first, then Gemini/OpenAI fallback
            max_output_tokens=500,
            task_name="profiler_analysis",
        )

        # Defensive normalization to keep API response shape stable.
        raw_persona = data.get("persona")
        persona: Dict[str, Any] = raw_persona if isinstance(raw_persona, dict) else {}
        persona.setdefault("title", "")
        persona.setdefault("summary", "")
        persona.setdefault("dominantTraits", [])
        persona.setdefault("workStyle", "")
        persona.setdefault("communicationStyle", "")
        persona.setdefault("leadershipStyle", "")
        persona.setdefault("stressResponse", "")

        career_categories = data.get("careerCategories")
        if not isinstance(career_categories, list):
            career_categories = []

        data["persona"] = persona
        data["careerCategories"] = career_categories
        data.setdefault("advice", "")
        return data
