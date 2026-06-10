"""
import_math.py
──────────────────────────────────────────────────────────────
Tự động sinh và import bài học Toán nền tảng vào Supabase.
Mỗi bài học gồm: lý thuyết Markdown (LaTeX/KaTeX) + 10 bài tập ôn tập
(4 câu Trắc nghiệm MCQ, 3 câu Đúng/Sai, 3 câu Trả lời ngắn điền số).

Sử dụng 9Router hoặc OpenRouter thông qua API tương thích OpenAI.

Usage:
  python scripts/import_math.py --dry-run
  python scripts/import_math.py --course nen-tang --lesson-id <uuid>
  python scripts/import_math.py --model "cx/claude-3-5-sonnet"
──────────────────────────────────────────────────────────────
"""
import argparse
import json
import os
import re
import sys
import time
import uuid
import requests
from pathlib import Path

# Force UTF-8 encoding and line-buffered logs for long-running model calls.
try:
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
except Exception:
    pass

def _load_dotenv():
    for path in [".env.local", ".env", "../pipeline/.env"]:
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line: continue
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")

_load_dotenv()

# --- Configs ---
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

# 9Router config detection
ROUTER_BASE_URL = (
    os.environ.get("CLAUDE_BASE_URL") or 
    os.environ.get("AI_ROUTER_BASE_URL") or 
    os.environ.get("NINE_ROUTER_BASE_URL") or 
    os.environ.get("ROUTER9_BASE_URL") or 
    os.environ.get("9ROUTER_BASE_URL") or 
    "http://localhost:20128"
)
# Strip trailing /v1 or / if present to make it compatible with Anthropic SDK base_url
if ROUTER_BASE_URL.endswith("/v1"):
    ROUTER_BASE_URL = ROUTER_BASE_URL[:-3]
elif ROUTER_BASE_URL.endswith("/v1/"):
    ROUTER_BASE_URL = ROUTER_BASE_URL[:-4]
ROUTER_BASE_URL = ROUTER_BASE_URL.rstrip("/")

ROUTER_API_KEY = (
    os.environ.get("NINEROUTER_API_KEY") or
    os.environ.get("CLAUDE_API_KEY") or
    os.environ.get("AI_ROUTER_API_KEY") or 
    os.environ.get("NINE_ROUTER_API_KEY") or 
    os.environ.get("ROUTER9_API_KEY") or 
    os.environ.get("9ROUTER_API_KEY") or 
    "local-9router"
)
ROUTER_MODEL = (
    os.environ.get("AI_ROUTER_MODEL") or 
    os.environ.get("NINE_ROUTER_MODEL") or 
    os.environ.get("ROUTER9_MODEL") or 
    os.environ.get("9ROUTER_MODEL") or 
    "loz/gpt-5.4" # balanced default for local /loz router
)

def safe_numeric_answer(value):
    if value is None:
        return None
    try:
        answer = float(value)
    except (TypeError, ValueError):
        return None
    if not (-999999 < answer < 999999):
        return None
    return round(answer, 4)

WEB_THEORY_PROMPT = """Bạn là giáo viên Toán THPT ở Việt Nam, đang viết phần lý thuyết ngắn cho website học Toán.

Viết lại bài "{title}" ({level}) để học sinh chưa vững nền tảng vẫn đọc được và biết bắt đầu làm bài.

Đây KHÔNG phải giáo án, không phải sách giáo khoa, không phải flashcard. Đây là phần học nhanh nằm cạnh video: ngắn, rõ, có công thức, có ví dụ mẫu, có dạng bài và có bài tập vận dụng liên quan.

Cách viết mong muốn:
- Viết tự nhiên như một thầy/cô đang giảng chậm, không dùng khung máy móc giống hệt nhau cho mọi bài.
- Ưu tiên luồng: ý tưởng cốt lõi -> công thức/dạng chính -> giải thích ký hiệu -> ví dụ mẫu -> dạng bài hay gặp -> quy trình/mẹo nhớ.
- Nếu bài nào không cần một mục thì có thể gộp, nhưng không được bỏ mất bản chất, công thức, ví dụ và dạng bài.
- Mỗi đoạn chỉ nói một ý. Tránh đoạn văn dài. Ưu tiên bảng nhỏ, bullet ngắn, checklist.
- Công thức dùng LaTeX chuẩn với $...$ hoặc $$...$$.
- Mỗi công thức quan trọng phải giải thích ký hiệu bằng ngôn ngữ đơn giản: ký hiệu đó là gì, lấy từ đâu trong đề, dùng khi nào.
- Ví dụ mẫu phải ngắn, sát công thức, giải 3-6 bước. Luôn nói vì sao chọn công thức/cách làm đó.
- Dạng bài hay gặp phải viết theo dấu hiệu đọc đề, không chỉ gọi tên dạng.
- Cuối bài có một quy trình làm bài hoặc mẹo nhớ thật ngắn.
- Không tạo hình minh họa, không nhắc TikZ, không tạo flashcard, không dùng nhãn "teaching guide".

Yêu cầu riêng:
- Với bài Oxyz, dùng đúng tọa độ 3 chiều: điểm $(x_0,y_0,z_0)$, vectơ $(a,b,c)$.
- Với bài đường thẳng trong Oxyz, phải xoay quanh ý tưởng: một điểm thuộc đường thẳng + một vectơ chỉ phương.
- Với bài mặt cầu, phải nêu tâm, bán kính, dạng chính tắc, dạng khai triển và điều kiện $R^2>0$ nếu phù hợp.
- Với bài có chữ "và" trong tiêu đề, phải phủ đủ cả hai vế, không viết lệch một nửa.
- Với bài xác suất nhiều giai đoạn, ưu tiên sơ đồ cây, nhân theo nhánh và cộng các trường hợp.
- Với khảo sát hàm số, ưu tiên dấu hiệu, bảng biến thiên, công thức và cách đọc kết quả.

Trả về JSON thuần túy, không markdown fence, không text ngoài JSON:
{{
  "title": "{title}",
  "title_vi": "{title_vi}",
  "content_md": "Markdown khoảng 600-1000 chữ theo tinh thần trên",
  "key_rules": ["3-5 ý cốt lõi ngắn, mỗi ý là một điều học sinh cần nhớ"],
  "common_mistakes": ["3-5 lỗi sai thật sự hay gặp, viết ngắn theo kiểu Sai: ... -> Sửa: ..."]
}}
"""

