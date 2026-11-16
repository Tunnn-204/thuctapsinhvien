import { Registration, addDays, parseISODate, toISODate, ADVISORS } from './registration'

export type Actor = 'student' | 'mentor' | 'advisor' | 'system'

export type WeekFields = {
  content: string
  results: string
  nextPlan: string
  hours: string
  attachmentName: string
  attachmentSize: number
}

export type Feedback = {
  id: string
  at: string
  by: 'mentor' | 'advisor'
  decision: 'confirmed' | 'revision'
  comment: string
  score?: number
  /** Lần nộp mà phản hồi này áp dụng */
  submissionNo: number
}

export type HistoryItem = { at: string; actor: Actor; text: string }

export type WeekLog = {
  weekNo: number
  fields: WeekFields
  submissionNo: number
  late: boolean
  submittedAt?: string
  versions: { no: number; at: string; late: boolean; snapshot: WeekFields }[]
  feedbacks: Feedback[]
  history: HistoryItem[]
}

export type Incident = {
  id: string
  weekNo: number
  category: string
  text: string
  at: string
  guidance?: string
  guidanceAt?: string
}

export type DiaryAlert = {
  id: string
  key: string
  kind: 'late' | 'overdue' | 'incident'
  weekNo: number
  at: string
  text: string
}

export type Diary = {
  /** Số ngày lệch của đồng hồ giả lập (chỉ dùng cho demo) */
  clockOffset: number
  weeks: Record<string, WeekLog>
  incidents: Incident[]
  alerts: DiaryAlert[]
  reminders: string[]
}

export const EMPTY_DIARY: Diary = { clockOffset: 0, weeks: {}, incidents: [], alerts: [], reminders: [] }

export const EMPTY_FIELDS: WeekFields = { content: '', results: '', nextPlan: '', hours: '', attachmentName: '', attachmentSize: 0 }

export type WeekInfo = { no: number; start: Date; end: Date; deadline: Date }

export function weeksOf(reg: Registration): WeekInfo[] {
  const start = parseISODate(reg.startDate)
  const end = parseISODate(reg.endDate)
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const n = Math.ceil(days / 7)
  return Array.from({ length: n }, (_, i) => {
    const s = addDays(reg.startDate, i * 7)
    const e = i === n - 1 ? end : addDays(reg.startDate, i * 7 + 6)
    const deadline = new Date(e)
    deadline.setHours(23, 59, 59, 999)
    return { no: i + 1, start: s, end: e, deadline }
  })
}

export type WeekStatus = 'future' | 'todo' | 'draft' | 'overdue' | 'submitted' | 'revision' | 'done'

export const currentFeedbacks = (log?: WeekLog) => (log ? log.feedbacks.filter((f) => f.submissionNo === log.submissionNo) : [])

export function weekStatus(w: WeekInfo, log: WeekLog | undefined, now: Date): WeekStatus {
  if (log && log.submissionNo > 0) {
    const fb = currentFeedbacks(log)
    if (fb.some((f) => f.decision === 'revision')) return 'revision'
    if (fb.some((f) => f.by === 'mentor') && fb.some((f) => f.by === 'advisor')) return 'done'
    return 'submitted'
  }
  if (now < w.start) return 'future'
  if (now > w.deadline) return 'overdue'
  return log && log.fields.content ? 'draft' : 'todo'
}

