from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import TypedDict


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "exports" / "deepseek-reading-cache"
OUT = ROOT / "exports" / "deepseek-reading-new-template-preview.html"


class EvidenceSnippet(TypedDict, total=False):
    text: str
    paragraph: int


PREVIEW_FILES = [
    CACHE_DIR / "8q-digital-learning-attention.json",
    CACHE_DIR / "10q-ai-in-schools.json",
]

TRANSLATIONS_VI = {
    "Digital Learning and the Challenge of Student Attention": [
        "Sự mở rộng nhanh chóng của các nền tảng học tập kỹ thuật số đã làm thay đổi lớp học trên toàn thế giới, mang lại khả năng tiếp cận chưa từng có với các nguồn tài liệu giáo dục. Mặc dù các công cụ này hứa hẹn tăng mức độ tham gia thông qua nội dung tương tác, ngày càng nhiều nghiên cứu cho rằng chúng cũng có thể làm phân tán sự chú ý của học sinh theo những cách mà tài liệu truyền thống không gây ra. Chính các đặc điểm thiết kế khiến nền tảng số trở nên hấp dẫn như phản hồi tức thì, yếu tố đa phương tiện và lộ trình cá nhân hóa lại có thể đồng thời tạo ra một môi trường khiến việc duy trì sự tập trung lâu dài ngày càng khó khăn.",
        "Các nghiên cứu so sánh khả năng đọc hiểu trên các phương tiện khác nhau đã đưa ra những phát hiện khá nhất quán. Khi học sinh đọc các văn bản học thuật phức tạp trên màn hình, các em có xu hướng đọc lướt nhiều hơn và ghi nhớ ít chi tiết hơn so với khi đọc cùng văn bản trên giấy. Một thí nghiệm có kiểm soát cho thấy những người đọc một bài viết dài trên máy tính xách tay đạt điểm thấp hơn đáng kể ở các câu hỏi suy luận so với những người đọc trên giấy, dù hai nhóm dành gần như cùng một lượng thời gian cho nhiệm vụ. Các nhà nghiên cứu cho rằng sự khác biệt này liên quan đến giả thuyết 'shallowing', theo đó thói quen đọc kỹ thuật số, được định hình bởi kiểu lướt nhanh phổ biến trên môi trường trực tuyến, dần làm giảm khả năng tư duy sâu và phản tỉnh của chúng ta.",
        "Tuy nhiên, mối quan hệ giữa học tập kỹ thuật số và sự chú ý không hoàn toàn tiêu cực. Một số loại công cụ số, đặc biệt là những công cụ được thiết kế dựa trên lý thuyết tải nhận thức, thực ra có thể hỗ trợ việc học tập tập trung. Chẳng hạn, các hệ thống học thích ứng điều chỉnh độ khó dựa trên kết quả của học sinh giúp duy trì mức thử thách phù hợp, tránh cả sự nhàm chán lẫn quá tải nhận thức. Ngoài ra, các video hướng dẫn được cấu trúc tốt, chia nội dung thành từng phần vừa sức và lồng ghép câu hỏi gợi nhớ định kỳ, đã được chứng minh là cải thiện khả năng ghi nhớ so với hình thức nghe giảng thụ động. Điểm khác biệt cốt lõi dường như không nằm ở bản thân phương tiện, mà ở việc công nghệ được thiết kế có chủ đích để quản lý sự chú ý thay vì khai thác nó.",
        "Vì vậy, các nhà giáo dục và nhà hoạch định chính sách cần tiếp cận việc tích hợp công nghệ số một cách thận trọng và tinh tế. Thay vì chấp nhận hoặc bác bỏ công nghệ một cách tuyệt đối, bằng chứng cho thấy cần một chiến lược cân bằng, kết hợp công cụ số với việc hướng dẫn rõ ràng về học tập tự điều chỉnh. Dạy học sinh theo dõi sự chú ý của chính mình, đặt mục tiêu học tập cụ thể và nhận ra khi nào sự xao nhãng kỹ thuật số đang làm suy giảm khả năng hiểu bài có thể hiệu quả hơn việc chỉ đơn giản hạn chế sử dụng thiết bị. Khi môi trường học tập tiếp tục thay đổi, thách thức trung tâm sẽ là bồi dưỡng các kỹ năng siêu nhận thức giúp học sinh tận dụng tài nguyên số mà không bị chúng lấn át.",
    ],
    "Artificial Intelligence in Schools: Promise and Pitfalls": [
        "Việc tích hợp trí tuệ nhân tạo vào môi trường giáo dục đã tăng tốc trong những năm gần đây, tạo ra cả sự hào hứng lẫn lo ngại trong giới giáo viên và nhà hoạch định chính sách. Những người ủng hộ cho rằng các công cụ sử dụng AI có thể cá nhân hóa việc học, tự động hóa các nhiệm vụ hành chính và cung cấp phản hồi theo thời gian thực cho học sinh. Ví dụ, các nền tảng học thích ứng phân tích dữ liệu kết quả của từng cá nhân để điều chỉnh độ khó của bài tập, cho phép người học tiến bộ theo tốc độ riêng của mình. [I] Những hệ thống như vậy, theo những người ủng hộ, có thể giúp thu hẹp khoảng cách thành tích bằng cách hỗ trợ đúng trọng tâm cho những học sinh có nguy cơ bị tụt lại phía sau. Tuy nhiên, việc áp dụng nhanh các công nghệ này đã vượt trước quá trình xây dựng các hướng dẫn rõ ràng, khiến nhiều trường phải tự xoay xở trong một vùng còn nhiều điều chưa biết.",
        "Bất chấp sự lạc quan, ngày càng nhiều nghiên cứu chỉ ra những hạn chế đáng kể trong các ứng dụng AI hiện nay. Một nghiên cứu năm 2023 của International Journal of Educational Technology cho thấy mặc dù gia sư AI giúp điểm toán tăng trung bình 12 phần trăm, mức cải thiện chủ yếu tập trung ở những học sinh vốn đã có kỹ năng tự điều chỉnh tốt. [II] Những người học thiếu động lực hoặc thiếu năng lực số chỉ cải thiện rất ít, và trong một số trường hợp kết quả của họ còn giảm sút. Hơn nữa, thiên vị thuật toán vẫn là một thách thức dai dẳng; một số công cụ đánh giá được sử dụng rộng rãi đã bị chứng minh là gây bất lợi cho học sinh đến từ môi trường không nói tiếng Anh, làm dấy lên các câu hỏi về công bằng và bình đẳng.",
        "Bên cạnh các hạn chế kỹ thuật, những khía cạnh xã hội và đạo đức của AI trong lớp học cũng cần được xem xét cẩn trọng. Giáo viên cho biết họ cảm thấy bị suy giảm vai trò chuyên môn khi thuật toán đảm nhận việc lập kế hoạch bài học và chấm điểm, từ đó có thể làm xói mòn khả năng phán đoán nghề nghiệp vốn rất quan trọng đối với việc giảng dạy hiệu quả. [III] Ngoài ra còn có những lo ngại chưa được giải quyết về quyền riêng tư, vì nhiều nền tảng AI thu thập lượng lớn dữ liệu nhạy cảm của học sinh, từ mẫu gõ phím đến biểu cảm khuôn mặt, thường không có quy trình xin ý kiến minh bạch. Các nhà phê bình cảnh báo rằng việc phụ thuộc quá mức vào hệ thống tự động có thể biến giáo dục thành một chuỗi giao dịch có thể đo lường, bỏ qua các khía cạnh quan hệ và cảm xúc của việc học mà chỉ người dạy mới có thể mang lại.",
        "Nhìn về phía trước, một cách tiếp cận cân bằng là điều cần thiết nếu các trường muốn tận dụng lợi ích của AI đồng thời giảm thiểu rủi ro. Các nhà hoạch định chính sách phải xây dựng khung quy định vững chắc, ưu tiên bảo vệ dữ liệu và trách nhiệm giải trình của thuật toán. [IV] Đồng thời, các chương trình phát triển chuyên môn cần trang bị cho giáo viên khả năng sử dụng AI như một công cụ bổ trợ, chứ không phải sự thay thế cho chuyên môn của họ. Cuối cùng, mục tiêu không nên là tạo ra những lớp học do máy móc vận hành, mà là tích hợp công nghệ một cách có suy nghĩ để tăng cường kết nối con người và nuôi dưỡng việc học sâu hơn cho tất cả học sinh.",
    ],
}