WEB_EXERCISE_BATCH_PROMPT = """Bạn là giáo viên Toán THPT. Tạo ĐÚNG {count} bài tập cho chuyên đề "{title}" ({level}).

Mục tiêu: bài tập phải giúp học sinh áp dụng ngay phần lý thuyết vừa học, không chỉ hỏi thuộc công thức. Câu hỏi ngắn, rõ dữ kiện, có lời giải giải thích vì sao dùng công thức/cách làm đó.

Loại câu bắt buộc: {question_type}
Độ khó ưu tiên: {difficulty}

Yêu cầu:
- Trả về JSON thuần túy, không markdown fence.
- Dùng tiếng Việt.
- Công thức toán phải dùng LaTeX với $...$ hoặc $$...$$.
- Đề, đáp án và lời giải phải chính xác, ngắn gọn.
- Với câu vận dụng, ưu tiên tình huống đọc đề -> nhận dạng dạng bài -> thay công thức -> kết luận.
- Không tạo flashcard, không nhắc FSRS.

Nếu question_type = "multiple_choice":
- Mỗi câu có option_a, option_b, option_c, option_d và correct_answer là "A"|"B"|"C"|"D".
Nếu question_type = "true_false":
- Mỗi câu có statements gồm đúng 4 ý A-D, mỗi ý có label, text, answer boolean.
Nếu question_type = "short_answer":
- Mỗi câu có numeric_answer là một số cụ thể.
- numeric_answer phải có giá trị tuyệt đối nhỏ hơn 999999.

JSON:
{{
  "exercises": [
    {{
      "question_text": "...",
      "question_type": "{question_type}",
      "difficulty": "{difficulty}",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A",
      "statements": [],
      "numeric_answer": null,
      "explanation": "..."
    }}
  ]
}}
"""

class SupabaseREST:
    def __init__(self, url, key):
        self.base = url.rstrip("/") + "/rest/v1"
        self.h = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    def get(self, table, select="*", eq=None):
        url = f"{self.base}/{table}?select={select}"
        if eq:
            for k, v in eq.items():
                url += f"&{k}=eq.{v}"
        r = requests.get(url, headers=self.h)
        r.raise_for_status()
        return r.json()
    def upsert(self, table, records, on_conflict="id"):
        data = records if isinstance(records, list) else [records]
        headers = {**self.h, "Prefer": "resolution=merge-duplicates,return=minimal"}
        r = requests.post(f"{self.base}/{table}?on_conflict={on_conflict}", json=data, headers=headers)
        if r.status_code >= 400:
            print(f"      [Supabase Upsert Error]: Status {r.status_code}, Body: {r.text}")
        r.raise_for_status()
    def delete_where(self, table, field, value):
        r = requests.delete(f"{self.base}/{table}?{field}=eq.{value}", headers=self.h)
        r.raise_for_status()
    def update(self, table, data, field, value):
        r = requests.patch(f"{self.base}/{table}?{field}=eq.{value}", json=data, headers=self.h)
        if r.status_code >= 400:
            print(f"      [Supabase Update Error]: Status {r.status_code}, Body: {r.text}")
        r.raise_for_status()
    def insert(self, table, records):
        if not records: return
        r = requests.post(f"{self.base}/{table}", json=records, headers=self.h)
        if r.status_code >= 400:
            print(f"      [Supabase Insert Error]: Status {r.status_code}, Body: {r.text}")
        r.raise_for_status()

