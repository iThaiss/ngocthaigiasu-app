"""
Import exam-style reading passages for full-passage practice.

This seed keeps the reading module aligned with the newer exam format:
- Reading 8 questions
- Reading 10 questions

Usage:
  python scripts/import_exam_reading_seed.py --dry-run
  python scripts/import_exam_reading_seed.py
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid
from pathlib import Path
from typing import Any

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
    res = requests.delete(f"{self.base}/{table}?{field}=eq.{value}", headers=self.headers, timeout=60)
    res.raise_for_status()

  def insert(self, table: str, records: list[dict[str, Any]]) -> None:
    if not records:
      return
    res = requests.post(
      f"{self.base}/{table}",
      headers={**self.headers, "Prefer": "return=minimal"},
      json=records,
      timeout=60,
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


def stable_id(*parts: str) -> str:
  return str(uuid.uuid5(uuid.NAMESPACE_DNS, "::".join(parts)))


PASSAGES: list[dict[str, Any]] = [
  {
    "id": stable_id("reading", "8q", "family-estrangement"),
    "title": "Family Estrangement and Emotional Well-being",
    "title_vi": "Xa Cách Gia Đình Và Sức Khỏe Tinh Thần",
    "topic": "Mental Health & Well-being",
    "topic_vi": "Sức khỏe tinh thần",
    "level": "B2",
    "order_index": 1,
    "content": """In recent years, mental health experts have observed a growing number of adults choosing to limit or completely end contact with certain family members. Although family relationships are traditionally associated with emotional support and stability, some individuals decide that distancing themselves from relatives is necessary to protect their psychological well-being. According to specialists, this decision is rarely impulsive, since it often develops after years of unresolved conflict, emotional neglect, or harmful patterns of behaviour within the family environment.

Experts explain that family estrangement can involve parents, siblings, or even extended relatives. In many cases, individuals who choose to cut ties report feeling emotionally exhausted after repeated arguments or manipulation. While some people experience relief after creating distance, others continue struggling with guilt, sadness, and social pressure, particularly because society frequently presents family relationships as unconditional and permanent. As a result, those who choose separation may fear criticism or misunderstanding from others who cannot fully understand their experiences.

Psychologists emphasise that ending contact with family members should not automatically be viewed as selfish or disrespectful. Instead, they encourage people to examine whether relationships are consistently damaging their emotional health. Some therapists note that maintaining boundaries can sometimes reduce anxiety, restore confidence, and improve personal relationships outside the family. Nevertheless, experts also warn that estrangement may create long-term emotional consequences, especially when individuals isolate themselves without receiving professional or social support.

