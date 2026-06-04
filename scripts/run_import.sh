#!/usr/bin/env bash
# run_import.sh — chạy import toàn bộ 35 topic system decks
# Usage: bash scripts/run_import.sh

set -e

SUPABASE_URL="https://eqrrjarsnrtvlsdfjhph.supabase.co"
SUPABASE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY ../pipeline/.env | cut -d= -f2)"
ANTHROPIC_KEY="$(grep ANTHROPIC_API_KEY ../pipeline/.env | cut -d= -f2)"

export PYTHONIOENCODING=utf-8
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_KEY"
export ANTHROPIC_API_KEY="$ANTHROPIC_KEY"

python scripts/import_vocab.py --words 20 --questions 12 "$@"
