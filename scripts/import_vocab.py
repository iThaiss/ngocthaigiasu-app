"""
import_vocab.py
──────────────────────────────────────────────────────────────
Import 35 system vocab decks vào Supabase.

Usage:
  python scripts/import_vocab.py
  python scripts/import_vocab.py --topic "Environment"
  python scripts/import_vocab.py --dry-run
  python scripts/import_vocab.py --start 5

Env vars cần thiết (đọc từ .env hoặc environment):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
──────────────────────────────────────────────────────────────
"""

import argparse
import json
import os
import re
import sys
import time
import uuid

# Load .env nếu có
def _load_dotenv(path: str = ".env.local") -> None:
    if not os.path.exists(path):
        path = ".env"
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k.strip(), v)

_load_dotenv()

import anthropic
import requests

SUPABASE_URL  = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]

# ── Supabase REST helpers (không dùng supabase-py để tránh conflict) ──
class SupabaseREST:
    def __init__(self, url: str, key: str):
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def upsert(self, table: str, records: list | dict, on_conflict: str = "id") -> None:
        url = f"{self.base}/{table}?on_conflict={on_conflict}"
        data = records if isinstance(records, list) else [records]
        r = requests.post(url, json=data, headers={**self.headers, "Prefer": f"resolution=merge-duplicates,return=minimal"})
        r.raise_for_status()

    def delete_where(self, table: str, field: str, value: str) -> None:
        url = f"{self.base}/{table}?{field}=eq.{value}"
        r = requests.delete(url, headers=self.headers)
        r.raise_for_status()

    def insert(self, table: str, records: list) -> None:
        if not records:
            return
        url = f"{self.base}/{table}"
        r = requests.post(url, json=records, headers=self.headers)
        r.raise_for_status()

    def update(self, table: str, data: dict, field: str, value: str) -> None:
        url = f"{self.base}/{table}?{field}=eq.{value}"
        r = requests.patch(url, json=data, headers=self.headers)
        r.raise_for_status()