For this reason, mental health professionals recommend thoughtful communication before making permanent decisions about family relationships. They advise individuals to seek counselling, discuss concerns openly when possible, and consider whether healthier boundaries could improve the situation without requiring complete separation. Although reconciliation is not always achievable, experts believe people should prioritise emotional safety while also recognising the emotional complexity that often accompanies family estrangement.""",
    "questions": [
      {
        "question_text": "According to paragraph 1, family estrangement results from all of the following EXCEPT _____.",
        "option_a": "harmful patterns of behaviour within the family environment",
        "option_b": "unresolved conflict over many years",
        "option_c": "financial pressure caused by rising living expenses",
        "option_d": "emotional neglect inside the family",
        "correct_answer": "C",
        "question_type": "detail_except",
        "explanation": "Đoạn 1 nêu ba nguyên nhân: xung đột kéo dài chưa được giải quyết, sự thờ ơ/cẩu thả về mặt cảm xúc, và các kiểu hành vi gây hại trong gia đình. Bài không nhắc đến áp lực tài chính do chi phí sinh hoạt tăng.",
      },
      {
        "question_text": "The word “relief” in paragraph 2 is OPPOSITE in meaning to _____.",
        "option_a": "anxiety",
        "option_b": "pleasure",
        "option_c": "satisfaction",
        "option_d": "appreciation",
        "correct_answer": "A",
        "question_type": "vocab_antonym",
        "explanation": "Trong ngữ cảnh này, “relief” là cảm giác nhẹ nhõm sau khi tạo khoảng cách. Từ trái nghĩa phù hợp nhất là “anxiety” vì nó diễn tả sự lo lắng, căng thẳng.",
      },
      {
        "question_text": "Which of the following best paraphrases the sentence: “As a result, those who choose separation may fear criticism or misunderstanding from others who cannot fully understand their experiences.”",
        "option_a": "Individuals deciding to end a relationship may become concerned about being judged by people unfamiliar with their personal circumstances.",
        "option_b": "People are often willing to withdraw from close relatives because surrounding communities usually respond with sympathy and acceptance.",
        "option_c": "Owing to public approval from those around them, many individuals feel increasingly comfortable creating distance from family connections.",
        "option_d": "Individuals may receive greater emotional encouragement from society after limiting interaction with relatives who caused personal distress.",
        "correct_answer": "A",
        "question_type": "sentence_paraphrase",
        "explanation": "Câu gốc nói rằng những người chọn tách khỏi gia đình có thể sợ bị phê phán hoặc hiểu lầm bởi người ngoài. Đáp án A giữ đúng ý này: họ lo bị đánh giá bởi những người không hiểu hoàn cảnh cá nhân của họ.",
      },
      {
        "question_text": "The word “they” in paragraph 3 refers to _____.",
        "option_a": "family members",
        "option_b": "people",
        "option_c": "relationships",
        "option_d": "psychologists",
        "correct_answer": "D",
        "question_type": "reference",
        "explanation": "Trong đoạn 3, câu trước nhắc đến “Psychologists emphasise...”. Vì vậy đại từ “they” trong “they encourage people...” quy chiếu về “psychologists”.",
      },
      {
        "question_text": "The word “reconciliation” in paragraph 4 mostly means _____.",
        "option_a": "emotional stability",
        "option_b": "personal boundaries",
        "option_c": "psychological well-being",
        "option_d": "restored harmony",
        "correct_answer": "D",
        "question_type": "vocab_meaning",
        "explanation": "“Reconciliation” nghĩa là sự hòa giải hoặc khôi phục lại mối quan hệ sau xung đột. Vì vậy nghĩa gần nhất là “restored harmony”.",
      },
      {
        "question_text": "Which of the following is TRUE according to the passage?",
        "option_a": "Public judgement gradually weakens following prolonged household disconnection.",
        "option_b": "Counsellors oppose protective limits because withdrawal harms psychological recovery.",
        "option_c": "Emotional protection should remain important during family separation decisions.",
        "option_d": "Domestic alienation emerges shortly after major interpersonal disagreements occur.",
        "correct_answer": "C",
        "question_type": "true_statement",
        "explanation": "Đoạn cuối nêu rõ mọi người nên ưu tiên sự an toàn về cảm xúc, đồng thời nhận thức rằng việc xa cách gia đình có tính phức tạp về mặt cảm xúc. Vì vậy đáp án C đúng.",
      },
      {
        "question_text": "Which paragraph mentions the potential emotional effects of lacking social assistance?",
        "option_a": "Paragraph 1",
        "option_b": "Paragraph 2",
        "option_c": "Paragraph 3",
        "option_d": "Paragraph 4",
        "correct_answer": "C",
        "question_type": "paragraph_location",
        "explanation": "Đoạn 3 cảnh báo rằng estrangement có thể tạo ra hậu quả cảm xúc lâu dài, đặc biệt khi cá nhân tự cô lập mà không nhận được hỗ trợ chuyên môn hoặc xã hội.",
      },
      {
        "question_text": "Which paragraph mentions different emotional responses following separation from relatives?",
        "option_a": "Paragraph 1",
        "option_b": "Paragraph 2",
        "option_c": "Paragraph 3",
        "option_d": "Paragraph 4",
        "correct_answer": "B",
        "question_type": "paragraph_location",
        "explanation": "Đoạn 2 nêu nhiều phản ứng cảm xúc khác nhau sau khi tách khỏi người thân: một số người thấy nhẹ nhõm, trong khi người khác vẫn cảm thấy tội lỗi, buồn bã và chịu áp lực xã hội.",
      },
    ],
  },
  {
    "id": stable_id("reading", "10q", "fast-fashion"),
    "title": "Fast Fashion and Its Hidden Costs",
    "title_vi": "Thời Trang Nhanh Và Những Cái Giá Ẩn",
    "topic": "Fashion & Lifestyle",
    "topic_vi": "Thời trang & Lối sống",
    "level": "B2",
    "order_index": 2,
    "content": """Over the past decade, fast fashion has transformed the global clothing industry by making trendy garments cheaper and more accessible than ever before. Brands release thousands of new designs each week, encouraging consumers to purchase clothing at an unprecedented rate. Although this business model has generated enormous profits and satisfied demand for inexpensive fashion, environmental organisations increasingly warn that the industry’s hidden costs are far more severe than many shoppers realise. Critics argue that companies promoting constant consumption have normalised a disposable culture in which clothing is treated as temporary rather than durable.

