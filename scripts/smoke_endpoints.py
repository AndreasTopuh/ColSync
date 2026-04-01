from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:3000")
EMAIL = os.environ.get("SMOKE_EMAIL", "andreasielts@gmail.com")
PASSWORD = os.environ.get("SMOKE_PASSWORD", "halohalo")


def load_env_file(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    if not path.exists():
        return data
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def request_json(url: str, method: str = "GET", headers: dict[str, str] | None = None, payload: dict | None = None):
    body = None
    req_headers = headers.copy() if headers else {}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")

    req = urllib.request.Request(url=url, method=method, headers=req_headers, data=body)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            text = resp.read().decode("utf-8", errors="replace")
            return resp.getcode(), json.loads(text)
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(text)
        except Exception:
            parsed = {"raw": text}
        return exc.code, parsed
    except urllib.error.URLError as exc:
        return 0, {"error": str(exc)}


def main() -> int:
    env = load_env_file(Path(".env.local"))
    supabase_url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    supabase_anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or ""

    if not supabase_url or not supabase_anon:
        print("ERROR missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
        return 1

    login_status, login_body = request_json(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        method="POST",
        headers={"apikey": supabase_anon, "Content-Type": "application/json"},
        payload={"email": EMAIL, "password": PASSWORD},
    )
    print(f"LOGIN {login_status}")
    if login_status != 200:
        print(json.dumps(login_body, ensure_ascii=True))
        return 1

    token = login_body.get("access_token")
    if not token:
        print("ERROR no access_token returned")
        return 1

    auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    analyze_status, analyze = request_json(
        f"{BASE_URL}/api/analyze",
        method="POST",
        headers=auth_headers,
        payload={
            "dominant": "blue",
            "secondary": "yellow",
            "scores": {"red": 8, "blue": 16, "white": 10, "yellow": 14},
            "percentages": {"red": 20, "blue": 40, "white": 25, "yellow": 35},
            "health": "growing",
        },
    )
    print(f"ANALYZE {analyze_status} insights={len(analyze.get('insights') or []) if isinstance(analyze, dict) else 0}")
    if analyze_status != 200:
        print(f"ANALYZE_ERROR {json.dumps(analyze, ensure_ascii=True)}")

    jobs_status, jobs = request_json(
        f"{BASE_URL}/api/job-search",
        method="POST",
        headers=auth_headers,
        payload={
            "dominant": "blue",
            "secondary": "yellow",
            "interests": "backend",
            "location": "Remote / Global",
        },
    )
    print(f"JOB {jobs_status} jobs={len(jobs.get('jobs') or []) if isinstance(jobs, dict) else 0}")
    if jobs_status != 200:
        print(f"JOB_ERROR {json.dumps(jobs, ensure_ascii=True)}")

    cv_status, cv = request_json(
        f"{BASE_URL}/api/cv-audit",
        method="POST",
        headers=auth_headers,
        payload={
            "cvText": "backend python fastapi postgres docker",
            "jobDescription": "backend engineer api sql cloud",
        },
    )
    print(f"CV {cv_status} match={cv.get('matchScore') if isinstance(cv, dict) else None}")
    if cv_status != 200:
        print(f"CV_ERROR {json.dumps(cv, ensure_ascii=True)}")

    ok = analyze_status == 200 and jobs_status == 200 and cv_status == 200
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
