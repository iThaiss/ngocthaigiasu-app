"""
Import enriched exam vocabulary skill decks into Supabase.

This script creates stable system decks for skill-based vocabulary practice:
context meaning, natural word partnerships, verb patterns, connectors, word
families, and exam traps.

Usage:
  $env:PYTHONIOENCODING="utf-8"
  python scripts/import_exam_vocab_skills.py --dry-run
  python scripts/import_exam_vocab_skills.py
  python scripts/import_exam_vocab_skills.py --limit 2
  python scripts/import_exam_vocab_skills.py --only "Context Synonyms"
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
CACHE_DIR = ROOT / "exports" / "exam-vocab-skills-cache"


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
load_env(ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = os.environ.get("EXAM_VOCAB_MODEL") or os.environ.get("AI_VOCAB_MODEL") or "claude-haiku-4-5"

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing Supabase credentials. Check scripts/.env.real.")
if not ANTHROPIC_KEY:
    sys.exit("Missing ANTHROPIC_API_KEY. Check D:/Projects/pipeline/.env or local env.")


class SupabaseREST:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def upsert(self, table: str, records: list[dict[str, Any]] | dict[str, Any], on_conflict: str = "id") -> None:
        data = records if isinstance(records, list) else [records]
        res = requests.post(
            f"{self.base}/{table}?on_conflict={on_conflict}",
            headers={**self.headers, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json=data,
            timeout=60,
        )
        res.raise_for_status()

    def delete_where(self, table: str, field: str, value: str) -> None:
        res = requests.delete(
            f"{self.base}/{table}?{field}=eq.{value}",
            headers=self.headers,
            timeout=60,
        )
        res.raise_for_status()

    def insert(self, table: str, records: list[dict[str, Any]]) -> None:
        if not records:
            return
        res = requests.post(
            f"{self.base}/{table}",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=records,
            timeout=90,
        )
        res.raise_for_status()

    def update(self, table: str, data: dict[str, Any], field: str, value: str) -> None:
        res = requests.patch(
            f"{self.base}/{table}?{field}=eq.{value}",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=data,
            timeout=60,
        )
        res.raise_for_status()


SKILL_SETS: list[dict[str, Any]] = [
    # Contextual meaning
    {"category": "Contextual Meaning", "category_vi": "Hiểu Nghĩa Theo Ngữ Cảnh", "name": "Polysemous Words in Exams", "name_vi": "Từ Nhiều Nghĩa Trong Đề", "focus": "words whose meaning changes by context, e.g. issue, address, charge, conduct", "question_types": ["meaning", "synonym"], "order": 61},
    {"category": "Contextual Meaning", "category_vi": "Hiểu Nghĩa Theo Ngữ Cảnh", "name": "Context-Based Synonyms", "name_vi": "Đồng Nghĩa Theo Ngữ Cảnh", "focus": "closest meaning questions where the right synonym depends on the sentence", "question_types": ["synonym", "meaning"], "order": 62},
    {"category": "Contextual Meaning", "category_vi": "Hiểu Nghĩa Theo Ngữ Cảnh", "name": "Context-Based Antonyms", "name_vi": "Trái Nghĩa Theo Ngữ Cảnh", "focus": "opposites in context, including academic verbs and adjectives", "question_types": ["antonym", "meaning"], "order": 63},
    {"category": "Contextual Meaning", "category_vi": "Hiểu Nghĩa Theo Ngữ Cảnh", "name": "Tone and Connotation", "name_vi": "Sắc Thái Nghĩa & Thái Độ", "focus": "positive, negative, neutral, formal, cautious, critical, approving word choice", "question_types": ["meaning", "synonym"], "order": 64},
    {"category": "Contextual Meaning", "category_vi": "Hiểu Nghĩa Theo Ngữ Cảnh", "name": "Easily Confused Meaning Pairs", "name_vi": "Cặp Từ Dễ Nhầm Nghĩa", "focus": "economic/economical, historic/historical, effective/efficient, sensible/sensitive", "question_types": ["meaning", "fill_blank"], "order": 65},

    # Natural word partnerships
    {"category": "Natural Word Partnerships", "category_vi": "Cụm Từ Tự Nhiên", "name": "Verb + Noun Collocations", "name_vi": "Collocation Động Từ + Danh Từ", "focus": "make progress, raise awareness, pose a threat, conduct research", "question_types": ["collocation", "fill_blank"], "order": 66},
    {"category": "Natural Word Partnerships", "category_vi": "Cụm Từ Tự Nhiên", "name": "Adjective + Noun Collocations", "name_vi": "Collocation Tính Từ + Danh Từ", "focus": "strong evidence, major concern, sustainable development, fierce competition", "question_types": ["collocation", "fill_blank"], "order": 67},
    {"category": "Natural Word Partnerships", "category_vi": "Cụm Từ Tự Nhiên", "name": "Academic Collocations", "name_vi": "Cụm Học Thuật Hay Gặp", "focus": "play a role, provide insight, reach a conclusion, have implications", "question_types": ["collocation", "meaning"], "order": 68},
    {"category": "Natural Word Partnerships", "category_vi": "Cụm Từ Tự Nhiên", "name": "Intensifier Collocations", "name_vi": "Trạng Từ Nhấn Mạnh Tự Nhiên", "focus": "highly likely, deeply concerned, strictly prohibited, widely accepted", "question_types": ["collocation", "fill_blank"], "order": 69},
    {"category": "Natural Word Partnerships", "category_vi": "Cụm Từ Tự Nhiên", "name": "Fixed Expressions in Reading", "name_vi": "Cụm Cố Định Trong Bài Đọc", "focus": "in terms of, with regard to, for the sake of, by means of", "question_types": ["collocation", "meaning"], "order": 70},

    # Verb patterns
    {"category": "Verb Patterns", "category_vi": "Cụm Động Từ & Động Từ Đi Kèm", "name": "Academic Phrasal Verbs", "name_vi": "Phrasal Verb Học Thuật", "focus": "account for, result from, stem from, bring about, point out", "question_types": ["meaning", "fill_blank"], "order": 71},
    {"category": "Verb Patterns", "category_vi": "Cụm Động Từ & Động Từ Đi Kèm", "name": "Everyday Phrasal Verbs in Reading", "name_vi": "Phrasal Verb Đời Sống Trong Bài Đọc", "focus": "take up, give up, look after, turn down, put off in exam contexts", "question_types": ["meaning", "fill_blank"], "order": 72},
    {"category": "Verb Patterns", "category_vi": "Cụm Động Từ & Động Từ Đi Kèm", "name": "Verb + Preposition Patterns", "name_vi": "Động Từ Đi Với Giới Từ", "focus": "depend on, refer to, contribute to, suffer from, object to", "question_types": ["collocation", "fill_blank"], "order": 73},
    {"category": "Verb Patterns", "category_vi": "Cụm Động Từ & Động Từ Đi Kèm", "name": "Three-Word Verb Phrases", "name_vi": "Cụm Động Từ Ba Thành Phần", "focus": "come up with, look forward to, keep up with, put up with", "question_types": ["meaning", "collocation"], "order": 74},
    {"category": "Verb Patterns", "category_vi": "Cụm Động Từ & Động Từ Đi Kèm", "name": "Confusing Verb Phrases", "name_vi": "Cụm Động Từ Dễ Nhầm", "focus": "bring up/bring about/bring in, take off/take over/take up", "question_types": ["meaning", "fill_blank"], "order": 75},

    # Connectors
    {"category": "Connectors and Logic", "category_vi": "Từ Nối & Logic Câu", "name": "Addition and Reinforcement", "name_vi": "Thêm Ý & Nhấn Mạnh", "focus": "moreover, furthermore, in addition, not only that, above all", "question_types": ["fill_blank", "meaning"], "order": 76},
    {"category": "Connectors and Logic", "category_vi": "Từ Nối & Logic Câu", "name": "Contrast and Concession", "name_vi": "Tương Phản & Nhượng Bộ", "focus": "however, nevertheless, whereas, although, despite, even so", "question_types": ["fill_blank", "meaning"], "order": 77},
    {"category": "Connectors and Logic", "category_vi": "Từ Nối & Logic Câu", "name": "Cause and Effect", "name_vi": "Nguyên Nhân & Kết Quả", "focus": "therefore, consequently, as a result, due to, owing to", "question_types": ["fill_blank", "meaning"], "order": 78},
    {"category": "Connectors and Logic", "category_vi": "Từ Nối & Logic Câu", "name": "Exemplification and Restatement", "name_vi": "Nêu Ví Dụ & Diễn Giải Lại", "focus": "for instance, namely, that is, in other words, to put it simply", "question_types": ["fill_blank", "meaning"], "order": 79},
    {"category": "Connectors and Logic", "category_vi": "Từ Nối & Logic Câu", "name": "Sequencing and Conclusion", "name_vi": "Trình Tự & Kết Luận", "focus": "initially, subsequently, ultimately, overall, to sum up", "question_types": ["fill_blank", "meaning"], "order": 80},

    # Word families
    {"category": "Word Families", "category_vi": "Họ Từ & Dạng Từ", "name": "Noun Verb Adjective Adverb Families", "name_vi": "Họ Từ Danh-Động-Tính-Trạng", "focus": "decide/decision/decisive/decisively; analyze/analysis/analytical", "question_types": ["word_form", "fill_blank"], "order": 81},
    {"category": "Word Families", "category_vi": "Họ Từ & Dạng Từ", "name": "Negative Prefixes", "name_vi": "Tiền Tố Phủ Định", "focus": "un-, in-, im-, ir-, il-, dis-, non- with common exam adjectives", "question_types": ["word_form", "meaning"], "order": 82},
    {"category": "Word Families", "category_vi": "Họ Từ & Dạng Từ", "name": "Suffix Patterns", "name_vi": "Hậu Tố Tạo Từ", "focus": "-tion, -ment, -ity, -ness, -ive, -al, -ly in exam vocabulary", "question_types": ["word_form", "fill_blank"], "order": 83},
    {"category": "Word Families", "category_vi": "Họ Từ & Dạng Từ", "name": "Compound and Derived Words", "name_vi": "Từ Ghép & Từ Phái Sinh", "focus": "breakthrough, drawback, sustainable, overestimate, underfunded", "question_types": ["meaning", "word_form"], "order": 84},
    {"category": "Word Families", "category_vi": "Họ Từ & Dạng Từ", "name": "Word Form Trap Pairs", "name_vi": "Cặp Dạng Từ Dễ Mắc Bẫy", "focus": "successful/successive, considerable/considerate, respective/respectful", "question_types": ["word_form", "meaning"], "order": 85},

    # Exam traps
    {"category": "Exam Traps", "category_vi": "Bẫy Từ Vựng Trong Đề", "name": "Formal and Informal Register", "name_vi": "Trang Trọng & Thân Mật", "focus": "purchase/buy, children/kids, assist/help, commence/start", "question_types": ["meaning", "synonym"], "order": 86},
    {"category": "Exam Traps", "category_vi": "Bẫy Từ Vựng Trong Đề", "name": "Near Synonyms with Different Use", "name_vi": "Từ Gần Nghĩa Nhưng Khác Cách Dùng", "focus": "problem/issue/matter, chance/opportunity/possibility, affect/influence", "question_types": ["meaning", "fill_blank"], "order": 87},
    {"category": "Exam Traps", "category_vi": "Bẫy Từ Vựng Trong Đề", "name": "Vietnamese Translation Traps", "name_vi": "Bẫy Dịch Việt Sang Anh", "focus": "common Vietnamese learner traps caused by literal translation", "question_types": ["meaning", "collocation"], "order": 88},
    {"category": "Exam Traps", "category_vi": "Bẫy Từ Vựng Trong Đề", "name": "Common Distractors in Multiple Choice", "name_vi": "Nhiễu Thường Gặp Trong Trắc Nghiệm", "focus": "options that are grammatically possible but semantically or collocationally wrong", "question_types": ["fill_blank", "meaning"], "order": 89},
    {"category": "Exam Traps", "category_vi": "Bẫy Từ Vựng Trong Đề", "name": "Paraphrase and Rewording", "name_vi": "Paraphrase & Diễn Đạt Lại", "focus": "recognizing equivalent meaning in reading questions and answer choices", "question_types": ["synonym", "meaning"], "order": 90},
]


SYSTEM_PROMPT = """Bạn là chuyên gia xây dựng kho từ vựng luyện thi tiếng Anh cho học sinh THPT Việt Nam.