export const WEEK_STATUS_META: Record<WeekStatus, { label: string; cls: string }> = {
  future: { label: 'Chưa đến tuần', cls: 'bg-stone-100 text-stone-500 ring-stone-200' },
  todo: { label: 'Chưa nộp', cls: 'bg-vlu-50 text-vlu-700 ring-vlu-200' },
  draft: { label: 'Bản nháp', cls: 'bg-stone-100 text-stone-700 ring-stone-300' },
  overdue: { label: 'Quá hạn', cls: 'bg-rose-50 text-rose-800 ring-rose-200' },
  submitted: { label: 'Chờ phản hồi', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  revision: { label: 'Cần chỉnh sửa', cls: 'bg-orange-50 text-orange-800 ring-orange-200' },
  done: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
}

export const weekScore = (log?: WeekLog) => currentFeedbacks(log).find((f) => f.by === 'advisor' && f.decision === 'confirmed')?.score

export function avgScore(logs: (WeekLog | undefined)[]) {
  const s = logs.map(weekScore).filter((x): x is number => typeof x === 'number')
  return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null
}

export type WeekErrors = Partial<Record<keyof WeekFields, string>>

export function validateWeek(f: WeekFields): WeekErrors {
  const e: WeekErrors = {}
  if (f.content.trim().length < 20) e.content = 'Vui lòng mô tả công việc đã thực hiện trong tuần (tối thiểu 20 ký tự).'
  if (!f.results.trim()) e.results = 'Vui lòng nêu kết quả đạt được hoặc khó khăn gặp phải.'
  const h = Number(f.hours)
  if (!f.hours.trim() || Number.isNaN(h) || h <= 0 || h > 60) e.hours = 'Số giờ làm việc phải từ 1 đến 60.'
  return e
}

export const sameFields = (a: WeekFields, b: WeekFields) => JSON.stringify(a) === JSON.stringify(b)

export const ATTACH_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip']
export const ATTACH_MAX_MB = 10

export const INCIDENT_CATEGORIES = [
  'Công việc / nhiệm vụ được giao',
  'Không thể đến đơn vị (lịch, sức khỏe, lý do cá nhân)',
  'Vấn đề với người hướng dẫn hoặc môi trường làm việc',
  'Thiếu công cụ, quyền truy cập hoặc tài liệu',
  'Khác',
]

export const MENTOR_OK = [
  'Em hoàn thành tốt các nhiệm vụ được giao, chủ động trao đổi khi gặp vướng mắc.',
  'Nội dung báo cáo đúng với thực tế công việc trong tuần. Tiếp tục phát huy.',
]
export const MENTOR_REVISION = [
  'Nội dung báo cáo còn chung chung, em bổ sung cụ thể đầu việc và kết quả đo lường được.',
  'Số giờ làm việc chưa khớp với bảng chấm công, em kiểm tra và cập nhật lại.',
]
export const ADVISOR_OK = [
  'Báo cáo rõ ràng, bám sát đề cương thực tập. Em cần chú ý hơn đến việc nêu bài học rút ra.',
  'Tiến độ tốt, kỹ năng chuyên môn cải thiện rõ rệt qua từng tuần.',
]
export const ADVISOR_REVISION = [
  'Phần kế hoạch tuần tới còn sơ sài, em bổ sung mục tiêu cụ thể và thời gian dự kiến.',
  'Em cần liên hệ thêm minh chứng công việc (ảnh chụp, file sản phẩm) để GVHD đối chiếu.',
]
export const GUIDANCES = [
  'Em trao đổi trực tiếp với người hướng dẫn tại doanh nghiệp để thống nhất lại nhiệm vụ, đồng thời ghi nhận nội dung đã trao đổi vào nhật ký tuần. GVHD sẽ liên hệ doanh nghiệp nếu cần.',
  'Em báo cáo bổ sung lý do vắng mặt kèm xác nhận của đơn vị, và đề xuất kế hoạch bù thời gian trong tuần kế tiếp. Liên hệ GVHD qua email nếu cần hỗ trợ thêm.',
]

/** Dữ liệu minh họa: sinh viên đã được duyệt, có GVHD và đang thực tập ở tuần thứ 4 */
export function buildDemoInternship(user: { fullName: string; email: string }) {
  const id = () => Math.random().toString(36).slice(2, 10)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = toISODate(new Date(today.getTime() - 22 * 86400000))
  const endDate = toISODate(new Date(today.getTime() + 62 * 86400000))
  const at = (day: number, hour = 20) => {
    const d = new Date(parseISODate(startDate))
    d.setDate(d.getDate() + day)
    d.setHours(hour, 15, 0, 0)
    return d.toISOString()
  }
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
  const appId = id()
  const regId = id()
  const advisor = ADVISORS[0]
  const fields = (content: string, results: string, hours: string): WeekFields => ({
    content, results, nextPlan: 'Tiếp tục hoàn thiện đầu việc đang thực hiện và nhận nhiệm vụ mới từ người hướng dẫn.', hours, attachmentName: '', attachmentSize: 0,
  })
  const f1 = fields('Làm quen quy trình làm việc, tìm hiểu bộ nhận diện thương hiệu của khách hàng, tham gia họp kickoff chiến dịch.', 'Nắm được quy trình duyệt nội dung và hoàn thành 2 bài viết thử nghiệm.', '40')
  const f2 = fields('Viết 5 bài blog chuẩn SEO cho khách hàng F&B, nghiên cứu từ khóa và lên lịch đăng.', 'Hoàn thành 5/6 bài, 1 bài chờ duyệt thêm từ khách hàng.', '38')
  const f3 = fields('Xây dựng kịch bản cho 3 video ngắn và hỗ trợ dựng nội dung đăng fanpage.', 'Hoàn thành kịch bản, 2/3 video đã được duyệt.', '42')

  const log1: WeekLog = {
    weekNo: 1, fields: f1, submissionNo: 1, late: false, submittedAt: at(5),
    versions: [{ no: 1, at: at(5), late: false, snapshot: f1 }],
    feedbacks: [
      { id: id(), at: at(6, 9), by: 'mentor', decision: 'confirmed', comment: MENTOR_OK[0], submissionNo: 1 },
      { id: id(), at: at(8, 10), by: 'advisor', decision: 'confirmed', comment: ADVISOR_OK[0], score: 8.5, submissionNo: 1 },
    ],
    history: [
      { at: at(8, 10), actor: 'advisor', text: 'GVHD nhận xét và chấm điểm quá trình: 8.5/10' },
      { at: at(6, 9), actor: 'mentor', text: 'Người hướng dẫn tại DN xác nhận báo cáo' },
      { at: at(5), actor: 'student', text: 'Nộp báo cáo tuần 1 (đúng hạn)' },
    ],
  }
  const log2: WeekLog = {
    weekNo: 2, fields: f2, submissionNo: 1, late: true, submittedAt: at(15),
    versions: [{ no: 1, at: at(15), late: true, snapshot: f2 }],
    feedbacks: [
      { id: id(), at: at(16, 9), by: 'mentor', decision: 'confirmed', comment: MENTOR_OK[1], submissionNo: 1 },
      { id: id(), at: at(17, 14), by: 'advisor', decision: 'revision', comment: ADVISOR_REVISION[1], submissionNo: 1 },
    ],
    history: [
      { at: at(17, 14), actor: 'advisor', text: 'GVHD yêu cầu chỉnh sửa báo cáo' },
      { at: at(16, 9), actor: 'mentor', text: 'Người hướng dẫn tại DN xác nhận báo cáo' },
      { at: at(15), actor: 'system', text: 'Hệ thống gửi cảnh báo nộp trễ hạn đến GVHD và nhắc nhở sinh viên' },
      { at: at(15), actor: 'student', text: 'Nộp báo cáo tuần 2 (trễ hạn)' },
    ],
  }
  const log3: WeekLog = {
    weekNo: 3, fields: f3, submissionNo: 1, late: false, submittedAt: at(19),
    versions: [{ no: 1, at: at(19), late: false, snapshot: f3 }],
    feedbacks: [{ id: id(), at: at(20, 9), by: 'mentor', decision: 'confirmed', comment: MENTOR_OK[0], submissionNo: 1 }],
    history: [
      { at: at(20, 9), actor: 'mentor', text: 'Người hướng dẫn tại DN xác nhận báo cáo' },
      { at: at(19), actor: 'student', text: 'Nộp báo cáo tuần 3 (đúng hạn)' },
    ],
  }
  const incidentId = id()
  const diary: Diary = {
    clockOffset: 0,
    weeks: { 1: log1, 2: log2, 3: log3 },
    incidents: [{ id: incidentId, weekNo: 3, category: INCIDENT_CATEGORIES[3], text: 'Chưa được cấp quyền truy cập công cụ quản lý lịch đăng bài nên phải nhờ đồng nghiệp đăng hộ, ảnh hưởng tiến độ.', at: at(18, 15) }],
    alerts: [
      { id: id(), key: 'late-2', kind: 'late', weekNo: 2, at: at(15), text: 'Sinh viên nộp báo cáo tuần 2 trễ hạn.' },
      { id: id(), key: `incident-${incidentId}`, kind: 'incident', weekNo: 3, at: at(18, 15), text: 'Sinh viên báo cáo sự cố ở tuần 3.' },
    ],
    reminders: [],
  }
  const application = {
    id: appId, jobId: 'j4', status: 'approved' as const, createdAt: ago(60), updatedAt: ago(52), fullName: user.fullName, email: user.email,
    phone: '0912888777', coverLetter: '', cvName: 'CV_TranThuyLinh.pdf', cvSize: 380000,
  }
  const registration: Registration = {
    id: regId, roundId: 'r1', source: 'system', applicationId: appId,
    companyName: 'Sao Mai Digital', companyAddress: 'Quận 3, TP.HCM', position: 'Thực tập sinh Content Marketing',
    startDate, endDate, mentorName: 'Lê Thu Hà', mentorTitle: 'Content Lead', mentorPhone: '0938556221', mentorEmail: 'ha.le@saomaidigital.vn',
    evidenceName: '', evidenceSize: 0, note: '', status: 'approved', createdAt: ago(40), updatedAt: ago(26), submittedAt: ago(38), advisor,
    history: [
      { at: ago(26), text: `Phân công GVHD: ${advisor.name}` },
      { at: ago(30), text: 'Ban chủ nhiệm Khoa đã duyệt hồ sơ' },
      { at: ago(38), text: 'Gửi đăng ký cho Khoa, chờ phê duyệt' },
      { at: ago(40), text: 'Tạo hồ sơ đăng ký (bản nháp)' },
    ],
  }
  const notices = [
    { id: id(), kind: 'revision' as const, href: '/diary/2', title: 'GVHD yêu cầu chỉnh sửa báo cáo tuần 2', body: 'Em cần cập nhật lại báo cáo tuần 2 theo nhận xét của GVHD.', createdAt: ago(5), read: false },
    { id: id(), kind: 'warning' as const, href: '/diary/2', title: 'Báo cáo tuần 2 nộp trễ hạn', body: 'Hệ thống đã gửi cảnh báo đến GVHD. Vui lòng chủ động trao đổi với GVHD.', createdAt: ago(7), read: true },
  ]
  return { application, registration, diary, notices }
}
