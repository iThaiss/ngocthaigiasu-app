"""
cleanup_legacy_sets.py
──────────────────────────────────────────────────────────────
Xóa các legacy vocab sets từ pipeline cũ (is_system=TRUE, is_ai_generated=FALSE).
Các set này có subtopic_code E2X.01–E2X.08 và được import bằng random UUID4.

Usage:
  python scripts/cleanup_legacy_sets.py
  python scripts/cleanup_legacy_sets.py --dry-run   # chỉ hiện danh sách, không xóa
──────────────────────────────────────────────────────────────
"""
import argparse
import os
import sys

def _load_dotenv(path: str = ".env.local") -> None:
    if not os.path.exists(path):
        path = ".env"
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_dotenv()

import requests

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

BASE = SUPABASE_URL.rstrip("/") + "/rest/v1"


def list_legacy_sets() -> list:
    """Tìm tất cả sets có is_system=TRUE và is_ai_generated=FALSE."""
    r = requests.get(
        f"{BASE}/vocab_sets",
        headers={**HEADERS, "Range-Unit": "items", "Range": "0-999"},
        params={
            "is_system": "eq.true",
            "is_ai_generated": "eq.false",
            "select": "id,name,topic,subtopic_code,word_count,question_count,created_at",
            "order": "created_at.desc",
        },
    )
    r.raise_for_status()
    return r.json()


def delete_set(set_id: str) -> None:
    r = requests.delete(f"{BASE}/vocab_sets?id=eq.{set_id}", headers=HEADERS)
    r.raise_for_status()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Chỉ liệt kê, không xóa")
    args = parser.parse_args()

    print("Tìm legacy vocab sets (is_system=TRUE, is_ai_generated=FALSE)...")
    sets = list_legacy_sets()

    if not sets:
        print("✓ Không có legacy set nào. Database sạch.")
        return

    print(f"\nTìm thấy {len(sets)} legacy sets:\n")
    for s in sets:
        print(f"  [{s['id'][:8]}...] {s['name']!r:45s} | {s['word_count']} từ · {s['question_count']} câu | topic={s.get('topic','')!r}")

    if args.dry_run:
        print(f"\n--dry-run: Không xóa. Chạy lại không có --dry-run để xóa {len(sets)} sets.")
        return

    print(f"\nXóa {len(sets)} sets...")
    deleted = 0
    for s in sets:
        try:
            delete_set(s["id"])
            print(f"  ✓ Đã xóa: {s['name']!r}")
            deleted += 1
        except Exception as e:
            print(f"  ✗ Lỗi xóa {s['name']!r}: {e}", file=sys.stderr)

    print(f"\nHoàn tất: đã xóa {deleted}/{len(sets)} legacy sets.")


if __name__ == "__main__":
    main()