# --- Predefined Math Syllabus Structure ---
MATH_SYLLABUS = [
    {
        "course_slug": "nen-tang",
        "chapters": [
            {
                "name": "Chương 1: Kiến thức tiền đề",
                "subject": "toan_dai",
                "order": 1,
                "lessons": [
                    {"title": "Giới hạn của dãy số và hàm số", "title_vi": "Giới hạn dãy số và hàm số", "level": "nhan_biet", "order": 1, "topic": "Kiến thức tiền đề"},
                    {"title": "Tính liên tục của hàm số tại một điểm và trên một khoảng", "title_vi": "Tính liên tục của hàm số", "level": "nhan_biet", "order": 2, "topic": "Kiến thức tiền đề"},
                    {"title": "Các quy tắc tính đạo hàm cơ bản, đạo hàm hàm hợp và đạo hàm cấp hai", "title_vi": "Quy tắc tính đạo hàm, đạo hàm hàm hợp và cấp hai", "level": "nhan_biet", "order": 3, "topic": "Kiến thức tiền đề"},
                    {"title": "Ý nghĩa hình học (tiếp tuyến) và ý nghĩa vật lý (vận tốc tức thời) của đạo hàm", "title_vi": "Ý nghĩa tiếp tuyến và ý nghĩa vật lý của đạo hàm", "level": "thong_hieu", "order": 4, "topic": "Kiến thức tiền đề"},
                    {"title": "Hệ thống các định lý hình học không gian cổ điển (góc và khoảng cách)", "title_vi": "Góc và khoảng cách cổ điển trong không gian", "level": "thong_hieu", "order": 5, "topic": "Kiến thức tiền đề"}
                ]
            },
            {
                "name": "Chương 2: Ứng dụng đạo hàm và khảo sát hàm số",
                "subject": "toan_dai",
                "order": 2,
                "lessons": [
                    {"title": "Điều kiện cần và đủ để hàm số đồng biến, nghịch biến", "title_vi": "Tính đơn điệu của hàm số", "level": "nhan_biet", "order": 1, "topic": "Khảo sát hàm số"},
                    {"title": "Cực trị của hàm số: Phân biệt cực đại, cực tiểu và các điểm tới hạn", "title_vi": "Điểm cực đại, cực tiểu và cực trị hàm số", "level": "nhan_biet", "order": 2, "topic": "Khảo sát hàm số"},
                    {"title": "Giá trị lớn nhất (GTLN) và giá trị nhỏ nhất (GTNN) trên một khoảng/đoạn", "title_vi": "Giá trị lớn nhất và nhỏ nhất của hàm số", "level": "nhan_biet", "order": 3, "topic": "Khảo sát hàm số"},
                    {"title": "Đường tiệm cận đứng và tiệm cận ngang", "title_vi": "Tiệm cận đứng và tiệm cận ngang", "level": "nhan_biet", "order": 4, "topic": "Khảo sát hàm số"},
                    {"title": "Đường tiệm cận xiên (tập trung hàm phân thức bậc hai trên bậc nhất)", "title_vi": "Đường tiệm cận xiên của đồ thị hàm số", "level": "thong_hieu", "order": 5, "topic": "Khảo sát hàm số"},
                    {"title": "Khảo sát sự biến thiên và vẽ đồ thị hàm số (đa thức, phân thức)", "title_vi": "Khảo sát sự biến thiên và đồ thị hàm số", "level": "thong_hieu", "order": 6, "topic": "Khảo sát hàm số"},
                    {"title": "Kỹ năng đọc hiểu đồ thị/bảng biến thiên của f(x) và đồ thị đạo hàm f'(x)", "title_vi": "Đọc hiểu bảng biến thiên và đồ thị đạo hàm f'(x)", "level": "van_dung", "order": 7, "topic": "Khảo sát hàm số"}
                ]
            },
            {
                "name": "Chương 3: Ứng dụng đạo hàm thực tế",
                "subject": "toan_dai",
                "order": 3,
                "lessons": [
                    {"title": "Phương pháp mô hình hóa: Chuyển dữ kiện thực tế thành hàm số một biến", "title_vi": "Mô hình hóa bài toán thực tế một biến", "level": "thong_hieu", "order": 1, "topic": "Ứng dụng đạo hàm thực tế"},
                    {"title": "Tối ưu hóa hình học: Tìm kích thước để diện tích, thể tích đạt max/min", "title_vi": "Bài toán tối ưu hóa diện tích và thể tích", "level": "van_dung", "order": 2, "topic": "Ứng dụng đạo hàm thực tế"},
                    {"title": "Toán kinh tế: Thiết lập và khảo sát hàm chi phí C(x), doanh thu R(x), lợi nhuận P(x)", "title_vi": "Bài toán kinh tế doanh thu, lợi nhuận, chi phí", "level": "van_dung", "order": 3, "topic": "Ứng dụng đạo hàm thực tế"},
                    {"title": "Tối ưu hóa động học: Bài toán tốc độ thay đổi, quãng đường ngắn nhất, thời gian ít nhất", "title_vi": "Bài toán tốc độ thay đổi và tối ưu chuyển động", "level": "van_dung", "order": 4, "topic": "Ứng dụng đạo hàm thực tế"}
                ]
            },
            {
                "name": "Chương 4: Nguyên hàm và tích phân",
                "subject": "toan_dai",
                "order": 4,
                "lessons": [
                    {"title": "Định nghĩa và tính chất cơ bản của nguyên hàm", "title_vi": "Khái niệm và tính chất nguyên hàm", "level": "nhan_biet", "order": 1, "topic": "Nguyên hàm và tích phân"},
                    {"title": "Các phương pháp tìm nguyên hàm: Đổi biến số, nguyên hàm từng phần", "title_vi": "Phương pháp đổi biến và từng phần tính nguyên hàm", "level": "thong_hieu", "order": 2, "topic": "Nguyên hàm và tích phân"},
                    {"title": "Kỹ thuật tính nguyên hàm các hàm lượng giác, hàm đặc biệt và hàm hữu tỷ đơn giản", "title_vi": "Kỹ thuật tính nguyên hàm hàm lượng giác, phân thức", "level": "thong_hieu", "order": 3, "topic": "Nguyên hàm và tích phân"},
                    {"title": "Định nghĩa và tính chất của tích phân xác định", "title_vi": "Khái niệm tích phân và tính chất", "level": "nhan_biet", "order": 4, "topic": "Nguyên hàm và tích phân"},
                    {"title": "Ứng dụng hình học 1: Tính diện tích hình phẳng giới hạn bởi các đường cong", "title_vi": "Ứng dụng tích phân tính diện tích hình phẳng", "level": "thong_hieu", "order": 5, "topic": "Nguyên hàm và tích phân"},
                    {"title": "Ứng dụng hình học 2: Tính thể tích vật thể tròn xoay quanh hệ trục tọa độ", "title_vi": "Ứng dụng tích phân tính thể tích vật thể tròn xoay", "level": "thong_hieu", "order": 6, "topic": "Nguyên hàm và tích phân"},
                    {"title": "Ứng dụng thực tế: Tính quãng đường s(t) từ vận tốc v(t), bài toán công và lưu lượng", "title_vi": "Ứng dụng thực tế của tích phân", "level": "van_dung", "order": 7, "topic": "Nguyên hàm và tích phân"}
                ]
            },
            {
                "name": "Chương 5: Vectơ và tọa độ Oxyz nền tảng",
                "subject": "toan_hinh",
                "order": 5,
                "lessons": [
                    {"title": "Hệ trục tọa độ Oxyz: Tọa độ của điểm và tọa độ của vectơ", "title_vi": "Tọa độ điểm và tọa độ vectơ trong Oxyz", "level": "nhan_biet", "order": 1, "topic": "Vectơ và tọa độ Oxyz"},
                    {"title": "Các phép toán đại số vectơ: Cộng, trừ, nhân vectơ với một số", "title_vi": "Các phép toán vectơ cơ bản", "level": "nhan_biet", "order": 2, "topic": "Vectơ và tọa độ Oxyz"},
                    {"title": "Tích vô hướng: Biểu thức tọa độ và ứng dụng tính góc, độ dài", "title_vi": "Ứng dụng tích vô hướng tính góc, độ dài", "level": "thong_hieu", "order": 3, "topic": "Vectơ và tọa độ Oxyz"},
                    {"title": "Tích có hướng của hai vectơ: Tính chất và ứng dụng diện tích, thể tích", "title_vi": "Tích có hướng và ứng dụng hình học", "level": "thong_hieu", "order": 4, "topic": "Vectơ và tọa độ Oxyz"},
                    {"title": "Bài toán tâm tỉ cự: Cơ sở đại số biểu diễn vectơ để giải quyết các điểm đặc biệt", "title_vi": "Tâm tỉ cự trong không gian Oxyz", "level": "van_dung", "order": 5, "topic": "Vectơ và tọa độ Oxyz"},
                    {"title": "Mô hình hóa thực tế: Biểu diễn lực, vận tốc và định vị vật thể không gian", "title_vi": "Mô hình hóa lực và vận tốc bằng vectơ Oxyz", "level": "thong_hieu", "order": 6, "topic": "Vectơ và tọa độ Oxyz"}
                ]
            },
            {
                "name": "Chương 6: Phương trình và hình học Oxyz",
                "subject": "toan_hinh",
                "order": 6,
                "lessons": [
                    {"title": "Mặt phẳng: Vectơ pháp tuyến, phương trình tổng quát, phương trình đoạn chắn", "title_vi": "Phương trình tổng quát và đoạn chắn của mặt phẳng", "level": "nhan_biet", "order": 1, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Đường thẳng: Vectơ chỉ phương, phương trình tham số, phương trình chính tắc", "title_vi": "Phương trình tham số và chính tắc của đường thẳng", "level": "nhan_biet", "order": 2, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Mặt cầu: Xác định tâm, bán kính, phương trình mặt cầu và sự tương giao", "title_vi": "Phương trình mặt cầu và tương giao", "level": "nhan_biet", "order": 3, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Vị trí tương đối: Điểm, đường thẳng, mặt phẳng và mặt cầu", "title_vi": "Vị trí tương đối giữa các đối tượng trong Oxyz", "level": "thong_hieu", "order": 4, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Bài toán khoảng cách: Từ điểm đến mặt/đường, khoảng cách giữa hai đường thẳng chéo nhau", "title_vi": "Bài toán tính khoảng cách trong Oxyz", "level": "thong_hieu", "order": 5, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Bài toán góc: Giữa hai đường thẳng, hai mặt phẳng, đường và mặt", "title_vi": "Bài toán tính góc trong không gian Oxyz", "level": "thong_hieu", "order": 6, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Bài toán tìm hình chiếu vuông góc và điểm đối xứng", "title_vi": "Hình chiếu vuông góc và điểm đối xứng", "level": "thong_hieu", "order": 7, "topic": "Phương trình và hình học Oxyz"},
                    {"title": "Cực trị Oxyz: Tìm điểm thỏa mãn điều kiện min/max về khoảng cách, tổng độ dài", "title_vi": "Các bài toán cực trị tọa độ hình học Oxyz", "level": "van_dung", "order": 8, "topic": "Phương trình và hình học Oxyz"}
                ]
            },
            {
                "name": "Chương 7: Thống kê & mẫu số liệu ghép nhóm",
                "subject": "toan_dai",
                "order": 7,
                "lessons": [
                    {"title": "Quy tắc thành lập mẫu số liệu ghép nhóm từ tập dữ liệu thô", "title_vi": "Cách thành lập mẫu số liệu ghép nhóm", "level": "nhan_biet", "order": 1, "topic": "Thống kê số liệu"},
                    {"title": "Đại lượng đo xu hướng trung tâm: Tính toán và ý nghĩa của Số trung bình, Mốt, Trung vị, Tứ phân vị", "title_vi": "Số trung bình, mốt, trung vị và tứ phân vị", "level": "nhan_biet", "order": 2, "topic": "Thống kê số liệu"},
                    {"title": "Đại lượng đo mức độ phân tán: Tính toán Khoảng biến thiên, Khoảng tứ phân vị, Phương sai, Độ lệch chuẩn", "title_vi": "Khoảng biến thiên, phương sai, độ lệch chuẩn", "level": "nhan_biet", "order": 3, "topic": "Thống kê số liệu"},
                    {"title": "Đánh giá thực tế: Kỹ năng đọc dữ liệu, so sánh độ rủi ro, phân tích sự phân tán", "title_vi": "Phân tích và đọc hiểu số liệu thống kê thực tế", "level": "thong_hieu", "order": 4, "topic": "Thống kê số liệu"}
                ]
            },
            {
                "name": "Chương 8: Xác suất có điều kiện",
                "subject": "toan_dai",
                "order": 8,
                "lessons": [
                    {"title": "Khái niệm biến cố độc lập và quy tắc nhân xác suất cơ bản", "title_vi": "Biến cố độc lập và quy tắc nhân xác suất", "level": "nhan_biet", "order": 1, "topic": "Xác suất có điều kiện"},
                    {"title": "Định nghĩa và cách tính Xác suất có điều kiện P(A|B)", "title_vi": "Xác suất có điều kiện", "level": "nhan_biet", "order": 2, "topic": "Xác suất có điều kiện"},
                    {"title": "Công thức nhân xác suất mở rộng", "title_vi": "Quy tắc nhân xác suất mở rộng", "level": "thong_hieu", "order": 3, "topic": "Xác suất có điều kiện"},
                    {"title": "Định lý xác suất toàn phần", "title_vi": "Công thức xác suất toàn phần", "level": "thong_hieu", "order": 4, "topic": "Xác suất có điều kiện"},
                    {"title": "Công thức Bayes: Ứng dụng suy luận ngược nguyên nhân gây ra biến cố", "title_vi": "Công thức Bayes và ứng dụng", "level": "thong_hieu", "order": 5, "topic": "Xác suất có điều kiện"},
                    {"title": "Sơ đồ cây: Kỹ năng vẽ và tính toán xác suất trực tiếp trên các nhánh cho bài toán nhiều giai đoạn", "title_vi": "Tính xác suất bằng sơ đồ cây", "level": "thong_hieu", "order": 6, "topic": "Xác suất có điều kiện"}
                ]
            }
        ]
    }
]