def split_passage(content: str) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", content) if part.strip()]
    if len(paragraphs) > 1:
        return paragraphs
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z\[])", content)
    result: list[str] = []
    for index, sentence in enumerate(sentences):
        bucket = index // 4
        if bucket == len(result):
            result.append(sentence)
        else:
            result[bucket] += " " + sentence
    return [part for part in result if part.strip()]


def extract_quoted_snippets(text: str | None, min_length: int = 2) -> list[str]:
    source = text or ""
    pattern = re.compile(r'"([^"]{2,})"|“([^”]{2,})”|\'([^\']{2,})\'')
    snippets: list[str] = []
    for match in pattern.finditer(source):
        snippet = next(group for group in match.groups() if group)
        snippet = snippet.strip()
        if len(snippet) >= min_length:
            snippets.append(snippet)
    return snippets


def extract_paragraph_number(text: str | None) -> int | None:
    match = re.search(r"\bparagraph\s+([1-9])\b", text or "", re.I)
    return int(match.group(1)) if match else None


def evidence_for_question(question: dict, content: str) -> list[EvidenceSnippet]:
    paragraph = extract_paragraph_number(str(question.get("question_text") or ""))
    snippets: list[EvidenceSnippet] = [
        {"text": snippet, "paragraph": paragraph}
        for snippet in extract_quoted_snippets(str(question.get("question_text") or ""), 2)
    ]
    if question.get("question_type") == "sentence_insertion":
        snippets.extend({"text": marker} for marker in ["[I]", "[II]", "[III]", "[IV]"])

    lower_content = content.lower()
    result: list[EvidenceSnippet] = []
    seen: set[tuple[str, int | None]] = set()
    for snippet in snippets:
        text = snippet["text"].strip()
        key = (text, snippet.get("paragraph"))
        if text and text.lower() in lower_content and key not in seen:
            result.append({"text": text, **({"paragraph": snippet["paragraph"]} if snippet.get("paragraph") else {})})
            seen.add(key)
    return result


