"""
Generate and import exam-style reading passages with DeepSeek via local 9Router.

Trial default:
  - 2 Reading 8-question passages
  - 2 Reading 10-question passages

The script validates JSON, question counts, answer format, duplicate options,
Vietnamese explanations, and passage length before importing.

Usage:
  python scripts/generate_exam_reading_deepseek.py --dry-run
  python scripts/generate_exam_reading_deepseek.py
  python scripts/generate_exam_reading_deepseek.py --limit 1
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

import requests


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "exports" / "deepseek-reading-cache"
MODEL = "ds/deepseek-v4-pro-none"


def load_env(path: Path) -> None:
  if not path.exists():
    return
  for raw in path.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    key, value = line.split("=", 1)
    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env(Path("D:/Projects/pipeline/.env"))
load_env(ROOT / ".env.local")
load_env(ROOT / "scripts" / ".env.real")

ROUTER_BASE_URL = (
  os.environ.get("AI_ROUTER_BASE_URL")
  or os.environ.get("PRACTICE_ROUTER_BASE_URL")
  or os.environ.get("NINE_ROUTER_BASE_URL")
  or ""
).rstrip("/")
ROUTER_KEY = (
  os.environ.get("NINEROUTER_API_KEY")
  or os.environ.get("AI_ROUTER_API_KEY")
  or os.environ.get("NINE_ROUTER_API_KEY")
  or "local"
)
SUPABASE_URL = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


SPECS: list[dict[str, Any]] = [
  {
    "slug": "digital-learning-attention",
    "kind": "8q",
    "title_hint": "digital learning and student attention",
    "topic": "Education & Learning",
    "topic_vi": "Giáo dục & Học tập",
    "level": "B2",
    "word_min": 290,
    "word_max": 360,
    "question_count": 8,
    "question_types": [
      "reference",
      "vocab_meaning",
      "sentence_paraphrase",
      "vocab_antonym",
      "detail_except",
      "true_statement",
      "paragraph_location",
      "paragraph_location",
    ],
  },
  {
    "slug": "urban-green-spaces",
    "kind": "8q",
    "title_hint": "urban green spaces and public health",
    "topic": "Sustainable Cities & Urban Planning",
    "topic_vi": "Đô thị bền vững",
    "level": "B2",
    "word_min": 290,
    "word_max": 360,
    "question_count": 8,
    "question_types": [
      "detail_except",
      "vocab_meaning",
      "sentence_paraphrase",
      "reference",
      "vocab_meaning",
      "true_statement",
      "paragraph_location",
      "paragraph_location",
    ],
  },
  {
    "slug": "ai-in-schools",
    "kind": "10q",
    "title_hint": "artificial intelligence in schools",
    "topic": "Artificial Intelligence & Robots",
    "topic_vi": "Trí tuệ nhân tạo",
    "level": "B2",
    "word_min": 360,
    "word_max": 450,
    "question_count": 10,
    "question_types": [
      "detail",
      "vocab_antonym",
      "paragraph_summary",
      "detail",
      "reference",
      "sentence_paraphrase",
      "detail",
      "passage_inference",
      "sentence_insertion",
      "passage_summary",
    ],
  },
  {
    "slug": "food-waste-consumption",
    "kind": "10q",
    "title_hint": "food waste and sustainable consumption",
    "topic": "Food Security & Supply Chains",
    "topic_vi": "An ninh lương thực & Chuỗi cung ứng",
    "level": "B2",
    "word_min": 360,
    "word_max": 450,
    "question_count": 10,
    "question_types": [
      "paragraph_summary",
      "detail",
      "vocab_meaning",
      "inference",
      "detail",
      "reference",
      "sentence_paraphrase",
      "passage_inference",
      "sentence_insertion",
      "passage_summary",
    ],
  },
]


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
      timeout=90,
    )
    res.raise_for_status()

  def delete_where(self, table: str, field: str, value: str) -> None:
    res = requests.delete(f"{self.base}/{table}?{field}=eq.{value}", headers=self.headers, timeout=90)
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
      timeout=90,
    )
    res.raise_for_status()


def stable_id(*parts: str) -> str:
  return str(uuid.uuid5(uuid.NAMESPACE_DNS, "::".join(parts)))


def chat_url() -> str:
  if not ROUTER_BASE_URL:
    raise RuntimeError("Missing AI_ROUTER_BASE_URL/PRACTICE_ROUTER_BASE_URL")
  if ROUTER_BASE_URL.endswith("/chat/completions"):
    return ROUTER_BASE_URL
  if ROUTER_BASE_URL.endswith("/v1"):
    return f"{ROUTER_BASE_URL}/chat/completions"
  return f"{ROUTER_BASE_URL}/v1/chat/completions"


def first_json(text: str) -> dict[str, Any]:
  start = text.find("{")
  if start < 0:
    raise ValueError("No JSON object in response")
  depth = 0
  in_string = False
  escaped = False
  for i, ch in enumerate(text[start:], start):
    if in_string:
      if escaped:
        escaped = False
      elif ch == "\\":
        escaped = True
      elif ch == '"':
        in_string = False
    else:
      if ch == '"':
        in_string = True
      elif ch == "{":
        depth += 1
      elif ch == "}":
        depth -= 1
        if depth == 0:
          return json.loads(text[start:i + 1])
  raise ValueError("Unterminated JSON object")


def extract_json(text: str) -> dict[str, Any]:
  cleaned = text.strip()
  cleaned = re.sub(r"^```json?\s*", "", cleaned)
  cleaned = re.sub(r"\s*```\s*$", "", cleaned)
  try:
    return json.loads(cleaned)
  except json.JSONDecodeError:
    return first_json(cleaned)


def has_vietnamese(text: str) -> bool:
  return bool(re.search(r"[\u00c0-\u1ef9]", text)) or any(
    marker in text.lower()
    for marker in ["đoạn", "bài", "đáp án", "cho thấy", "bằng chứng"]
  )


def quoted_snippets(text: str, min_length: int = 2) -> list[str]:
  pattern = r'"([^"]{2,})"|“([^”]{2,})”|\'([^\']{2,})\''
  snippets: list[str] = []
  for match in re.finditer(pattern, text):
    snippet = next((group for group in match.groups() if group), "").strip()
    if len(snippet) >= min_length:
      snippets.append(snippet)
  return snippets


def paragraph_number(text: str) -> int | None:
  match = re.search(r"\bparagraph\s+([1-9])\b", text, re.I)
  return int(match.group(1)) if match else None


def explanation_has_evidence(text: str) -> bool:
  lower = text.lower()
  return any(marker in lower for marker in [
    "đoạn",
    "câu",
    "nêu",
    "cho thấy",
    "trong ngữ cảnh",
    "câu gốc",
    "bài đọc",
    "tác giả",
    "evidence",
  ]) or bool(re.search(r"['\"“”][^'\"“”]{10,}['\"“”]", text))


def explanation_has_trap_analysis(text: str) -> bool:
  lower = text.lower()
  return any(marker in lower for marker in [
    "a sai",
    "b sai",
    "c sai",
    "d sai",
    "các đáp án khác",
    "các phương án khác",
    "không được đề cập",
    "không phù hợp",
    "trái ngược",
    "quá hẹp",
    "quá cực đoan",
    "sai lệch",
  ])


def exam_template_notes(spec: dict[str, Any]) -> str:
  if spec["kind"] == "8q":
    return """
