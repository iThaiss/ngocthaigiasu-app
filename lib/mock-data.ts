export type UserRole = 'Student' | 'Teacher' | 'Admin'
export type UserStatus = 'Active' | 'Blocked'
export type Difficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao'
export type TransactionStatus = 'Pending' | 'Completed' | 'Failed'
export type TransactionType = 'VIPPurchase' | 'AffiliateCommission'
export type ReferralStatus = 'Pending' | 'Commissioned' | 'Invalid'
export type NotificationType = 'payment' | 'commission' | 'exam' | 'system' | 'solve'
export type ExamStatus = 'InProgress' | 'Completed' | 'Timeout'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  status: UserStatus
  school?: string
  grade?: string
  isVIP: boolean
  createdAt: string
}

export interface Question {
  id: string
  title: string
  content: string
  answer: string
  difficulty: Difficulty
  tags: string[]
  imageUrl?: string
  videoUrl?: string
  createdBy: string
  createdAt: string
  status: 'Active' | 'Inactive'
}

export interface SolutionStep {
  step: number
  description: string
  latex?: string
}

export interface StudentProgress {
  id: string
  userId: string
  imageHash: string
  question: string
  solution: SolutionStep[]
  cached: boolean
  solvedAt: string
}

export interface ExamQuestion {
  id: string
  content: string
  options: string[]
  correct: number
}

export interface ExamSession {
  id: string
  userId: string
  questions: ExamQuestion[]
  answers: Record<string, number>
  score: number
  totalQuestions: number
  startTime: string
  endTime?: string
  status: ExamStatus
  timeSpent: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  userAvatar: string
  score: number
  timeSpent: number
  completedAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  content: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  status: TransactionStatus
  createdAt: string
  packageType?: 'monthly' | 'yearly'
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  updatedAt: string
}

export interface AffiliateReferral {
  id: string
  referrerId: string
  refereeId: string
  refereeName: string
  refereeEmail: string
  status: ReferralStatus
  commission: number
  createdAt: string
}

// ─── Mock Users ──────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=An',
    role: 'Student',
    status: 'Active',
    school: 'THPT Nguyễn Huệ',
    grade: '12A1',
    isVIP: false,
    createdAt: '2024-09-01T07:00:00Z',
  },
  {
    id: 'u2',
    name: 'Trần Thị Bích',
    email: 'bich.tran@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bich',
    role: 'Teacher',
    status: 'Active',
    school: 'THPT Lê Hồng Phong',
    isVIP: true,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'u3',
    name: 'Phạm Quốc Cường',
    email: 'cuong.pham@admin.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cuong',
    role: 'Admin',
    status: 'Active',
    isVIP: true,
    createdAt: '2023-06-01T00:00:00Z',
  },
]

// ─── Mock Questions ───────────────────────────────────────────────────────────
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Tính đạo hàm của hàm số f(x) = x³ - 3x + 2',
    content: 'f(x) = x^3 - 3x + 2',
    answer: "f'(x) = 3x² - 3",
    difficulty: 'Nhận biết',
    tags: ['Giải tích', 'Đạo hàm'],
    createdBy: 'u2',
    createdAt: '2024-10-01T09:00:00Z',
    status: 'Active',
  },
  {
    id: 'q2',
    title: 'Giải phương trình lượng giác sin(2x) = √3/2',
    content: '\\sin(2x) = \\frac{\\sqrt{3}}{2}',
    answer: '2x = π/3 + 2kπ hoặc 2x = 2π/3 + 2kπ',
    difficulty: 'Thông hiểu',
    tags: ['Lượng giác', 'Phương trình'],
    createdBy: 'u2',
    createdAt: '2024-10-05T10:00:00Z',
    status: 'Active',
  },
  {
    id: 'q3',
    title: 'Tính tích phân ∫(x² + 1)dx từ 0 đến 2',
    content: '\\int_0^2 (x^2 + 1)\\,dx',
    answer: '14/3',
    difficulty: 'Vận dụng',
    tags: ['Giải tích', 'Tích phân'],
    createdBy: 'u2',
    createdAt: '2024-10-10T11:00:00Z',
    status: 'Active',
  },
  {
    id: 'q4',
    title: 'Tìm giá trị lớn nhất của hàm số y = x⁴ - 2x² + 1',
    content: 'y = x^4 - 2x^2 + 1',
    answer: 'Hàm số không có giá trị lớn nhất; giá trị nhỏ nhất là 0',
    difficulty: 'Vận dụng cao',
    tags: ['Giải tích', 'Cực trị'],
    videoUrl: 'https://example.com/video1.mp4',
    createdBy: 'u2',
    createdAt: '2024-10-15T12:00:00Z',
    status: 'Active',
  },
  {
    id: 'q5',
    title: 'Tính xác suất khi tung 2 con súc sắc được tổng bằng 7',
    content: 'P(\\text{tổng} = 7) = ?',
    answer: '1/6',
    difficulty: 'Thông hiểu',
    tags: ['Xác suất', 'Thống kê'],
    createdBy: 'u2',
    createdAt: '2024-10-20T14:00:00Z',
    status: 'Active',
  },
  {
    id: 'q6',
    title: 'Phương trình tiếp tuyến của đường tròn tại điểm (3, 4)',
    content: 'Đường tròn x^2 + y^2 = 25, tiếp tuyến tại M(3, 4)',
    answer: '3x + 4y = 25',
    difficulty: 'Vận dụng',
    tags: ['Hình học', 'Đường tròn'],
    createdBy: 'u3',
    createdAt: '2024-11-01T08:00:00Z',
    status: 'Active',
  },
  {
    id: 'q7',
    title: 'Tính số phức z = (2+3i)(1-i)',
    content: 'z = (2+3i)(1-i)',
    answer: '5 + i',
    difficulty: 'Nhận biết',
    tags: ['Số phức', 'Đại số'],
    createdBy: 'u2',
    createdAt: '2024-11-05T09:00:00Z',
    status: 'Active',
  },
  {
    id: 'q8',
    title: 'Tính giới hạn lim(x→0) sin(x)/x',
    content: '\\lim_{x \\to 0} \\frac{\\sin x}{x}',
    answer: '1',
    difficulty: 'Nhận biết',
    tags: ['Giải tích', 'Giới hạn'],
    createdBy: 'u2',
    createdAt: '2024-11-10T10:00:00Z',
    status: 'Inactive',
  },
]