def boundary_ok(text: str, start: int, end: int, snippet: str) -> bool:
    if len(snippet) > 20 or not re.match(r"^[A-Za-z0-9]+$", snippet):
        return True
    before = text[start - 1] if start > 0 else ""
    after = text[end] if end < len(text) else ""
    return not re.match(r"[A-Za-z0-9]", before) and not re.match(r"[A-Za-z0-9]", after)


def highlight(text: str, snippets: list[EvidenceSnippet], paragraph_number: int) -> tuple[str, int]:
    ranges: list[tuple[int, int, bool]] = []
    lower_text = text.lower()
    candidates = []
    for item in snippets:
        if item.get("paragraph") and item["paragraph"] != paragraph_number:
            continue
        candidate = item["text"].strip()
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    for snippet in sorted(candidates, key=len, reverse=True):
        lower_snippet = snippet.lower()
        start = lower_text.find(lower_snippet)
        while start >= 0:
            end = start + len(snippet)
            overlaps = any(start < old_end and end > old_start for old_start, old_end, _ in ranges)
            if not overlaps and boundary_ok(text, start, end, snippet):
                ranges.append((start, end, len(snippet) > 70))
            start = lower_text.find(lower_snippet, start + max(1, len(snippet)))

    if not ranges:
        return html.escape(text), 0

    ranges.sort()
    parts: list[str] = []
    cursor = 0
    for start, end, is_long in ranges:
        parts.append(html.escape(text[cursor:start]))
        cls = ' class="long"' if is_long else ""
        parts.append(f"<mark{cls}>{html.escape(text[start:end])}</mark>")
        cursor = end
    parts.append(html.escape(text[cursor:]))
    return "".join(parts), len(ranges)


def render_options(question: dict) -> str:
    correct = str(question.get("correct_answer") or "").upper()
    rows = []
    for key in ["A", "B", "C", "D"]:
        value = question.get(f"option_{key.lower()}") or ""
        cls = "option correct" if key == correct else "option"
        rows.append(f'<div class="{cls}"><b>{key}.</b> {html.escape(str(value))}</div>')
    return "".join(rows)