Use the Vietnamese THPT 8-question reading format modelled on questions 23-30.
The passage has 4 paragraphs and NO [I]-[IV] insertion markers.

The 8 questions must follow this exam-style cluster:
- Q23-Q27: a mix of reference, vocabulary meaning/opposite, detail EXCEPT/NOT mentioned, and sentence paraphrase. At least one question must quote a full sentence from the passage for paraphrase.
- Q28: TRUE according to the passage.
- Q29-Q30: paragraph-location questions asking which paragraph mentions a specific idea.

Do not make Q23 a generic main-idea question. Do not add a passage-summary question in the 8-question set.
Use dense but fair distractors: wrong options should be plausible if a student skims, but contradicted or unsupported by the passage.
""".strip()

  return """
Use the Vietnamese THPT 10-question reading format modelled on questions 31-40.
The passage must have 4 paragraphs and must include the exact insertion markers [I], [II], [III], [IV] once each.
Place the markers naturally between sentences, not inside a sentence.

The 10 questions must follow this exam-style cluster:
- Q31-Q35: paragraph detail/summary, vocabulary meaning or opposite, detail, and reference. At least one of these must be a paragraph-summary question, not a whole-passage summary.
- Q36: sentence paraphrase. Quote a complete sentence from the passage in the question.
- Q37: detail or implied meaning from paragraph 3 or 4.
- Q38: inference from the whole passage.
- Q39: sentence insertion using the four markers. Options must be exactly [I], [II], [III], [IV].
- Q40: best summary of the whole passage.

Do not ask two whole-passage summary questions. The only whole-passage summary question should be Q40.
  Distractors should be academic and close in wording to the passage, similar to official exam style.
  """.strip()


def explanation_style_notes() -> str:
  return """
