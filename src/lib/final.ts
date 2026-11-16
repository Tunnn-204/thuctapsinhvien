import { Registration, addDays, parseISODate } from './registration'
import { Diary, WeekLog, avgScore, weekStatus, weeksOf } from './diary'

export type FinalFields = {
  title: string
  summary: string
  reportName: string
  reportSize: number
  appendixName: string
  appendixSize: number
}

export type FinalReview = {
  id: string
  at: string
  decision: 'confirmed' | 'revision'
  comment: string
  /** Các mục GVHD yêu cầu chỉnh sửa (khi decision = revision) */
  items: string[]
  submissionNo: number
}

export type FinalReport = {
  fields: FinalFields
  submissionNo: number
  submittedAt: string
  versions: { no: number; at: string; snapshot: FinalFields }[]
  reviews: FinalReview[]
  history: { at: string; actor: 'student' | 'advisor' | 'mentor' | 'system'; text: string }[]
}

export type MentorEval = {
  at: string
  criteria: { label: string; score: number }[]
  score: number
  comment: string
}

export type Grading = {
  at: string
  advisorScore: number
  advisorComment: string
  /** Ảnh chụp các thành phần điểm tại thời điểm tổng hợp (BR4) */
  processScore: number | null
  mentorScore: number | null
  total: number
  rank: string
  passed: boolean
}

export type Message = { id: string; from: 'student' | 'advisor' | 'faculty'; to?: 'advisor' | 'faculty'; text: string; at: string }

export type FinalState = {
  report?: FinalReport
  mentorEval?: MentorEval
  grading?: Grading
  messages: Message[]
}

export const EMPTY_FINAL: FinalState = { messages: [] }
export const EMPTY_FINAL_FIELDS: FinalFields = { title: '', summary: '', reportName: '', reportSize: 0, appendixName: '', appendixSize: 0 }

// Quy chuẩn định dạng file báo cáo cuối kỳ của Nhà trường
export const REPORT_EXT = ['pdf']
export const REPORT_MAX_MB = 20
export const APPENDIX_EXT = ['pdf', 'docx', 'xlsx', 'zip', 'jpg', 'png']
export const APPENDIX_MAX_MB = 20

export const WEIGHTS = { process: 0.3, mentor: 0.3, advisor: 0.4 }
export const PORTAL_DAYS = 14

export const MENTOR_CRITERIA = ['Tinh thần, thái độ làm việc', 'Kiến thức và kỹ năng chuyên môn', 'Kỷ luật và chuyên cần', 'Làm việc nhóm và giao tiếp', 'Mức độ hoàn thành công việc']

export function finalWindow(reg: Registration) {
  const open = parseISODate(reg.endDate)
  const close = addDays(reg.endDate, PORTAL_DAYS)
  close.setHours(23, 59, 59, 999)
  return { open, close }
}

export type FinalGates = {
  ended: boolean
  diaryDone: number
  diaryTotal: number
  diaryComplete: boolean
  portal: 'upcoming' | 'open' | 'closed'
  window: { open: Date; close: Date }
}

/** BR1 + BR2: điều kiện để nộp báo cáo cuối kỳ */
export function finalGates(reg: Registration, diary: Diary, now: Date): FinalGates {
  const weeks = weeksOf(reg)
  const done = weeks.filter((w) => {
    const s = weekStatus(w, diary.weeks[w.no], now)
    return s === 'submitted' || s === 'done'
  }).length
  const end = parseISODate(reg.endDate)
  end.setHours(23, 59, 59, 999)
  const window = finalWindow(reg)
  return {
    ended: now > end,
    diaryDone: done,
    diaryTotal: weeks.length,
    diaryComplete: done === weeks.length,
    portal: now < window.open ? 'upcoming' : now > window.close ? 'closed' : 'open',
    window,
  }
}

export type FinalStatus = 'none' | 'submitted' | 'revision' | 'accepted' | 'graded'

export function finalStatus(s: FinalState): FinalStatus {
  if (s.grading) return 'graded'
  const r = s.report
  if (!r) return 'none'
  const last = r.reviews.find((x) => x.submissionNo === r.submissionNo)
  if (!last) return 'submitted'
  return last.decision === 'revision' ? 'revision' : 'accepted'
}

