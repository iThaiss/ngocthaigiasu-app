"""
Enrich the vocabulary library with advanced C1-C2 words and new exam-relevant topics.

Modes:
  - augment: add advanced words/questions into existing system sets without deleting old data
  - new: create new system topic sets
  - thin: top up any active system sets that are still below target size
  - all: run augment and new

The script is idempotent: generated rows use stable IDs and cached AI payloads.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import anthropic
import requests


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "exports" / "advanced-vocab-cache"


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
load_env(Path("D:/Projects/pipeline/.env"))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = os.environ.get("ADVANCED_VOCAB_MODEL") or "claude-haiku-4-5"

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing Supabase credentials.")
if not ANTHROPIC_KEY:
    sys.exit("Missing ANTHROPIC_API_KEY.")


HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}
BASE = SUPABASE_URL.rstrip("/") + "/rest/v1"


EXISTING_AUGMENTS: list[dict[str, Any]] = [
    {"topic": "Medicine & Biotechnology", "focus": "advanced public health, bioethics, clinical research, biotech innovation", "order": 201},
    {"topic": "Globalization & Trade", "focus": "supply chains, protectionism, trade disputes, economic interdependence", "order": 202},
    {"topic": "Philosophy & Ethics", "focus": "moral reasoning, dilemmas, autonomy, justice, responsibility", "order": 203},
    {"topic": "Psychology & Behavior", "focus": "cognitive bias, motivation, habit formation, social behavior", "order": 204},
    {"topic": "Academic & Formal Language", "focus": "high-frequency C1-C2 academic verbs, adjectives, stance markers", "order": 205},
    {"topic": "International Relations", "focus": "diplomacy, alliances, sanctions, sovereignty, conflict resolution", "order": 206},
    {"topic": "Law & Justice", "focus": "rights, accountability, legal reform, due process, enforcement", "order": 207},
    {"topic": "Artificial Intelligence & Robots", "focus": "AI ethics, automation, algorithmic bias, human-machine collaboration", "order": 208},
    {"topic": "Finance & Banking", "focus": "inflation, debt, investment, monetary policy, household finance", "order": 209},
    {"topic": "Environment & Climate Change", "focus": "climate adaptation, biodiversity loss, mitigation, environmental policy", "order": 210},
    {"topic": "Science & Research", "focus": "research methods, evidence quality, uncertainty, peer review", "order": 211},
    {"topic": "Politics & Government", "focus": "governance, civic participation, policy trade-offs, public trust", "order": 212},
]


NEW_TOPICS: list[dict[str, Any]] = [
    {"name": "Misinformation & Digital Literacy", "name_vi": "Tin giả & Năng lực số", "group": "Media & Journalism", "level_range": "B2-C1", "focus": "fake news, source evaluation, online manipulation, media literacy", "order": 91},
    {"name": "Cybersecurity & Data Privacy", "name_vi": "An ninh mạng & Quyền riêng tư dữ liệu", "group": "Technology & Innovation", "level_range": "B2-C1", "focus": "privacy, data breaches, surveillance, online safety", "order": 92},
    {"name": "Public Health & Pandemics", "name_vi": "Y tế công cộng & Đại dịch", "group": "Health & Medicine", "level_range": "B2-C1", "focus": "vaccination, prevention, public health systems, outbreaks", "order": 93},
    {"name": "Aging Population & Demographic Change", "name_vi": "Dân số già & Biến đổi nhân khẩu", "group": "Community & Social Issues", "level_range": "B2-C1", "focus": "aging society, pensions, elderly care, workforce pressure", "order": 94},
    {"name": "Automation & Future of Work", "name_vi": "Tự động hóa & Tương lai việc làm", "group": "Work & Career", "level_range": "B2-C1", "focus": "automation, reskilling, job displacement, productivity", "order": 95},
    {"name": "Education Reform & Lifelong Learning", "name_vi": "Cải cách giáo dục & Học tập suốt đời", "group": "Education & Learning", "level_range": "B2-C1", "focus": "curriculum reform, digital learning, equity, lifelong learning", "order": 96},
    {"name": "Renewable Energy Transition", "name_vi": "Chuyển dịch năng lượng tái tạo", "group": "Energy & Natural Resources", "level_range": "B2-C1", "focus": "solar, wind, grid reliability, energy transition, decarbonization", "order": 97},
    {"name": "Sustainable Cities & Urban Planning", "name_vi": "Thành phố bền vững & Quy hoạch đô thị", "group": "Housing & Urban Life", "level_range": "B2-C1", "focus": "smart cities, public transport, green spaces, urban density", "order": 98},
    {"name": "Food Security & Supply Chains", "name_vi": "An ninh lương thực & Chuỗi cung ứng", "group": "Food & Nutrition", "level_range": "B2-C1", "focus": "food systems, shortages, agriculture, logistics, resilience", "order": 99},
    {"name": "Inequality & Social Mobility", "name_vi": "Bất bình đẳng & Dịch chuyển xã hội", "group": "Community & Social Issues", "level_range": "B2-C1", "focus": "income gaps, access to opportunity, poverty, social mobility", "order": 100},
    {"name": "Consumer Behavior & Advertising", "name_vi": "Hành vi tiêu dùng & Quảng cáo", "group": "Shopping & Consumerism", "level_range": "B2-C1", "focus": "consumer psychology, advertising, branding, impulse buying", "order": 101},
    {"name": "Disaster Preparedness & Resilience", "name_vi": "Phòng chống thiên tai & Khả năng phục hồi", "group": "Natural Disasters", "level_range": "B2-C1", "focus": "emergency planning, resilience, early warning, recovery", "order": 102},
]


SYSTEM_PROMPT = """Bạn là chuyên gia biên soạn từ vựng tiếng Anh luyện thi tốt nghiệp THPT/HSA/TSA cho học sinh Việt Nam.