Vietnamese title and explanation style, modelled on the current Supabase reading bank:
- title_vi: translate the English title naturally as a short Vietnamese academic title. Do not explain, do not transliterate awkwardly, and do not over-literalize word-by-word.
- topic_vi is provided by metadata; keep the passage title_vi consistent with that topic.
- explanation must read like a tutor teaching the solving logic, not like a bare answer key.
- Preferred explanation flow: locate evidence ("Đoạn 2 nêu...", "Câu trong đoạn 4...", "Đoạn 3 bắt đầu bằng..."), quote or paraphrase a short English evidence phrase, infer the answer, then explain traps in wrong options when useful.
- detail/detail_except: list the mentioned evidence first, then identify the option not mentioned or contradicted.
- vocab_meaning/vocab_antonym: define the target word in context, connect it to the correct option, and briefly dismiss wrong options by meaning.
- reference: identify the exact antecedent from the previous clause/sentence; explain why other options are grammatically or semantically unsuitable.
- sentence_paraphrase: explain the meaning of the quoted sentence in Vietnamese, match it to the correct option, then note how wrong options reverse, narrow, exaggerate, or add unsupported meaning.
- inference/passage_inference: show the textual clue, then state the inference; do not present unsupported general knowledge.
- true_statement: cite the evidence for the correct statement and briefly say why the other statements are false/unsupported.
- paragraph_location: cite the sentence or idea that proves the paragraph number.
- sentence_insertion: explain the logical link before and after the insertion point, especially reference words such as "this", "such", "however", "for example", and topic continuity.
- passage_summary/paragraph_summary: summarize the relevant paragraph or whole passage structure, then reject options that are too narrow, too extreme, or contrary to the passage.
""".strip()


def build_prompt(spec: dict[str, Any], prior_error: str = "") -> str:
  error_note = f"\nPrevious QA problems to fix: {prior_error}\n" if prior_error else ""
  return f"""
You are an expert Vietnamese high-school English exam item writer.
Create ONE exam-style reading passage and questions for the Vietnamese THPT reading format.

Topic: {spec['title_hint']}
Topic metadata: {spec['topic']}
Level: {spec['level']}
Passage length: {spec['word_min']}-{spec['word_max']} English words.
Question count: exactly {spec['question_count']}.

Passage requirements:
- Write in natural academic English suitable for grade 12 students.
- Use exactly 4 clear paragraphs separated by blank lines.
- Use original wording. Do not copy copyrighted source text.
- Keep the argument nuanced: introduce the issue, develop evidence/examples, discuss limitations/challenges, then conclude.

Exam template:
{exam_template_notes(spec)}

Question type sequence to output exactly:
{json.dumps(spec['question_types'], ensure_ascii=False)}

Style guide:
{explanation_style_notes()}

Question requirements:
- Question text and options must be in English.
- Each question has exactly four options: option_a, option_b, option_c, option_d.
- correct_answer must be only A, B, C, or D.
- Explanations must be in Vietnamese with Vietnamese accents, following the style guide above.
- Explanations must show the solving logic: evidence -> inference/meaning -> correct answer -> trap analysis where useful.
- For vocabulary/reference/paraphrase questions, explicitly mention the quoted word, phrase, or sentence and its paragraph.
- For TRUE/summary/inference questions, also briefly explain why the main wrong options are wrong.
- Distractors must be plausible, academic, and close to the passage wording. Avoid obviously silly distractors.
- Avoid answer-key imbalance: do not use the same correct letter more than 3 times in an 8-question set or more than 4 times in a 10-question set.
- If a question says "in paragraph N", the quoted target must actually appear in paragraph N, not merely elsewhere in the passage.

