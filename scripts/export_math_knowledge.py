import json
import os
import sys
from datetime import datetime
from pathlib import Path

import requests


def load_dotenv() -> None:
    for path in [".env.local", ".env.production.local", ".env", "../pipeline/.env"]:
        p = Path(path)
        if not p.exists():
            continue
        for raw in p.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class SupabaseREST:
    def __init__(self, url: str, key: str) -> None:
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def get(self, table: str, select: str = "*", params: dict[str, str] | None = None) -> list[dict]:
        query = {"select": select}
        if params:
            query.update(params)
        response = requests.get(f"{self.base}/{table}", headers=self.headers, params=query, timeout=30)
        response.raise_for_status()
        return response.json()


def as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass
        return [value] if value.strip() else []
    return [str(value)]


def main() -> int:
    load_dotenv()
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if not url or not key:
        print("Missing Supabase URL or key in environment.", file=sys.stderr)
        return 1

    sb = SupabaseREST(url, key)
    courses = sb.get("courses", params={"slug": "eq.nen-tang", "is_active": "eq.true"})
    if not courses:
        print("Course nen-tang not found.", file=sys.stderr)
        return 1

    course = courses[0]
    chapters = sb.get(
        "chapters",
        params={"course_id": f"eq.{course['id']}", "order": "order_index.asc"},
    )

    chapter_ids = [chapter["id"] for chapter in chapters]
    lessons: list[dict] = []
    if chapter_ids:
        lessons = sb.get(
            "math_lessons",
            select="id,chapter_id,title,title_vi,topic,level,content_md,key_rules,common_mistakes,exercise_count,order_index,created_at",
            params={
                "chapter_id": f"in.({','.join(chapter_ids)})",
                "is_active": "eq.true",
                "order": "chapter_id.asc,order_index.asc",
            },
        )

    by_chapter: dict[str, list[dict]] = {}
    for lesson in lessons:
        by_chapter.setdefault(lesson["chapter_id"], []).append(lesson)
    for items in by_chapter.values():
        items.sort(key=lambda item: item.get("order_index") or 0)

    lines: list[str] = [
        f"# {course.get('name', 'Kiến thức nền tảng')}",
        "",
        f"- Slug: `{course.get('slug')}`",
        f"- Xuất lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"- Tổng số chương có dữ liệu: {sum(1 for c in chapters if by_chapter.get(c['id']))}",
        f"- Tổng số bài: {len(lessons)}",
        "",
        "> File này xuất từ dữ liệu `math_lessons` đang được website dùng cho khóa học.",
        "",
    ]

    lesson_no = 0
    for chapter in chapters:
        chapter_lessons = by_chapter.get(chapter["id"], [])
        if not chapter_lessons:
            continue
        lines.extend(
            [
                f"## {chapter.get('name', 'Chương')}",
                "",
                f"- Môn: `{chapter.get('subject', '')}`",
                f"- Số bài: {len(chapter_lessons)}",
                "",
            ]
        )

        for lesson in chapter_lessons:
            lesson_no += 1
            title = lesson.get("title_vi") or lesson.get("title") or f"Bài {lesson_no}"
            lines.extend(
                [
                    f"### {lesson_no}. {title}",
                    "",
                    f"- ID: `{lesson.get('id')}`",
                    f"- Chủ đề: {lesson.get('topic') or ''}",
                    f"- Mức độ: `{lesson.get('level') or ''}`",
                    f"- Số bài tập: {lesson.get('exercise_count') or 0}",
                    "",
                ]
            )

            content = (lesson.get("content_md") or "").strip()
            if content:
                lines.extend([content, ""])
            else:
                lines.extend(["_Chưa có nội dung lý thuyết._", ""])

            rules = as_list(lesson.get("key_rules"))
            if rules:
                lines.extend(["#### Quy tắc chính", ""])
                lines.extend([f"- {rule}" for rule in rules])
                lines.append("")

            mistakes = as_list(lesson.get("common_mistakes"))
            if mistakes:
                lines.extend(["#### Lỗi thường gặp", ""])
                lines.extend([f"- {mistake}" for mistake in mistakes])
                lines.append("")

            lines.append("---")
            lines.append("")

    output_dir = Path("exports")
    output_dir.mkdir(exist_ok=True)
    output = output_dir / "kien-thuc-nen-tang.md"
    output.write_text("\n".join(lines), encoding="utf-8")
    print(output.resolve())
    print(f"chapters={sum(1 for c in chapters if by_chapter.get(c['id']))} lessons={len(lessons)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