Tạo dữ liệu chất lượng cao, giàu tính thi cử, không chung chung. Ưu tiên từ/cụm B2-C1-C2 xuất hiện trong bài đọc nghị luận, khoa học phổ thông, xã hội hiện đại và đề thi tốt nghiệp.

JSON thuần, không markdown:
{
  "words": [
    {
      "word": "từ/cụm tiếng Anh",
      "pronunciation": "/IPA nếu phù hợp/",
      "part_of_speech": "noun|verb|adjective|adverb|phrase|collocation",
      "definition_vi": "nghĩa tiếng Việt tự nhiên, đủ phân biệt sắc thái",
      "definition_en": "concise English definition",
      "level": "B2|C1|C2",
      "synonyms": ["tối đa 3"],
      "antonyms": ["tối đa 2"],
      "example_sentence": "Câu ví dụ học thuật/tin tức 14-26 từ."
    }
  ],
  "questions": [
    {
      "question_text": "English multiple-choice question with clear context.",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A|B|C|D",
      "question_type": "meaning|synonym|antonym|fill_blank|collocation",
      "difficulty": "intermediate|advanced",
      "explanation": "Giải thích tiếng Việt ngắn, chỉ rõ bẫy."
    }
  ]
}

Ràng buộc:
- Không trùng từ/cụm đã cho trong prompt.
- Không dùng đáp án mơ hồ có thể đúng hơn một lựa chọn.
- Ít nhất 70% words phải là C1 hoặc C2 khi prompt yêu cầu advanced augmentation.
- Ưu tiên collocations và academic phrases, không chỉ từ đơn.
- question_text và option_a/b/c/d bắt buộc viết bằng tiếng Anh; explanation viết bằng tiếng Việt.
"""


def rest_get(table: str, params: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    start = 0
    while True:
        res = requests.get(
            f"{BASE}/{table}",
            headers={**HEADERS, "Range-Unit": "items", "Range": f"{start}-{start + 999}"},
            params=params,
            timeout=60,
        )
        res.raise_for_status()
        batch = res.json()
        rows.extend(batch)
        if len(batch) < 1000:
            return rows
        start += 1000


def rest_upsert(table: str, rows: list[dict[str, Any]] | dict[str, Any]) -> None:
    payload = rows if isinstance(rows, list) else [rows]
    if not payload:
        return
    res = requests.post(
        f"{BASE}/{table}?on_conflict=id",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=payload,
        timeout=90,
    )
    res.raise_for_status()


def rest_patch(table: str, field: str, value: str, data: dict[str, Any]) -> None:
    res = requests.patch(
        f"{BASE}/{table}?{field}=eq.{value}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=data,
        timeout=60,
    )
    res.raise_for_status()


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def extract_json(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```\s*$", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def norm_list(value: Any, limit: int) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(x).strip() for x in value if str(x).strip()][:limit]


def normalize(payload: dict[str, Any], min_words: int, min_questions: int) -> dict[str, list[dict[str, Any]]]:
    words: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in payload.get("words", []):
        if not isinstance(raw, dict):
            continue
        word = str(raw.get("word", "")).strip().lower()
        definition_vi = str(raw.get("definition_vi", "")).strip()
        if len(word) < 2 or len(definition_vi) < 5 or word in seen:
            continue
        seen.add(word)
        pos = str(raw.get("part_of_speech", "phrase")).strip().lower().replace(" ", "_")
        if pos in {"n", "noun_phrase"}:
            pos = "noun" if pos == "n" else "phrase"
        if pos in {"v", "adj", "adv"}:
            pos = {"v": "verb", "adj": "adjective", "adv": "adverb"}[pos]
        if pos not in {"noun", "verb", "adjective", "adverb", "phrase", "collocation"}:
            pos = "phrase" if " " in word else "noun"
        level = str(raw.get("level", "C1")).upper()
        if level not in {"B2", "C1", "C2"}:
            level = "C1"
        words.append({
            "word": word,
            "pronunciation": str(raw.get("pronunciation", "")).strip(),
            "part_of_speech": pos,
            "definition_vi": definition_vi,
            "definition_en": str(raw.get("definition_en", "")).strip(),
            "level": level,
            "synonyms": norm_list(raw.get("synonyms"), 3),
            "antonyms": norm_list(raw.get("antonyms"), 2),
            "example_sentence": str(raw.get("example_sentence", "")).strip(),
        })

    questions: list[dict[str, Any]] = []
    for raw in payload.get("questions", []):
        if not isinstance(raw, dict):
            continue
        qtext = str(raw.get("question_text", "")).strip()
        opts = [str(raw.get(f"option_{x}", "")).strip() for x in "abcd"]
        answer = str(raw.get("correct_answer", "")).strip().upper()[:1]
        if len(qtext) < 12 or not all(opts) or len({o.lower() for o in opts}) < 4 or answer not in {"A", "B", "C", "D"}:
            continue
        qtype = str(raw.get("question_type", "meaning")).strip().lower()
        if qtype not in {"meaning", "synonym", "antonym", "fill_blank", "collocation"}:
            qtype = "meaning"
        difficulty = str(raw.get("difficulty", "advanced")).strip().lower()
        if difficulty not in {"intermediate", "advanced"}:
            difficulty = "advanced"
        questions.append({
            "question_text": qtext,
            "option_a": opts[0],
            "option_b": opts[1],
            "option_c": opts[2],
            "option_d": opts[3],
            "correct_answer": answer,
            "question_type": qtype,
            "difficulty": difficulty,
            "explanation": str(raw.get("explanation", "")).strip(),
        })

    if len(words) < min_words:
        raise ValueError(f"Only {len(words)} valid words")
    if len(questions) < min_questions:
        raise ValueError(f"Only {len(questions)} valid questions")
    return {"words": words, "questions": questions}


def call_ai(client: anthropic.Anthropic, prompt: str, cache_file: Path, refresh: bool, min_words: int, min_questions: int) -> dict[str, list[dict[str, Any]]]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if cache_file.exists() and not refresh:
        return normalize(json.loads(cache_file.read_text(encoding="utf-8")), min_words, min_questions)
    msg = client.messages.create(
        model=MODEL,
        max_tokens=12000,
        temperature=0.25,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text
    try:
        payload = normalize(extract_json(raw), min_words, min_questions)
    except Exception:
        cache_file.with_suffix(".raw.txt").write_text(raw, encoding="utf-8")
        raise
    cache_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def update_counts(set_id: str) -> None:
    wc = rest_get("vocab_set_words", {"set_id": f"eq.{set_id}", "select": "id"})
    qc = rest_get("vocab_questions", {"set_id": f"eq.{set_id}", "select": "id"})
    rest_patch("vocab_sets", "id", set_id, {"word_count": len(wc), "question_count": len(qc)})


def augment_existing(client: anthropic.Anthropic, spec: dict[str, Any], words: int, questions: int, dry_run: bool, refresh: bool) -> tuple[int, int]:
    sets = rest_get("vocab_sets", {"topic": f"eq.{spec['topic']}", "is_system": "eq.true", "select": "id,name,topic,word_count,question_count"})
    if len(sets) != 1:
        raise ValueError(f"Expected one system set for topic {spec['topic']}, got {len(sets)}")
    set_row = sets[0]
    set_id = set_row["id"]
    existing = rest_get("vocab_set_words", {"set_id": f"eq.{set_id}", "select": "word,order_index", "order": "order_index.asc"})
    existing_words = [w["word"] for w in existing]
    prompt = f"""
