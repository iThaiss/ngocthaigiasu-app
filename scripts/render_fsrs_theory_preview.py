import argparse
import html
import json
from pathlib import Path


STYLE = r"""
:root{color-scheme:dark;--bg:#050814;--panel:#0b1220;--soft:#111b2e;--line:#26354d;--text:#f7f9fd;--muted:#a9b7ca;--primary:#8b5cf6;--blue:#60a5fa;--green:#34d399;--amber:#fbbf24;--red:#fb7185}
*{box-sizing:border-box}body{margin:0;background:#050814;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.65}
.page{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:28px 0 72px}.hero{border:1px solid var(--line);background:linear-gradient(180deg,#0d1729,#08101e);border-radius:8px;padding:22px;margin-bottom:18px}.eyebrow{color:#c4b5fd;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}h1{margin:6px 0 8px;font-size:30px;line-height:1.2;letter-spacing:0}.lead{color:#d3deee;max-width:820px;margin:0;font-size:15px}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.pill{border:1px solid var(--line);background:#101a2c;color:#dbeafe;border-radius:999px;padding:5px 10px;font-size:12px}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px;align-items:start}.panel{border:1px solid var(--line);background:rgba(11,18,32,.96);border-radius:8px;padding:18px;overflow:hidden}.panel h2{font-size:19px;margin:24px 0 10px;padding-top:16px;border-top:1px solid var(--line);letter-spacing:0}.panel h2:first-child{margin-top:0;padding-top:0;border-top:0}.panel p{margin:8px 0}.panel table{width:100%;border-collapse:collapse;margin:10px 0;font-size:14px}.panel th,.panel td{border:1px solid var(--line);padding:9px;text-align:left;vertical-align:top}.panel th{background:#0f1d33;color:#dbeafe}.panel td{background:#08111f}.panel ul{padding-left:20px}.panel li{margin:4px 0}.panel code{background:#111827;border:1px solid #283243;border-radius:4px;padding:1px 5px}.sidebar{position:sticky;top:14px;display:flex;flex-direction:column;gap:10px}.card{border:1px solid #2e3d56;background:#091120;border-radius:8px;padding:13px}.card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}.kind{color:#c4b5fd;text-transform:uppercase;font-size:11px;font-weight:800;letter-spacing:.04em}.idx{color:var(--muted);font-size:12px}.front{font-size:14px;font-weight:700;color:#f8fafc;margin:0 0 8px}.back{border-top:1px solid #23324a;padding-top:8px;color:#dbeafe;font-size:14px}.hint{margin-top:8px;color:#a7f3d0;font-size:12px}.explain{margin-top:7px;color:#cbd5e1;font-size:12px}.section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px}.section-title h2{margin:0;border:0;padding:0;font-size:17px}.small{color:var(--muted);font-size:12px}.lists{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.tag{border-radius:999px;background:#1d2b44;color:#bfdbfe;font-size:11px;padding:4px 8px}@media(max-width:960px){.layout,.lists{grid-template-columns:1fr}.sidebar{position:static}h1{font-size:25px}}
.practice{margin-top:16px}.exercise{border:1px solid #2e3d56;background:#08111f;border-radius:8px;padding:14px;margin-top:10px}.exercise-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.exercise-title strong{font-size:14px}.options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.option{border:1px solid #223149;border-radius:6px;background:#0c1728;padding:8px;font-size:13px}.answer{border-top:1px solid #23324a;margin-top:10px;padding-top:9px;color:#bbf7d0;font-size:13px}.solution{color:#cbd5e1;font-size:13px;margin-top:6px}.statements{display:grid;gap:7px;margin-top:9px}.statement{border:1px solid #223149;border-radius:6px;background:#0c1728;padding:8px;font-size:13px}
"""


def render_list(items: list[str]) -> str:
    if not items:
        return '<p class="small">Chưa có dữ liệu.</p>'
    return "<ul>" + "".join(f"<li>{html.escape(str(item))}</li>" for item in items) + "</ul>"


def render_flashcards(cards: list[dict]) -> str:
    if not cards:
        return '<div class="card"><p class="small">Chưa có flashcard.</p></div>'

    chunks = []
    for index, card in enumerate(cards, start=1):
        kind = html.escape(str(card.get("card_kind", "concept")))
        front = html.escape(str(card.get("front", "")))
        back = html.escape(str(card.get("back", "")))
        hint = card.get("hint")
        explanation = card.get("explanation")
        chunks.append(
            f"""
            <article class="card">
              <div class="card-head"><span class="kind">{kind}</span><span class="idx">#{index}</span></div>
              <p class="front">{front}</p>
              <div class="back">{back}</div>
              {f'<div class="hint">Gợi ý: {html.escape(str(hint))}</div>' if hint else ''}
              {f'<div class="explain">{html.escape(str(explanation))}</div>' if explanation else ''}
            </article>
            """
        )
    return "\n".join(chunks)


