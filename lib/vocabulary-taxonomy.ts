import {
  Brain,
  BriefcaseBusiness,
  Cable,
  Compass,
  FlaskConical,
  Globe2,
  GraduationCap,
  Leaf,
  Lightbulb,
  Link2,
  LucideIcon,
  Puzzle,
  Scale,
  Sprout,
  Target,
  Users,
} from 'lucide-react'

export type LevelKey = 'all' | 'B1' | 'B2' | 'C1'

export interface GroupConfig {
  key: string
  label: string
  description: string
  icon: LucideIcon
  accent: string
  bg: string
  border: string
  topics: string[]
}

export const LEVEL_TABS: { key: LevelKey; label: string; sublabel: string; color: string; bg: string }[] = [
  { key: 'all', label: 'Tất cả', sublabel: 'Toàn bộ kho', color: 'text-foreground', bg: 'bg-muted' },
  { key: 'B1', label: 'B1', sublabel: 'Nền tảng', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
  { key: 'B2', label: 'B2', sublabel: 'Mở rộng', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500/10' },
  { key: 'C1', label: 'C1-C2', sublabel: 'Chuyên sâu', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500/10' },
]

export const VOCAB_GROUPS: GroupConfig[] = [
  {
    key: 'people-society',
    label: 'Con người & Xã hội',
    description: 'Gia đình, giáo dục, việc làm, sức khỏe, công bằng xã hội.',
    icon: Users,
    accent: 'text-violet-600 dark:text-violet-300',
    bg: 'bg-violet-500/8 hover:bg-violet-500/12',
    border: 'border-violet-200 dark:border-violet-900',
    topics: ['Family & Relationships', 'Education & Learning', 'Education Reform & Lifelong Learning', 'Work & Career', 'Automation & Future of Work', 'Health & Medicine', 'Public Health & Pandemics', 'Emotions & Personality', 'Gender & Equality', 'Community & Social Issues', 'Culture & Traditions', 'Law & Justice', 'Mental Health & Well-being', 'Migration & Refugees', 'Aging Population & Demographic Change', 'Inequality & Social Mobility'],
  },
  {
    key: 'nature-world',
    label: 'Tự nhiên & Đời sống',
    description: 'Môi trường, khí hậu, thiên tai, thực phẩm, năng lượng.',
    icon: Leaf,
    accent: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/8 hover:bg-emerald-500/12',
    border: 'border-emerald-200 dark:border-emerald-900',
    topics: ['Environment & Climate Change', 'Nature & Wildlife', 'Natural Disasters', 'Disaster Preparedness & Resilience', 'Food & Nutrition', 'Food Security & Supply Chains', 'Energy & Natural Resources', 'Renewable Energy Transition', 'Agriculture & Farming'],
  },
  {
    key: 'science-technology',
    label: 'Khoa học & Công nghệ',
    description: 'Nghiên cứu, AI, internet, bảo mật, hạ tầng, sinh học.',
    icon: FlaskConical,
    accent: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/8 hover:bg-blue-500/12',
    border: 'border-blue-200 dark:border-blue-900',
    topics: ['Science & Research', 'Technology & Innovation', 'Cybersecurity & Data Privacy', 'Digital & Internet', 'Space & Astronomy', 'Medicine & Biotechnology', 'Artificial Intelligence & Robots', 'Engineering & Infrastructure'],
  },
  {
    key: 'economy-politics',
    label: 'Kinh tế & Chính trị',
    description: 'Kinh doanh, truyền thông, tài chính, toàn cầu hóa.',
    icon: BriefcaseBusiness,
    accent: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/8 hover:bg-amber-500/12',
    border: 'border-amber-200 dark:border-amber-900',
    topics: ['Business & Economics', 'Politics & Government', 'Globalization & Trade', 'Media & Journalism', 'Misinformation & Digital Literacy', 'Finance & Banking', 'International Relations'],
  },
  {
    key: 'daily-life',
    label: 'Đời sống hằng ngày',
    description: 'Du lịch, đô thị, thể thao, nghệ thuật, tiêu dùng.',
    icon: Compass,
    accent: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/8 hover:bg-rose-500/12',
    border: 'border-rose-200 dark:border-rose-900',
    topics: ['Travel & Transport', 'Housing & Urban Life', 'Sustainable Cities & Urban Planning', 'Sports & Recreation', 'Arts & Entertainment', 'Shopping & Consumerism', 'Consumer Behavior & Advertising', 'Fashion & Lifestyle', 'Music & Performing Arts'],
  },
  {
    key: 'thought-language',
    label: 'Tư duy & Ngôn ngữ',
    description: 'Giao tiếp, đạo đức, lịch sử, tâm lý, học thuật.',
    icon: Brain,
    accent: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-500/8 hover:bg-cyan-500/12',
    border: 'border-cyan-200 dark:border-cyan-900',
    topics: ['Communication & Language', 'Philosophy & Ethics', 'History & Civilization', 'Psychology & Behavior', 'Academic & Formal Language', 'Literature & Writing', 'Religion & Beliefs'],
  },
  {
    key: 'contextual-meaning',
    label: 'Hiểu nghĩa theo ngữ cảnh',
    description: 'Từ nhiều nghĩa, đồng nghĩa, trái nghĩa, sắc thái trong câu.',
    icon: Lightbulb,
    accent: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-500/8 hover:bg-indigo-500/12',
    border: 'border-indigo-200 dark:border-indigo-900',
    topics: ['Contextual Meaning', 'Synonyms & Antonyms in Context'],
  },
  {
    key: 'word-partnerships',
    label: 'Cụm từ tự nhiên',
    description: 'Collocation, cụm cố định, giới từ và phrase hay gặp.',
    icon: Puzzle,
    accent: 'text-fuchsia-700 dark:text-fuchsia-300',
    bg: 'bg-fuchsia-500/8 hover:bg-fuchsia-500/12',
    border: 'border-fuchsia-200 dark:border-fuchsia-900',
    topics: ['Natural Word Partnerships', 'Collocations in Context', 'Prepositions & Fixed Phrases'],
  },
  {
    key: 'verb-patterns',
    label: 'Cụm động từ & mẫu động từ',
    description: 'Phrasal verbs, verb + preposition, verb phrases dễ nhầm.',
    icon: Cable,
    accent: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-500/8 hover:bg-sky-500/12',
    border: 'border-sky-200 dark:border-sky-900',
    topics: ['Verb Patterns', 'Phrasal Verbs'],
  },
  {
    key: 'connectors-logic',
    label: 'Từ nối & logic câu',
    description: 'Bổ sung, tương phản, nguyên nhân, ví dụ, kết luận.',
    icon: Link2,
    accent: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-500/8 hover:bg-teal-500/12',
    border: 'border-teal-200 dark:border-teal-900',
    topics: ['Connectors and Logic', 'Discourse Markers & Linking Words'],
  },
  {
    key: 'word-families',
    label: 'Họ từ & dạng từ',
    description: 'Danh, động, tính, trạng và word formation trong đề.',
    icon: Sprout,
    accent: 'text-lime-700 dark:text-lime-300',
    bg: 'bg-lime-500/8 hover:bg-lime-500/12',
    border: 'border-lime-200 dark:border-lime-900',
    topics: ['Word Families', 'Word Formation & Word Form'],
  },
  {
    key: 'exam-traps',
    label: 'Bẫy từ vựng trong đề',
    description: 'Cặp dễ nhầm, distractor, register và lỗi chọn nghĩa.',
    icon: Target,
    accent: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/8 hover:bg-red-500/12',
    border: 'border-red-200 dark:border-red-900',
    topics: ['Exam Traps'],
  },
]

export const TOPIC_TO_GROUP = VOCAB_GROUPS.reduce<Record<string, string>>((acc, group) => {
  for (const topic of group.topics) acc[topic] = group.key
  return acc
}, {})

export const POS_LABELS: Record<string, string> = {
  noun: 'Danh từ',
  verb: 'Động từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  phrase: 'Cụm từ',
  collocation: 'Collocation',
  phrasal_verb: 'Phrasal verb',
  connector: 'Từ nối',
}

export function getPrimaryLevel(description: string | null): LevelKey {
  if (!description) return 'B2'
  const range = description.match(/([ABC][12])-([ABC][12])/)
  const start = range ? range[1] : description.match(/\b([ABC][12])\b/)?.[1]
  if (!start) return 'B2'
  if (start === 'A1' || start === 'A2' || start === 'B1') return 'B1'
  if (start === 'B2') return 'B2'
  return 'C1'
}

export function getGroupForTopic(topic: string | null | undefined): GroupConfig | undefined {
  if (!topic) return undefined
  const groupKey = TOPIC_TO_GROUP[topic]
  return VOCAB_GROUPS.find((group) => group.key === groupKey)
}

export function normalizePosLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase().replaceAll('_', ' ')
  const parts = normalized.split(/\s*(?:\||\/|,)\s*/).filter(Boolean)
  if (parts.length > 1) {
    return parts.map((part) => POS_LABELS[part] ?? POS_LABELS[part.replaceAll(' ', '_')] ?? part).join(' / ')
  }
  return POS_LABELS[value] ?? POS_LABELS[normalized] ?? POS_LABELS[normalized.replaceAll(' ', '_')] ?? value.replaceAll('_', ' ')
}