Enrich an existing vocabulary set with advanced C1-C2 additions.

Set name: {set_row['name']}
Topic: {spec['topic']}
Focus: {spec['focus']}
Existing words to avoid: {', '.join(existing_words[:120])}

Create exactly {words} NEW words/collocations/phrases and {questions} NEW questions.
At least 70% of words must be C1 or C2. Do not repeat existing words.
"""
    payload = call_ai(
        client,
        prompt,
        CACHE_DIR / f"augment-{spec['order']}-{slug(spec['topic'])}.json",
        refresh,
        max(12, words - 4),
        max(6, questions - 2),
    )
    existing_lower = {w.lower() for w in existing_words}
    new_words = [w for w in payload["words"] if w["word"].lower() not in existing_lower]
    if dry_run:
        return len(new_words), len(payload["questions"])

    max_order = max([int(w.get("order_index") or 0) for w in existing] or [-1])
    word_rows = []
    for i, word in enumerate(new_words):
        word_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-advanced-{spec['order']}-{word['word']}")),
            "set_id": set_id,
            "order_index": max_order + 1 + i,
            **word,
        })
    rest_upsert("vocab_set_words", word_rows)
    q_rows = []
    for i, q in enumerate(payload["questions"]):
        q_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-advanced-{spec['order']}-q-{i}")),
            "set_id": set_id,
            **q,
        })
    rest_upsert("vocab_questions", q_rows)
    update_counts(set_id)
    return len(word_rows), len(q_rows)


def top_up_thin_set(client: anthropic.Anthropic, set_row: dict[str, Any], target_words: int, target_questions: int, dry_run: bool, refresh: bool) -> tuple[int, int]:
    set_id = set_row["id"]
    current_words = int(set_row.get("word_count") or 0)
    current_questions = int(set_row.get("question_count") or 0)
    add_words = max(0, target_words - current_words)
    add_questions = max(0, target_questions - current_questions)
    if add_words <= 0 and add_questions <= 0:
        return 0, 0

    # Keep each generation request substantial enough for quality and review.
    request_words = max(add_words, 10 if add_words > 0 else 0)
    request_questions = max(add_questions, 6 if add_questions > 0 else 0)

    existing = rest_get("vocab_set_words", {"set_id": f"eq.{set_id}", "select": "word,order_index,level", "order": "order_index.asc"})
    existing_words = [w["word"] for w in existing]
    level_hint = "B1-B2"
    description = str(set_row.get("description") or "")
    if "C1" in description or "C2" in description:
        level_hint = "B2-C1"
    if "C1-C2" in description or "B2-C2" in description:
        level_hint = "C1-C2"

    prompt = f"""