THEORY_PROMPT = """Bạn là giáo viên Toán chuyên luyện thi THPT Quốc Gia, HSA và ĐGNL tại Việt Nam.

Hãy tạo bài học lý thuyết toán học chuyên đề "{title}" ({level}) dưới dạng Markdown và JSON.

Yêu cầu nội dung (content_md):
- Viết công thức toán học bằng định dạng LaTeX tiêu chuẩn: sử dụng một ký tự $ cho công thức viết cùng dòng (Ví dụ: $y = ax^2$) và hai ký tự $$ cho công thức dạng khối viết riêng dòng.
- Cấu trúc trình bày rõ ràng:
  ## I. Công thức & Định nghĩa cốt lõi
  ## II. Các bước giải & Phương pháp điển hình
  ## III. Ví dụ minh họa (Giải chi tiết từng bước bằng tiếng Việt, chứa công thức LaTeX)
  ## IV. Chú ý & Sai lầm cần tránh (Đặc biệt là điều kiện xác định, khoảng biến thiên, nhầm dấu)
- Dùng các ký tự ✅ và ❌ để đối chiếu đúng/sai cho học sinh dễ ghi nhớ.
- Bài viết súc tích, dễ học, lý thuyết đi thẳng vào bản chất và phương pháp làm bài trắc nghiệm nhanh.

JSON Format:
{{
  "title": "{title}",
  "title_vi": "{title_vi}",
  "content_md": "nội dung Markdown ở đây...",
  "key_rules": ["Quy tắc quan trọng 1", "Quy tắc quan trọng 2", ...],
  "common_mistakes": ["❌ [Lỗi hay mắc] -> ✅ [Khắc phục đúng]", ...]
}}
Chỉ trả về JSON thuần túy, không kẹp text ngoài JSON.
"""

EXERCISES_PROMPT = """Tạo ĐÚNG 10 câu hỏi ôn tập toán học cho chuyên đề "{title}" ({level}).

Cơ cấu câu hỏi bắt buộc:
- 4 câu Trắc nghiệm khách quan bốn lựa chọn (question_type: "multiple_choice")
- 3 câu trắc nghiệm Đúng/Sai (question_type: "true_false"), mỗi câu có 4 ý khẳng định A, B, C, D cần chọn Đúng hoặc Sai.
- 3 câu hỏi Trả lời ngắn điền số (question_type: "short_answer"), học sinh cần tính toán ra kết quả là một số cụ thể (nguyên hoặc thập phân).

Yêu cầu định dạng toán học:
- TẤT CẢ các câu hỏi, các lựa chọn, các phát biểu đúng/sai và lời giải chi tiết (explanation) PHẢI sử dụng mã LaTeX kẹp trong dấu $ (inline) hoặc $$ (block) khi viết công thức toán học.
- Đảm bảo tính chính xác khoa học tuyệt đối về đề bài và đáp án.
- Phân bố độ khó: 4 câu Nhận biết, 4 câu Thông hiểu, 2 câu Vận dụng.

JSON Format:
{{
  "exercises": [
    {{
      "question_text": "Câu hỏi chứa LaTeX...",
      "question_type": "multiple_choice",
      "difficulty": "Nhận biết|Thông hiểu|Vận dụng",
      "option_a": "Lựa chọn A...",
      "option_b": "Lựa chọn B...",
      "option_c": "Lựa chọn C...",
      "option_d": "Lựa chọn D...",
      "correct_answer": "A|B|C|D",
      "explanation": "Lời giải chi tiết chứa LaTeX..."
    }},
    {{
      "question_text": "Phát biểu chung chứa LaTeX...",
      "question_type": "true_false",
      "difficulty": "Thông hiểu|Vận dụng",
      "statements": [
        {{"label": "A", "text": "Khẳng định A chứa LaTeX...", "answer": true}},
        {{"label": "B", "text": "Khẳng định B chứa LaTeX...", "answer": false}},
        {{"label": "C", "text": "Khẳng định C chứa LaTeX...", "answer": true}},
        {{"label": "D", "text": "Khẳng định D chứa LaTeX...", "answer": false}}
      ],
      "explanation": "Giải thích chi tiết cho từng khẳng định đúng/sai..."
    }},
    {{
      "question_text": "Câu hỏi yêu cầu tìm giá trị số chứa LaTeX...",
      "question_type": "short_answer",
      "difficulty": "Vận dụng",
      "numeric_answer": 2.5,
      "explanation": "Giải thích chi tiết các bước biến đổi dẫn tới kết quả..."
    }}
  ]
}}
Chỉ trả về JSON thuần túy, không có văn bản giải thích thừa.
"""