# ── 35 System Topics ──────────────────────────────────────────
TOPICS = [
    # Con người & Xã hội
    {"name": "Family & Relationships",       "name_vi": "Gia đình & Các mối quan hệ",    "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 1},
    {"name": "Education & Learning",         "name_vi": "Giáo dục & Học tập",            "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 2},
    {"name": "Work & Career",                "name_vi": "Công việc & Sự nghiệp",         "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 3},
    {"name": "Health & Medicine",            "name_vi": "Sức khỏe & Y tế",               "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 4},
    {"name": "Emotions & Personality",       "name_vi": "Cảm xúc & Tính cách",          "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B1-C1", "order": 5},
    {"name": "Gender & Equality",            "name_vi": "Bình đẳng giới & Quyền lợi",   "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 6},
    {"name": "Community & Social Issues",    "name_vi": "Cộng đồng & Vấn đề xã hội",    "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 7},
    {"name": "Culture & Traditions",         "name_vi": "Văn hóa & Truyền thống",        "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 8},
    {"name": "Law & Justice",                "name_vi": "Pháp luật & Công lý",           "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 36},
    {"name": "Mental Health & Well-being",   "name_vi": "Sức khỏe tâm thần",             "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 37},
    {"name": "Migration & Refugees",         "name_vi": "Di cư & Người tị nạn",          "group": "Con người & Xã hội",    "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 38},
    # Thế giới tự nhiên
    {"name": "Environment & Climate Change", "name_vi": "Môi trường & Biến đổi khí hậu", "group": "Thế giới tự nhiên",     "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 9},
    {"name": "Nature & Wildlife",            "name_vi": "Thiên nhiên & Động vật hoang dã","group": "Thế giới tự nhiên",     "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 10},
    {"name": "Natural Disasters",            "name_vi": "Thiên tai & Thảm họa",          "group": "Thế giới tự nhiên",     "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 11},
    {"name": "Food & Nutrition",             "name_vi": "Thực phẩm & Dinh dưỡng",        "group": "Thế giới tự nhiên",     "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 12},
    {"name": "Energy & Natural Resources",   "name_vi": "Năng lượng & Tài nguyên thiên nhiên","group": "Thế giới tự nhiên", "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 39},
    {"name": "Agriculture & Farming",        "name_vi": "Nông nghiệp & Canh tác",        "group": "Thế giới tự nhiên",     "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 40},
    # Khoa học & Công nghệ
    {"name": "Science & Research",           "name_vi": "Khoa học & Nghiên cứu",          "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 13},
    {"name": "Technology & Innovation",      "name_vi": "Công nghệ & Đổi mới sáng tạo",  "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 14},
    {"name": "Digital & Internet",           "name_vi": "Kỹ thuật số & Internet",         "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 15},
    {"name": "Space & Astronomy",            "name_vi": "Vũ trụ & Thiên văn học",        "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 16},
    {"name": "Medicine & Biotechnology",     "name_vi": "Y học & Công nghệ sinh học",     "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "C1-C2", "order": 17},
    {"name": "Artificial Intelligence & Robots","name_vi": "Trí tuệ nhân tạo & Robot",   "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 41},
    {"name": "Engineering & Infrastructure", "name_vi": "Kỹ thuật & Cơ sở hạ tầng",      "group": "Khoa học & Công nghệ",  "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 42},
    # Kinh tế & Chính trị
    {"name": "Business & Economics",         "name_vi": "Kinh doanh & Kinh tế học",       "group": "Kinh tế & Chính trị",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 18},
    {"name": "Politics & Government",        "name_vi": "Chính trị & Chính phủ",         "group": "Kinh tế & Chính trị",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 19},
    {"name": "Globalization & Trade",        "name_vi": "Toàn cầu hóa & Thương mại",     "group": "Kinh tế & Chính trị",   "subtopic_code": "E2X.07", "level_range": "C1-C2", "order": 20},
    {"name": "Media & Journalism",           "name_vi": "Truyền thông & Báo chí",        "group": "Kinh tế & Chính trị",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 21},
    {"name": "Finance & Banking",            "name_vi": "Tài chính & Ngân hàng",         "group": "Kinh tế & Chính trị",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 43},
    {"name": "International Relations",      "name_vi": "Quan hệ quốc tế",               "group": "Kinh tế & Chính trị",   "subtopic_code": "E2X.07", "level_range": "C1-C2", "order": 44},
    # Cuộc sống hàng ngày
    {"name": "Travel & Transport",           "name_vi": "Du lịch & Phương tiện giao thông","group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 22},
    {"name": "Housing & Urban Life",         "name_vi": "Nhà ở & Cuộc sống đô thị",      "group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 23},
    {"name": "Sports & Recreation",          "name_vi": "Thể thao & Giải trí",           "group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 24},
    {"name": "Arts & Entertainment",         "name_vi": "Nghệ thuật & Giải trí văn hóa", "group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 25},
    {"name": "Shopping & Consumerism",       "name_vi": "Mua sắm & Tiêu dùng",           "group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 26},
    {"name": "Fashion & Lifestyle",          "name_vi": "Thời trang & Lối sống",         "group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 45},
    {"name": "Music & Performing Arts",      "name_vi": "Âm nhạc & Nghệ thuật biểu diễn","group": "Cuộc sống hàng ngày",  "subtopic_code": "E2X.07", "level_range": "B1-B2", "order": 46},
    # Tư duy & Ngôn ngữ
    {"name": "Communication & Language",     "name_vi": "Giao tiếp & Ngôn ngữ học",      "group": "Tư duy & Ngôn ngữ",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 27},
    {"name": "Philosophy & Ethics",          "name_vi": "Triết học & Đạo đức",           "group": "Tư duy & Ngôn ngữ",   "subtopic_code": "E2X.07", "level_range": "C1-C2", "order": 28},
    {"name": "History & Civilization",       "name_vi": "Lịch sử & Văn minh nhân loại",  "group": "Tư duy & Ngôn ngữ",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 29},
    {"name": "Psychology & Behavior",        "name_vi": "Tâm lý học & Hành vi con người", "group": "Tư duy & Ngôn ngữ",   "subtopic_code": "E2X.07", "level_range": "C1-C2", "order": 30},
    {"name": "Academic & Formal Language",   "name_vi": "Ngôn ngữ học thuật & Trang trọng","group": "Tư duy & Ngôn ngữ",  "subtopic_code": "E2X.06", "level_range": "B2-C2", "order": 31},
    {"name": "Literature & Writing",         "name_vi": "Văn học & Kỹ năng viết",        "group": "Tư duy & Ngôn ngữ",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 47},
    {"name": "Religion & Beliefs",           "name_vi": "Tôn giáo & Tín ngưỡng",         "group": "Tư duy & Ngôn ngữ",   "subtopic_code": "E2X.07", "level_range": "B2-C1", "order": 48},
    # Kỹ năng từ vựng đặc thù đề thi
    {"name": "Collocations in Context",      "name_vi": "Collocation thường gặp trong đề thi","group": "Kỹ năng từ vựng", "subtopic_code": "E2X.03", "level_range": "B2-C1", "order": 32},
    {"name": "Phrasal Verbs",                "name_vi": "Cụm động từ (Phrasal Verbs)",    "group": "Kỹ năng từ vựng",     "subtopic_code": "E2X.04", "level_range": "B1-C1", "order": 33},
    {"name": "Synonyms & Antonyms in Context","name_vi": "Đồng nghĩa & Trái nghĩa theo ngữ cảnh","group": "Kỹ năng từ vựng","subtopic_code": "E2X.05", "level_range": "B2-C2", "order": 34},
    {"name": "Word Formation & Word Form",   "name_vi": "Cấu tạo từ & Biến đổi dạng từ", "group": "Kỹ năng từ vựng",     "subtopic_code": "E2X.01", "level_range": "B1-C1", "order": 35},
    {"name": "Discourse Markers & Linking Words","name_vi": "Từ nối & Diễn ngôn học thuật","group": "Kỹ năng từ vựng",   "subtopic_code": "E2X.06", "level_range": "B2-C1", "order": 49},
    {"name": "Prepositions & Fixed Phrases", "name_vi": "Giới từ & Cụm từ cố định",      "group": "Kỹ năng từ vựng",     "subtopic_code": "E2X.03", "level_range": "B1-C1", "order": 50},
]

GENERATE_PROMPT = """Bạn là chuyên gia từ vựng tiếng Anh cho học sinh THPT Việt Nam luyện thi TN/HSA/SPT.

Tạo bộ từ vựng chủ đề "{topic_en}" ({level_range}) gồm đúng {word_count} từ/cụm từ.

Yêu cầu từ vựng:
- Ưu tiên từ xuất hiện trong đề thi THPT/HSA/SPT thực tế
- Bao gồm vocabulary, collocations, phrasal verbs phù hợp chủ đề
- Phân bổ level cân đối trong khoảng {level_range}
- IPA chuẩn British English
- Câu ví dụ học thuật, liên quan thực tế (15-25 từ)

Yêu cầu câu hỏi:
- Đa dạng loại: fill_blank, synonym, antonym, meaning, collocation, word_form
- Độ khó tăng dần: 40% basic, 40% intermediate, 20% advanced
- Chuẩn format đề TN (fill_blank/synonym), HSA (collocation/meaning), SPT (word_form)
- Distractor phải hợp lý, dễ nhầm lẫn

Trả về JSON thuần túy (không markdown):
{{
  "words": [
    {{
      "word": "từ/cụm từ",
      "pronunciation": "/IPA/",
      "part_of_speech": "n|v|adj|adv|phrase",
      "definition_vi": "nghĩa tiếng Việt tự nhiên",
      "definition_en": "concise English definition",
      "level": "B1|B2|C1|C2",
      "synonyms": ["tối đa 3"],
      "antonyms": ["tối đa 2"],
      "example_sentence": "Câu ví dụ."
    }}
  ],
  "questions": [
    {{
      "question_text": "Câu hỏi",
      "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
      "correct_answer": "A|B|C|D",
      "explanation": "Giải thích ngắn",
      "question_type": "fill_blank|synonym|antonym|meaning|collocation|word_form",
      "difficulty": "basic|intermediate|advanced"
    }}
  ]
}}"""


WORDS_PROMPT = """Bạn là chuyên gia từ vựng tiếng Anh cho học sinh THPT Việt Nam luyện thi TN/HSA/SPT.

Tạo đúng {word_count} từ/cụm từ chủ đề "{topic_en}" ({level_range}).

Yêu cầu:
- Từ xuất hiện thực tế trong đề thi THPT/HSA/SPT
- Bao gồm vocabulary, collocations, phrasal verbs phù hợp
- IPA chuẩn British English
- Câu ví dụ học thuật 15-20 từ

JSON thuần túy:
{{"words": [{{"word":"...","pronunciation":"/IPA/","part_of_speech":"n|v|adj|adv|phrase","definition_vi":"...","definition_en":"...","level":"B1|B2|C1|C2","synonyms":["tối đa 2"],"antonyms":["tối đa 1"],"example_sentence":"..."}}]}}"""

QUESTIONS_PROMPT = """Tạo đúng {question_count} câu hỏi trắc nghiệm 4 options cho bộ từ vựng chủ đề "{topic_en}".

Từ vựng: {words_list}

Yêu cầu câu hỏi:
- Đa dạng: fill_blank, synonym, antonym, meaning, collocation, word_form
- Độ khó: 40% basic, 40% intermediate, 20% advanced
- Chuẩn format đề TN/HSA/SPT
- Distractor hợp lý, dễ nhầm

JSON thuần túy:
{{"questions": [{{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A|B|C|D","explanation":"Giải thích ngắn.","question_type":"fill_blank|synonym|antonym|meaning|collocation|word_form","difficulty":"basic|intermediate|advanced"}}]}}"""


def extract_json(text: str) -> dict | None:
    """Trích xuất JSON object đầu tiên từ text, bỏ qua extra content."""
    text = text.strip()
    # Strip markdown code blocks
    text = re.sub(r"^```json?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first complete JSON object using brace matching
    depth = 0
    start = text.find("{")
    if start == -1:
        return None
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i+1])
                except json.JSONDecodeError:
                    return None
    return None


def call_ai(ai: anthropic.Anthropic, prompt: str, max_tokens: int = 6000) -> dict | None:
    for attempt in range(3):
        try:
            msg = ai.messages.create(
                model="claude-haiku-4-5",
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = msg.content[0].text
            result = extract_json(raw)
            if result:
                return result
            print(f"    JSON parse failed attempt {attempt+1}, retrying...")
            time.sleep(2)
        except anthropic.RateLimitError:
            wait = (attempt + 1) * 15
            print(f"    Rate limit, waiting {wait}s...")
            time.sleep(wait)
        except Exception as e:
            print(f"    Error attempt {attempt+1}: {e}")
            time.sleep(3)
    return None


def call_claude(ai: anthropic.Anthropic, topic: dict, word_count: int, question_count: int) -> dict | None:
    # Call 1: Generate words
    words_prompt = WORDS_PROMPT.format(
        topic_en=topic["name"],
        level_range=topic["level_range"],
        word_count=word_count,
    )
    words_result = call_ai(ai, words_prompt, max_tokens=6000)
    if not words_result or not words_result.get("words"):
        return None

    words = words_result["words"]
    words_list = ", ".join(w.get("word", "") for w in words[:15])

    # Call 2: Generate questions
    questions_prompt = QUESTIONS_PROMPT.format(
        topic_en=topic["name"],
        question_count=question_count,
        words_list=words_list,
    )
    questions_result = call_ai(ai, questions_prompt, max_tokens=6000)
    questions = questions_result.get("questions", []) if questions_result else []

    return {"words": words, "questions": questions}


def process_topic(sb: SupabaseREST, ai: anthropic.Anthropic, topic: dict, args) -> tuple[int, int]:
    set_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"system-{topic['name']}"))

    record = {
        "id": set_id,
        "name": topic["name_vi"],
        "description": f"Từ vựng {topic['name_vi']} — {topic['level_range']} — luyện thi TN/HSA/SPT",
        "topic": topic["name"],
        "subtopic_code": topic["subtopic_code"],
        "is_system": True,
        "is_public": True,
        "is_active": True,
        "is_ai_generated": True,
        "featured": topic["order"] <= 15,
        "order_index": topic["order"],
        "word_count": 0,
        "question_count": 0,
    }
    if not args.dry_run:
        sb.upsert("vocab_sets", record, on_conflict="id")

    result = call_claude(ai, topic, args.words, args.questions)
    if not result:
        return 0, 0

    words = result.get("words", [])
    questions = result.get("questions", [])

    if not args.dry_run and words:
        word_records = [{
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-w{i}-{w.get('word','')}")),
            "set_id": set_id,
            "word": str(w.get("word", "")).lower().strip(),
            "pronunciation": w.get("pronunciation") or "",
            "part_of_speech": w.get("part_of_speech") or "",
            "definition_vi": str(w.get("definition_vi", "")),
            "definition_en": w.get("definition_en") or "",
            "level": w.get("level") or "B2",
            "synonyms": w.get("synonyms") or [],
            "antonyms": w.get("antonyms") or [],
            "example_sentence": w.get("example_sentence") or "",
            "order_index": i,
        } for i, w in enumerate(words)]

        sb.delete_where("vocab_set_words", "set_id", set_id)
        # Insert in chunks to avoid request size limits
        for chunk_start in range(0, len(word_records), 50):
            sb.insert("vocab_set_words", word_records[chunk_start:chunk_start+50])
        sb.update("vocab_sets", {"word_count": len(word_records)}, "id", set_id)

    if not args.dry_run and questions:
        q_records = [{
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{set_id}-q{i}")),
            "set_id": set_id,
            "question_text": str(q.get("question_text", "")),
            "option_a": str(q.get("option_a", "")),
            "option_b": str(q.get("option_b", "")),
            "option_c": str(q.get("option_c", "")),
            "option_d": str(q.get("option_d", "")),
            "correct_answer": str(q.get("correct_answer", "A")).upper()[:1],
            "explanation": q.get("explanation") or "",
            "question_type": q.get("question_type") or "meaning",
            "difficulty": q.get("difficulty") or "basic",
        } for i, q in enumerate(questions)]

        sb.delete_where("vocab_questions", "set_id", set_id)
        sb.insert("vocab_questions", q_records)
        sb.update("vocab_sets", {"question_count": len(q_records)}, "id", set_id)

    return len(words), len(questions)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", help="Filter theo tên topic")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--words", type=int, default=30)
    parser.add_argument("--questions", type=int, default=15)
    parser.add_argument("--start", type=int, default=1, help="Bắt đầu từ order N")
    args = parser.parse_args()

    ai = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    sb = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)

    topics = TOPICS
    if args.topic:
        topics = [t for t in TOPICS if args.topic.lower() in t["name"].lower()]
    elif args.start > 1:
        topics = [t for t in TOPICS if t["order"] >= args.start]

    print(f"{'='*58}")
    print(f"VOCAB IMPORT — {len(topics)} topics | {args.words} words | {args.questions} questions")
    print(f"Dry run: {args.dry_run}")
    print(f"{'='*58}\n")

    total_w = total_q = 0
    failed = []

    for i, topic in enumerate(topics, 1):
        print(f"[{i}/{len(topics)}] {topic['name']} ({topic['level_range']})")
        try:
            w, q = process_topic(sb, ai, topic, args)
            print(f"    ✓ {w} từ · {q} câu hỏi")
            total_w += w
            total_q += q
        except Exception as e:
            print(f"    ✗ FAILED: {e}")
            failed.append(topic["name"])
        if i < len(topics):
            time.sleep(1)

    print(f"\n{'='*58}")
    print(f"Tổng: {total_w} từ · {total_q} câu hỏi · {len(failed)} lỗi")
    if failed:
        print(f"Failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