// ─── Mock Exam Questions (50 câu) ────────────────────────────────────────────
const generateExamQuestions = (): ExamQuestion[] => {
  const questions: ExamQuestion[] = []
  const topics = [
    { q: 'Đạo hàm của f(x) = x² là:', options: ['2x', 'x²', '2', 'x'], correct: 0 },
    { q: 'Giá trị của sin(30°) là:', options: ['1/2', '√2/2', '√3/2', '1'], correct: 0 },
    { q: 'Tích phân ∫2x dx = ?', options: ['x² + C', 'x + C', '2x² + C', '2 + C'], correct: 0 },
    { q: 'Số phức conjugate của (3+4i) là:', options: ['3-4i', '-3+4i', '3+4i', '-3-4i'], correct: 0 },
    { q: 'log₂(8) = ?', options: ['3', '2', '4', '1'], correct: 0 },
    { q: 'Phương trình x² - 5x + 6 = 0 có nghiệm:', options: ['x=2, x=3', 'x=1, x=6', 'x=-2, x=-3', 'Vô nghiệm'], correct: 0 },
    { q: 'Diện tích hình tròn bán kính r = 5 là:', options: ['25π', '10π', '5π', '50π'], correct: 0 },
    { q: 'Thể tích hình cầu bán kính r = 3 là:', options: ['36π', '27π', '9π', '12π'], correct: 0 },
    { q: 'cos(π/3) = ?', options: ['1/2', '√3/2', '√2/2', '0'], correct: 0 },
    { q: 'tan(45°) = ?', options: ['1', '√3', '1/√3', '0'], correct: 0 },
  ]
  for (let i = 0; i < 50; i++) {
    const t = topics[i % topics.length]
    questions.push({ id: `eq${i + 1}`, content: `Câu ${i + 1}: ${t.q}`, options: t.options, correct: t.correct })
  }
  return questions
}

export const MOCK_EXAM_QUESTIONS = generateExamQuestions()

