import argparse
import html
import json
from pathlib import Path


STYLE = r"""
:root{color-scheme:dark;--bg:#050814;--panel:#0b1220;--line:#26354d;--text:#f7f9fd;--muted:#a9b7ca;--blue:#60a5fa;--cyan:#67e8f9;--green:#34d399;--amber:#fbbf24;--red:#fb7185}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top left,#10213f 0,#050814 360px);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.7}
.page{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:28px 0 72px}.breadcrumb{color:var(--muted);font-size:14px;margin-bottom:12px}.hero{border:1px solid var(--line);background:rgba(8,15,29,.94);border-radius:8px;padding:24px;margin-bottom:18px}.eyebrow{color:var(--cyan);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}h1{margin:6px 0 10px;font-size:32px;line-height:1.2;letter-spacing:0}.lead{color:#d3deee;max-width:800px;margin:0;font-size:17px}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.pill{border:1px solid var(--line);background:#101a2c;color:#dbeafe;border-radius:999px;padding:5px 10px;font-size:13px}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}.content{border:1px solid var(--line);background:rgba(11,18,32,.96);border-radius:8px;padding:20px;overflow:hidden}.content h2{font-size:21px;margin:28px 0 10px;padding-top:18px;border-top:1px solid var(--line);letter-spacing:0}.content h2:first-child{margin-top:0;padding-top:0;border-top:0}.content h3{font-size:17px;margin:18px 0 8px}.content p{margin:10px 0}.content table{width:100%;border-collapse:collapse;margin:12px 0}.content th,.content td{border:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}.content th{background:#0f1d33;color:#dbeafe}.content td{background:#08111f}.content blockquote{border-left:3px solid var(--blue);background:#0a1a30;margin:12px 0;padding:12px 14px;border-radius:0 8px 8px 0;color:#dbeafe}.content code{background:#111827;border:1px solid #283243;border-radius:4px;padding:1px 5px}.figure{border:1px solid #2b3d58;background:#070c18;border-radius:8px;padding:14px;position:sticky;top:14px}.figure img{width:100%;height:auto;display:block;background:#f8fafc;border-radius:6px;padding:8px}.caption{margin-top:10px;color:var(--muted);font-size:13px}.observe{margin-top:12px;padding-left:12px;border-left:3px solid var(--cyan);color:#cffafe;font-size:14px}.rules{border:1px solid var(--line);background:#091120;border-radius:8px;padding:16px;margin-top:18px}.rules h2{font-size:18px;margin:0 0 8px;border:0;padding:0}@media(max-width:900px){.layout{grid-template-columns:1fr}.figure{position:static}h1{font-size:26px}}
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("json_path")
    parser.add_argument("html_path")
    args = parser.parse_args()

    data = json.loads(Path(args.json_path).read_text(encoding="utf-8"))
    lesson = data.get("lesson", {})
    theory = data.get("theory", {})
    content_md = theory.get("content_md", "")

    figure_text = ""
    clean_lines = []
    for line in content_md.splitlines():
        stripped = line.strip()
        if (
            stripped.startswith("> [Hình minh họa:") or stripped.startswith("[Hình minh họa:")
        ) and not figure_text:
            figure_text = stripped.split(":", 1)[1].removesuffix("]").strip()
            continue
        clean_lines.append(line)
    clean_md = "\n".join(clean_lines)

    key_rules = theory.get("key_rules") or []
    mistakes = theory.get("common_mistakes") or []
    title = theory.get("title_vi") or lesson.get("title_vi") or lesson.get("title") or "Preview bài học"
    title_lc = f"{title} {lesson.get('title', '')} {lesson.get('topic', '')}".lower()
    figure_src = "../public/math-diagrams/plane-sphere.svg" if "mặt cầu" in title_lc else "../public/math-diagrams/line-oxyz-point-direction.svg"
    figure_alt = "TikZ minh họa mặt cầu" if "mặt cầu" in title_lc else "TikZ minh họa đường thẳng Oxyz"
    layout_class = "layout" if figure_text else ""
    figure_html = f"""
      <aside class="figure">
        <img src="{figure_src}" alt="{figure_alt}" />
        <div class="caption">Hình TikZ gắn với marker hình trong nội dung.</div>
        <div class="observe"><b>Mô tả từ model:</b> {html.escape(figure_text)}</div>
      </aside>
""" if figure_text else ""

    html_doc = f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)}</title>
  <script>
    window.MathJax = {{ tex: {{ inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$']] }} }};
  </script>
  <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>{STYLE}</style>
</head>
<body>
  <main class="page">
    <div class="breadcrumb">Preview / Sinh từ scripts/import_math.py / {html.escape(lesson.get("topic", ""))}</div>
    <header class="hero">
      <div class="eyebrow">Generated teaching guide</div>
      <h1>{html.escape(title)}</h1>
      <p class="lead">Bản này được sinh bằng prompt mới trong <code>scripts/import_math.py</code>, chưa ghi database và chưa deploy.</p>
      <div class="meta">
        <span class="pill">Model output thật</span>
        <span class="pill">Có marker hình nếu cần</span>
        <span class="pill">{html.escape(lesson.get("level", ""))}</span>
      </div>
    </header>

    <section class="{layout_class}">
      <article class="content" id="content"></article>
{figure_html}
    </section>

    <section class="content rules">
      <h2>Key rules</h2>
      <ul>{"".join(f"<li>{html.escape(str(item))}</li>" for item in key_rules)}</ul>
      <h2>Common mistakes</h2>
      <ul>{"".join(f"<li>{html.escape(str(item))}</li>" for item in mistakes)}</ul>
    </section>
  </main>
  <script>
    const markdown = {json.dumps(clean_md, ensure_ascii=False)};
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