export const FINAL_STATUS_META: Record<FinalStatus, { label: string; cls: string }> = {
  none: { label: 'Chưa nộp', cls: 'bg-stone-100 text-stone-600 ring-stone-200' },
  submitted: { label: 'Chờ GVHD kiểm tra', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  revision: { label: 'Cần chỉnh sửa', cls: 'bg-orange-50 text-orange-800 ring-orange-200' },
  accepted: { label: 'Đạt yêu cầu · chờ chấm điểm', cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  graded: { label: 'Đã công bố kết quả', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
}

export const rankOf = (t: number) => (t >= 9 ? 'Xuất sắc' : t >= 8 ? 'Giỏi' : t >= 7 ? 'Khá' : t >= 5 ? 'Trung bình' : 'Không đạt')

/** BR4: tổng hợp điểm từ điểm quá trình, phiếu đánh giá DN và điểm chấm GVHD (chuẩn hóa nếu thiếu thành phần) */
export function computeTotal(process: number | null, mentor: number | null, advisor: number) {
  const parts: [number | null, number][] = [[process, WEIGHTS.process], [mentor, WEIGHTS.mentor], [advisor, WEIGHTS.advisor]]
  const used = parts.filter((p): p is [number, number] => p[0] !== null)
  const w = used.reduce((a, [, x]) => a + x, 0)
  const total = used.reduce((a, [s, x]) => a + s * x, 0) / w
  return Math.round(total * 10) / 10
}

export const processAvg = (diary: Diary, reg: Registration) => avgScore(weeksOf(reg).map((w) => diary.weeks[w.no] as WeekLog | undefined))

export const finalSameFiles = (a: FinalFields, b: FinalFields) => a.reportName === b.reportName && a.reportSize === b.reportSize

export type FinalErrors = Partial<Record<keyof FinalFields, string>>

export function validateFinal(f: FinalFields): FinalErrors {
  const e: FinalErrors = {}
  if (!f.title.trim()) e.title = 'Vui lòng nhập tên đề tài / tiêu đề báo cáo.'
  if (f.summary.trim().length < 50) e.summary = 'Tóm tắt nội dung tối thiểu 50 ký tự.'
  if (!f.reportName) e.reportName = 'Vui lòng tải lên file báo cáo tổng kết (PDF).'
  return e
}

export const REVISION_ITEMS = [
  'Chương 2: Bổ sung mô tả chi tiết quy trình làm việc tại đơn vị thực tập.',
  'Chương 3: Cần thêm số liệu, minh chứng cụ thể cho kết quả đạt được.',
  'Mục tài liệu tham khảo chưa đúng chuẩn trích dẫn của Nhà trường.',
  'Phần kết luận và bài học kinh nghiệm còn sơ sài, cần viết lại.',
  'Trang bìa và mục lục chưa đúng mẫu quy định.',
]
export const REVIEW_OK = ['Báo cáo đáp ứng yêu cầu về nội dung và hình thức theo quy định.', 'Báo cáo đạt yêu cầu, trình bày rõ ràng, bố cục hợp lý.']
export const MENTOR_COMMENTS = ['Sinh viên nghiêm túc, chủ động học hỏi và hoàn thành tốt công việc được giao. Doanh nghiệp sẵn sàng nhận lại em trong các đợt sau.', 'Em có tinh thần trách nhiệm cao, tiếp thu nhanh và phối hợp tốt với đồng nghiệp trong suốt kỳ thực tập.']
export const GRADING_COMMENTS = ['Báo cáo có chiều sâu, thể hiện rõ quá trình học hỏi và áp dụng kiến thức vào thực tế. Em cần phát huy thêm kỹ năng phân tích số liệu.', 'Em hoàn thành tốt kỳ thực tập, báo cáo trình bày mạch lạc. Nên đầu tư hơn vào phần đề xuất cải tiến.']

export const GUIDE_DOCS = [
  { id: 'rules', name: 'Quy định nộp báo cáo thực tập cuối kỳ', file: 'QuyDinh_BaoCaoCuoiKy.txt' },
  { id: 'template', name: 'Mẫu báo cáo thực tập tổng kết', file: 'Mau_BaoCaoTongKet.txt' },
  { id: 'grading', name: 'Thang điểm và cách tính điểm tổng kết', file: 'CachTinhDiem_ThucTap.txt' },
]

export function guideText(id: string, reg: Registration) {
  const close = finalWindow(reg).close.toLocaleDateString('vi-VN')
  if (id === 'rules')
    return [
      'QUY ĐỊNH NỘP BÁO CÁO THỰC TẬP CUỐI KỲ',
      '',
      '1. Điều kiện nộp: đã hoàn thành kỳ thực tập tại doanh nghiệp và cập nhật đầy đủ nhật ký các tuần.',
      `2. Thời gian: cổng thu bài mở từ ngày kết thúc thực tập đến hết ngày ${close}.`,
      `3. Định dạng: báo cáo chính là file PDF, tối đa ${REPORT_MAX_MB} MB. Phụ lục (nếu có): ${APPENDIX_EXT.join(', ').toUpperCase()}, tối đa ${APPENDIX_MAX_MB} MB.`,
      '4. Đặt tên file khuyến nghị: BCTT_<MSSV>_<HoVaTen>.pdf',
      '5. Khi GVHD đánh giá "Cần chỉnh sửa", sinh viên nộp lại file báo cáo mới.',
    ].join('\n')
  if (id === 'template')
    return ['MẪU BÁO CÁO THỰC TẬP TỔNG KẾT', '', 'Trang bìa', 'Mục lục', 'Chương 1. Giới thiệu đơn vị thực tập', 'Chương 2. Nội dung và quy trình công việc', 'Chương 3. Kết quả đạt được', 'Chương 4. Bài học kinh nghiệm và đề xuất', 'Kết luận', 'Tài liệu tham khảo', 'Phụ lục'].join('\n')
  return [
    'CÁCH TÍNH ĐIỂM TỔNG KẾT HỌC PHẦN THỰC TẬP',
    '',
    `- Điểm quá trình (trung bình điểm các tuần do GVHD chấm): ${WEIGHTS.process * 100}%`,
    `- Phiếu đánh giá của Doanh nghiệp / Người hướng dẫn tại DN: ${WEIGHTS.mentor * 100}%`,
    `- Điểm chấm báo cáo tổng kết của GVHD: ${WEIGHTS.advisor * 100}%`,
    '',
    'Xếp loại: >= 9.0 Xuất sắc; >= 8.0 Giỏi; >= 7.0 Khá; >= 5.0 Trung bình; < 5.0 Không đạt.',
  ].join('\n')
}
