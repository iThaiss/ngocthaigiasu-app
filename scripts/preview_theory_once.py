import argparse
import json
from pathlib import Path

import import_math as im


LESSONS = {
    "line-oxyz": {
        "title": "Phương trình tham số và chính tắc của đường thẳng trong Oxyz",
        "title_vi": "Phương trình tham số và chính tắc của đường thẳng",
        "level": "nhan_biet",
        "topic": "Phương trình và hình học Oxyz",
    },
    "limit": {
        "title": "Giới hạn dãy số và hàm số",
        "title_vi": "Giới hạn dãy số và hàm số",
        "level": "nhan_biet",
        "topic": "Kiến thức tiền đề",
    },
    "sphere-oxyz": {
        "title": "Phương trình mặt cầu và tương giao",
        "title_vi": "Phương trình mặt cầu và tương giao",
        "level": "nhan_biet",
        "topic": "Phương trình và hình học Oxyz",
    },
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson", choices=LESSONS.keys(), default="line-oxyz")
    parser.add_argument("--model", default=im.ROUTER_MODEL)
    parser.add_argument("--timeout", type=int, default=150)
    parser.add_argument("--out", default="exports/generated-theory/preview-theory.json")
    args = parser.parse_args()

    lesson = LESSONS[args.lesson]
    prompt = im.COMPACT_THEORY_PROMPT.format(
        title=lesson["title"],
        title_vi=lesson["title_vi"],
        level=lesson["level"],
    )

    print(f"calling {im.ROUTER_BASE_URL} model={args.model}", flush=True)
    theory = im.call_9router(prompt, model=args.model, max_tokens=2600, timeout=args.timeout)
    print(f"result={bool(theory)}", flush=True)
    if not theory:
        return 2

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"lesson": lesson, "theory": theory}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out.resolve(), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