def render_passage(payload: dict, index: int) -> tuple[str, int]:
    content = str(payload["content"])
    questions = payload.get("questions") or []
    snippets: list[EvidenceSnippet] = []
    for question in questions:
        snippets.extend(evidence_for_question(question, content))

    highlighted = 0
    paragraph_html = []
    paragraphs = split_passage(content)
    translations = TRANSLATIONS_VI.get(str(payload.get("title") or ""), [])
    translation_html = []
    for p_index, paragraph in enumerate(paragraphs, start=1):
        paragraph_text, count = highlight(paragraph, snippets, p_index)
        highlighted += count
        paragraph_html.append(f'<p class="para"><span class="pno">P{p_index}</span>{paragraph_text}</p>')
        if p_index <= len(translations):
            translation_html.append(
                f'<p class="translation-para"><span class="pno">P{p_index}</span>{html.escape(translations[p_index - 1])}</p>'
            )

    question_html = []
    for q_index, question in enumerate(questions, start=1):
        q_text = html.escape(str(question.get("question_text") or ""))
        q_type = html.escape(str(question.get("question_type") or ""))
        answer = html.escape(str(question.get("correct_answer") or ""))
        explanation = html.escape(str(question.get("explanation") or ""))
        question_html.append(
            f"""
            <article class="question">
              <div class="qtop"><span class="qindex">{q_index}</span><div>
                <h3>{q_text}</h3>
                <div class="chips"><span>{q_type}</span><strong>Answer: {answer}</strong></div>
              </div></div>
              <div class="options">{render_options(question)}</div>
              <div class="explain"><b>Lời giải chi tiết:</b> {explanation}</div>
            </article>
            """
        )

    kind_class = "q10" if len(questions) == 10 else "q8"
    marker_badge = '<span class="badge marker">Markers: [I] [II] [III] [IV]</span>' if len(questions) == 10 else ""
    block = f"""
    <section class="passage">
      <div class="passage-head">
        <div>
          <div class="kicker">New-template trial {index} / {html.escape(str(payload.get("id") or ""))}</div>
          <h2>{html.escape(str(payload.get("title") or ""))}</h2>
          <p class="vi">{html.escape(str(payload.get("title_vi") or ""))}</p>
        </div>
        <div class="meta">
          <span class="badge {kind_class}">{len(questions)} questions</span>
          <span class="badge">{html.escape(str(payload.get("level") or ""))}</span>
          <span class="badge">{html.escape(str(payload.get("word_count") or ""))} words</span>
          <span class="badge evidence">{highlighted} highlighted targets</span>
          {marker_badge}
        </div>
      </div>
      <div class="columns">
        <div class="reading">
          <h3 class="block-title">Passage Text</h3>
          {''.join(paragraph_html)}
          <div class="translation-box">
            <h3 class="block-title">Bản dịch tiếng Việt</h3>
            {''.join(translation_html) if translation_html else '<p class="translation-para">Chưa có bản dịch cho bài này.</p>'}
          </div>
        </div>
        <div class="questions"><h3 class="block-title">Questions, Answer Key, Lời giải chi tiết</h3>{''.join(question_html)}</div>
      </div>
    </section>
    """
    return block, highlighted