Top up an existing vocabulary set so it becomes richer and more useful.

Set name: {set_row.get('name')}
Topic: {set_row.get('topic')}
Description: {description}
Suggested level range: {level_hint}
Existing words to avoid: {', '.join(existing_words[:140])}

Create exactly {request_words} NEW words/collocations/phrases and {request_questions} NEW questions.
Match the level range and topic. Include useful collocations, academic phrases, exam traps, and high-frequency reading vocabulary.
Do not repeat existing words. Questions/options must be English; explanations must be Vietnamese.
"""
    payload = call_ai(
        client,
        prompt,
        CACHE_DIR / f"thin-{slug(str(set_row.get('order_index', 'x')))}-{slug(str(set_row.get('topic') or set_row.get('name')))}-{current_words}w-{current_questions}q-to-{target_words}w-{target_questions}q.json",
        refresh,
        0 if request_words == 0 else max(6, request_words - 4),
        0 if request_questions == 0 else max(4, request_questions - 2),
    )
    existing_lower = {w.lower() for w in existing_words}
    new_words = [w for w in payload["words"] if w["word"].lower() not in existing_lower]
    if add_words > 0:
        new_words = new_words[:request_words]
    else:
        new_words = []
    new_questions = payload["questions"][:request_questions] if add_questions > 0 else []

    if dry_run:
        return len(new_words), len(new_questions)

    max_order = max([int(w.get("order_index") or 0) for w in existing] or [-1])
    word_rows = []
    for i, word in enumerate(new_words):
        word_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-thin-{target_words}-{word['word']}")),
            "set_id": set_id,
            "order_index": max_order + 1 + i,
            **word,
        })
    rest_upsert("vocab_set_words", word_rows)

    q_rows = []
    for i, q in enumerate(new_questions):
        q_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-thin-{target_questions}-q-{i}")),
            "set_id": set_id,
            **q,
        })
    rest_upsert("vocab_questions", q_rows)
    update_counts(set_id)
    return len(word_rows), len(q_rows)


def create_new_topic(client: anthropic.Anthropic, spec: dict[str, Any], words: int, questions: int, dry_run: bool, refresh: bool) -> tuple[int, int]:
    set_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"advanced-topic-{spec['name']}"))
    prompt = f"""
