"""Shared helpers for Python agent modules.

Hybrid strategy:
- Lightweight tasks: Hugging Face first, then Gemini/OpenAI fallback.
- Critical tasks: Gemini/OpenAI first, Hugging Face fallback.
"""

from __future__ import annotations

import json
import os
import re
import ast
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Tuple

JsonDict = Dict[str, Any]
_PROVIDER_TRACE: List[JsonDict] = []


def reset_provider_trace() -> None:
    _PROVIDER_TRACE.clear()


def get_provider_trace() -> List[JsonDict]:
    return list(_PROVIDER_TRACE)


def _record_provider_trace(
    *,
    task_name: str,
    provider: str,
    model: str,
    task_profile: str,
    temperature: float,
    max_output_tokens: int | None,
) -> None:
    _PROVIDER_TRACE.append(
        {
            "task": task_name,
            "provider": provider,
            "model": model,
            "profile": task_profile,
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        }
    )


def _project_root() -> Path:
    # .../src/lib/agents/_shared.py -> project root is parents[3]
    return Path(__file__).resolve().parents[3]


def _load_env_file(env_path: Path) -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not env_path.exists():
        return env

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")

    return env


def load_env() -> Dict[str, str]:
    file_env = _load_env_file(_project_root() / ".env.local")
    merged = dict(file_env)
    merged.update({k: v for k, v in os.environ.items() if v is not None})
    return merged


def _get_gemini_keys(env: Dict[str, str]) -> List[str]:
    keys: List[str] = []

    bulk = (env.get("GOOGLE_API_KEYS") or "").strip()
    if bulk:
        keys.extend([k.strip() for k in bulk.split(",") if k.strip()])

    single = (env.get("GOOGLE_API_KEY") or "").strip()
    if single:
        keys.append(single)

    # Preserve order but remove duplicates.
    seen = set()
    unique: List[str] = []
    for key in keys:
        if key in seen:
            continue
        seen.add(key)
        unique.append(key)

    return unique


def _get_hf_tokens(env: Dict[str, str]) -> List[str]:
    tokens: List[str] = []
    bulk = (env.get("HF_API_TOKENS") or "").strip()
    if bulk:
        tokens.extend([t.strip() for t in bulk.split(",") if t.strip()])

    single = (env.get("HF_API_TOKEN") or "").strip() or (env.get("HUGGINGFACE_API_KEY") or "").strip()
    if single:
        tokens.append(single)

    seen = set()
    unique: List[str] = []
    for token in tokens:
        if token in seen:
            continue
        seen.add(token)
        unique.append(token)

    return unique


def sanitize_input(text: str, max_len: int = 15000) -> str:
    if not text:
        return ""
    return (
        text.replace("IGNORE PREVIOUS INSTRUCTIONS", "[filtered]")
        .replace("SYSTEM:", "[filtered]")
        .replace("USER:", "[filtered]")
    )[:max_len]


