CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL CHECK (subject IN ('toan_dai', 'toan_hinh')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  lesson_plan JSONB,
  lesson_plan_html TEXT,
  video_url TEXT,
  video_source TEXT DEFAULT 'link',
  is_published BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO courses (name, description, slug, order_index) VALUES
('Khởi Đầu Vững Chắc', 'Xây dựng nền tảng Toán 12 từ cơ bản đến thành thạo', 'nen-tang', 1),
('Chinh Phục Bài Toán', 'Áp dụng kiến thức vào các dạng bài thực tế', 'van-dung', 2),
('Ôn Tập Toàn Diện', 'Hệ thống hoá toàn bộ chương trình Toán 12', 'tong-on', 3),
('Luyện Đề Chiến Lược', 'Làm quen với cấu trúc đề thi THPTQG', 'luyen-de', 4),
('Bứt Phá Điểm Cao', 'Chinh phục các bài toán khó và Vận dụng cao', 'nang-cao', 5)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can view published lessons" ON lessons FOR SELECT USING (is_published = true);
