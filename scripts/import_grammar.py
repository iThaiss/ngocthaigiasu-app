"""
import_grammar.py
──────────────────────────────────────────────────────────────
Import 50 grammar lessons vào Supabase.
Mỗi lesson gồm: lý thuyết (Markdown) + 12 bài tập MCQ.

PREREQUISITES:
  Chạy supabase/grammar-reading-schema.sql trong Supabase SQL Editor trước.

Usage:
  python scripts/import_grammar.py
  python scripts/import_grammar.py --start 10
  python scripts/import_grammar.py --group "Câu điều kiện"
  python scripts/import_grammar.py --dry-run
──────────────────────────────────────────────────────────────
"""
import argparse, json, os, re, sys, time, uuid

def _load_dotenv(path=".env.local"):
    if not os.path.exists(path): path = ".env"
    if not os.path.exists(path): return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_dotenv()

import anthropic, requests

SUPABASE_URL  = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]

class SupabaseREST:
    def __init__(self, url, key):
        self.base = url.rstrip("/") + "/rest/v1"
        self.h = {"apikey": key, "Authorization": f"Bearer {key}",
                  "Content-Type": "application/json", "Prefer": "return=minimal"}
    def upsert(self, table, records, on_conflict="id"):
        data = records if isinstance(records, list) else [records]
        r = requests.post(f"{self.base}/{table}?on_conflict={on_conflict}", json=data,
                          headers={**self.h, "Prefer": "resolution=merge-duplicates,return=minimal"})
        r.raise_for_status()
    def delete_where(self, table, field, value):
        r = requests.delete(f"{self.base}/{table}?{field}=eq.{value}", headers=self.h)
        r.raise_for_status()
    def update(self, table, data, field, value):
        r = requests.patch(f"{self.base}/{table}?{field}=eq.{value}", json=data, headers=self.h)
        r.raise_for_status()
    def insert(self, table, records):
        if not records: return
        r = requests.post(f"{self.base}/{table}", json=records, headers=self.h)
        r.raise_for_status()