def _http_json(
    url: str,
    method: str = "GET",
    headers: Dict[str, str] | None = None,
    payload: Dict[str, Any] | None = None,
    timeout: int = 30,
) -> Tuple[int, str, Any]:
    req_headers = headers.copy() if headers else {}
    data = None

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")

    req = urllib.request.Request(url=url, data=data, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(body)
            except json.JSONDecodeError:
                parsed = body
            return resp.getcode(), "ok", parsed
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = body
        return exc.code, f"http_error: {exc.reason}", parsed
    except Exception as exc:  # noqa: BLE001
        return -1, f"exception: {exc}", None


def _extract_json_from_text(text: str) -> JsonDict:
    if not text:
        raise ValueError("LLM returned empty text")

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # First, try to recover a JSON object embedded in additional text.
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            candidate = match.group(0)
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                # Some providers return Python-literal style objects.
                try:
                    parsed = ast.literal_eval(candidate)
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:  # noqa: BLE001
                    pass

        # Fallback for full-text Python-literal output.
        try:
            parsed = ast.literal_eval(text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:  # noqa: BLE001
            pass

        raise ValueError("LLM did not return valid JSON")


def _call_openai_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    env: Dict[str, str],
    max_output_tokens: int | None = None,
) -> JsonDict:
    api_key = env.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing")

    model = env.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    payload: Dict[str, Any] = {
        "model": model,
        "response_format": {"type": "json_object"},
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if max_output_tokens is not None:
        payload["max_tokens"] = max_output_tokens

    status, state, body = _http_json(
        url="https://api.openai.com/v1/chat/completions",
        method="POST",
        headers={"Authorization": f"Bearer {api_key}"},
        payload=payload,
    )

    if status != 200:
        raise RuntimeError(f"OpenAI failed ({status}, {state}): {body}")

    content = (((body or {}).get("choices") or [{}])[0].get("message") or {}).get("content", "")
    return _extract_json_from_text(content)


def _openai_model(env: Dict[str, str]) -> str:
    return env.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"


def _call_gemini_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    env: Dict[str, str],
    max_output_tokens: int | None = None,
) -> JsonDict:
    api_keys = _get_gemini_keys(env)
    if not api_keys:
        raise ValueError("GOOGLE_API_KEY(S) is missing")

    model = env.get("GEMINI_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    failures: List[str] = []
    for api_key in api_keys:
        generation_config: Dict[str, Any] = {
            "temperature": temperature,
            "responseMimeType": "application/json",
        }
        if max_output_tokens is not None:
            generation_config["maxOutputTokens"] = max_output_tokens

        status, state, body = _http_json(
            url=url,
            method="POST",
            headers={"x-goog-api-key": api_key},
            payload={
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{system_prompt}\n\n{user_prompt}\n\nReturn only valid JSON."}
                        ],
                    }
                ],
                "generationConfig": generation_config,
            },
        )

        if status == 200:
            content = ((((body or {}).get("candidates") or [{}])[0].get("content") or {}).get("parts") or [{}])[0].get("text", "")
            return _extract_json_from_text(content)

        failures.append(f"key={api_key[:6]}... status={status} state={state}")

    raise RuntimeError(f"Gemini failed for all configured keys. {' | '.join(failures)}")


def _gemini_model(env: Dict[str, str]) -> str:
    return env.get("GEMINI_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"


def _call_hf_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    env: Dict[str, str],
    max_output_tokens: int | None = None,
) -> JsonDict:
    tokens = _get_hf_tokens(env)
    if not tokens:
        raise ValueError("HF_API_TOKEN(S) (or HUGGINGFACE_API_KEY) is missing")

    model = env.get("HF_MODEL", "openai/gpt-oss-120b:cheapest").strip() or "openai/gpt-oss-120b:cheapest"

    failures: List[str] = []
    for token in tokens:
        status, state, body = _http_json(
            url="https://router.huggingface.co/v1/chat/completions",
            method="POST",
            headers={"Authorization": f"Bearer {token}"},
            payload={
                "model": model,
                "temperature": temperature,
                "max_tokens": max_output_tokens or 700,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{user_prompt}\n\nReturn ONLY valid JSON."},
                ],
            },
            timeout=60,
        )

        if status == 200:
            message = (((body or {}).get("choices") or [{}])[0].get("message") or {})
            generated = message.get("content")
            # Some HF routed models populate reasoning text while content is null.
            if not generated:
                generated = message.get("reasoning")
            if not generated:
                raise RuntimeError("HF chat completion returned no content/reasoning JSON payload")

            return _extract_json_from_text(generated)

        failures.append(f"token={token[:6]}... status={status} state={state}")

    raise RuntimeError(f"Hugging Face failed for all configured tokens. {' | '.join(failures)}")


