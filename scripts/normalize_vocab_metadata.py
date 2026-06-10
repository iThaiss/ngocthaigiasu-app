"""
Normalize safe vocabulary metadata in Supabase.

Currently this script only standardizes part_of_speech values in vocab_set_words.
It does not rewrite definitions, examples, questions, or user progress.

Usage:
  python scripts/normalize_vocab_metadata.py --dry-run
  python scripts/normalize_vocab_metadata.py --apply
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests


ROOT = Path(__file__).resolve().parents[1]


def load_env(path: Path) -> None:
  if not path.exists():
    return
  for raw in path.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    key, value = line.split("=", 1)
    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env(ROOT / "scripts" / ".env.real")
load_env(ROOT / ".env.local")

SUPABASE_URL = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

POS_MAP = {
  "n": "noun",
  "noun": "noun",
  "v": "verb",
  "verb": "verb",
  "adj": "adjective",
  "adjective": "adjective",
  "adv": "adverb",
  "adverb": "adverb",
  "phrasal verb": "phrasal_verb",
  "phrasal_verb": "phrasal_verb",
  "phrasal-verb": "phrasal_verb",
  "noun phrase": "phrase",
  "verb phrase": "phrase",
  "fixed phrase": "phrase",
  "phrase": "phrase",
  "collocation": "collocation",
  "connector": "connector",
  "linker": "connector",
}


class SupabaseREST:
  def __init__(self, url: str, key: str) -> None:
    self.base = url.rstrip("/") + "/rest/v1"
    self.headers = {
      "apikey": key,
      "Authorization": f"Bearer {key}",
      "Content-Type": "application/json",
    }

  def get_page(self, offset: int, limit: int = 1000) -> list[dict[str, Any]]:
    res = requests.get(
      f"{self.base}/vocab_set_words",
      headers=self.headers,
      params={
        "select": "id,word,part_of_speech",
        "order": "id.asc",
        "offset": str(offset),
        "limit": str(limit),
      },
      timeout=60,
    )
    res.raise_for_status()
    return res.json()

  def update_pos_value(self, old_value: str, new_value: str) -> None:
    res = requests.patch(
      f"{self.base}/vocab_set_words?part_of_speech=eq.{quote(old_value, safe='')}",
      headers={**self.headers, "Prefer": "return=minimal"},
      json={"part_of_speech": new_value},
      timeout=60,
    )
    res.raise_for_status()


def canonical_pos(value: str | None) -> str | None:
  if value is None:
    return None
  cleaned = " ".join(value.strip().lower().replace("_", " ").split())
  return POS_MAP.get(cleaned)


def main() -> int:
  parser = argparse.ArgumentParser()
  parser.add_argument("--dry-run", action="store_true", help="Print planned changes without writing.")
  parser.add_argument("--apply", action="store_true", help="Apply safe metadata updates.")
  args = parser.parse_args()

  if args.dry_run == args.apply:
    parser.error("Choose exactly one of --dry-run or --apply.")

  if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing Supabase credentials. Check scripts/.env.real.")

  db = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)
  rows: list[dict[str, Any]] = []
  offset = 0
  while True:
    page = db.get_page(offset)
    rows.extend(page)
    if len(page) < 1000:
      break
    offset += 1000

  current = Counter((row.get("part_of_speech") or "").strip() or "(blank)" for row in rows)
  changes: list[tuple[str, str, str, str]] = []
  grouped_changes: dict[str, str] = {}
  unmapped = Counter()

  for row in rows:
    raw = row.get("part_of_speech")
    canonical = canonical_pos(raw)
    if canonical and raw != canonical:
      changes.append((row["id"], row.get("word") or "", raw or "", canonical))
      grouped_changes[raw] = canonical
    elif raw and not canonical:
      unmapped[raw] += 1

  print(f"Rows scanned : {len(rows)}")
  print(f"POS values   : {dict(sorted(current.items()))}")
  print(f"To update    : {len(changes)}")
  if changes:
    print("\nSample changes:")
    for _, word, old, new in changes[:20]:
      print(f"  {word}: {old!r} -> {new!r}")
  if unmapped:
    print("\nUnmapped values left untouched:")
    for value, count in sorted(unmapped.items()):
      print(f"  {value!r}: {count}")

  if args.dry_run:
    return 0

  for old, new in sorted(grouped_changes.items()):
    db.update_pos_value(old, new)
  print(f"\nApplied {len(changes)} updates.")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