Hãy tạo dữ liệu chất lượng cao, tự nhiên, kiểm tra được trong bài thi. Không dùng từ/cụm quá hiếm hoặc sáo rỗng.
Ưu tiên B1-B2-C1, phù hợp THPT Quốc gia, HSA, TSA, đánh giá năng lực và các bài đọc học thuật phổ thông.

Trả về JSON thuần, không markdown, đúng schema:
{
  "words": [
    {
      "word": "từ hoặc cụm từ tiếng Anh",
      "pronunciation": "/IPA nếu là một từ; để rỗng nếu là cụm dài khó đọc/",
      "part_of_speech": "noun|verb|adjective|adverb|phrase|phrasal_verb|connector|collocation",
      "definition_vi": "nghĩa tiếng Việt tự nhiên, ngắn gọn nhưng đủ phân biệt",
      "definition_en": "concise English definition",
      "level": "B1|B2|C1",
      "synonyms": ["tối đa 3"],
      "antonyms": ["tối đa 2"],
      "example_sentence": "Một câu ví dụ tự nhiên, 14-24 từ, phù hợp ngữ cảnh học thuật/đề thi."
    }
  ],
  "questions": [
    {
      "question_text": "Câu hỏi trắc nghiệm 4 lựa chọn, có ngữ cảnh rõ.",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A|B|C|D",
      "question_type": "meaning|synonym|antonym|fill_blank|collocation|word_form",
      "difficulty": "basic|intermediate|advanced",
      "explanation": "Giải thích ngắn bằng tiếng Việt, nêu vì sao đáp án đúng và/hoặc bẫy sai."
    }
  ]
}