Create a new exam-relevant vocabulary topic.

Vietnamese name: {spec['name_vi']}
English topic: {spec['name']}
Level range: {spec['level_range']}
Focus: {spec['focus']}

Create exactly {words} words/collocations/phrases and {questions} questions.
Make it useful for Vietnamese high-school students reading modern exam passages.
"""
    payload = call_ai(
        client,
        prompt,
        CACHE_DIR / f"new-{spec['order']}-{slug(spec['name'])}.json",
        refresh,
        max(22, words - 5),
        max(10, questions - 3),
    )
    if dry_run:
        return len(payload["words"]), len(payload["questions"])

    rest_upsert("vocab_sets", {
        "id": set_id,
        "name": spec["name_vi"],
        "description": f"Từ vựng {spec['name_vi']} — {spec['level_range']} — chủ đề mới hay gặp trong bài đọc hiện đại",
        "topic": spec["name"],
        "subtopic_code": "E2X.ADV",
        "word_count": len(payload["words"]),
        "question_count": len(payload["questions"]),
        "is_active": True,
        "is_public": True,
        "is_ai_generated": True,
        "is_system": True,
        "featured": False,
        "order_index": spec["order"],
    })
    word_rows = []
    for i, word in enumerate(payload["words"]):
        word_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-word-{i}-{word['word']}")),
            "set_id": set_id,
            "order_index": i,
            **word,
        })
    rest_upsert("vocab_set_words", word_rows)
    q_rows = []
    for i, q in enumerate(payload["questions"]):
        q_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-question-{i}")),
            "set_id": set_id,
            **q,
        })
    rest_upsert("vocab_questions", q_rows)
    update_counts(set_id)
    return len(word_rows), len(q_rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["augment", "new", "thin", "all"], default="all")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--only")
    parser.add_argument("--augment-words", type=int, default=18)
    parser.add_argument("--augment-questions", type=int, default=8)
    parser.add_argument("--new-words", type=int, default=32)
    parser.add_argument("--new-questions", type=int, default=14)
    parser.add_argument("--target-words", type=int, default=40)
    parser.add_argument("--target-questions", type=int, default=20)
    args = parser.parse_args()

    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    jobs: list[tuple[str, dict[str, Any]]] = []
    if args.mode in {"augment", "all"}:
        jobs += [("augment", spec) for spec in EXISTING_AUGMENTS]
    if args.mode in {"new", "all"}:
        jobs += [("new", spec) for spec in NEW_TOPICS]
    if args.mode == "thin":
        all_sets = rest_get(
            "vocab_sets",
            {
                "is_system": "eq.true",
                "is_active": "eq.true",
                "select": "id,name,description,topic,word_count,question_count,order_index",
                "order": "order_index.asc",
            },
        )
        jobs += [
            ("thin", spec)
            for spec in all_sets
            if int(spec.get("word_count") or 0) < args.target_words
            or int(spec.get("question_count") or 0) < args.target_questions
        ]
    if args.only:
        needle = args.only.lower()
        jobs = [(kind, spec) for kind, spec in jobs if needle in json.dumps(spec, ensure_ascii=False).lower()]
    if args.limit:
        jobs = jobs[: args.limit]

    print(f"Advanced vocab enrichment: {len(jobs)} jobs | mode={args.mode} | dry_run={args.dry_run} | model={MODEL}")
    total_w = total_q = 0
    failed: list[str] = []
    for idx, (kind, spec) in enumerate(jobs, 1):
        name = spec.get("name_vi") or spec.get("topic")
        print(f"[{idx}/{len(jobs)}] {kind}: {name}", flush=True)
        try:
            if kind == "augment":
                w, q = augment_existing(client, spec, args.augment_words, args.augment_questions, args.dry_run, args.refresh)
            elif kind == "new":
                w, q = create_new_topic(client, spec, args.new_words, args.new_questions, args.dry_run, args.refresh)
            else:
                w, q = top_up_thin_set(client, spec, args.target_words, args.target_questions, args.dry_run, args.refresh)
            print(f"  OK: {w} words, {q} questions", flush=True)
            total_w += w
            total_q += q
        except Exception as exc:
            print(f"  FAILED: {exc}", flush=True)
            failed.append(str(name))
        if idx < len(jobs):
            time.sleep(0.6)
    print(f"\nTotal: {total_w} words, {total_q} questions, failures={len(failed)}")
    if failed:
        print("Failed:", ", ".join(failed))


if __name__ == "__main__":
    main()