// ─── Mock Leaderboard ─────────────────────────────────────────────────────────
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u10', userName: 'Lê Minh Tú', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tu', score: 48, timeSpent: 3240, completedAt: '2024-12-01T14:30:00Z' },
  { rank: 2, userId: 'u11', userName: 'Nguyễn Khánh Linh', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Linh', score: 47, timeSpent: 3600, completedAt: '2024-12-01T15:00:00Z' },
  { rank: 3, userId: 'u12', userName: 'Trần Đức Anh', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anh', score: 46, timeSpent: 2900, completedAt: '2024-12-01T13:50:00Z' },
  { rank: 4, userId: 'u1', userName: 'Nguyễn Văn An', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=An', score: 44, timeSpent: 3100, completedAt: '2024-12-01T14:10:00Z' },
  { rank: 5, userId: 'u13', userName: 'Phạm Thu Hà', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ha', score: 43, timeSpent: 3400, completedAt: '2024-12-01T14:40:00Z' },
  { rank: 6, userId: 'u14', userName: 'Hoàng Văn Bình', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Binh', score: 42, timeSpent: 3500, completedAt: '2024-12-01T14:50:00Z' },
  { rank: 7, userId: 'u15', userName: 'Vũ Thị Châu', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chau', score: 40, timeSpent: 3600, completedAt: '2024-12-01T15:00:00Z' },
  { rank: 8, userId: 'u16', userName: 'Đặng Quang Dũng', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung', score: 39, timeSpent: 2800, completedAt: '2024-12-01T13:40:00Z' },
  { rank: 9, userId: 'u17', userName: 'Bùi Thị Hoa', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hoa', score: 38, timeSpent: 3200, completedAt: '2024-12-01T14:20:00Z' },
  { rank: 10, userId: 'u18', userName: 'Lý Minh Đức', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Duc', score: 37, timeSpent: 3550, completedAt: '2024-12-01T14:55:00Z' },
]

// ─── Mock Student Progress ────────────────────────────────────────────────────
export const MOCK_STUDENT_PROGRESS: StudentProgress[] = [
  {
    id: 'sp1',
    userId: 'u1',
    imageHash: 'abc123',
    question: 'Tính đạo hàm của f(x) = x³ - 3x + 2',
    solution: [
      { step: 1, description: 'Áp dụng công thức đạo hàm: (xⁿ)\' = n·xⁿ⁻¹', latex: "(x^n)' = n \\cdot x^{n-1}" },
      { step: 2, description: 'Đạo hàm từng hạng tử:', latex: "(x^3)' = 3x^2, \\quad (-3x)' = -3, \\quad (2)' = 0" },
      { step: 3, description: 'Kết quả cuối cùng:', latex: "f'(x) = 3x^2 - 3" },
    ],
    cached: false,
    solvedAt: '2024-12-01T09:30:00Z',
  },
  {
    id: 'sp2',
    userId: 'u1',
    imageHash: 'def456',
    question: 'Giải phương trình x² - 5x + 6 = 0',
    solution: [
      { step: 1, description: 'Tính delta: Δ = b² - 4ac', latex: "\\Delta = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1" },
      { step: 2, description: 'Tính hai nghiệm:', latex: "x = \\frac{5 \\pm 1}{2} \\Rightarrow x_1 = 3, x_2 = 2" },
    ],
    cached: true,
    solvedAt: '2024-12-01T10:15:00Z',
  },
  {
    id: 'sp3',
    userId: 'u1',
    imageHash: 'ghi789',
    question: 'Tính tích phân ∫₀² x² dx',
    solution: [
      { step: 1, description: 'Tìm nguyên hàm F(x):', latex: "F(x) = \\frac{x^3}{3} + C" },
      { step: 2, description: 'Áp dụng Newton-Leibniz:', latex: "\\int_0^2 x^2 dx = F(2) - F(0) = \\frac{8}{3} - 0 = \\frac{8}{3}" },
    ],
    cached: false,
    solvedAt: '2024-11-30T16:45:00Z',
  },
  {
    id: 'sp4',
    userId: 'u1',
    imageHash: 'jkl012',
    question: 'Tính sin(π/6)',
    solution: [
      { step: 1, description: 'Sử dụng bảng giá trị lượng giác đặc biệt:', latex: "\\sin\\left(\\frac{\\pi}{6}\\right) = \\sin(30°) = \\frac{1}{2}" },
    ],
    cached: true,
    solvedAt: '2024-11-29T14:00:00Z',
  },
  {
    id: 'sp5',
    userId: 'u1',
    imageHash: 'mno345',
    question: 'Diện tích tam giác có ba cạnh 3, 4, 5',
    solution: [
      { step: 1, description: 'Kiểm tra tam giác vuông: 3² + 4² = 5²', latex: "9 + 16 = 25 \\checkmark" },
      { step: 2, description: 'Tính diện tích tam giác vuông:', latex: "S = \\frac{1}{2} \\cdot 3 \\cdot 4 = 6" },
    ],
    cached: false,
    solvedAt: '2024-11-28T11:30:00Z',
  },
]

// ─── Mock Notifications ───────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Nâng cấp VIP thành công', content: 'Tài khoản của bạn đã được nâng cấp lên VIP trong 1 tháng.', type: 'payment', isRead: false, createdAt: '2024-12-01T10:00:00Z' },
  { id: 'n2', userId: 'u1', title: 'Hoa hồng được cộng', content: 'Bạn nhận được 10.000đ hoa hồng từ lượt giới thiệu của Lê Văn X.', type: 'commission', isRead: false, createdAt: '2024-12-01T09:30:00Z' },
  { id: 'n3', userId: 'u1', title: 'Kết quả bài thi', content: 'Bạn đạt 44/50 trong bài thi thử ngày 01/12/2024. Xếp hạng #4.', type: 'exam', isRead: true, createdAt: '2024-12-01T08:00:00Z' },
  { id: 'n4', userId: 'u1', title: 'Bài toán đã được giải', content: 'AI đã giải xong bài toán "Tính đạo hàm của f(x) = x³ - 3x + 2".', type: 'solve', isRead: true, createdAt: '2024-11-30T16:00:00Z' },
  { id: 'n5', userId: 'u1', title: 'Bảo trì hệ thống', content: 'Hệ thống sẽ bảo trì vào 2:00 - 4:00 ngày 05/12/2024.', type: 'system', isRead: true, createdAt: '2024-11-29T12:00:00Z' },
  { id: 'n6', userId: 'u1', title: 'Hoa hồng được cộng', content: 'Bạn nhận được 10.000đ hoa hồng từ lượt giới thiệu của Trần Thị Y.', type: 'commission', isRead: false, createdAt: '2024-11-28T14:00:00Z' },
  { id: 'n7', userId: 'u1', title: 'Tính năng mới', content: 'Đã ra mắt tính năng thi thử theo chủ đề. Khám phá ngay!', type: 'system', isRead: true, createdAt: '2024-11-25T09:00:00Z' },
]

// ─── Mock Transactions ────────────────────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', userId: 'u1', type: 'VIPPurchase', amount: 99000, status: 'Completed', createdAt: '2024-12-01T10:00:00Z', packageType: 'monthly' },
  { id: 'tx2', userId: 'u1', type: 'AffiliateCommission', amount: 10000, status: 'Completed', createdAt: '2024-12-01T09:30:00Z' },
  { id: 'tx3', userId: 'u1', type: 'AffiliateCommission', amount: 10000, status: 'Completed', createdAt: '2024-11-28T14:00:00Z' },
  { id: 'tx4', userId: 'u1', type: 'VIPPurchase', amount: 799000, status: 'Failed', createdAt: '2024-11-15T11:00:00Z', packageType: 'yearly' },
]

// ─── Mock Wallets ─────────────────────────────────────────────────────────────
export const MOCK_WALLETS: Wallet[] = [
  { id: 'w1', userId: 'u1', balance: 20000, updatedAt: '2024-12-01T09:30:00Z' },
  { id: 'w2', userId: 'u2', balance: 150000, updatedAt: '2024-11-20T10:00:00Z' },
  { id: 'w3', userId: 'u3', balance: 0, updatedAt: '2024-01-01T00:00:00Z' },
]

// ─── Mock Affiliate Referrals ─────────────────────────────────────────────────
export const MOCK_AFFILIATE_REFERRALS: AffiliateReferral[] = [
  { id: 'ar1', referrerId: 'u1', refereeId: 'u10', refereeName: 'Lê Văn X', refereeEmail: 'x.le@gmail.com', status: 'Commissioned', commission: 10000, createdAt: '2024-12-01T09:30:00Z' },
  { id: 'ar2', referrerId: 'u1', refereeId: 'u11', refereeName: 'Trần Thị Y', refereeEmail: 'y.tran@gmail.com', status: 'Commissioned', commission: 10000, createdAt: '2024-11-28T14:00:00Z' },
  { id: 'ar3', referrerId: 'u1', refereeId: 'u12', refereeName: 'Nguyễn Văn Z', refereeEmail: 'z.nguyen@gmail.com', status: 'Pending', commission: 0, createdAt: '2024-11-25T10:00:00Z' },
  { id: 'ar4', referrerId: 'u1', refereeId: 'u13', refereeName: 'Phạm Minh W', refereeEmail: 'w.pham@gmail.com', status: 'Invalid', commission: 0, createdAt: '2024-11-20T08:00:00Z' },
]

// ─── Mock Exam Sessions ───────────────────────────────────────────────────────
export const MOCK_EXAM_SESSIONS: Omit<ExamSession, 'questions'>[] = [
  { id: 'es1', userId: 'u1', answers: {}, score: 44, totalQuestions: 50, startTime: '2024-12-01T07:00:00Z', endTime: '2024-12-01T08:30:00Z', status: 'Completed', timeSpent: 3100 },
  { id: 'es2', userId: 'u1', answers: {}, score: 38, totalQuestions: 50, startTime: '2024-11-25T07:00:00Z', endTime: '2024-11-25T08:30:00Z', status: 'Completed', timeSpent: 3600 },
  { id: 'es3', userId: 'u1', answers: {}, score: 41, totalQuestions: 50, startTime: '2024-11-18T07:00:00Z', endTime: '2024-11-18T08:20:00Z', status: 'Completed', timeSpent: 3200 },
]
