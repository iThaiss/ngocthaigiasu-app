"""
count_vocab.py — Read-only audit of the vocab library.
Prints set counts and the word/question distribution per system set.

Credentials (real values — Vercel-pulled .env files have these redacted):
  Set in your shell before running, e.g. PowerShell:
    $env:NEXT_PUBLIC_SUPABASE_URL = "https://xxxx.supabase.co"
    $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
  Or put them in a local file scripts/.env.real (git-ignored) as KEY=value lines.

Usage:
  python scripts/count_vocab.py
"""
import os
import sys
import requests


def load_env(path: str) -> None:
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env("scripts/.env.real")

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not URL or not KEY:
    sys.exit(
        "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and "
        "SUPABASE_SERVICE_ROLE_KEY in your shell or scripts/.env.real "
        "(the Vercel-pulled .env files store them redacted as \"\")."
    )

H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

r = requests.get(
    f"{URL}/rest/v1/vocab_sets",
    headers=H,
    params={"select": "id,name,is_system,is_active,word_count,question_count", "limit": "1000"},
)
r.raise_for_status()
sets = r.json()

sysset = [s for s in sets if s.get("is_system")]
active_sys = [s for s in sysset if s.get("is_active")]

print(f"Total sets in DB : {len(sets)}")
print(f"System sets      : {len(sysset)} (active: {len(active_sys)})")

if active_sys:
    words = [s.get("word_count", 0) for s in active_sys]
    qs = [s.get("question_count", 0) for s in active_sys]
    print(f"\nWords/set   -> min {min(words)}, max {max(words)}, avg {sum(words)/len(words):.1f}, total {sum(words)}")
    print(f"Questions/set -> min {min(qs)}, max {max(qs)}, avg {sum(qs)/len(qs):.1f}, total {sum(qs)}")

    print("\n10 sets with the fewest words:")
    for s in sorted(active_sys, key=lambda s: s.get("word_count", 0))[:10]:
        print(f"  {s.get('word_count', 0):3} từ · {s.get('question_count', 0):2} câu · {s['name']}")
