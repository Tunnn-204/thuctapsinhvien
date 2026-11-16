export type RegStatus = 'draft' | 'pending' | 'revision' | 'approved'
export type RegSource = 'system' | 'self'

export type Advisor = {
  name: string
  title: string
  email: string
  phone: string
  office: string
}

export type RegInput = {
  source: RegSource
  applicationId?: string
  companyName: string
  companyAddress: string
  position: string
  startDate: string
  endDate: string
  mentorName: string
  mentorTitle: string
  mentorPhone: string
  mentorEmail: string
  evidenceName: string
  evidenceSize: number
  note: string
}

export type Registration = RegInput & {
  id: string
  roundId: string
  status: RegStatus
  createdAt: string
  updatedAt: string
  submittedAt?: string
  revisionNote?: string
  /** Ảnh chụp nội dung hồ sơ tại thời điểm Khoa yêu cầu chỉnh sửa (BR4) */
  revisionBaseline?: string
  advisor?: Advisor
  history: { at: string; text: string }[]
}

export const ROUND = {
  id: 'r1',
  name: 'Đợt 1 · Học kỳ 1 năm học 2026–2027',
  portalOpenOffset: -7,
  portalCloseOffset: 10,
  startOffset: 21,
  endOffset: 133,
  minDays: 56,
}

const dayOffset = (n: number, endOfDay = false) => {
  const d = new Date()
  d.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

export function roundDates() {
  return {
    portalOpen: dayOffset(ROUND.portalOpenOffset),
    portalClose: dayOffset(ROUND.portalCloseOffset, true),
    start: dayOffset(ROUND.startOffset),
    end: dayOffset(ROUND.endOffset),
  }
}

export type PortalState = 'open' | 'upcoming' | 'closed'

export function portalState(forceClosed: boolean): PortalState {
  if (forceClosed) return 'closed'
  const { portalOpen, portalClose } = roundDates()
  const now = Date.now()
  if (now < portalOpen.getTime()) return 'upcoming'
  if (now > portalClose.getTime()) return 'closed'
  return 'open'
}

export const toISODate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const parseISODate = (s: string) => new Date(s + 'T00:00:00')

export const addDays = (s: string, n: number) => {
  const d = parseISODate(s)
  d.setDate(d.getDate() + n)
  return d
}

export const EVIDENCE_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
export const EVIDENCE_MAX_MB = 5

export const ADVISORS: Advisor[] = [
  { name: 'ThS. Phạm Hoài Nam', title: 'Giảng viên bộ môn', email: 'nam.ph@vanlanguni.vn', phone: '0903 112 458', office: 'Phòng B.402 · Cơ sở 3' },
  { name: 'TS. Võ Thanh Hương', title: 'Phó trưởng bộ môn', email: 'huong.vt@vanlanguni.vn', phone: '0908 227 931', office: 'Phòng B.405 · Cơ sở 3' },
  { name: 'ThS. Đặng Minh Khoa', title: 'Giảng viên', email: 'khoa.dm@vanlanguni.vn', phone: '0912 345 678', office: 'Phòng A.301 · Cơ sở 1' },
]

export const REVISION_REQUESTS = [
  'Thông tin người hướng dẫn tại doanh nghiệp chưa đầy đủ. Vui lòng bổ sung chức danh và số điện thoại liên hệ trực tiếp.',
  'Thời gian thực tập chưa phù hợp với kế hoạch của đợt. Vui lòng điều chỉnh ngày bắt đầu và kết thúc, đảm bảo tối thiểu 8 tuần.',
  'Giấy tiếp nhận / minh chứng chưa rõ nét hoặc thiếu dấu xác nhận của doanh nghiệp. Vui lòng đính kèm lại bản đầy đủ.',
]

export const facultyOf = (major: string) => `Khoa ${major}`

export function formatDateISO(s: string) {
  return parseISODate(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function pickEditable(r: RegInput): RegInput {
  const { source, applicationId, companyName, companyAddress, position, startDate, endDate, mentorName, mentorTitle, mentorPhone, mentorEmail, evidenceName, evidenceSize, note } = r
  return { source, applicationId, companyName, companyAddress, position, startDate, endDate, mentorName, mentorTitle, mentorPhone, mentorEmail, evidenceName, evidenceSize, note }
}

export type RegErrors = Partial<Record<keyof RegInput, string>>

/** Kiểm tra dữ liệu bắt buộc của hồ sơ trước khi gửi Khoa */
export function validateReg(r: RegInput): RegErrors {
  const e: RegErrors = {}
  const need = (k: keyof RegInput, msg: string) => {
    if (!String(r[k] ?? '').trim()) e[k] = msg
  }
  if (r.source === 'self') {
    need('companyName', 'Vui lòng nhập tên doanh nghiệp.')
    need('companyAddress', 'Vui lòng nhập địa chỉ doanh nghiệp.')
    need('position', 'Vui lòng nhập vị trí thực tập.')
    if (!r.evidenceName) e.evidenceName = 'Doanh nghiệp tự tìm bắt buộc đính kèm giấy tiếp nhận thực tập.'
  }
  need('startDate', 'Chọn ngày bắt đầu.')
  need('endDate', 'Chọn ngày kết thúc.')
  const d = roundDates()
  if (r.startDate && r.endDate) {
    const s = parseISODate(r.startDate)
    const en = parseISODate(r.endDate)
    if (s < d.start || en > d.end) {
      e.startDate = `Thời gian thực tập phải nằm trong khoảng ${formatDateISO(toISODate(d.start))} – ${formatDateISO(toISODate(d.end))} của đợt.`
    } else if (en <= s) {
      e.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.'
    } else if ((en.getTime() - s.getTime()) / 86400000 < ROUND.minDays) {
      e.endDate = `Thời gian thực tập tối thiểu ${ROUND.minDays / 7} tuần.`
    }
  }
  need('mentorName', 'Vui lòng nhập họ tên người hướng dẫn.')
  need('mentorTitle', 'Vui lòng nhập chức danh.')
  if (!r.mentorPhone.trim()) e.mentorPhone = 'Vui lòng nhập số điện thoại.'
  else if (!/^(0|\+84)\d{9}$/.test(r.mentorPhone.replace(/[\s.]/g, ''))) e.mentorPhone = 'Số điện thoại không hợp lệ.'
  if (!r.mentorEmail.trim()) e.mentorEmail = 'Vui lòng nhập email.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.mentorEmail.trim())) e.mentorEmail = 'Email không hợp lệ.'
  return e
}

export function scheduleFor(r: Registration) {
  const mid = new Date((parseISODate(r.startDate).getTime() + parseISODate(r.endDate).getTime()) / 2)
  return [
    { date: addDays(r.startDate, -3), title: 'Gặp GVHD, thống nhất đề cương và kế hoạch thực tập' },
    { date: parseISODate(r.startDate), title: 'Bắt đầu thực tập tại đơn vị' },
    { date: addDays(r.startDate, 28), title: 'Báo cáo tiến độ lần 1 với GVHD' },
    { date: mid, title: 'Nộp nhật ký thực tập giữa kỳ, GVHD đánh giá' },
    { date: addDays(r.endDate, -7), title: 'Nộp báo cáo thực tập cuối kỳ' },
    { date: parseISODate(r.endDate), title: 'Kết thúc thực tập, doanh nghiệp gửi phiếu đánh giá' },
  ]
}