# ── 50 Grammar Lessons ──────────────────────────────────────────
LESSONS = [
    # ── Thì động từ ─────────────────────────────────────────────
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Present Simple & Present Continuous", "title_vi": "Thì Hiện tại đơn & Hiện tại tiếp diễn", "level": "B1", "order": 1},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Past Simple & Past Continuous", "title_vi": "Thì Quá khứ đơn & Quá khứ tiếp diễn", "level": "B1", "order": 2},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Present Perfect vs Past Simple", "title_vi": "Thì Hiện tại hoàn thành vs Quá khứ đơn", "level": "B2", "order": 3},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Past Perfect & Past Perfect Continuous", "title_vi": "Thì Quá khứ hoàn thành & Quá khứ hoàn thành tiếp diễn", "level": "B2", "order": 4},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Future: will, going to & Present Continuous", "title_vi": "Tương lai: will, going to & Hiện tại tiếp diễn", "level": "B1", "order": 5},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Future Perfect & Future Continuous", "title_vi": "Tương lai hoàn thành & Tương lai tiếp diễn", "level": "B2", "order": 6},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Present Perfect Continuous", "title_vi": "Thì Hiện tại hoàn thành tiếp diễn", "level": "B2", "order": 7},
    {"group": "Thì động từ", "group_en": "Verb Tenses", "icon": "🕐",
     "title": "Mixed Tenses: Complete Review", "title_vi": "Ôn tổng hợp tất cả các thì", "level": "B2", "order": 8},
    # ── Câu điều kiện ────────────────────────────────────────────
    {"group": "Câu điều kiện", "group_en": "Conditionals", "icon": "🔄",
     "title": "Conditionals Type 0 & Type 1", "title_vi": "Câu điều kiện Loại 0 & Loại 1", "level": "B1", "order": 9},
    {"group": "Câu điều kiện", "group_en": "Conditionals", "icon": "🔄",
     "title": "Conditionals Type 2", "title_vi": "Câu điều kiện Loại 2 (điều kiện không có thực ở hiện tại)", "level": "B2", "order": 10},
    {"group": "Câu điều kiện", "group_en": "Conditionals", "icon": "🔄",
     "title": "Conditionals Type 3", "title_vi": "Câu điều kiện Loại 3 (điều kiện không có thực ở quá khứ)", "level": "B2", "order": 11},
    {"group": "Câu điều kiện", "group_en": "Conditionals", "icon": "🔄",
     "title": "Mixed Conditionals & Inverted Conditionals", "title_vi": "Câu điều kiện hỗn hợp & đảo ngữ", "level": "C1", "order": 12},
    {"group": "Câu điều kiện", "group_en": "Conditionals", "icon": "🔄",
     "title": "Unless, Provided that, As long as", "title_vi": "Unless, Provided that, As long as trong câu điều kiện", "level": "B2", "order": 13},
    # ── Câu bị động ───────────────────────────────────────────────
    {"group": "Câu bị động", "group_en": "Passive Voice", "icon": "📢",
     "title": "Passive Voice: Present & Past Simple", "title_vi": "Bị động: Hiện tại đơn & Quá khứ đơn", "level": "B1", "order": 14},
    {"group": "Câu bị động", "group_en": "Passive Voice", "icon": "📢",
     "title": "Passive Voice: Perfect & Continuous Tenses", "title_vi": "Bị động: Thì hoàn thành & tiếp diễn", "level": "B2", "order": 15},
    {"group": "Câu bị động", "group_en": "Passive Voice", "icon": "📢",
     "title": "Passive with Modal Verbs", "title_vi": "Bị động với Modal Verbs", "level": "B2", "order": 16},
    {"group": "Câu bị động", "group_en": "Passive Voice", "icon": "📢",
     "title": "Causative: have/get something done", "title_vi": "Cấu trúc nhờ/sai làm: have/get something done", "level": "B2", "order": 17},
    {"group": "Câu bị động", "group_en": "Passive Voice", "icon": "📢",
     "title": "Passive Reporting Verbs", "title_vi": "Bị động với động từ tường thuật (is said to, is believed to)", "level": "C1", "order": 18},
    # ── Mệnh đề quan hệ ──────────────────────────────────────────
    {"group": "Mệnh đề quan hệ", "group_en": "Relative Clauses", "icon": "🔗",
     "title": "Defining Relative Clauses", "title_vi": "Mệnh đề quan hệ xác định", "level": "B1", "order": 19},
    {"group": "Mệnh đề quan hệ", "group_en": "Relative Clauses", "icon": "🔗",
     "title": "Non-defining Relative Clauses", "title_vi": "Mệnh đề quan hệ không xác định", "level": "B2", "order": 20},
    {"group": "Mệnh đề quan hệ", "group_en": "Relative Clauses", "icon": "🔗",
     "title": "Relative Clauses: where, when, why, whose", "title_vi": "Mệnh đề quan hệ với where, when, why, whose", "level": "B2", "order": 21},
    {"group": "Mệnh đề quan hệ", "group_en": "Relative Clauses", "icon": "🔗",
     "title": "Reduced Relative Clauses", "title_vi": "Rút gọn mệnh đề quan hệ", "level": "C1", "order": 22},
    # ── Modal Verbs ───────────────────────────────────────────────
    {"group": "Modal Verbs", "group_en": "Modal Verbs", "icon": "⚙️",
     "title": "Ability & Permission: can, could, be able to", "title_vi": "Khả năng & Sự cho phép: can, could, be able to", "level": "B1", "order": 23},
    {"group": "Modal Verbs", "group_en": "Modal Verbs", "icon": "⚙️",
     "title": "Obligation & Necessity: must, have to, need", "title_vi": "Nghĩa vụ & Sự cần thiết: must, have to, need", "level": "B1", "order": 24},
    {"group": "Modal Verbs", "group_en": "Modal Verbs", "icon": "⚙️",
     "title": "Advice: should, ought to, had better", "title_vi": "Lời khuyên: should, ought to, had better", "level": "B2", "order": 25},
    {"group": "Modal Verbs", "group_en": "Modal Verbs", "icon": "⚙️",
     "title": "Possibility & Deduction: may, might, must, can't", "title_vi": "Khả năng & Suy luận: may, might, must, can't", "level": "B2", "order": 26},
    {"group": "Modal Verbs", "group_en": "Modal Verbs", "icon": "⚙️",
     "title": "Past Modals: should have, must have, could have", "title_vi": "Modal Verbs quá khứ: should have, must have, could have", "level": "B2", "order": 27},
    # ── Câu tường thuật ──────────────────────────────────────────
    {"group": "Câu tường thuật", "group_en": "Reported Speech", "icon": "🗣️",
     "title": "Reported Statements", "title_vi": "Câu tường thuật: câu trần thuật", "level": "B2", "order": 28},
    {"group": "Câu tường thuật", "group_en": "Reported Speech", "icon": "🗣️",
     "title": "Reported Questions", "title_vi": "Câu tường thuật: câu hỏi", "level": "B2", "order": 29},
    {"group": "Câu tường thuật", "group_en": "Reported Speech", "icon": "🗣️",
     "title": "Reported Commands & Requests", "title_vi": "Câu tường thuật: câu mệnh lệnh & yêu cầu", "level": "B2", "order": 30},
    {"group": "Câu tường thuật", "group_en": "Reported Speech", "icon": "🗣️",
     "title": "Tense Backshift & Time/Place Expressions", "title_vi": "Lùi thì & thay đổi trạng từ thời gian/nơi chốn", "level": "B2", "order": 31},
    # ── V-ing vs Infinitive ───────────────────────────────────────
    {"group": "V-ing vs Infinitive", "group_en": "Infinitive & Gerund", "icon": "∞",
     "title": "Verbs Followed by Infinitive", "title_vi": "Động từ theo sau bởi nguyên mẫu (to-infinitive)", "level": "B2", "order": 32},
    {"group": "V-ing vs Infinitive", "group_en": "Infinitive & Gerund", "icon": "∞",
     "title": "Verbs Followed by Gerund (-ing)", "title_vi": "Động từ theo sau bởi V-ing", "level": "B2", "order": 33},
    {"group": "V-ing vs Infinitive", "group_en": "Infinitive & Gerund", "icon": "∞",
     "title": "Adjective + to-infinitive; Preposition + -ing", "title_vi": "Tính từ + to-infinitive; Giới từ + V-ing", "level": "B2", "order": 34},
    {"group": "V-ing vs Infinitive", "group_en": "Infinitive & Gerund", "icon": "∞",
     "title": "Stop, Remember, Try, Regret + Gerund/Infinitive", "title_vi": "Stop, Remember, Try, Regret + V-ing/to-V (nghĩa khác nhau)", "level": "B2", "order": 35},
    # ── Giới từ & Mạo từ ──────────────────────────────────────────
    {"group": "Giới từ & Mạo từ", "group_en": "Articles & Prepositions", "icon": "📌",
     "title": "Articles: a, an, the & Zero Article", "title_vi": "Mạo từ: a, an, the & không dùng mạo từ", "level": "B1", "order": 36},
    {"group": "Giới từ & Mạo từ", "group_en": "Articles & Prepositions", "icon": "📌",
     "title": "Prepositions of Time: in, on, at, by, until", "title_vi": "Giới từ chỉ thời gian: in, on, at, by, until", "level": "B1", "order": 37},
    {"group": "Giới từ & Mạo từ", "group_en": "Articles & Prepositions", "icon": "📌",
     "title": "Prepositions of Place & Movement", "title_vi": "Giới từ chỉ vị trí & chuyển động", "level": "B1", "order": 38},
    {"group": "Giới từ & Mạo từ", "group_en": "Articles & Prepositions", "icon": "📌",
     "title": "Common Prepositional Phrases & Phrasal Prepositions", "title_vi": "Cụm giới từ thông dụng & giới từ phức hợp", "level": "B2", "order": 39},
    # ── Từ nối & Liên từ ──────────────────────────────────────────
    {"group": "Từ nối & Liên từ", "group_en": "Conjunctions & Linking", "icon": "➡️",
     "title": "Coordinating Conjunctions: FANBOYS", "title_vi": "Liên từ đẳng lập: for, and, nor, but, or, yet, so", "level": "B1", "order": 40},
    {"group": "Từ nối & Liên từ", "group_en": "Conjunctions & Linking", "icon": "➡️",
     "title": "Subordinating Conjunctions: time, reason, result", "title_vi": "Liên từ phụ: thời gian, nguyên nhân, kết quả", "level": "B2", "order": 41},
    {"group": "Từ nối & Liên từ", "group_en": "Conjunctions & Linking", "icon": "➡️",
     "title": "Contrast: although, despite, in spite of, however", "title_vi": "Đối lập: although, despite, in spite of, however", "level": "B2", "order": 42},
    {"group": "Từ nối & Liên từ", "group_en": "Conjunctions & Linking", "icon": "➡️",
     "title": "Cause & Effect: because, since, therefore, consequently", "title_vi": "Nguyên nhân & kết quả: because, since, therefore, consequently", "level": "B2", "order": 43},
    {"group": "Từ nối & Liên từ", "group_en": "Conjunctions & Linking", "icon": "➡️",
     "title": "Discourse Markers & Formal Transitions", "title_vi": "Từ nối diễn ngôn & chuyển đoạn trang trọng", "level": "C1", "order": 44},
    # ── Cấu trúc đặc biệt ────────────────────────────────────────
    {"group": "Cấu trúc đặc biệt", "group_en": "Advanced Structures", "icon": "🔤",
     "title": "Inversion with Negative Adverbials", "title_vi": "Đảo ngữ với trạng từ phủ định (Hardly, No sooner, Not only)", "level": "C1", "order": 45},
    {"group": "Cấu trúc đặc biệt", "group_en": "Advanced Structures", "icon": "🔤",
     "title": "Emphatic Cleft Sentences: It is/was... that", "title_vi": "Câu chẻ nhấn mạnh: It is/was... that", "level": "C1", "order": 46},
    {"group": "Cấu trúc đặc biệt", "group_en": "Advanced Structures", "icon": "🔤",
     "title": "Wish, If Only & Would rather", "title_vi": "Wish, If Only & Would rather (ước muốn)", "level": "B2", "order": 47},
    {"group": "Cấu trúc đặc biệt", "group_en": "Advanced Structures", "icon": "🔤",
     "title": "Subjunctive Mood: suggest/recommend that sb (should) do", "title_vi": "Cách giả định: suggest/recommend that sb (should) do", "level": "C1", "order": 48},
    {"group": "Cấu trúc đặc biệt", "group_en": "Advanced Structures", "icon": "🔤",
     "title": "So/Such... that, Too... to, Enough to", "title_vi": "Cấu trúc So/Such...that, Too...to, Enough to", "level": "B2", "order": 49},
    {"group": "Cấu trúc đặc biệt", "group_en": "Advanced Structures", "icon": "🔤",
     "title": "Participle Clauses & Absolute Constructions", "title_vi": "Mệnh đề phân từ & cấu trúc tuyệt đối", "level": "C1", "order": 50},
]

