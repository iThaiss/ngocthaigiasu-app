"""
import_reading.py
──────────────────────────────────────────────────────────────
Import reading passages vào Supabase.
Mỗi passage gồm: đoạn văn (~200-250 words) + 5 câu hỏi MCQ.

PREREQUISITES:
  Chạy supabase/grammar-reading-schema.sql trong Supabase SQL Editor trước.

Usage:
  python scripts/import_reading.py
  python scripts/import_reading.py --topic "Environment" --level B2
  python scripts/import_reading.py --dry-run
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

# ── Reading Passage List (topic × level) ─────────────────────
# 7 topic groups × B1 + B2 + C1 levels = 42 passages
PASSAGES = []
_order = 0

def _add(topic_en, topic_vi, level, subtopic=""):
    global _order
    _order += 1
    PASSAGES.append({"topic": topic_en, "topic_vi": topic_vi, "level": level, "subtopic": subtopic, "order": _order})

# Con người & Xã hội
_add("Family & Relationships", "Gia đình & Các mối quan hệ", "B1", "Family dynamics in modern Vietnam")
_add("Education & Learning", "Giáo dục & Học tập", "B1", "The role of education in society")
_add("Work & Career", "Công việc & Sự nghiệp", "B2", "Changing nature of work in the 21st century")
_add("Health & Medicine", "Sức khỏe & Y tế", "B2", "Advances in modern healthcare")
_add("Community & Social Issues", "Cộng đồng & Vấn đề xã hội", "B2", "Social inequality and solutions")
_add("Gender & Equality", "Bình đẳng giới", "B2", "Women in the workforce")
_add("Mental Health & Well-being", "Sức khỏe tâm thần", "C1", "The mental health crisis among young people")

# Thế giới tự nhiên
_add("Environment & Climate Change", "Môi trường & Biến đổi khí hậu", "B1", "Global warming and its effects")
_add("Environment & Climate Change", "Môi trường & Biến đổi khí hậu", "B2", "Renewable energy solutions")
_add("Nature & Wildlife", "Thiên nhiên & Động vật hoang dã", "B1", "Endangered species and conservation")
_add("Natural Disasters", "Thiên tai", "B2", "Earthquake preparedness and response")
_add("Energy & Natural Resources", "Năng lượng & Tài nguyên", "B2", "The future of clean energy")
_add("Agriculture & Farming", "Nông nghiệp", "B1", "Sustainable farming practices")
_add("Food & Nutrition", "Thực phẩm & Dinh dưỡng", "B2", "The impact of diet on health")

# Khoa học & Công nghệ
_add("Technology & Innovation", "Công nghệ & Đổi mới", "B1", "How smartphones changed daily life")
_add("Digital & Internet", "Kỹ thuật số & Internet", "B2", "Social media and teenagers")
_add("Artificial Intelligence & Robots", "Trí tuệ nhân tạo", "B2", "AI in everyday applications")
_add("Science & Research", "Khoa học & Nghiên cứu", "B2", "Scientific breakthroughs of the decade")
_add("Space & Astronomy", "Vũ trụ & Thiên văn học", "B2", "Mars exploration missions")
_add("Medicine & Biotechnology", "Y học & Công nghệ sinh học", "C1", "CRISPR and gene editing")
_add("Engineering & Infrastructure", "Kỹ thuật & Cơ sở hạ tầng", "C1", "Smart cities of the future")

# Kinh tế & Chính trị
_add("Business & Economics", "Kinh doanh & Kinh tế", "B1", "Entrepreneurship and startups")
_add("Media & Journalism", "Truyền thông & Báo chí", "B2", "Fake news and media literacy")
_add("Politics & Government", "Chính trị & Chính phủ", "B2", "Democracy and citizen participation")
_add("Globalization & Trade", "Toàn cầu hóa", "B2", "The effects of globalization on developing nations")
_add("Finance & Banking", "Tài chính & Ngân hàng", "C1", "The rise of digital banking")
_add("International Relations", "Quan hệ quốc tế", "C1", "Diplomacy in the modern world")

# Cuộc sống hàng ngày
_add("Travel & Transport", "Du lịch & Giao thông", "B1", "Sustainable tourism")
_add("Sports & Recreation", "Thể thao & Giải trí", "B1", "The benefits of sport for young people")
_add("Arts & Entertainment", "Nghệ thuật & Giải trí", "B2", "The influence of pop culture")
_add("Fashion & Lifestyle", "Thời trang & Lối sống", "B1", "Fast fashion and environmental impact")
_add("Music & Performing Arts", "Âm nhạc & Nghệ thuật", "B2", "Music as a universal language")
_add("Shopping & Consumerism", "Mua sắm & Tiêu dùng", "B2", "Online shopping trends")
_add("Housing & Urban Life", "Nhà ở & Đô thị", "C1", "Urbanization challenges in Asia")

# Tư duy & Ngôn ngữ
_add("Communication & Language", "Giao tiếp & Ngôn ngữ", "B2", "The importance of learning multiple languages")
_add("History & Civilization", "Lịch sử & Văn minh", "B2", "Ancient civilizations and their legacies")
_add("Psychology & Behavior", "Tâm lý học", "B2", "The psychology of social influence")
_add("Philosophy & Ethics", "Triết học & Đạo đức", "C1", "Ethical dilemmas in modern science")
_add("Literature & Writing", "Văn học", "B2", "The power of storytelling")
_add("Academic & Formal Language", "Ngôn ngữ học thuật", "C1", "Critical thinking in academic writing")
_add("Religion & Beliefs", "Tôn giáo & Tín ngưỡng", "B2", "Religion and society")

PASSAGE_PROMPT = """Bạn là giáo viên Tiếng Anh chuyên luyện thi THPT Việt Nam.