COMPACT_THEORY_PROMPT = """Bạn là giáo viên Toán THPT luyện thi cho học sinh Việt Nam.

Tạo phần LÝ THUYẾT TRÊN WEB cho chuyên đề "{title}" ({level}).

Vai trò của phần này: tóm tắt ôn thi dễ hiểu. Học sinh đọc để nắm công thức, biết khi nào dùng, xem ví dụ mẫu và tránh lỗi sai. Phần giảng sâu sẽ nằm trong video, nên không viết như giáo án dài.

Yêu cầu trả về:
- Chỉ trả về JSON thuần túy, không markdown fence, không text ngoài JSON.
- content_md dài khoảng 500-800 chữ, dùng Markdown và LaTeX chuẩn với $...$ hoặc $$...$$.
- Viết ngắn gọn, rõ, dễ scan. Không dùng nhãn "Hỏi học sinh", "Trả lời mong đợi", "teaching guide".
- Không viết đoạn văn dài quá 5 dòng. Ưu tiên bảng, bullet, checklist.
- Không tạo dòng [Hình minh họa: ...] trong content_md. Hình/TikZ sẽ được chèn thủ công sau khi có bộ hình phù hợp.
- Ví dụ mẫu phải có một câu ngắn giải thích vì sao chọn công thức/phương pháp.
- common_mistakes phải là lỗi thật, không viết lỗi và đáp án đúng giống nhau.

Cấu trúc content_md bắt buộc:
## 1. Công thức trọng tâm
Đưa các công thức/dạng công thức chính. Nếu có nhiều công thức, dùng bảng gồm: Công thức | Dùng khi | Cần nhớ.

## 2. Hiểu nhanh công thức
Giải thích ý nghĩa công thức bằng lời ngắn gọn: mỗi ký hiệu là gì, điều kiện áp dụng là gì, bản chất cần hiểu là gì.

## 3. Khi nào dùng?
Nêu dấu hiệu nhận biết trong đề. Viết dạng bullet ngắn, thực dụng.

## 4. Ví dụ mẫu
Cho 1-2 ví dụ tiêu biểu. Mỗi ví dụ giải gọn 3-6 bước, có câu "Vì đề cho ..., ta dùng ...".

## 5. Lưu ý & lỗi sai
Nêu lỗi theo mẫu ngắn:
- Sai: ...
  Vì sao sai: ...
  Sửa: ...

## 6. Chốt nhanh
Tóm tắt 3-5 ý cần nhớ để làm bài.

Quy ước thêm:
- Với bài Oxyz, dùng đúng không gian 3 chiều nếu tiêu đề thuộc Oxyz: điểm $(x_0,y_0,z_0)$, vectơ $(a,b,c)$.
- Với đường thẳng trong Oxyz, dùng ý tưởng "một điểm thuộc đường + một vectơ chỉ phương" nhưng viết ngắn.
- Với mặt cầu, luôn nêu tâm, bán kính, dạng chính tắc, dạng khai triển và điều kiện $R^2>0$ nếu phù hợp.
- Với bài có chữ "và" trong tiêu đề, phải phủ đủ cả hai vế của tiêu đề; không được chỉ viết sâu vế đầu.
- Với "Phương trình mặt cầu và tương giao", bắt buộc có đủ: phương trình mặt cầu, tương giao mặt cầu-mặt phẳng, tương giao mặt cầu-đường thẳng. Phần ví dụ mẫu phải có 3 ví dụ ngắn: một ví dụ lập/tìm phương trình mặt cầu, một ví dụ tương giao mặt cầu-mặt phẳng, một ví dụ tương giao mặt cầu-đường thẳng.
- Với khảo sát hàm số, ưu tiên công thức/dấu hiệu/bảng biến thiên, không giảng dài.
- Với xác suất nhiều giai đoạn, ưu tiên sơ đồ cây, quy tắc nhân nhánh và cộng các trường hợp.

JSON:
{{
  "title": "{title}",
  "title_vi": "{title_vi}",
  "content_md": "...",
  "key_rules": ["3-5 quy tắc ngắn, rõ, dùng để hiện ở khung Cần nhớ"],
  "common_mistakes": ["Sai: ... -> Đúng: ..."]
}}
"""

COMPACT_THEORY_PROMPT = """Bạn là giáo viên Toán THPT luyện thi cho học sinh Việt Nam.

Tạo phần LÝ THUYẾT TRÊN WEB cho chuyên đề "{title}" ({level}).

Mục tiêu: học sinh đọc nhanh để hiểu ý chính, sau đó ôn lại bằng flashcard FSRS. Phần giảng sâu nằm trong video, nên không viết như giáo án dài.

Yêu cầu trả về:
- Chỉ trả về JSON thuần túy, không markdown fence, không text ngoài JSON.
- content_md dài khoảng 180-300 chữ, dùng Markdown và LaTeX chuẩn với $...$ hoặc $$...$$.
- Viết cực ngắn, rõ, dễ scan. Không dùng nhãn "Hỏi học sinh", "Trả lời mong đợi", "teaching guide".
- Không viết đoạn văn dài quá 4 dòng. Ưu tiên bảng, bullet, checklist.
- Không tạo dòng [Hình minh họa: ...] trong content_md.
- Ví dụ mẫu chỉ 1 ví dụ, giải 2-4 bước, có câu "Vì đề cho ..., ta dùng ...".
- common_mistakes phải là lỗi thật, không viết lỗi và đáp án đúng giống nhau.
- Tạo 12-18 flashcards để học sinh ôn bằng FSRS. Mỗi flashcard chỉ hỏi MỘT ý nhỏ.
- Flashcard phải dùng active recall: mặt trước là câu hỏi ngắn hoặc điền khuyết; mặt sau là đáp án ngắn, tối đa 3-5 dòng.
- Cơ cấu flashcard ưu tiên:
  + 4-7 thẻ công thức/công thức biến đổi.
  + 2-3 thẻ khái niệm hoặc ý nghĩa ký hiệu.
  + 3-4 thẻ "khi nào dùng / nhìn đề nhận ra gì".
  + 2-3 thẻ lỗi sai.
  + 1-2 thẻ ví dụ mini.

Cấu trúc content_md bắt buộc:
## 1. Tóm tắt 30 giây
Nói bài này dùng để làm gì, 2-3 câu ngắn.

## 2. Công thức cần nhớ
Bảng ngắn gồm: Công thức | Dùng khi | Cần nhớ.

## 3. Khi nào dùng?
Nêu dấu hiệu nhận biết trong đề. Viết bullet ngắn, thực dụng.

## 4. Ví dụ mẫu cực ngắn
Cho 1 ví dụ tiêu biểu, giải gọn 2-4 bước.

## 5. Lỗi sai hay gặp
Mỗi lỗi viết theo dạng: Sai: ... -> Đúng: ...

Quy ước thêm:
- Với bài Oxyz, dùng đúng không gian 3 chiều nếu tiêu đề thuộc Oxyz: điểm $(x_0,y_0,z_0)$, vectơ $(a,b,c)$.
- Với đường thẳng trong Oxyz, dùng ý tưởng "một điểm thuộc đường + một vectơ chỉ phương".
- Với mặt cầu, luôn nêu tâm, bán kính, dạng chính tắc, dạng khai triển và điều kiện $R^2>0$ nếu phù hợp.
- Với bài có chữ "và" trong tiêu đề, phải phủ đủ cả hai vế của tiêu đề; không chỉ viết sâu vế đầu.
- Với "Phương trình mặt cầu và tương giao", bắt buộc có đủ: phương trình mặt cầu, tương giao mặt cầu-mặt phẳng, tương giao mặt cầu-đường thẳng.

JSON:
{{
  "title": "{title}",
  "title_vi": "{title_vi}",
  "content_md": "...",
  "key_rules": ["3-5 quy tắc ngắn, rõ, dùng để hiện ở khung Cần nhớ"],
  "common_mistakes": ["Sai: ... -> Đúng: ..."],
  "flashcards": [
    {{
      "card_kind": "formula|concept|when_to_use|mistake|mini_example",
      "front": "Câu hỏi ngắn hoặc câu điền khuyết, có thể dùng LaTeX",
      "back": "Đáp án ngắn, có thể dùng Markdown/LaTeX",
      "hint": "Gợi ý rất ngắn hoặc null",
      "explanation": "Giải thích thêm 1-2 câu hoặc null"
    }}
  ]
}}
"""