Quy tắc chất lượng:
- Không trùng word trong cùng bộ.
- Không tạo câu hỏi mơ hồ hoặc có hơn một đáp án đúng.
- Với collocation/fixed phrase/phrasal verb/connector, word phải là cả cụm, không chỉ một từ rời.
- Câu hỏi phải bám đúng skill focus, không hỏi lan man chủ đề đời sống.
- Đáp án nhiễu phải hợp lý nhưng sai rõ về nghĩa, logic, collocation hoặc word form.
"""


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


def normalize_word(raw: dict[str, Any]) -> dict[str, Any] | None:
    word = str(raw.get("word", "")).strip()
    definition_vi = str(raw.get("definition_vi", "")).strip()
    if len(word) < 2 or len(definition_vi) < 4:
        return None

    pos = str(raw.get("part_of_speech", "phrase")).strip().lower().replace(" ", "_")
    pos_map = {
        "n": "noun",
        "noun_phrase": "phrase",
        "v": "verb",
        "adj": "adjective",
        "adv": "adverb",
        "phrasal verb": "phrasal_verb",
        "fixed_expression": "phrase",
    }
    pos = pos_map.get(pos, pos)
    if pos not in {"noun", "verb", "adjective", "adverb", "phrase", "phrasal_verb", "connector", "collocation"}:
        pos = "phrase" if " " in word else "noun"

    level = str(raw.get("level", "B2")).upper()
    if level not in {"B1", "B2", "C1"}:
        level = "B2"

    def string_list(value: Any, limit: int) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(x).strip() for x in value if str(x).strip()][:limit]

    return {
        "word": word.lower(),
        "pronunciation": str(raw.get("pronunciation", "")).strip(),
        "part_of_speech": pos,
        "definition_vi": definition_vi,
        "definition_en": str(raw.get("definition_en", "")).strip(),
        "level": level,
        "synonyms": string_list(raw.get("synonyms"), 3),
        "antonyms": string_list(raw.get("antonyms"), 2),
        "example_sentence": str(raw.get("example_sentence", "")).strip(),
    }


def normalize_question(raw: dict[str, Any], allowed_types: set[str]) -> dict[str, Any] | None:
    question = str(raw.get("question_text", "")).strip()
    options = [str(raw.get(f"option_{letter}", "")).strip() for letter in "abcd"]
    answer = str(raw.get("correct_answer", "")).strip().upper()[:1]
    if len(question) < 12 or not all(options) or answer not in {"A", "B", "C", "D"}:
        return None

    qtype = str(raw.get("question_type", "meaning")).strip().lower()
    if qtype not in allowed_types:
        qtype = next(iter(allowed_types))

    difficulty = str(raw.get("difficulty", "intermediate")).strip().lower()
    if difficulty not in {"basic", "intermediate", "advanced"}:
        difficulty = "intermediate"

    return {
        "question_text": question,
        "option_a": options[0],
        "option_b": options[1],
        "option_c": options[2],
        "option_d": options[3],
        "correct_answer": answer,
        "question_type": qtype,
        "difficulty": difficulty,
        "explanation": str(raw.get("explanation", "")).strip(),
    }


def validate_payload(payload: dict[str, Any], spec: dict[str, Any], min_words: int, min_questions: int) -> dict[str, list[dict[str, Any]]]:
    seen: set[str] = set()
    words: list[dict[str, Any]] = []
    for raw in payload.get("words", []):
        if not isinstance(raw, dict):
            continue
        item = normalize_word(raw)
        if not item:
            continue
        key = item["word"].lower()
        if key in seen:
            continue
        seen.add(key)
        words.append(item)

    allowed = set(spec["question_types"])
    questions: list[dict[str, Any]] = []
    for raw in payload.get("questions", []):
        if isinstance(raw, dict):
            q = normalize_question(raw, allowed)
            if q:
                questions.append(q)

    if len(words) < min_words:
        raise ValueError(f"Only {len(words)} valid words")
    if len(questions) < min_questions:
        raise ValueError(f"Only {len(questions)} valid questions")
    return {"words": words, "questions": questions}


def call_ai(client: anthropic.Anthropic, spec: dict[str, Any], words: int, questions: int) -> dict[str, list[dict[str, Any]]]:
    user_prompt = f"""