def _hf_model(env: Dict[str, str]) -> str:
    return env.get("HF_MODEL", "openai/gpt-oss-120b:cheapest").strip() or "openai/gpt-oss-120b:cheapest"


def request_llm_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.4,
    task_profile: str = "critical",
    max_output_tokens: int | None = None,
    task_name: str = "llm_task",
) -> JsonDict:
    env = load_env()

    has_hf = bool(_get_hf_tokens(env))
    has_gemini = bool(_get_gemini_keys(env))
    has_openai = bool(env.get("OPENAI_API_KEY"))

    if not (has_hf or has_gemini or has_openai):
        raise RuntimeError("No LLM provider configured. Add at least one API key.")

    preferred = (env.get("LLM_PROVIDER", "").strip().lower() or "hybrid")

    if preferred == "huggingface":
        order = ["hf", "gemini", "openai"]
    elif preferred == "gemini":
        order = ["gemini", "openai", "hf"]
    elif preferred == "openai":
        order = ["openai", "gemini", "hf"]
    else:
        # hybrid default: cheap-first for lightweight tasks.
        # gemini_first keeps a strong preference for Gemini while still allowing fallback.
        if task_profile == "light":
            order = ["hf", "gemini", "openai"]
        elif task_profile == "gemini_first":
            order = ["gemini", "hf", "openai"]
        else:
            order = ["gemini", "openai", "hf"]

    failures: List[str] = []

    for provider in order:
        try:
            if provider == "hf" and has_hf:
                data = _call_hf_json(system_prompt, user_prompt, temperature, env, max_output_tokens=max_output_tokens)
                _record_provider_trace(
                    task_name=task_name,
                    provider="huggingface",
                    model=_hf_model(env),
                    task_profile=task_profile,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
                return data
            if provider == "gemini" and has_gemini:
                data = _call_gemini_json(system_prompt, user_prompt, temperature, env, max_output_tokens=max_output_tokens)
                _record_provider_trace(
                    task_name=task_name,
                    provider="gemini",
                    model=_gemini_model(env),
                    task_profile=task_profile,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
                return data
            if provider == "openai" and has_openai:
                data = _call_openai_json(system_prompt, user_prompt, temperature, env, max_output_tokens=max_output_tokens)
                _record_provider_trace(
                    task_name=task_name,
                    provider="openai",
                    model=_openai_model(env),
                    task_profile=task_profile,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
                return data
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{provider}: {exc}")

    raise RuntimeError("All configured providers failed. " + " | ".join(failures))


def extract_cv_text_with_gemini(uploaded_doc: JsonDict) -> str:
    env = load_env()
    api_keys = _get_gemini_keys(env)
    if not api_keys:
        raise RuntimeError("GOOGLE_API_KEY is required for file extraction")

    model = env.get("GEMINI_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"

    failures: List[str] = []
    for api_key in api_keys:
        status, state, body = _http_json(
            url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            method="POST",
            headers={"x-goog-api-key": api_key},
            payload={
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": "Extract all readable CV/resume text from this file. Return plain text only, no markdown."
                            },
                            {
                                "inlineData": {
                                    "mimeType": uploaded_doc["mimeType"],
                                    "data": uploaded_doc["base64"],
                                }
                            },
                        ],
                    }
                ],
                "generationConfig": {"temperature": 0, "maxOutputTokens": 2048},
            },
            timeout=90,
        )

        if status == 200:
            text = ((((body or {}).get("candidates") or [{}])[0].get("content") or {}).get("parts") or [{}])[0].get("text", "")
            text = (text or "").strip()
            if text:
                _record_provider_trace(
                    task_name="cv_extraction",
                    provider="gemini",
                    model=model,
                    task_profile="gemini_first",
                    temperature=0,
                    max_output_tokens=2048,
                )
                return text

        failures.append(f"key={api_key[:6]}... status={status} state={state}")

    raise RuntimeError(f"Could not extract text from uploaded document. {' | '.join(failures)}")