EXERCISE_BATCH_PROMPT = """Bạn là giáo viên Toán THPT. Tạo ĐÚNG {count} câu hỏi cho chuyên đề "{title}" ({level}).

Loại câu bắt buộc: {question_type}
Độ khó ưu tiên: {difficulty}
Yêu cầu:
- Trả về JSON thuần túy, không markdown fence.
- Dùng tiếng Việt.
- Công thức toán phải dùng LaTeX với $...$ hoặc $$...$$.
- Đề, đáp án và lời giải phải chính xác, ngắn gọn.

Nếu question_type = "multiple_choice":
- Mỗi câu có option_a, option_b, option_c, option_d và correct_answer là "A"|"B"|"C"|"D".
Nếu question_type = "true_false":
- Mỗi câu có statements gồm đúng 4 ý A-D, mỗi ý có label, text, answer boolean.
Nếu question_type = "short_answer":
- Mỗi câu có numeric_answer là một số cụ thể.

JSON:
{{
  "exercises": [
    {{
      "question_text": "...",
      "question_type": "{question_type}",
      "difficulty": "{difficulty}",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A",
      "statements": [{{"label": "A", "text": "...", "answer": true}}],
      "numeric_answer": 1,
      "explanation": "..."
    }}
  ]
}}
"""

def extract_json(text: str) -> dict | None:
    text = text.strip()
    text = re.sub(r"^```json?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try finding first { and matching with corresponding }
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

def extract_text_from_message(message) -> str:
    # 1. Check choices (OpenAI-compatible format returned by some 9Router models)
    if hasattr(message, "choices") and message.choices:
        try:
            choice = message.choices[0]
            if isinstance(choice, dict):
                return choice.get("message", {}).get("content", "")
            elif hasattr(choice, "message"):
                msg_obj = choice.message
                if isinstance(msg_obj, dict):
                    return msg_obj.get("content", "")
                elif hasattr(msg_obj, "content"):
                    return msg_obj.content
        except Exception as e:
            print(f"      [extract_text_from_message] Error parsing choices: {e}")
            
    # 2. Check model_extra for choices
    if hasattr(message, "model_extra") and message.model_extra and "choices" in message.model_extra:
        try:
            choices = message.model_extra["choices"]
            if choices:
                return choices[0].get("message", {}).get("content", "")
        except Exception as e:
            print(f"      [extract_text_from_message] Error parsing model_extra choices: {e}")

    # 3. Fallback to standard Anthropic content block
    if hasattr(message, "content") and message.content:
        block = message.content[0]
        if hasattr(block, "text"):
            return block.text
        elif isinstance(block, dict) and "text" in block:
            return block["text"]
            
    return ""

def call_9router(prompt: str, model: str, max_tokens=6000, timeout=90) -> dict | None:
    import anthropic
    client = anthropic.Anthropic(api_key=ROUTER_API_KEY, base_url=ROUTER_BASE_URL, timeout=timeout)
    
    for attempt in range(3):
        start = time.time()
        try:
            message = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=0.2,
                system="You are a professional math teacher outputting strict JSON.",
                messages=[{"role": "user", "content": prompt}]
            )
            content = extract_text_from_message(message)
            result = extract_json(content)
            elapsed = time.time() - start
            if result:
                print(f"    Model response parsed in {elapsed:.1f}s")
                return result
            print(f"    JSON parse failed attempt {attempt+1} after {elapsed:.1f}s, retrying...")
            time.sleep(2)
        except anthropic.RateLimitError:
            print("    Rate limited. Waiting 10s...")
            time.sleep(10)
        except Exception as e:
            elapsed = time.time() - start
            print(f"    Error attempt {attempt+1} after {elapsed:.1f}s: {e}")
            time.sleep(3)
    return None

def generate_exercise_batches(lesson: dict, model: str, args) -> list[dict]:
    plan = [
        ("multiple_choice", "Nhận biết", 2),
        ("multiple_choice", "Thông hiểu", 2),
        ("true_false", "Thông hiểu", 3),
        ("short_answer", "Vận dụng", 3),
    ]
    exercises: list[dict] = []
    for q_type, difficulty, count in plan:
        print(f"    Generating {count} {q_type} questions ({difficulty})...")
        data = call_9router(
            WEB_EXERCISE_BATCH_PROMPT.format(
                title=lesson["title"],
                level=lesson["level"],
                question_type=q_type,
                difficulty=difficulty,
                count=count,
            ),
            model=model,
            max_tokens=2400,
            timeout=args.request_timeout,
        )
        batch = data.get("exercises", []) if data else []
        if not isinstance(batch, list):
            batch = []
        for ex in batch[:count]:
            if isinstance(ex, dict):
                ex["question_type"] = q_type
                ex["difficulty"] = ex.get("difficulty") or difficulty
                exercises.append(ex)
        print(f"    -> Got {min(len(batch), count)}/{count} questions")
        time.sleep(args.pause_seconds)
    return exercises