def render_exercises(exercises: list[dict]) -> str:
    if not exercises:
        return '<p class="small">Preview này chưa sinh bài tập. Chạy lại không dùng --theory-only để xem phần luyện tập.</p>'

    chunks = []
    for index, ex in enumerate(exercises, start=1):
        q_type = str(ex.get("question_type", "multiple_choice"))
        difficulty = html.escape(str(ex.get("difficulty", "")))
        question = html.escape(str(ex.get("question_text", "")))
        explanation = html.escape(str(ex.get("explanation", "")))

        body = ""
        answer = ""
        if q_type == "multiple_choice":
            opts = []
            for key in ["a", "b", "c", "d"]:
                value = ex.get(f"option_{key}")
                if value:
                    opts.append(f'<div class="option"><b>{key.upper()}.</b> {html.escape(str(value))}</div>')
            body = f'<div class="options">{"".join(opts)}</div>'
            answer = f'Đáp án: {html.escape(str(ex.get("correct_answer", "")))}'
        elif q_type == "true_false":
            statements = ex.get("statements") or []
            rows = []
            if isinstance(statements, list):
                for st in statements:
                    if isinstance(st, dict):
                        label = html.escape(str(st.get("label", "")))
                        text = html.escape(str(st.get("text", "")))
                        val = "Đúng" if st.get("answer") is True else "Sai"
                        rows.append(f'<div class="statement"><b>{label}.</b> {text} <span class="small">({val})</span></div>')
            body = f'<div class="statements">{"".join(rows)}</div>'
            answer = "Đáp án đúng/sai đã ghi cạnh từng mệnh đề để review nhanh."
        else:
            answer = f'Đáp án số: {html.escape(str(ex.get("numeric_answer", "")))}'

        chunks.append(
            f"""
            <article class="exercise">
              <div class="exercise-title"><strong>Câu {index}</strong><span class="tag">{html.escape(q_type)} · {difficulty}</span></div>
              <p>{question}</p>
              {body}
              <div class="answer">{answer}</div>
              {f'<div class="solution">{explanation}</div>' if explanation else ''}
            </article>
            """
        )
    return "\n".join(chunks)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("json_path")
    parser.add_argument("html_path")
    args = parser.parse_args()

    data = json.loads(Path(args.json_path).read_text(encoding="utf-8"))
    lesson = data.get("lesson", {})
    theory = data.get("theory", {})
    title = theory.get("title_vi") or theory.get("title") or lesson.get("title_vi") or lesson.get("title") or "Preview bài học"
    content_md = theory.get("content_md", "")
    key_rules = theory.get("key_rules") or []
    mistakes = theory.get("common_mistakes") or []
    flashcards = theory.get("flashcards") or []
    exercises = data.get("exercises") or []

    html_doc = f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)} - FSRS Preview</title>
  <script>
    window.MathJax = {{ tex: {{ inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$']] }} }};
  </script>
  <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>{STYLE}</style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div class="eyebrow">FSRS theory preview</div>
      <h1>{html.escape(title)}</h1>
      <p class="lead">Bản preview theo khung mới: lý thuyết ngắn để hiểu nhanh, flashcard để ôn lại bằng FSRS. File này sinh từ JSON dry-run, chưa ghi database.</p>
      <div class="meta">
        <span class="pill">{len(content_md)} ký tự lý thuyết</span>
        <span class="pill">{len(flashcards)} flashcards</span>
        <span class="pill">{html.escape(str(lesson.get("level", "")))}</span>
      </div>
    </header>

    <section class="layout">
      <article class="panel" id="content"></article>
      <aside class="sidebar">
        <div class="panel">
          <div class="section-title">
            <h2>Flashcards FSRS</h2>
            <span class="tag">12-18 thẻ/bài</span>
          </div>
          {render_flashcards(flashcards)}
        </div>
      </aside>
    </section>

    <section class="lists">
      <article class="panel">
        <div class="section-title"><h2>Cần nhớ</h2><span class="small">{len(key_rules)} ý</span></div>
        {render_list(key_rules)}
      </article>
      <article class="panel">
        <div class="section-title"><h2>Lỗi sai</h2><span class="small">{len(mistakes)} lỗi</span></div>
        {render_list(mistakes)}
      </article>
    </section>

    <section class="panel practice">
      <div class="section-title">
        <h2>Bài tập luyện</h2>
        <span class="tag">{len(exercises)} câu</span>
      </div>
      {render_exercises(exercises)}
    </section>
  </main>
  <script>
    const markdown = {json.dumps(content_md, ensure_ascii=False)};
    marked.setOptions({{ gfm: true, breaks: true }});
    document.getElementById('content').innerHTML = marked.parse(markdown);
    if (window.MathJax) window.MathJax.typesetPromise();
  </script>
</body>
</html>
"""

    out = Path(args.html_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html_doc, encoding="utf-8")
    print(out.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