THEORY_PROMPT = """Bạn là giáo viên Tiếng Anh chuyên luyện thi THPT/HSA/SPT cho học sinh Việt Nam.

Tạo bài học ngữ pháp "{title}" ({level}) bằng Markdown cho học sinh luyện thi.

Yêu cầu nội dung (content_md):
- Ngắn gọn, súc tích, dễ hiểu — tối đa 400 từ
- Cấu trúc: ## Công thức → ## Cách dùng → ## Ví dụ so sánh → ## Lưu ý
- Có bảng công thức (Markdown table) nếu phù hợp
- Ví dụ câu ngắn, thực tế, liên quan đề thi THPT
- Dùng ký hiệu ✅ ❌ để so sánh đúng/sai

key_rules: 4-6 quy tắc quan trọng nhất (mỗi quy tắc 1 câu ngắn)
common_mistakes: 4-5 lỗi sai phổ biến nhất dạng "❌ [sai] → ✅ [đúng]"

JSON thuần túy:
{{"title":"{title}","title_vi":"{title_vi}","content_md":"...","key_rules":["..."],"common_mistakes":["❌ ... → ✅ ..."]}}"""

EXERCISES_PROMPT = """Tạo đúng 12 câu hỏi MCQ 4 đáp án cho bài học ngữ pháp "{title}" ({level}).

Yêu cầu:
- Đa dạng: fill_blank (điền vào chỗ trống), error_correction (tìm lỗi sai), transformation (chuyển đổi câu)
- Độ khó: 5 basic, 5 intermediate, 2 advanced
- Chuẩn format đề THPT/HSA/SPT
- Distractor (đáp án sai) phải hợp lý, dễ nhầm
- Explanation ngắn gọn (1-2 câu)

JSON thuần túy:
{{"exercises":[{{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A|B|C|D","explanation":"...","difficulty":"basic|intermediate|advanced","question_type":"fill_blank|error_correction|transformation"}}]}}"""