def exercise_to_record(ex: dict, lesson_uuid: str, index: int) -> dict:
    ex_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{lesson_uuid}-ex-{index}"))

    diff_raw = str(ex.get("difficulty", "Nhận biết")).lower()
    if "nhan" in diff_raw or "biết" in diff_raw or "biet" in diff_raw:
        difficulty = "Nhận biết"
    elif "thong" in diff_raw or "hiểu" in diff_raw or "hieu" in diff_raw:
        difficulty = "Thông hiểu"
    elif "van" in diff_raw or "dụng" in diff_raw or "dung" in diff_raw:
        difficulty = "Vận dụng"
    else:
        difficulty = "Nhận biết"

    type_raw = str(ex.get("question_type", "multiple_choice")).lower().replace("-", "_")
    if "multiple" in type_raw or "choice" in type_raw:
        q_type = "multiple_choice"
    elif "true" in type_raw or "false" in type_raw:
        q_type = "true_false"
    elif "short" in type_raw or "answer" in type_raw or "numeric" in type_raw:
        q_type = "short_answer"
    else:
        q_type = "multiple_choice"

    ex_record = {
        "id": ex_id,
        "lesson_id": lesson_uuid,
        "question_text": str(ex.get("question_text", "")),
        "question_type": q_type,
        "difficulty": difficulty,
        "option_a": None,
        "option_b": None,
        "option_c": None,
        "option_d": None,
        "correct_answer": None,
        "statements": None,
        "numeric_answer": None,
        "explanation": ex.get("explanation", ""),
        "order_index": index
    }

    if q_type == "multiple_choice":
        ex_record["option_a"] = str(ex.get("option_a", ""))
        ex_record["option_b"] = str(ex.get("option_b", ""))
        ex_record["option_c"] = str(ex.get("option_c", ""))
        ex_record["option_d"] = str(ex.get("option_d", ""))
        answer = str(ex.get("correct_answer", "A")).strip().upper()
        ex_record["correct_answer"] = answer if answer in {"A", "B", "C", "D"} else "A"
    elif q_type == "true_false":
        statements = ex.get("statements", [])
        ex_record["statements"] = statements if isinstance(statements, list) else []
    elif q_type == "short_answer":
        ex_record["numeric_answer"] = safe_numeric_answer(ex.get("numeric_answer"))

    return ex_record

VALID_FLASHCARD_KINDS = {"formula", "concept", "when_to_use", "mistake", "mini_example"}

def flashcard_to_record(card: dict, lesson_uuid: str, index: int) -> dict | None:
    if not isinstance(card, dict):
        return None

    kind = str(card.get("card_kind", "concept")).strip()
    if kind not in VALID_FLASHCARD_KINDS:
        kind = "concept"

    front = str(card.get("front", "")).strip()
    back = str(card.get("back", "")).strip()
    if not front or not back:
        return None

    hint = card.get("hint")
    explanation = card.get("explanation")

    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{lesson_uuid}-flashcard-{index}")),
        "lesson_id": lesson_uuid,
        "card_kind": kind,
        "front": front,
        "back": back,
        "hint": str(hint).strip() if hint not in (None, "") else None,
        "explanation": str(explanation).strip() if explanation not in (None, "") else None,
        "order_index": index,
        "is_active": True,
    }

def theory_flashcards_to_records(theory: dict | None, lesson_uuid: str) -> list[dict]:
    raw_cards = theory.get("flashcards", []) if isinstance(theory, dict) else []
    if not isinstance(raw_cards, list):
        return []

    records: list[dict] = []
    for index, card in enumerate(raw_cards[:20]):
        record = flashcard_to_record(card, lesson_uuid, index)
        if record:
            records.append(record)
    return records

def process_math_lesson(sb: SupabaseREST | None, lesson: dict, chapter_id: str, model: str, args) -> int:
    # Stable UUID generation based on name
    lesson_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"math-lesson-{lesson['title']}"))
    
    lesson_record = {
        "id": lesson_uuid,
        "chapter_id": chapter_id,
        "title": lesson["title"],
        "title_vi": lesson["title_vi"],
        "topic": lesson["topic"],
        "level": lesson["level"],
        "content_md": "",
        "key_rules": [],
        "common_mistakes": [],
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", # Placeholder video
        "video_source": "youtube",
        "exercise_count": 0,
        "is_active": True,
        "order_index": lesson["order"]
    }
    
    if not args.dry_run:
        existing_lesson = sb.get("math_lessons", select="id", eq={"id": lesson_uuid})
        if not existing_lesson:
            sb.upsert("math_lessons", lesson_record, on_conflict="id")
        
    print(f"    Generating theory for {lesson['title']}...")
    theory = call_9router(
        WEB_THEORY_PROMPT.format(title=lesson["title"], title_vi=lesson["title_vi"], level=lesson["level"]),
        model=model,
        max_tokens=5200,
        timeout=args.request_timeout
    )

    if theory and args.dry_run and args.export_dir:
        export_dir = Path(args.export_dir)
        export_dir.mkdir(parents=True, exist_ok=True)
        export_path = export_dir / f"{lesson_uuid}-theory.json"
        payload = {
            "lesson_id": lesson_uuid,
            "title": lesson["title"],
            "title_vi": lesson["title_vi"],
            "topic": lesson["topic"],
            "level": lesson["level"],
            "theory": theory,
        }
        export_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"    Exported theory preview JSON: {export_path}")
    
    if theory and not args.dry_run:
        sb.upsert("math_lessons", {
            "id": lesson_uuid,
            "chapter_id": chapter_id,
            "title": lesson["title"],
            "title_vi": lesson["title_vi"],
            "topic": lesson["topic"],
            "level": lesson["level"],
            "content_md": theory.get("content_md", ""),
            "key_rules": theory.get("key_rules", []),
            "common_mistakes": theory.get("common_mistakes", []),
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "video_source": "youtube",
            "is_active": True,
            "order_index": lesson["order"]
        }, on_conflict="id")

        sb.delete_where("math_flashcards", "lesson_id", lesson_uuid)
        print("    Flashcards removed for this lesson; keeping only theory and application exercises.")

    if args.theory_only:
        print("    Theory-only mode enabled; skipping exercise generation.")
        return 0
        
    time.sleep(args.pause_seconds)
    
    print(f"    Generating exercise batches for {lesson['title']}...")
    exercises = generate_exercise_batches(lesson, model, args)

    if args.dry_run and args.export_dir:
        export_dir = Path(args.export_dir)
        export_dir.mkdir(parents=True, exist_ok=True)
        export_path = export_dir / f"{lesson_uuid}-theory.json"
        payload = {
            "lesson_id": lesson_uuid,
            "title": lesson["title"],
            "title_vi": lesson["title_vi"],
            "topic": lesson["topic"],
            "level": lesson["level"],
            "theory": theory or {},
            "exercises": exercises,
        }
        export_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"    Exported theory + exercises preview JSON: {export_path}")
    
    if exercises and not args.dry_run:
        ex_records = [exercise_to_record(ex, lesson_uuid, i) for i, ex in enumerate(exercises[:10])]
        for i, ex in enumerate([]):
            ex_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{lesson_uuid}-ex-{i}"))
            
            # Sanitize difficulty
            diff_raw = str(ex.get("difficulty", "Nhận biết")).lower()
            if "nhan" in diff_raw or "biết" in diff_raw or "biet" in diff_raw:
                difficulty = "Nhận biết"
            elif "thong" in diff_raw or "hiểu" in diff_raw or "hieu" in diff_raw:
                difficulty = "Thông hiểu"
            elif "van" in diff_raw or "dụng" in diff_raw or "dung" in diff_raw:
                difficulty = "Vận dụng"
            else:
                difficulty = "Nhận biết"

            # Sanitize question_type
            type_raw = str(ex.get("question_type", "multiple_choice")).lower().replace("-", "_")
            if "multiple" in type_raw or "choice" in type_raw:
                q_type = "multiple_choice"
            elif "true" in type_raw or "false" in type_raw:
                q_type = "true_false"
            elif "short" in type_raw or "answer" in type_raw or "numeric" in type_raw:
                q_type = "short_answer"
            else:
                q_type = "multiple_choice"
            
            # Formulate the exercise structure
            ex_record = {
                "id": ex_id,
                "lesson_id": lesson_uuid,
                "question_text": str(ex.get("question_text", "")),
                "question_type": q_type,
                "difficulty": difficulty,
                "option_a": None,
                "option_b": None,
                "option_c": None,
                "option_d": None,
                "correct_answer": None,
                "statements": None,
                "numeric_answer": None,
                "explanation": ex.get("explanation", ""),
                "order_index": i
            }
            
            # Map type-specific options
            q_type = ex_record["question_type"]
            if q_type == "multiple_choice":
                ex_record["option_a"] = str(ex.get("option_a", ""))
                ex_record["option_b"] = str(ex.get("option_b", ""))
                ex_record["option_c"] = str(ex.get("option_c", ""))
                ex_record["option_d"] = str(ex.get("option_d", ""))
                ex_record["correct_answer"] = str(ex.get("correct_answer", "A"))
            elif q_type == "true_false":
                ex_record["statements"] = ex.get("statements", []) # JSONB
            elif q_type == "short_answer":
                # Convert numeric answer safely to float/double
                ex_record["numeric_answer"] = safe_numeric_answer(ex.get("numeric_answer"))
                    
            ex_records.append(ex_record)
            
        existing_count = len(sb.get("math_exercises", select="id", eq={"lesson_id": lesson_uuid}))
        if len(ex_records) >= existing_count:
            sb.delete_where("math_exercises", "lesson_id", lesson_uuid)
            sb.insert("math_exercises", ex_records)
            sb.update("math_lessons", {"exercise_count": len(ex_records)}, "id", lesson_uuid)
        else:
            print(f"    Keeping existing {existing_count} questions; new run only produced {len(ex_records)}.")
        
    return len(exercises)