Return valid JSON only. No markdown. No extra text.
Required schema:
{{
  "title": "...",
  "title_vi": "...",
  "content": "paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3\\n\\nparagraph 4",
  "questions": [
    {{
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A",
      "question_type": "...",
      "explanation": "..."
    }}
  ]
}}
{error_note}
""".strip()

def call_model(spec: dict[str, Any], prior_error: str = "") -> tuple[dict[str, Any], dict[str, Any]]:
  body = {
    "model": MODEL,
    "temperature": 0.25,
    "max_tokens": 8500,
    "thinking": {"type": "disabled"},
    "messages": [
      {"role": "system", "content": "Return valid JSON only. Do not use markdown or any text outside JSON."},
      {"role": "user", "content": build_prompt(spec, prior_error)},
    ],
  }
  res = requests.post(
    chat_url(),
    headers={"Authorization": f"Bearer {ROUTER_KEY}", "Content-Type": "application/json"},
    json=body,
    timeout=180,
  )
  res.encoding = "utf-8"
  res.raise_for_status()
  raw = first_json(res.text)
  content = str((raw.get("choices") or [{}])[0].get("message", {}).get("content") or "")
  return extract_json(content), raw.get("usage") or {}


def validate_payload(spec: dict[str, Any], payload: dict[str, Any]) -> list[str]:
  problems: list[str] = []
  content = str(payload.get("content") or "").strip()
  words = content.split()
  if not (spec["word_min"] <= len(words) <= spec["word_max"] + 40):
    problems.append(f"word_count={len(words)} expected {spec['word_min']}-{spec['word_max']}")
  paragraphs = [part.strip() for part in content.split("\n\n") if part.strip()]
  if len(paragraphs) != 4:
    problems.append(f"paragraph_count={len(paragraphs)} expected 4")
  if spec["kind"] == "8q" and re.search(r"\[(I|II|III|IV)\]", content):
    problems.append("8q_should_not_have_insertion_markers")
  if spec["kind"] == "10q":
    for marker in ["[I]", "[II]", "[III]", "[IV]"]:
      if content.count(marker) != 1:
        problems.append(f"10q_marker_{marker}_count={content.count(marker)} expected 1")

  questions = payload.get("questions")
  if not isinstance(questions, list):
    return problems + ["questions_not_list"]
  if len(questions) != spec["question_count"]:
    problems.append(f"question_count={len(questions)} expected {spec['question_count']}")
  answers = [str(question.get("correct_answer") or "") for question in questions if isinstance(question, dict)]
  max_same_answer = 3 if spec["question_count"] == 8 else 5
  for letter in "ABCD":
    if answers.count(letter) > max_same_answer:
      problems.append(f"answer_key_imbalance_{letter}={answers.count(letter)} max {max_same_answer}")

  for index, question in enumerate(questions, start=1):
    for key in ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "question_type", "explanation"]:
      if not str(question.get(key) or "").strip():
        problems.append(f"q{index}_missing_{key}")
    if question.get("correct_answer") not in list("ABCD"):
      problems.append(f"q{index}_bad_answer")
    expected_type = spec["question_types"][index - 1] if index <= len(spec["question_types"]) else None
    if expected_type and question.get("question_type") != expected_type:
      problems.append(f"q{index}_type={question.get('question_type')} expected {expected_type}")
    question_text = str(question.get("question_text") or "")
    if expected_type == "sentence_paraphrase" and len(re.findall(r'"[^"]{40,}"|“[^”]{40,}”|\'[^\']{40,}\'', question_text)) == 0:
      problems.append(f"q{index}_paraphrase_should_quote_sentence")
    target_paragraph = paragraph_number(question_text)
    if target_paragraph and 1 <= target_paragraph <= len(paragraphs):
      paragraph_text = paragraphs[target_paragraph - 1].lower()
      for snippet in quoted_snippets(question_text, 2):
        if snippet.lower() not in paragraph_text:
          problems.append(f"q{index}_quoted_target_not_in_paragraph_{target_paragraph}:{snippet[:40]}")
    if expected_type == "paragraph_summary" and "passage" in question_text.lower():
      problems.append(f"q{index}_paragraph_summary_asks_whole_passage")
    if expected_type == "passage_summary" and index != spec["question_count"]:
      problems.append(f"q{index}_passage_summary_before_final_question")
    if expected_type == "sentence_insertion":
      option_values = [str(question.get(f"option_{letter.lower()}") or "").strip() for letter in "ABCD"]
      if option_values != ["[I]", "[II]", "[III]", "[IV]"]:
        problems.append(f"q{index}_sentence_insertion_options_should_be_markers")
    options = [str(question.get(f"option_{letter.lower()}") or "").strip() for letter in "ABCD"]
    if len(set(options)) != 4:
      problems.append(f"q{index}_duplicate_options")
    explanation = str(question.get("explanation") or "")
    if not has_vietnamese(explanation):
      problems.append(f"q{index}_explanation_not_vi")
    if len(explanation.split()) < 14:
      problems.append(f"q{index}_explanation_too_short")
    if not explanation_has_evidence(explanation):
      problems.append(f"q{index}_explanation_missing_evidence_logic")
    if expected_type in {
      "detail_except",
      "true_statement",
      "sentence_paraphrase",
      "paragraph_summary",
      "passage_summary",
      "passage_inference",
      "inference",
    } and not explanation_has_trap_analysis(explanation):
      problems.append(f"q{index}_explanation_missing_trap_analysis")

  return problems


def generate_one(spec: dict[str, Any], use_cache: bool = True) -> tuple[dict[str, Any], dict[str, Any], list[str]]:
  CACHE_DIR.mkdir(parents=True, exist_ok=True)
  cache_path = CACHE_DIR / f"{spec['kind']}-{spec['slug']}.json"
  if use_cache and cache_path.exists():
    payload = json.loads(cache_path.read_text(encoding="utf-8"))
    return payload, {"cached": True}, validate_payload(spec, payload)

  prior_error = ""
  last_payload: dict[str, Any] = {}
  last_usage: dict[str, Any] = {}
  for attempt in range(1, 4):
    payload, usage = call_model(spec, prior_error)
    problems = validate_payload(spec, payload)
    last_payload, last_usage = payload, usage
    if not problems:
      cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
      return payload, usage, []
    prior_error = "; ".join(problems[:12])
    time.sleep(1.5)
  cache_path.write_text(json.dumps(last_payload, ensure_ascii=False, indent=2), encoding="utf-8")
  return last_payload, last_usage, validate_payload(spec, last_payload)


def import_payload(db: SupabaseREST, spec: dict[str, Any], payload: dict[str, Any], order_index: int) -> str:
  passage_id = stable_id("deepseek-reading", spec["kind"], spec["slug"])
  content = str(payload["content"]).strip()
  questions = payload["questions"]
  record = {
    "id": passage_id,
    "title": str(payload["title"]).strip(),
    "title_vi": str(payload.get("title_vi") or "").strip(),
    "content": content,
    "topic": spec["topic"],
    "topic_vi": spec["topic_vi"],
    "level": spec["level"],
    "word_count": len(content.split()),
    "question_count": len(questions),
    "is_system": True,
    "is_active": True,
    "order_index": order_index,
  }
  db.upsert("reading_passages", record, on_conflict="id")
  db.delete_where("reading_questions", "passage_id", passage_id)
  rows = []
  for index, question in enumerate(questions, start=1):
    rows.append({
      "id": stable_id("deepseek-reading-question", passage_id, str(index)),
      "passage_id": passage_id,
      "order_index": index,
      "question_text": question["question_text"],
      "option_a": question["option_a"],
      "option_b": question["option_b"],
      "option_c": question["option_c"],
      "option_d": question["option_d"],
      "correct_answer": question["correct_answer"],
      "question_type": question["question_type"],
      "explanation": question["explanation"],
    })
  db.insert("reading_questions", rows)
  db.update("reading_passages", {"word_count": record["word_count"], "question_count": len(rows)}, "id", passage_id)
  return passage_id


def main() -> int:
  parser = argparse.ArgumentParser()
  parser.add_argument("--dry-run", action="store_true")
  parser.add_argument("--limit", type=int, default=0)
  parser.add_argument("--no-cache", action="store_true")
  args = parser.parse_args()

  if not ROUTER_BASE_URL:
    sys.exit("Missing AI router base URL. Check D:/Projects/pipeline/.env.")
  if not args.dry_run and (not SUPABASE_URL or not SUPABASE_KEY):
    sys.exit("Missing Supabase credentials.")

  specs = SPECS[: args.limit] if args.limit else SPECS
  print(f"Generating {len(specs)} trial passages with {MODEL}")
  print(f"Router: {chat_url()}")
  imported: list[tuple[str, str]] = []
  db = None if args.dry_run else SupabaseREST(SUPABASE_URL, SUPABASE_KEY)

  for offset, spec in enumerate(specs, start=1):
    started = time.time()
    payload, usage, problems = generate_one(spec, use_cache=not args.no_cache)
    words = len(str(payload.get("content") or "").split())
    usage_text = "cached" if usage.get("cached") else f"tokens={usage.get('total_tokens')} prompt={usage.get('prompt_tokens')} completion={usage.get('completion_tokens')}"
    print(f"\n{spec['kind']} · {spec['slug']} · {words} words · {len(payload.get('questions') or [])} q · {time.time()-started:.1f}s · {usage_text}")
    print(f"  title: {payload.get('title')}")
    if problems:
      print("  QA FAILED:")
      for problem in problems[:20]:
        print(f"   - {problem}")
      continue
    print("  QA passed")
    if db:
      passage_id = import_payload(db, spec, payload, order_index=1000 + offset)
      imported.append((payload.get("title") or spec["slug"], passage_id))
      print(f"  imported: {passage_id}")

  if imported:
    print("\nImported passages:")
    for title, passage_id in imported:
      print(f"  {passage_id} · {title}")

  return 0


if __name__ == "__main__":
  raise SystemExit(main())