def render() -> None:
    payloads = [json.loads(path.read_text(encoding="utf-8")) for path in PREVIEW_FILES]
    blocks = []
    total_highlights = 0
    for index, payload in enumerate(payloads, start=1):
        block, count = render_passage(payload, index)
        blocks.append(block)
        total_highlights += count

    q8_count = sum(1 for item in payloads if len(item.get("questions") or []) == 8)
    q10_count = sum(1 for item in payloads if len(item.get("questions") or []) == 10)
    html_doc = f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Template Reading Preview</title>
  <style>
    :root{{--bg:#f8fafc;--paper:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--blue:#2563eb;--rose:#e11d48;--amber:#d97706}}
    *{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.58}}
    .wrap{{max-width:1320px;margin:0 auto;padding:28px 18px 64px}}.top{{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}}
    h1{{margin:0;font-size:30px;line-height:1.15}}.sub{{margin-top:6px;color:var(--muted)}}.stats{{display:flex;gap:8px;flex-wrap:wrap}}
    .stat{{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:10px 12px;min-width:112px}}.stat b{{display:block;font-size:20px}}.stat span{{font-size:12px;color:var(--muted)}}
    .passage{{background:var(--paper);border:1px solid var(--line);border-radius:12px;margin-top:18px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}}
    .passage-head{{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:18px;border-bottom:1px solid var(--line)}}.kicker{{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:800}}
    h2{{font-size:22px;margin:6px 0 3px;line-height:1.25}}.vi{{color:#475569;margin:0}}.meta,.chips{{display:flex;gap:6px;flex-wrap:wrap}}
    .badge,.chips span,.chips strong{{display:inline-flex;align-items:center;min-height:24px;border-radius:999px;background:#f1f5f9;color:#475569;padding:3px 8px;font-size:12px;font-weight:800}}
    .q8{{background:rgba(37,99,235,.1);color:var(--blue)}}.q10{{background:rgba(225,29,72,.1);color:var(--rose)}}.marker,.evidence{{background:rgba(217,119,6,.1);color:var(--amber)}}
    .columns{{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(440px,.98fr);gap:0}}.reading{{padding:18px;border-right:1px solid var(--line);background:#fff}}.questions{{padding:18px;background:#fbfdff}}
    .block-title{{font-size:15px;margin:0 0 12px;color:#334155}}.para{{font-size:14px;margin:0 0 14px;text-align:justify}}
    .para mark{{border-radius:5px;background:#fde68a;color:#78350f;font-weight:800;padding:1px 3px;box-decoration-break:clone;-webkit-box-decoration-break:clone}}
    .para mark.long{{background:#fef3c7;font-weight:500;text-decoration:underline;text-decoration-thickness:2px;text-decoration-color:#d97706;text-underline-offset:3px}}
    .translation-box{{margin-top:18px;border-top:1px solid var(--line);padding-top:16px;background:#f8fafc;border-radius:10px;padding:16px}}
    .translation-para{{font-size:13px;line-height:1.72;color:#334155;margin:0 0 12px;text-align:justify}}
    .pno{{font-size:11px;font-weight:900;color:var(--muted);background:#f1f5f9;border-radius:6px;padding:2px 6px;margin-right:7px}}.question{{border:1px solid var(--line);background:#fff;border-radius:10px;padding:14px;margin-bottom:12px}}
    .qtop{{display:flex;gap:10px;align-items:flex-start}}.qindex{{width:26px;height:26px;border-radius:999px;background:#eff6ff;color:var(--blue);display:grid;place-items:center;font-size:12px;font-weight:900;flex:0 0 auto}}
    .question h3{{font-size:14px;line-height:1.45;margin:1px 0 8px}}.option{{border:1px solid var(--line);border-radius:9px;padding:8px 10px;margin-top:7px;font-size:13px;background:#fff}}
    .option.correct{{border-color:rgba(5,150,105,.45);background:rgba(5,150,105,.08);color:#047857}}.explain{{margin-top:10px;border-top:1px solid var(--line);padding-top:10px;color:#475569;font-size:13px;line-height:1.62}}
    @media(max-width:980px){{.top,.passage-head{{display:block}}.stats{{margin-top:12px}}.columns{{grid-template-columns:1fr}}.reading{{border-right:0;border-bottom:1px solid var(--line)}}}}
  </style>
</head>
<body>
  <main class="wrap">
    <header class="top">
      <div>
        <h1>New Template Reading Preview</h1>
        <p class="sub">Only targets explicitly mentioned in the questions are highlighted; Vietnamese titles and explanations follow the Supabase reading format.</p>
      </div>
      <div class="stats">
        <div class="stat"><b>{len(payloads)}</b><span>Trial passages</span></div>
        <div class="stat"><b>{q8_count}</b><span>8-question set</span></div>
        <div class="stat"><b>{q10_count}</b><span>10-question set</span></div>
        <div class="stat"><b>{total_highlights}</b><span>Highlights</span></div>
      </div>
    </header>
    {''.join(blocks)}
  </main>
</body>
</html>
"""
    OUT.write_text(html_doc, encoding="utf-8", newline="\n")
    print(f"Wrote {OUT} ({total_highlights} highlights)")


if __name__ == "__main__":
    render()