Viết một đoạn văn đọc hiểu chủ đề "{subtopic}" thuộc topic "{topic_en}" cho học sinh level {level}.

Yêu cầu đoạn văn:
- Độ dài: 200-250 từ
- Ngôn ngữ: tiếng Anh học thuật, tự nhiên, phù hợp {level}
- Nội dung: thực tế, liên quan THPT, không quá chuyên sâu
- Văn phong: expository/informative (không phải narrative)
- Có ít nhất 1-2 từ vựng tốt level {level} có thể hỏi trong câu hỏi

JSON thuần túy:
{{"title":"...","title_vi":"...","content":"..."}}"""

QUESTIONS_PROMPT = """Tạo đúng 5 câu hỏi MCQ đọc hiểu THPT cho đoạn văn sau:

TITLE: {title}
CONTENT:
{content}

Yêu cầu:
- 1 câu hỏi ý chính (main idea)
- 2 câu hỏi chi tiết (specific detail)
- 1 câu hỏi suy luận (inference)
- 1 câu hỏi từ vựng trong ngữ cảnh (vocabulary in context)
- Distractor hợp lý, đặt đúng vị trí đề thi THPT
- Explanation bằng tiếng Việt, ngắn gọn, rõ ràng
- Explanation nên chỉ ra evidence trong bài và vì sao đáp án đúng

JSON thuần túy:
{{"questions":[{{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A|B|C|D","explanation":"...","question_type":"main_idea|detail|inference|vocab_in_context"}}]}}"""


def extract_json(text: str) -> dict | None:
    text = text.strip()
    text = re.sub(r"^```json?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    try: return json.loads(text)
    except json.JSONDecodeError: pass
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


def call_ai(ai: anthropic.Anthropic, prompt: str, max_tokens=4000) -> dict | None:
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


def process_passage(sb: SupabaseREST, ai: anthropic.Anthropic, passage: dict, args) -> int:
    passage_id = str(uuid.uuid5(uuid.NAMESPACE_DNS,
                                f"reading-{passage['topic']}-{passage['level']}-{passage['subtopic']}"))

    # Call 1: Generate passage text
    p_data = call_ai(ai, PASSAGE_PROMPT.format(
        subtopic=passage["subtopic"],
        topic_en=passage["topic"],
        level=passage["level"],
    ), max_tokens=2000)

    if not p_data or not p_data.get("content"):
        return 0

    title = p_data.get("title", passage["subtopic"])
    title_vi = p_data.get("title_vi", passage["topic_vi"])
    content = p_data["content"]
    word_count = len(content.split())

    record = {
        "id": passage_id,
        "title": title,
        "title_vi": title_vi,
        "content": content,
        "topic": passage["topic"],
        "topic_vi": passage["topic_vi"],
        "level": passage["level"],
        "word_count": word_count,
        "question_count": 0,
        "is_system": True,
        "is_active": True,
        "order_index": passage["order"],
    }

    if not args.dry_run:
        sb.upsert("reading_passages", record, on_conflict="id")

    time.sleep(1)

    # Call 2: Generate questions
    q_data = call_ai(ai, QUESTIONS_PROMPT.format(title=title, content=content), max_tokens=3000)
    questions = q_data.get("questions", []) if q_data else []

    if questions and not args.dry_run:
        q_records = [{
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{passage_id}-q{i}")),
            "passage_id": passage_id,
            "question_text": str(q.get("question_text", "")),
            "option_a": str(q.get("option_a", "")),
            "option_b": str(q.get("option_b", "")),
            "option_c": str(q.get("option_c", "")),
            "option_d": str(q.get("option_d", "")),
            "correct_answer": str(q.get("correct_answer", "A")).upper()[:1],
            "explanation": q.get("explanation", ""),
            "question_type": q.get("question_type", "detail"),
            "order_index": i,
        } for i, q in enumerate(questions)]

        sb.delete_where("reading_questions", "passage_id", passage_id)
        sb.insert("reading_questions", q_records)
        sb.update("reading_passages", {"question_count": len(q_records)}, "id", passage_id)

    return len(questions)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--start", type=int, default=1, help="Bắt đầu từ order N")
    parser.add_argument("--topic", help="Filter theo tên topic")
    parser.add_argument("--level", help="Filter theo level (B1/B2/C1)")
    args = parser.parse_args()

    ai = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    sb = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)

    passages = PASSAGES
    if args.topic:
        passages = [p for p in PASSAGES if args.topic.lower() in p["topic"].lower()]
    if args.level:
        passages = [p for p in passages if p["level"] == args.level.upper()]
    if args.start > 1:
        passages = [p for p in passages if p["order"] >= args.start]

    print(f"{'='*60}")
    print(f"READING IMPORT — {len(passages)} passages | Dry run: {args.dry_run}")
    print(f"{'='*60}\n")

    total_q = 0
    failed = []
    for i, passage in enumerate(passages, 1):
        print(f"[{i}/{len(passages)}] [{passage['level']}] {passage['topic']} — {passage['subtopic']}")
        try:
            n = process_passage(sb, ai, passage, args)
            print(f"    ✓ {n} câu hỏi")
            total_q += n
        except Exception as e:
            print(f"    ✗ FAILED: {e}")
            failed.append(passage["subtopic"])
        if i < len(passages):
            time.sleep(2)

    print(f"\n{'='*60}")
    print(f"Tổng: {len(passages) - len(failed)} passages · {total_q} câu hỏi · {len(failed)} lỗi")
    if failed:
        print(f"Failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