Tạo bộ Exam Vocabulary Skill sau:

Tên bộ: {spec['name_vi']} ({spec['name']})
Nhóm lớn: {spec['category_vi']} ({spec['category']})
Trọng tâm: {spec['focus']}
Số lượng words: {words}
Số lượng questions: {questions}
Question types được phép: {', '.join(spec['question_types'])}

Yêu cầu riêng:
- Mỗi word/cụm phải trực tiếp giúp học sinh xử lý dạng đề này.
- Ưu tiên cụm/từ hay gặp trong bài đọc và câu hỏi trắc nghiệm.
- Nghĩa Việt phải phân biệt được bẫy thường gặp.
"""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=12000,
        temperature=0.25,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = msg.content[0].text
    try:
        payload = extract_json(raw)
    except Exception:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        debug_path = cache_path(spec).with_suffix(".raw.txt")
        debug_path.write_text(raw, encoding="utf-8")
        raise
    return validate_payload(payload, spec, min_words=max(18, words - 4), min_questions=max(8, questions - 3))


def cache_path(spec: dict[str, Any]) -> Path:
    slug = re.sub(r"[^a-z0-9]+", "-", spec["name"].lower()).strip("-")
    return CACHE_DIR / f"{spec['order']:03d}-{slug}.json"


def get_payload(client: anthropic.Anthropic, spec: dict[str, Any], words: int, questions: int, refresh: bool) -> dict[str, list[dict[str, Any]]]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = cache_path(spec)
    if path.exists() and not refresh:
        return validate_payload(json.loads(path.read_text(encoding="utf-8")), spec, max(18, words - 4), max(8, questions - 3))
    payload = call_ai(client, spec, words, questions)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def import_set(sb: SupabaseREST, spec: dict[str, Any], payload: dict[str, list[dict[str, Any]]], dry_run: bool) -> tuple[int, int]:
    set_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"exam-vocab-skill-{spec['category']}-{spec['name']}"))
    record = {
        "id": set_id,
        "name": spec["name_vi"],
        "description": f"{spec['category_vi']} — {spec['name_vi']} — luyện kỹ năng từ vựng trong đề thi",
        "topic": spec["category"],
        "subtopic_code": "E2X.SKILL",
        "is_system": True,
        "is_public": True,
        "is_active": True,
        "is_ai_generated": True,
        "featured": False,
        "order_index": spec["order"],
        "word_count": len(payload["words"]),
        "question_count": len(payload["questions"]),
    }

    if dry_run:
        return len(payload["words"]), len(payload["questions"])

    sb.upsert("vocab_sets", record, on_conflict="id")
    sb.delete_where("vocab_set_words", "set_id", set_id)
    sb.delete_where("vocab_questions", "set_id", set_id)

    word_rows = []
    for i, word in enumerate(payload["words"]):
        word_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-word-{i}-{word['word']}")),
            "set_id": set_id,
            "order_index": i,
            **word,
        })
    for start in range(0, len(word_rows), 50):
        sb.insert("vocab_set_words", word_rows[start : start + 50])

    question_rows = []
    for i, question in enumerate(payload["questions"]):
        question_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-question-{i}")),
            "set_id": set_id,
            **question,
        })
    sb.insert("vocab_questions", question_rows)
    sb.update("vocab_sets", {"word_count": len(word_rows), "question_count": len(question_rows)}, "id", set_id)

    return len(word_rows), len(question_rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--refresh", action="store_true", help="Regenerate cached AI payloads")
    parser.add_argument("--only", help="Run specs whose English or Vietnamese name contains this text")
    parser.add_argument("--limit", type=int, help="Limit number of specs for testing")
    parser.add_argument("--words", type=int, default=24)
    parser.add_argument("--questions", type=int, default=12)
    args = parser.parse_args()

    specs = SKILL_SETS
    if args.only:
        needle = args.only.lower()
        specs = [
            spec for spec in specs
            if needle in spec["name"].lower()
            or needle in spec["name_vi"].lower()
            or needle in spec["category"].lower()
            or needle in spec["category_vi"].lower()
        ]
    if args.limit:
        specs = specs[: args.limit]

    print(f"Exam vocab skill import: {len(specs)} sets | {args.words} words | {args.questions} questions | dry_run={args.dry_run}")
    print(f"Model: {MODEL}")

    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    sb = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)
    total_words = total_questions = 0
    failures: list[str] = []

    for idx, spec in enumerate(specs, 1):
        print(f"[{idx}/{len(specs)}] {spec['category_vi']} / {spec['name_vi']}")
        try:
            payload = get_payload(client, spec, args.words, args.questions, args.refresh)
            word_count, question_count = import_set(sb, spec, payload, args.dry_run)
            print(f"  OK: {word_count} words, {question_count} questions")
            total_words += word_count
            total_questions += question_count
        except Exception as exc:
            print(f"  FAILED: {exc}")
            failures.append(spec["name"])
        if idx < len(specs):
            time.sleep(0.6)

    print(f"\nTotal: {total_words} words, {total_questions} questions, failures={len(failures)}")
    if failures:
        print("Failed:", ", ".join(failures))


if __name__ == "__main__":
    main()
