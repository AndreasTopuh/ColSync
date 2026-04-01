"""Hunter agent.

Recommends realistic job roles based on personality profile and interests.
"""

from __future__ import annotations

from typing import Any, Dict, List

try:
    from ._shared import request_llm_json, sanitize_input
except ImportError:
    from _shared import request_llm_json, sanitize_input


class HunterAgent:
    """Generate job recommendations using hybrid LLM routing."""

    def run(
        self,
        dominant: str,
        secondary: str,
        interests: str,
        location: str,
        listings: List[Dict[str, Any]] | None = None,
    ) -> Dict[str, Any]:
        listings = listings or []
        safe_interests = sanitize_input(interests, max_len=1200)
        safe_location = sanitize_input(location, max_len=200)

        listings_context = ""
        if listings:
            shortlist = listings[:30]
            listings_context = (
                "\n\nREAL JOB LISTINGS (prefer these roles first):\n"
                f"{shortlist}\n"
                "Use these listings as the primary grounding. Keep recommendations realistic."
            )

        system_prompt = (
            "You are The Hunter, a senior recruitment specialist. "
            "Recommend realistic job types and explain fit clearly. Return only JSON."
        )

        user_prompt = (
            "Return this schema exactly: "
            "{\"jobs\":[{\"title\":str,\"company_type\":str,\"seniority\":str,\"salary_range\":str,"
            "\"personalityFit\":number,\"whyItFits\":str,\"keyResponsibilities\":[str],"
            "\"requiredSkills\":[str],\"searchTip\":str}],\"marketInsight\":str}.\n\n"
            f"Dominant color: {dominant}\n"
            f"Secondary color: {secondary}\n"
            f"Interest area: {safe_interests}\n"
            f"Location: {safe_location}\n"
            "Recommend 8 specific job categories/titles and rank by personality fit. "
            "Return ONLY valid JSON without markdown fences."
            f"{listings_context}"
        )

        try:
            data = request_llm_json(
                system_prompt,
                user_prompt,
                temperature=0.5,
                task_profile="light",  # HF first, then Gemini/OpenAI fallback
                max_output_tokens=1000,
                task_name="hunter_recommendation",
            )
        except Exception:
            # Fallback to a smaller schema if providers keep returning malformed/truncated JSON.
            compact_prompt = (
                "Return this compact schema exactly: "
                "{\"jobs\":[{\"title\":str,\"personalityFit\":number,\"whyItFits\":str}],\"marketInsight\":str}.\n\n"
                f"Dominant color: {dominant}\n"
                f"Secondary color: {secondary}\n"
                f"Interest area: {safe_interests}\n"
                f"Location: {safe_location}\n"
                "Return 5 jobs only. Keep whyItFits to 1 short sentence each. "
                "Return ONLY valid JSON without markdown fences."
            )
            data = request_llm_json(
                system_prompt,
                compact_prompt,
                temperature=0.4,
                task_profile="light",
                max_output_tokens=500,
                task_name="hunter_recommendation_compact",
            )

        jobs = data.get("jobs")
        if not isinstance(jobs, list):
            jobs = []

        normalized_jobs: List[Dict[str, Any]] = []
        for item in jobs:
            if not isinstance(item, dict):
                continue
            normalized_jobs.append(
                {
                    "title": str(item.get("title") or ""),
                    "company_type": str(item.get("company_type") or "Tech / Digital"),
                    "seniority": str(item.get("seniority") or "Junior/Mid"),
                    "salary_range": str(item.get("salary_range") or "Market dependent"),
                    "personalityFit": float(item.get("personalityFit") or 0),
                    "whyItFits": str(item.get("whyItFits") or ""),
                    "keyResponsibilities": item.get("keyResponsibilities") if isinstance(item.get("keyResponsibilities"), list) else [],
                    "requiredSkills": item.get("requiredSkills") if isinstance(item.get("requiredSkills"), list) else [],
                    "searchTip": str(item.get("searchTip") or "Search on LinkedIn / Jobstreet"),
                }
            )

        data["jobs"] = normalized_jobs
        data["marketInsight"] = str(data.get("marketInsight") or "")
        return data