def main():
    global ROUTER_BASE_URL, ROUTER_API_KEY
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử không lưu database")
    parser.add_argument("--course", default="nen-tang", help="Slug khóa học cần import (nen-tang)")
    parser.add_argument("--model", help="Tên model 9Router (ví dụ: cx/claude-3-5-sonnet, cx/gpt-4o)")
    parser.add_argument("--base-url", help="URL gateway 9Router hoặc OpenRouter")
    parser.add_argument("--api-key", help="API Key cho gateway")
    parser.add_argument("--limit", type=int, default=None, help="Giới hạn số bài học sinh ra")
    parser.add_argument("--only-lesson", help="Chỉ import bài học có tiêu đề chứa từ khóa này")
    parser.add_argument("--request-timeout", type=int, default=90, help="Timeout cho mỗi request model, tính bằng giây")
    parser.add_argument("--pause-seconds", type=float, default=1.0, help="Pause between model requests")
    parser.add_argument("--theory-only", action="store_true", help="Chỉ sinh lý thuyết, bỏ qua bài tập")
    parser.add_argument("--export-dir", help="Thư mục lưu JSON preview khi chạy dry-run")
    args = parser.parse_args()
    
    if args.base_url:
        ROUTER_BASE_URL = args.base_url
    if args.api_key:
        ROUTER_API_KEY = args.api_key
        
    model = args.model or ROUTER_MODEL
    print(f"============================================================")
    print(f"MATH FOUNDATIONAL IMPORT SYSTEM")
    print(f"Base URL: {ROUTER_BASE_URL}")
    print(f"Model:    {model}")
    print(f"Dry-run:  {args.dry_run}")
    if args.limit:
        print(f"Limit:    {args.limit} lessons")
    if args.only_lesson:
        print(f"Filter:   only lesson matching '{args.only_lesson}'")
    print(f"============================================================\n")
    
    if not ROUTER_API_KEY:
        print("LỖI: Thiếu cấu hình API Key (AI_ROUTER_API_KEY hoặc --api-key)")
        sys.exit(1)
        
    sb = None
    if args.dry_run:
        course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"math-course-{args.course}"))
        course_name = f"{args.course} (dry-run)"
    else:
        sb = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)
        
        # Check if target course exists in DB
        try:
            courses = sb.get("courses", eq={"slug": args.course})
        except Exception as e:
            print(f"LỖI: Không kết nối được Supabase. Hãy chạy SQL migrations trước! Chi tiết: {e}")
            sys.exit(1)
            
        if not courses:
            print(f"LỖI: Không tìm thấy khóa học nào có slug '{args.course}' trong database.")
            sys.exit(1)
            
        course_id = courses[0]["id"]
        course_name = courses[0]["name"]
    print(f"Khóa học: {course_name} (ID: {course_id})")
    
    # Process syllabus
    syllabus = next((s for s in MATH_SYLLABUS if s["course_slug"] == args.course), None)
    if not syllabus:
        print(f"LỖI: Khóa học '{args.course}' chưa được cấu hình giáo án trong file Python này.")
        sys.exit(1)
        
    processed_count = 0
    for ch_idx, ch in enumerate(syllabus["chapters"]):
        chapter_name = ch["name"]
        
        # Check if we should skip this chapter because of --only-lesson filter
        if args.only_lesson:
            matching_lessons = [l for l in ch["lessons"] if args.only_lesson.lower() in l["title"].lower() or args.only_lesson.lower() in l["title_vi"].lower()]
            if not matching_lessons:
                continue
                
        print(f"\nChương: {chapter_name}")
        
        # Check or create chapter in DB
        if args.dry_run:
            chapter_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"math-chapter-{course_id}-{chapter_name}"))
            print(f"  -> Dry-run Chương ID: {chapter_id}")
        else:
            ch_records = sb.get("chapters", eq={"course_id": course_id, "name": chapter_name})
            if not ch_records:
                ch_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"math-chapter-{course_id}-{chapter_name}"))
                ch_record = {
                    "id": ch_uuid,
                    "course_id": course_id,
                    "name": chapter_name,
                    "description": f"Học và ôn tập FSRS {chapter_name}",
                    "subject": ch["subject"],
                    "order_index": ch["order"]
                }
                sb.upsert("chapters", ch_record, on_conflict="id")
                print(f"  -> Tạo mới Chương ID: {ch_uuid}")
                chapter_id = ch_uuid
            else:
                chapter_id = ch_records[0]["id"]
                print(f"  -> Đã tồn tại Chương ID: {chapter_id}")

        for lesson in ch["lessons"]:
            if args.only_lesson:
                if args.only_lesson.lower() not in lesson["title"].lower() and args.only_lesson.lower() not in lesson["title_vi"].lower():
                    continue
                    
            print(f"  ↳ Bài: {lesson['title']} ({lesson['level']})")
            try:
                num_ex = process_math_lesson(sb, lesson, chapter_id, model, args)
                print(f"    ✓ Hoàn thành! Đã tạo {num_ex} câu bài tập.")
                processed_count += 1
                if args.limit and processed_count >= args.limit:
                    print(f"\nĐã đạt giới hạn --limit={args.limit} bài học. Dừng.")
                    return
                time.sleep(2)
            except Exception as e:
                print(f"    ✗ THẤT BẠI: {e}")
                
if __name__ == "__main__":
    main()
