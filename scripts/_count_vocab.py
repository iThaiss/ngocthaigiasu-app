"""Temporary read-only script: count vocab sets and word/question distribution."""
import os, requests

def load_env(path):
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_env(".env.production.local")
load_env(".env.local")

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

# Pull all sets
r = requests.get(
    f"{URL}/rest/v1/vocab_sets",
    headers=H,
    params={"select": "id,name,is_system,is_active,word_count,question_count", "limit": "1000"},
)
r.raise_for_status()
sets = r.json()

sysset = [s for s in sets if s.get("is_system")]
active_sys = [s for s in sysset if s.get("is_active")]

print(f"Total sets in DB: {len(sets)}")
print(f"System sets: {len(sysset)} (active: {len(active_sys)})")

if active_sys:
    words = [s.get("word_count", 0) for s in active_sys]
    qs = [s.get("question_count", 0) for s in active_sys]
    print(f"\nWords/set  -> min {min(words)}, max {max(words)}, avg {sum(words)/len(words):.1f}, total {sum(words)}")
    print(f"Quest/set  -> min {min(qs)}, max {max(qs)}, avg {sum(qs)/len(qs):.1f}, total {sum(qs)}")

    # Verify actual word rows for a couple sets (word_count column may be stale)
    sample = active_sys[:3]
    print("\nSpot-check actual vocab_set_words rows:")
    for s in sample:
        rr = requests.get(
            f"{URL}/rest/v1/vocab_set_words",
            headers={**H, "Prefer": "count=exact"},
            params={"select": "id", "set_id": f"eq.{s['id']}", "limit": "1"},
        )
        cr = rr.headers.get("content-range", "?")
        print(f"  {s['name'][:30]:30} column={s.get('word_count')}  actual_range={cr}")

# Show low-word sets
low = sorted(active_sys, key=lambda s: s.get("word_count", 0))[:10]
print("\n10 sets with fewest words:")
for s in low:
    print(f"  {s.get('word_count',0):3} từ · {s.get('question_count',0):2} câu · {s['name']}")