One of the most alarming concerns involves the enormous quantity of waste generated by the industry. Millions of garments are discarded annually, many of which end up in landfills or are incinerated after only limited use. Environmental researchers explain that synthetic fabrics frequently contain plastic-based materials that shed microfibres into rivers and oceans during production and washing. In addition, textile manufacturing consumes vast amounts of water and energy while also relying heavily on chemical dyes capable of contaminating local ecosystems. As production accelerates to satisfy rapidly changing trends, the environmental burden associated with clothing consumption continues to intensify worldwide.

Labour practices within the fast fashion supply chain have also attracted growing scrutiny. To maintain extremely low prices, some corporations depend on factories where workers endure exhausting schedules, inadequate wages, and unsafe conditions. Investigations have revealed that certain suppliers operate under intense pressure to produce garments at a remarkable speed, leaving employees vulnerable to exploitation. Although many major brands publicly promote ethical standards and sustainability initiatives, activists argue that transparency remains insufficient because companies rarely disclose the full environmental and social impact of their manufacturing processes.

In response to these concerns, environmental groups are urging consumers to reconsider their purchasing habits and support more sustainable alternatives. Experts recommend buying fewer items, choosing higher-quality clothing, repairing garments instead of discarding them, and supporting companies with transparent supply chains. While individual choices alone may not completely transform the industry, campaigners believe public awareness and stricter regulations could eventually pressure corporations to adopt more responsible production practices. Without substantial reform, however, the long-term environmental consequences of fast fashion may continue escalating at a deeply troubling pace.""",
    "questions": [
      {
        "question_text": "Which of the following best summarises paragraph 1?",
        "option_a": "International retailers rapidly expand seasonal collections while attracting younger buyers seeking affordable personal appearance improvements.",
        "option_b": "Consumer culture rarely treats outfits as short-lived items due to mounting environmental concerns worldwide.",
        "option_c": "Mass-market apparel encourages excessive purchasing despite growing concerns regarding concealed ecological damage.",
        "option_d": "Manufacturing companies continue earning substantial revenue from inexpensive apparel distributed through rapidly changing commercial trends.",
        "correct_answer": "C",
        "question_type": "paragraph_summary",
        "explanation": "Đoạn 1 giới thiệu fast fashion: quần áo rẻ, xu hướng thay đổi nhanh, người tiêu dùng mua quá nhiều, và các tổ chức môi trường cảnh báo về chi phí sinh thái ẩn. Đáp án C bao quát đầy đủ nhất.",
      },
      {
        "question_text": "What is indicated about a disposable culture in paragraph 1?",
        "option_a": "It encourages manufacturers to reduce international shipping expenses.",
        "option_b": "It causes garments to be viewed as short-term possessions.",
        "option_c": "It motivates designers to create more environmentally friendly materials.",
        "option_d": "It increases public interest in traditional tailoring techniques.",
        "correct_answer": "B",
        "question_type": "detail",
        "explanation": "Đoạn 1 nói rằng văn hóa dùng rồi bỏ khiến quần áo được xem là tạm thời thay vì bền lâu. Vì vậy đáp án B đúng.",
      },
      {
        "question_text": "The word “incinerated” in paragraph 2 mostly means _____.",
        "option_a": "avoided",
        "option_b": "resumed",
        "option_c": "burned",
        "option_d": "preserved",
        "correct_answer": "C",
        "question_type": "vocab_meaning",
        "explanation": "“Incinerated” nghĩa là bị đốt/chôn hủy bằng cách đốt, thường dùng khi nói về xử lý rác thải. Từ gần nghĩa nhất là “burned”.",
      },
      {
        "question_text": "What can be implied about the last sentence in paragraph 2?",
        "option_a": "Global consumers are gradually purchasing fewer garments than previous generations.",
        "option_b": "Textile companies are becoming less dependent on synthetic manufacturing materials.",
        "option_c": "Rising manufacturing speed is worsening ecological damage linked to clothing demand.",
        "option_d": "International governments are controlling industrial pollution from fashion production.",
        "correct_answer": "C",
        "question_type": "inference",
        "explanation": "Câu cuối đoạn 2 liên hệ việc sản xuất tăng tốc để chạy theo xu hướng với gánh nặng môi trường ngày càng lớn. Vì vậy có thể suy ra tốc độ sản xuất cao đang làm thiệt hại sinh thái nghiêm trọng hơn.",
      },
      {
        "question_text": "According to paragraph 3, workers in factories _____.",
        "option_a": "suffer from workplace isolation",
        "option_b": "experience negligible emotional pressure",
        "option_c": "receive better career protection",
        "option_d": "face exploitative working conditions",
        "correct_answer": "D",
        "question_type": "detail",
        "explanation": "Đoạn 3 nêu rằng công nhân phải chịu lịch làm việc kiệt sức, lương không đủ và điều kiện thiếu an toàn; họ cũng dễ bị bóc lột. Vì vậy đáp án D đúng.",
      },
      {
        "question_text": "The word “their” in paragraph 3 refers to _____.",
        "option_a": "processes",
        "option_b": "activists",
        "option_c": "companies",
        "option_d": "initiatives",
        "correct_answer": "C",
        "question_type": "reference",
        "explanation": "Cụm “their manufacturing processes” nằm sau mệnh đề nói về việc các công ty hiếm khi công khai đầy đủ tác động sản xuất. Do đó “their” quy chiếu về “companies”.",
      },
      {
        "question_text": "Which of the following best paraphrases the sentence: “Without substantial reform, however, the long-term environmental consequences of fast fashion may continue escalating at a deeply troubling pace.”",
        "option_a": "Unless major industrial changes are introduced, ecological damage linked to cheap clothing could intensify significantly over time.",
        "option_b": "The environmental crisis associated with mass-produced apparel may worsen rapidly even if there is meaningful corporate transformation.",
        "option_c": "If the fashion industry failed to implement serious reforms, future environmental harm could become increasingly severe.",
        "option_d": "Continuing current manufacturing practices may originate from the ecological effects of inexpensive fashion, which is growing considerably.",
        "correct_answer": "A",
        "question_type": "sentence_paraphrase",
        "explanation": "Câu gốc có ý: nếu không có cải cách lớn, hậu quả môi trường dài hạn của fast fashion có thể tiếp tục xấu đi nghiêm trọng. Đáp án A giữ đúng cả điều kiện “unless major changes” và kết quả “ecological damage could intensify”.",
      },
      {
        "question_text": "Which of the following can be inferred from the passage?",
        "option_a": "Consumer demand indirectly contributes to environmental deterioration and exploitative industrial labour practices.",
        "option_b": "International clothing corporations prioritise ecological preservation above commercial expansion and competitive profitability.",
        "option_c": "Sustainable manufacturing policies have substantially reduced environmental contamination across contemporary textile production networks.",
        "option_d": "Public confidence regarding ethical apparel production continues to strengthen despite environmental criticism.",
        "correct_answer": "A",
        "question_type": "passage_inference",
        "explanation": "Toàn bài cho thấy nhu cầu mua quần áo rẻ, chạy theo xu hướng dẫn tới sản xuất nhanh hơn, gây hại môi trường và tạo áp lực bóc lột lên lao động. Đây là suy luận hợp lý từ nhiều đoạn.",
      },
      {
        "question_text": "Where in the passage does the sentence “Labour practices within the fast fashion supply chain have also attracted growing scrutiny.” best fit?",
        "option_a": "Before paragraph 2",
        "option_b": "At the beginning of paragraph 3",
        "option_c": "After the first sentence of paragraph 3",
        "option_d": "Before paragraph 4",
        "correct_answer": "B",
        "question_type": "sentence_insertion",
        "explanation": "Câu cần chèn giới thiệu một ý mới: thực hành lao động trong chuỗi cung ứng fast fashion bị giám sát nhiều hơn. Ý này mở đầu tự nhiên cho đoạn 3, vì đoạn 3 nói về lịch làm việc, lương, điều kiện an toàn và bóc lột công nhân.",
      },
      {
        "question_text": "Which of the following best summarises the passage?",
        "option_a": "Environmental organisations increasingly encourage shoppers to support ethical businesses promoting durable products and transparent manufacturing procedures internationally.",
        "option_b": "Manufacturing employees frequently experience hazardous occupational conditions because suppliers operate under pressure, demanding accelerated commercial productivity.",
        "option_c": "The global popularity of inexpensive clothing has created serious ethical and environmental concerns, requiring more responsible consumer and corporate behaviour.",
        "option_d": "Cheap apparel production encourages excessive consumption while intensifying ecological destruction and unethical treatment throughout international manufacturing systems.",
        "correct_answer": "C",
        "question_type": "passage_summary",
        "explanation": "Đáp án C tóm tắt được toàn bài: sự phổ biến của quần áo giá rẻ tạo ra vấn đề môi trường và đạo đức, từ đó cần hành vi có trách nhiệm hơn từ người tiêu dùng và doanh nghiệp.",
      },
    ],
  },
]


def main() -> int:
  parser = argparse.ArgumentParser()
  parser.add_argument("--dry-run", action="store_true")
  args = parser.parse_args()

  if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing Supabase credentials. Check scripts/.env.real.")

  print(f"Prepared {len(PASSAGES)} exam reading passages.")
  for passage in PASSAGES:
    print(f"  {len(passage['questions']):2} câu · {passage['level']} · {passage['topic']} · {passage['title']}")

  if args.dry_run:
    return 0

  db = SupabaseREST(SUPABASE_URL, SUPABASE_KEY)
  for passage in PASSAGES:
    passage_id = passage["id"]
    record = {
      "id": passage_id,
      "title": passage["title"],
      "title_vi": passage["title_vi"],
      "content": passage["content"],
      "topic": passage["topic"],
      "topic_vi": passage["topic_vi"],
      "level": passage["level"],
      "word_count": len(passage["content"].split()),
      "question_count": len(passage["questions"]),
      "is_system": True,
      "is_active": True,
      "order_index": passage["order_index"],
    }
    db.upsert("reading_passages", record, on_conflict="id")
    db.delete_where("reading_questions", "passage_id", passage_id)
    rows = []
    for index, question in enumerate(passage["questions"], start=1):
      rows.append({
        "id": stable_id("reading-question", passage_id, str(index)),
        "passage_id": passage_id,
        "order_index": index,
        **question,
      })
    db.insert("reading_questions", rows)
    db.update("reading_passages", {"question_count": len(rows), "word_count": record["word_count"]}, "id", passage_id)

  print("Imported exam reading seed passages.")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