def extract_json(text: str) -> dict | None:
    text = text.strip()
    text = re.sub(r"^```json?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    depth, start = 0, text.find("{")
    if start == -1: return None
    for i, ch in enumerate(text[start:], start):
        if ch == "{": depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try: return json.loads(text[start:i+1])
                except: return None
    return None


def call_ai(ai: anthropic.Anthropic, prompt: str, max_tokens=6000) -> dict | None:
    for attempt in range(3):
        try:
            msg = ai.messages.create(
                model="claude-haiku-4-5", max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            result = extract_json(msg.content[0].text)
            if result: return result
            print(f"    JSON parse failed attempt {attempt+1}, retrying...")
            time.sleep(2)
        except anthropic.RateLimitError:
            wait = (attempt + 1) * 15
            print(f"    Rate limit, waiting {wait}s..."); time.sleep(wait)
        except Exception as e:
            print(f"    Error attempt {attempt+1}: {e}"); time.sleep(3)
    return None


def process_lesson(sb: SupabaseREST, ai: anthropic.Anthropic, lesson: dict, args) -> int:
    lesson_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"grammar-{lesson['title']}"))

    record = {
        "id": lesson_id,
        "topic_group": lesson["group"],
        "topic_group_en": lesson["group_en"],
        "topic_group_icon": lesson["icon"],
        "title": lesson["title"],
        "title_vi": lesson["title_vi"],
        "level": lesson["level"],
        "content_md": "",
        "key_rules": [],
        "common_mistakes": [],
        "exercise_count": 0,
        "is_system": True,
        "is_active": True,
        "order_index": lesson["order"],
    }

    if not args.dry_run:
        sb.upsert("grammar_lessons", record, on_conflict="id")

    # Call 1: Theory
    theory = call_ai(ai, THEORY_PROMPT.format(
        title=lesson["title"], title_vi=lesson["title_vi"], level=lesson["level"]
    ), max_tokens=4000)

    if theory and not args.dry_run:
        sb.update("grammar_lessons", {
            "content_md": theory.get("content_md", ""),
            "key_rules": theory.get("key_rules", []),
            "common_mistakes": theory.get("common_mistakes", []),
        }, "id", lesson_id)

    time.sleep(1)

    # Call 2: Exercises
    exercises_data = call_ai(ai, EXERCISES_PROMPT.format(
        title=lesson["title"], level=lesson["level"]
    ), max_tokens=5000)

    exercises = exercises_data.get("exercises", []) if exercises_data else []

    if exercises and not args.dry_run:
        ex_records = [{
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{lesson_id}-ex{i}")),
            "lesson_id": lesson_id,
            "question_text": str(e.get("question_text", "")),
            "option_a": str(e.get("option_a", "")),
            "option_b": str(e.get("option_b", "")),
            "option_c": str(e.get("option_c", "")),
            "option_d": str(e.get("option_d", "")),
            "correct_answer": str(e.get("correct_answer", "A")).upper()[:1],
            "explanation": e.get("explanation", ""),
            "difficulty": e.get("difficulty", "basic"),
            "question_type": e.get("question_type", "fill_blank"),
            "order_index": i,
        } for i, e in enumerate(exercises)]

        sb.delete_where("grammar_exercises", "lesson_id", lesson_id)
        sb.insert("grammar_exercises", ex_records)
        sb.update("grammar_lessons", {"exercise_count": len(ex_records)}, "id", lesson_id)

    return len(exercises)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--start", type=int, default=1, help="Bắt đầu từ order N")
    parser.add_argument("--group", help="Filter theo tên group")
    args = parser.parse_args()

    ai = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    sb = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)

    lessons = LESSONS
    if args.group:
        lessons = [l for l in LESSONS if args.group.lower() in l["group"].lower()]
    elif args.start > 1:
        lessons = [l for l in LESSONS if l["order"] >= args.start]

    lessons = sorted(lessons, key=lambda x: x["order"])

    print(f"{'='*60}")
    print(f"GRAMMAR IMPORT — {len(lessons)} lessons | Dry run: {args.dry_run}")
    print(f"{'='*60}\n")

    total_ex = 0
    failed = []
    for i, lesson in enumerate(lessons, 1):
        print(f"[{i}/{len(lessons)}] {lesson['group']} > {lesson['title']} ({lesson['level']})")
        try:
            n = process_lesson(sb, ai, lesson, args)
            print(f"    ✓ {n} bài tập")
            total_ex += n
        except Exception as e:
            print(f"    ✗ FAILED: {e}")
            failed.append(lesson["title"])
        if i < len(lessons):
            time.sleep(2)

    print(f"\n{'='*60}")
    print(f"Tổng: {len(lessons) - len(failed)} lessons · {total_ex} bài tập · {len(failed)} lỗi")
    if failed:
        print(f"Failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
