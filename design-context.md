# Design System — ngocthaigiasu-app

## Stack
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Dark mode mặc định

## Color Tokens (CSS variables)

### Dark mode (mặc định)
- `--background`: hsl(224 71.4% 4.1%) → màu navy rất tối
- `--foreground`: hsl(210 20% 98%) → trắng gần như thuần
- `--card`: hsl(224 71.4% 6%) → card nền tối hơn background nhẹ
- `--primary`: hsl(263.4 70% 50.4%) → **tím/violet** — màu nhấn chính
- `--secondary`: hsl(215 27.9% 16.9%) → xám xanh tối
- `--muted`: hsl(215 27.9% 16.9%) → nền mờ
- `--muted-foreground`: hsl(217.9 10.6% 64.9%) → chữ phụ
- `--border`: hsl(215 27.9% 16.9%) → viền
- `--destructive`: hsl(0 62.8% 30.6%) → đỏ/nguy hiểm
- `--ring`: hsl(263.4 70% 50.4%) → focus ring tím

### Border radius
- `--radius`: 0.5rem → bo góc vừa phải

## Layout
- **Sidebar** trái (components/layout/Sidebar.tsx)
- **Header** trên (components/layout/Header.tsx)
- **Breadcrumb** điều hướng (components/layout/Breadcrumb.tsx)
- **SupportBubble** nút hỗ trợ nổi

## UI Components (shadcn/ui)
Button, Card, Badge, Dialog, Input, Avatar, Accordion,
Dropdown Menu, Popover, Select, Tabs, Toast, Tooltip

## Tính năng chính
- Luyện thi (exam): QuestionGrid, Timer
- Giải bài (solve): Dropzone ảnh → AI giải
- Dashboard người dùng
- Modal: PracticeModal, QuestionPracticeModal, ProfileCompletionModal
- AI Tutor: QuestionTutorAgent

## Phong cách thiết kế
- Tối giản, dark theme navy + tím
- Góc bo tròn nhẹ (0.5rem)
- Scrollbar mỏng (6px), tự ẩn
- KaTeX cho công thức toán
