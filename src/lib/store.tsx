import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ALLOWED_DOMAINS, JOBS, Job, REJECT_REASONS, STUDENTS, StudentAccount } from './data'
import { companyOf, deadlineDate } from './utils'
import { Diary, EMPTY_DIARY, Feedback, HistoryItem, Incident, WeekFields, WeekLog, WeekInfo, weeksOf, weekStatus, validateWeek, sameFields, currentFeedbacks, MENTOR_OK, MENTOR_REVISION, ADVISOR_OK, ADVISOR_REVISION, GUIDANCES } from './diary'
import { EMPTY_FINAL, FinalFields, FinalState, FinalReview, MentorEval, Grading, Message, MENTOR_CRITERIA, MENTOR_COMMENTS, GRADING_COMMENTS, REVIEW_OK, REVISION_ITEMS, computeTotal, finalGates, finalStatus, finalSameFiles, processAvg, rankOf, validateFinal, finalWindow } from './final'
import { ADVISORS, REVISION_REQUESTS, RegInput, Registration, ROUND, PortalState, portalState, pickEditable, validateReg } from './registration'

export type AppStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type Application = {
  id: string
  jobId: string
  status: AppStatus
  createdAt: string
  updatedAt: string
  fullName: string
  email: string
  phone: string
  coverLetter: string
  cvName: string
  cvSize: number
  rejectReason?: string
}

export type Notice = {
  id: string
  applicationId?: string
  kind: 'approved' | 'rejected' | 'info' | 'revision' | 'warning'
  href?: string
  title: string
  body: string
  createdAt: string
  read: boolean
}

export type ApplyForm = {
  fullName: string
  email: string
  phone: string
  coverLetter: string
  cvName: string
  cvSize: number
}

export type Profile = {
  fullName: string
  dob: string
  gender: '' | 'Nam' | 'Nữ' | 'Khác'
  phone: string
  contactEmail: string
  address: string
  website: string
  skills: string[]
  bio: string
  avatar: string
  notifyEmail: boolean
}

export const EMPTY_PROFILE: Profile = { fullName: '', dob: '', gender: '', phone: '', contactEmail: '', address: '', website: '', skills: [], bio: '', avatar: '', notifyEmail: true }

type UserData = { applications: Application[]; notices: Notice[]; registrations: Registration[]; portalClosed: boolean; diary: Diary; final: FinalState; profile: Profile }
const EMPTY: UserData = { applications: [], notices: [], registrations: [], portalClosed: false, diary: EMPTY_DIARY, final: EMPTY_FINAL, profile: EMPTY_PROFILE }
type Toast = { id: string; text: string }

export type JobState = 'open' | 'expired' | 'full'

type Ctx = {
  user: StudentAccount | null
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
  applications: Application[]
  notices: Notice[]
  unread: number
  toasts: Toast[]
  slotsLeft: (job: Job) => number
  jobState: (job: Job) => JobState
  applicationFor: (jobId: string) => Application | undefined
  submitApplication: (jobId: string, form: ApplyForm) => { ok: true } | { ok: false; error: string }
  cancelApplication: (id: string) => void
  simulateEmployer: (id: string, decision: 'approved' | 'rejected') => void
  markRead: (id: string) => void
  markAllRead: () => void
  registrations: Registration[]
  portal: PortalState
  setPortalClosed: (closed: boolean) => void
  /** Hồ sơ UA1 đã được doanh nghiệp duyệt và chưa dùng để đăng ký với Khoa */
  approvedSources: Application[]
  saveRegistration: (input: RegInput, id?: string, submit?: boolean) => { ok: true; id: string } | { ok: false; error: string }
  deleteRegistration: (id: string) => { ok: true } | { ok: false; error: string }
  simulateFaculty: (id: string, decision: 'approved' | 'revision') => void
  assignAdvisor: (id: string) => void
  // ---- UA3: nhật ký & tiến độ ----
  /** Hồ sơ đã được Khoa duyệt và đã phân công GVHD (điều kiện mở chức năng nhật ký) */
  diaryReg?: Registration
  diary: Diary
  diaryNow: Date
  setClockOffset: (days: number) => void
  saveWeek: (weekNo: number, fields: WeekFields, submit: boolean) => { ok: true } | { ok: false; error: string }
  reportIncident: (weekNo: number, category: string, text: string) => { ok: true } | { ok: false; error: string }
  simulateFeedback: (weekNo: number, by: 'mentor' | 'advisor', decision: 'confirmed' | 'revision') => void
  giveGuidance: (incidentId: string) => void
  // ---- UA4: báo cáo cuối kỳ & kết quả ----
  final: FinalState
  submitFinal: (fields: FinalFields) => { ok: true } | { ok: false; error: string }
  sendMessage: (to: 'advisor' | 'faculty', text: string) => void
  simulateFinalReview: (decision: 'confirmed' | 'revision') => void
  simulateMentorEval: () => void
  simulateGrading: () => void
  simulateReply: () => void
  completeInternshipDemo: () => void
}

const DATA_KEY = 'vlu-internship-data-v1'
const SESSION_KEY = 'vlu-internship-session-v1'

const StoreCtx = createContext<Ctx>(null as unknown as Ctx)
export const useStore = () => useContext(StoreCtx)

const uid = () => Math.random().toString(36).slice(2, 10)
const ago = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString()

/** Dữ liệu minh họa cho lần đăng nhập đầu tiên: một hồ sơ đã bị từ chối để thể hiện luồng "tìm nơi khác". */
function seedFor(user: StudentAccount): UserData {
  const appId = uid()
  return {
    ...EMPTY,
    applications: [
      {
        id: appId,
        jobId: 'j2',
        status: 'rejected',
        createdAt: ago(60 * 52),
        updatedAt: ago(60 * 5),
        fullName: user.fullName,
        email: user.email,
        phone: '0901234567',
        coverLetter: '',
        cvName: 'CV_HuynhTheTung.pdf',
        cvSize: 412000,
        rejectReason: REJECT_REASONS[0],
      },
    ],
    notices: [
      {
        id: uid(),
        applicationId: appId,
        kind: 'rejected',
        title: 'Hồ sơ bị từ chối',
        body: `${companyOf('c1').name} đã từ chối hồ sơ của bạn cho vị trí ${JOBS.find((j) => j.id === 'j2')!.title}. Bạn có thể tìm và nộp hồ sơ sang doanh nghiệp khác.`,
        createdAt: ago(60 * 5),
        read: false,
      },
    ],
  }
}

function loadAll(): Record<string, UserData> {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || '{}')
  } catch {
    return {}
  }
}


const DAY = 86400000
const activeReg = (d: UserData) => d.registrations.find((r) => r.status === 'approved' && r.advisor)

/**
 * BR3: quét các tuần để tự động phát cảnh báo cho GVHD và nhắc nhở sinh viên.
 * Trả về chính `d` nếu không có gì thay đổi để tránh cập nhật lặp.
 */
function scanDiary(d: UserData, now: Date): UserData {
  const reg = activeReg(d)
  if (!reg) return d
  let diary = d.diary
  let notices = d.notices
  const nowIso = now.toISOString()
  for (const w of weeksOf(reg)) {
    const log = diary.weeks[w.no]
    if (log && log.submissionNo > 0) continue
    if (now < w.start) continue
    if (now > w.deadline) {
      const key = `overdue-${w.no}`
      if (diary.alerts.some((a) => a.key === key)) continue
      diary = { ...diary, alerts: [{ id: uid(), key, kind: 'overdue', weekNo: w.no, at: nowIso, text: `Sinh viên chưa nộp báo cáo tuần ${w.no} sau thời hạn.` }, ...diary.alerts] }
      notices = [{ id: uid(), kind: 'warning', href: `/diary/${w.no}`, title: `Quá hạn nộp báo cáo tuần ${w.no}`, body: 'Hệ thống đã gửi cảnh báo đến GVHD. Vui lòng nộp báo cáo sớm và chủ động trao đổi với GVHD nếu có sự cố.', createdAt: new Date().toISOString(), read: false }, ...notices]
    } else if (w.deadline.getTime() - now.getTime() <= 2 * DAY) {
      const key = `remind-${w.no}`
      if (diary.reminders.includes(key)) continue
      diary = { ...diary, reminders: [...diary.reminders, key] }
      notices = [{ id: uid(), kind: 'info', href: `/diary/${w.no}`, title: `Nhắc nộp báo cáo tuần ${w.no}`, body: `Hạn nộp báo cáo tuần ${w.no} sắp đến. Hãy cập nhật nhật ký công việc và nộp đúng hạn.`, createdAt: new Date().toISOString(), read: false }, ...notices]
    }
  }
  // UA4: thông báo mở cổng nộp báo cáo cuối kỳ và nhắc hạn
  const win = finalWindow(reg)
  if (!d.final.report) {
    if (now >= win.open && now <= win.close && !diary.reminders.includes('final-open')) {
      diary = { ...diary, reminders: [...diary.reminders, 'final-open'] }
      notices = [{ id: uid(), kind: 'info', href: '/final', title: 'Cổng nộp báo cáo cuối kỳ đã mở', body: `Bạn có thể nộp báo cáo thực tập tổng kết đến hết ngày ${win.close.toLocaleDateString('vi-VN')}.`, createdAt: new Date().toISOString(), read: false }, ...notices]
    }
    if (now >= win.open && now <= win.close && win.close.getTime() - now.getTime() <= 3 * DAY && !diary.reminders.includes('final-remind')) {
      diary = { ...diary, reminders: [...diary.reminders, 'final-remind'] }
      notices = [{ id: uid(), kind: 'warning', href: '/final', title: 'Sắp hết hạn nộp báo cáo cuối kỳ', body: `Cổng thu bài đóng vào ${win.close.toLocaleDateString('vi-VN')}. Vui lòng nộp báo cáo đúng hạn.`, createdAt: new Date().toISOString(), read: false }, ...notices]
    }
  }
  return diary === d.diary ? d : { ...d, diary, notices }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))
  const [all, setAll] = useState<Record<string, UserData>>(loadAll)
  const [toasts, setToasts] = useState<Toast[]>([])

  const account = useMemo(() => STUDENTS.find((s) => s.email === email) ?? null, [email])
  const data: UserData = { ...EMPTY, ...((email && all[email]) || {}) }
  const profile: Profile = { ...EMPTY_PROFILE, ...data.profile }
  const user = useMemo(() => (account ? { ...account, fullName: profile.fullName.trim() || account.fullName } : null), [account, profile.fullName])

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(all))
  }, [all])

  // Tự động nhắc hạn / cảnh báo trễ hạn mỗi khi dữ liệu hoặc đồng hồ thay đổi
  useEffect(() => {
    if (!email) return
    setAll((prev) => {
      const d: UserData = { ...EMPTY, ...(prev[email] ?? {}) }
      const next = scanDiary(d, new Date(Date.now() + d.diary.clockOffset * DAY))
      return next === d ? prev : { ...prev, [email]: next }
    })
  }, [all, email])

  const update = useCallback(
    (fn: (d: UserData) => UserData) => {
      if (!email) return
      setAll((prev) => ({ ...prev, [email]: fn({ ...EMPTY, ...(prev[email] ?? {}) }) }))
    },
    [email],
  )

  const toast = useCallback((text: string) => {
    const id = uid()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const login: Ctx['login'] = (rawEmail, password) => {
    const e = rawEmail.trim().toLowerCase()
    const domain = e.split('@')[1]
    if (!e || !password) return { ok: false, error: 'Vui lòng nhập đầy đủ Email VLU và mật khẩu.' }
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      return { ok: false, error: 'Chỉ chấp nhận Email VLU (đuôi @vanlanguni.vn hoặc @vlu.edu.vn).' }
    }
    const account = STUDENTS.find((s) => s.email === e)
    if (!account || account.password !== password) {
      return { ok: false, error: 'Email hoặc mật khẩu SSO không chính xác.' }
    }
    // BR1: phải thuộc danh sách đủ điều kiện thực tập của học kỳ hiện tại
    if (!account.eligible) {
      return {
        ok: false,
        error:
          'Tài khoản hợp lệ nhưng bạn chưa có trong danh sách sinh viên đủ điều kiện thực tập học kỳ này. Vui lòng liên hệ Phòng Đào tạo / Khoa.',
      }
    }
    setAll((prev) => {
      const cur = prev[e]
      const empty = !cur || (!cur.applications?.length && !cur.registrations?.length)
      return empty ? { ...prev, [e]: seedFor(account) } : prev
    })
    localStorage.setItem(SESSION_KEY, e)
    setEmail(e)
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setEmail(null)
    window.location.hash = '#/jobs'
  }

  // Số chỉ tiêu còn lại = chỉ tiêu - sinh viên khác đã giữ chỗ - hồ sơ còn hiệu lực của chính mình
  const slotsLeft = (job: Job) => {
    const mine = data.applications.filter(
      (a) => a.jobId === job.id && (a.status === 'pending' || a.status === 'approved'),
    ).length
    return Math.max(0, job.quota - job.filled - mine)
  }

  const jobState = (job: Job): JobState => {
    if (deadlineDate(job).getTime() < Date.now()) return 'expired'
    if (slotsLeft(job) <= 0) return 'full'
    return 'open'
  }

  const applicationFor = (jobId: string) =>
    data.applications.find((a) => a.jobId === jobId && a.status !== 'cancelled')

  const submitApplication: Ctx['submitApplication'] = (jobId, form) => {
    const job = JOBS.find((j) => j.id === jobId)
    if (!job) return { ok: false, error: 'Không tìm thấy vị trí thực tập.' }
    const state = jobState(job)
    if (state === 'expired') return { ok: false, error: 'Vị trí này đã hết hạn nhận hồ sơ.' }
    if (state === 'full') return { ok: false, error: 'Vị trí này đã hết chỉ tiêu tuyển dụng.' }
    if (applicationFor(jobId)) return { ok: false, error: 'Bạn đã ứng tuyển vị trí này.' }
    const now = new Date().toISOString()
    const app: Application = { id: uid(), jobId, status: 'pending', createdAt: now, updatedAt: now, ...form }
    update((d) => ({
      ...d,
      applications: [app, ...d.applications],
      notices: [
        {
          id: uid(),
          applicationId: app.id,
          kind: 'info',
          title: 'Đã nộp hồ sơ thành công',
          body: `Hồ sơ ứng tuyển vị trí ${job.title} tại ${companyOf(job.companyId).name} đang chờ doanh nghiệp duyệt.`,
          createdAt: now,
          read: false,
        },
        ...d.notices,
      ],
    }))
    return { ok: true }
  }

  const cancelApplication = (id: string) => {
    const app = data.applications.find((a) => a.id === id)
    // BR4: chỉ được hủy khi đang "Chờ doanh nghiệp duyệt"
    if (!app || app.status !== 'pending') return
    update((d) => ({
      ...d,
      applications: d.applications.map((a) =>
        a.id === id ? { ...a, status: 'cancelled', updatedAt: new Date().toISOString() } : a,
      ),
    }))
    toast('Đã hủy đơn ứng tuyển. Chỉ tiêu đã được hoàn lại cho vị trí.')
  }

  // Mô phỏng phản hồi của doanh nghiệp → hệ thống gửi thông báo tự động (BR5)
  const simulateEmployer: Ctx['simulateEmployer'] = (id, decision) => {
    const app = data.applications.find((a) => a.id === id)
    if (!app || app.status !== 'pending') return
    const job = JOBS.find((j) => j.id === app.jobId)!
    const company = companyOf(job.companyId)
    const now = new Date().toISOString()
    const reason = REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)]
    const notice: Notice =
      decision === 'approved'
        ? {
            id: uid(),
            applicationId: id,
            kind: 'approved',
            title: 'Hồ sơ đã được duyệt',
            body: `${company.name} đã duyệt hồ sơ của bạn cho vị trí ${job.title}. Doanh nghiệp sẽ liên hệ qua email để hẹn lịch phỏng vấn.`,
            createdAt: now,
            read: false,
          }
        : {
            id: uid(),
            applicationId: id,
            kind: 'rejected',
            title: 'Hồ sơ bị từ chối',
            body: `${company.name} đã từ chối hồ sơ của bạn cho vị trí ${job.title}. Bạn có thể tìm và nộp hồ sơ sang doanh nghiệp khác.`,
            createdAt: now,
            read: false,
          }
    update((d) => ({
      ...d,
      applications: d.applications.map((a) =>
        a.id === id
          ? { ...a, status: decision, updatedAt: now, rejectReason: decision === 'rejected' ? reason : undefined }
          : a,
      ),
      notices: [notice, ...d.notices],
    }))
    toast(`${notice.title} · ${job.title}`)
  }

  const markRead = (id: string) =>
    update((d) => ({ ...d, notices: d.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  const markAllRead = () => update((d) => ({ ...d, notices: d.notices.map((n) => ({ ...n, read: true })) }))

  // ---------- UA2: Đăng ký thực tập với Khoa ----------
  const portal = portalState(data.portalClosed)
  const setPortalClosed = (closed: boolean) => update((d) => ({ ...d, portalClosed: closed }))

  const usedAppIds = new Set(data.registrations.map((r) => r.applicationId).filter(Boolean))
  const approvedSources = data.applications.filter((a) => a.status === 'approved' && !usedAppIds.has(a.id))

  const pushNotice = (d: UserData, n: Omit<Notice, 'id' | 'createdAt' | 'read'>): UserData => ({
    ...d,
    notices: [{ ...n, id: uid(), createdAt: new Date().toISOString(), read: false }, ...d.notices],
  })

  const saveRegistration: Ctx['saveRegistration'] = (input, id, submit = false) => {
    const existing = id ? data.registrations.find((r) => r.id === id) : undefined
    if (id && !existing) return { ok: false, error: 'Không tìm thấy hồ sơ đăng ký.' }
    if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
      return { ok: false, error: 'Hồ sơ đang chờ phê duyệt hoặc đã được duyệt nên không thể chỉnh sửa.' }
    }
    // BR2: mỗi đợt chỉ có tối đa 01 hồ sơ đang chờ duyệt hoặc đã duyệt (và chỉ giữ một hồ sơ xử lý trong đợt)
    if (!existing && data.registrations.length > 0) {
      return { ok: false, error: 'Bạn đã có hồ sơ đăng ký trong đợt thực tập này. Mỗi sinh viên chỉ được có 01 hồ sơ.' }
    }
    // BR1: phải có kết quả DN duyệt CV, hoặc đính kèm giấy tiếp nhận đối với DN tự tìm
    if (input.source === 'system') {
      const src = data.applications.find((a) => a.id === input.applicationId)
      if (!src || src.status !== 'approved') {
        return { ok: false, error: 'Chỉ được đăng ký với đơn vị đã có kết quả Doanh nghiệp duyệt tiếp nhận CV.' }
      }
    } else if (submit && !input.evidenceName) {
      return { ok: false, error: 'Doanh nghiệp tự tìm bắt buộc đính kèm giấy tiếp nhận hợp lệ.' }
    }

    const now = new Date().toISOString()
    let next: Registration
    if (submit) {
      const errs = validateReg(input)
      if (Object.keys(errs).length) return { ok: false, error: 'Hồ sơ còn thiếu hoặc sai thông tin bắt buộc. Vui lòng kiểm tra lại.' }
      // BR3: phải nằm trong thời gian mở cổng đăng ký (áp dụng cho lần gửi đầu tiên)
      if (existing?.status !== 'revision' && portal !== 'open') {
        return { ok: false, error: portal === 'upcoming' ? 'Cổng đăng ký của đợt thực tập chưa mở.' : 'Cổng đăng ký của đợt thực tập đã đóng. Bạn không thể gửi hồ sơ.' }
      }
      // BR2
      if (data.registrations.some((r) => r.id !== id && (r.status === 'pending' || r.status === 'approved'))) {
        return { ok: false, error: 'Bạn đã có hồ sơ chờ phê duyệt hoặc đã được duyệt trong đợt này.' }
      }
      // BR4: sau "Cần chỉnh sửa" phải cập nhật hồ sơ trước khi gửi duyệt lại
      if (existing?.status === 'revision' && JSON.stringify(pickEditable(input)) === existing.revisionBaseline) {
        return { ok: false, error: 'Bạn chưa cập nhật hồ sơ theo yêu cầu của Khoa. Vui lòng bổ sung, chỉnh sửa trước khi gửi duyệt lại.' }
      }
    }

    const rid = existing?.id ?? uid()
    const resubmit = existing?.status === 'revision'
    const status = submit ? 'pending' : (existing?.status ?? 'draft')
    next = {
      ...(existing ?? { id: rid, roundId: ROUND.id, createdAt: now, history: [{ at: now, text: 'Tạo hồ sơ đăng ký (bản nháp)' }] }),
      ...input,
      status,
      updatedAt: now,
      ...(submit ? { submittedAt: now, revisionNote: undefined } : {}),
    } as Registration
    if (submit) next.history = [{ at: now, text: resubmit ? 'Gửi duyệt lại cho Khoa' : 'Gửi đăng ký cho Khoa, chờ phê duyệt' }, ...next.history]

    update((d) => {
      const list = existing ? d.registrations.map((r) => (r.id === rid ? next : r)) : [next, ...d.registrations]
      let out: UserData = { ...d, registrations: list }
      if (submit) {
        out = pushNotice(out, {
          kind: 'info',
          href: `/registration/${rid}`,
          title: resubmit ? 'Đã gửi duyệt lại hồ sơ' : 'Đã gửi đăng ký thực tập cho Khoa',
          body: `Hồ sơ đăng ký thực tập tại ${input.companyName} đang chờ Ban chủ nhiệm Khoa phê duyệt.`,
        })
      }
      return out
    })
    return { ok: true, id: rid }
  }

  const deleteRegistration: Ctx['deleteRegistration'] = (id) => {
    const r = data.registrations.find((x) => x.id === id)
    if (!r) return { ok: false, error: 'Không tìm thấy hồ sơ.' }
    // BR5: đã duyệt và đã phân công GVHD thì không được tự xóa
    if (r.status === 'approved' && r.advisor) {
      return { ok: false, error: 'Hồ sơ đã được duyệt và phân công GVHD, bạn không thể tự xóa hoặc thay đổi đơn vị thực tập.' }
    }
    update((d) => ({ ...d, registrations: d.registrations.filter((x) => x.id !== id) }))
    toast('Đã rút hồ sơ đăng ký thực tập.')
    return { ok: true }
  }

  // Mô phỏng phản hồi của Ban chủ nhiệm Khoa (demo)
  const simulateFaculty: Ctx['simulateFaculty'] = (id, decision) => {
    const r = data.registrations.find((x) => x.id === id)
    if (!r || r.status !== 'pending') return
    const now = new Date().toISOString()
    const note = REVISION_REQUESTS[Math.floor(Math.random() * REVISION_REQUESTS.length)]
    update((d) => {
      const list = d.registrations.map((x) =>
        x.id !== id
          ? x
          : decision === 'approved'
            ? { ...x, status: 'approved' as const, updatedAt: now, history: [{ at: now, text: 'Ban chủ nhiệm Khoa đã duyệt hồ sơ' }, ...x.history] }
            : {
                ...x,
                status: 'revision' as const,
                updatedAt: now,
                revisionNote: note,
                revisionBaseline: JSON.stringify(pickEditable(x)),
                history: [{ at: now, text: 'Ban chủ nhiệm Khoa yêu cầu chỉnh sửa hồ sơ' }, ...x.history],
              },
      )
      return pushNotice(
        { ...d, registrations: list },
        decision === 'approved'
          ? { kind: 'approved', href: `/registration/${id}`, title: 'Hồ sơ đăng ký thực tập đã được duyệt', body: `Khoa đã duyệt hồ sơ thực tập tại ${r.companyName}. Vui lòng chờ phân công Giảng viên hướng dẫn.` }
          : { kind: 'revision', href: `/registration/${id}`, title: 'Khoa yêu cầu chỉnh sửa hồ sơ', body: `Hồ sơ thực tập tại ${r.companyName} cần chỉnh sửa. Vui lòng xem yêu cầu, cập nhật và gửi duyệt lại.` },
      )
    })
    toast(decision === 'approved' ? 'Khoa đã duyệt hồ sơ đăng ký thực tập' : 'Khoa yêu cầu chỉnh sửa hồ sơ')
  }

  const assignAdvisor: Ctx['assignAdvisor'] = (id) => {
    const r = data.registrations.find((x) => x.id === id)
    if (!r || r.status !== 'approved' || r.advisor) return
    const advisor = ADVISORS[Math.floor(Math.random() * ADVISORS.length)]
    const now = new Date().toISOString()
    update((d) =>
      pushNotice(
        {
          ...d,
          registrations: d.registrations.map((x) =>
            x.id === id ? { ...x, advisor, updatedAt: now, history: [{ at: now, text: `Phân công GVHD: ${advisor.name}` }, ...x.history] } : x,
          ),
        },
        { kind: 'approved', href: `/registration/${id}`, title: 'Đã phân công Giảng viên hướng dẫn', body: `${advisor.name} là GVHD phụ trách của bạn trong đợt thực tập này.` },
      ),
    )
    toast(`Đã phân công GVHD: ${advisor.name}`)
  }

  // ---------- UA3: Nhật ký & báo cáo tiến độ tuần ----------
  const diaryReg = data.registrations.find((r) => r.status === 'approved' && r.advisor)
  const diary = data.diary
  const diaryNow = new Date(Date.now() + diary.clockOffset * DAY)
  const setClockOffset = (days: number) => update((d) => ({ ...d, diary: { ...d.diary, clockOffset: days } }))

  const withLog = (d: UserData, weekNo: number, fn: (l: WeekLog) => WeekLog, base?: WeekLog): UserData => {
    const cur = d.diary.weeks[weekNo] ?? base!
    return { ...d, diary: { ...d.diary, weeks: { ...d.diary.weeks, [weekNo]: fn(cur) } } }
  }
  const emptyLog = (weekNo: number, fields: WeekFields): WeekLog => ({ weekNo, fields, submissionNo: 0, late: false, versions: [], feedbacks: [], history: [] })
  const addAlert = (d: UserData, a: { key: string; kind: 'late' | 'overdue' | 'incident'; weekNo: number; at: string; text: string }): UserData =>
    d.diary.alerts.some((x) => x.key === a.key) ? d : { ...d, diary: { ...d.diary, alerts: [{ id: uid(), ...a }, ...d.diary.alerts] } }

  const saveWeek: Ctx['saveWeek'] = (weekNo, fields, submit) => {
    // BR1: chỉ mở khi hồ sơ đã được Khoa duyệt và đã phân công GVHD
    if (!diaryReg) return { ok: false, error: 'Chức năng chỉ mở sau khi Khoa duyệt đăng ký thực tập và phân công GVHD.' }
    const w = weeksOf(diaryReg).find((x) => x.no === weekNo)
    if (!w) return { ok: false, error: 'Không tìm thấy tuần thực tập.' }
    const log = diary.weeks[weekNo]
    const st = weekStatus(w, log, diaryNow)
    if (st === 'future') return { ok: false, error: 'Chưa đến tuần thực tập này nên chưa thể ghi nhật ký.' }
    if (st === 'submitted' || st === 'done') return { ok: false, error: 'Báo cáo tuần này đã nộp. Chỉ chỉnh sửa lại khi có yêu cầu "Cần chỉnh sửa".' }
    const nowIso = diaryNow.toISOString()
    if (!submit) {
      update((d) =>
        withLog(d, weekNo, (l) => ({ ...l, fields }), emptyLog(weekNo, fields)),
      )
      return { ok: true }
    }
    if (Object.keys(validateWeek(fields)).length) return { ok: false, error: 'Báo cáo còn thiếu thông tin bắt buộc.' }
    const latest = log?.versions[log.versions.length - 1]
    // BR4: sau "Cần chỉnh sửa" phải cập nhật lại nội dung báo cáo của tuần đó
    if (st === 'revision' && latest && sameFields(fields, latest.snapshot)) {
      return { ok: false, error: 'Bạn chưa chỉnh sửa nội dung báo cáo theo yêu cầu. Vui lòng cập nhật rồi nộp lại.' }
    }
    const no = (log?.submissionNo ?? 0) + 1
    const late = no === 1 ? diaryNow > w.deadline : (log?.late ?? false)
    const lateNow = no === 1 && late
    update((d) => {
      let out = withLog(
        d, weekNo,
        (l) => ({
          ...l, fields, submissionNo: no, late, submittedAt: nowIso,
          versions: [...l.versions, { no, at: nowIso, late: diaryNow > w.deadline, snapshot: fields }],
          history: [
            ...(lateNow ? [{ at: nowIso, actor: 'system' as const, text: 'Hệ thống gửi cảnh báo nộp trễ hạn đến GVHD và nhắc nhở sinh viên' }] : []),
            { at: nowIso, actor: 'student' as const, text: no === 1 ? `Nộp báo cáo tuần ${weekNo}${late ? ' (trễ hạn)' : ' (đúng hạn)'}` : `Nộp lại báo cáo tuần ${weekNo} sau chỉnh sửa (lần ${no})` },
            ...l.history,
          ],
        }),
        emptyLog(weekNo, fields),
      )
      out = {
        ...out,
        notices: [
          ...(lateNow ? [{ id: uid(), kind: 'warning' as const, href: `/diary/${weekNo}`, title: `Báo cáo tuần ${weekNo} nộp trễ hạn`, body: 'Hệ thống đã gửi cảnh báo đến GVHD. Vui lòng chủ động trao đổi với GVHD và nộp đúng hạn các tuần tiếp theo.', createdAt: new Date().toISOString(), read: false }] : []),
          { id: uid(), kind: 'info' as const, href: `/diary/${weekNo}`, title: no === 1 ? `Đã nộp báo cáo tuần ${weekNo}` : `Đã nộp lại báo cáo tuần ${weekNo}`, body: 'Báo cáo đang chờ Người hướng dẫn tại DN và GVHD phản hồi.', createdAt: new Date().toISOString(), read: false },
          ...out.notices,
        ],
      }
      if (lateNow) out = addAlert(out, { key: `late-${weekNo}`, kind: 'late', weekNo, at: nowIso, text: `Sinh viên nộp báo cáo tuần ${weekNo} trễ hạn.` })
      return out
    })
    return { ok: true }
  }

  const reportIncident: Ctx['reportIncident'] = (weekNo, category, text) => {
    if (!diaryReg) return { ok: false, error: 'Chức năng chưa được mở.' }
    if (text.trim().length < 10) return { ok: false, error: 'Vui lòng mô tả sự cố rõ hơn (tối thiểu 10 ký tự).' }
    const nowIso = diaryNow.toISOString()
    const inc: Incident = { id: uid(), weekNo, category, text: text.trim(), at: nowIso }
    update((d) => {
      let out: UserData = { ...d, diary: { ...d.diary, incidents: [inc, ...d.diary.incidents] } }
      out = withLog(out, weekNo, (l) => ({ ...l, history: [{ at: nowIso, actor: 'student', text: `Báo cáo sự cố: ${category}` }, ...l.history] }), emptyLog(weekNo, { content: '', results: '', nextPlan: '', hours: '', attachmentName: '', attachmentSize: 0 }))
      out = addAlert(out, { key: `incident-${inc.id}`, kind: 'incident', weekNo, at: nowIso, text: `Sinh viên báo cáo sự cố ở tuần ${weekNo}: ${category}.` })
      return pushNotice(out, { kind: 'warning', href: `/diary/${weekNo}`, title: `Đã ghi nhận sự cố tuần ${weekNo}`, body: 'Hệ thống đã gửi cảnh báo đến GVHD. Vui lòng theo dõi hướng dẫn xử lý và cập nhật báo cáo tuần.' })
    })
    toast('Đã gửi cảnh báo sự cố đến GVHD')
    return { ok: true }
  }

  // Mô phỏng phản hồi của Người hướng dẫn tại DN / GVHD (demo)
  const simulateFeedback: Ctx['simulateFeedback'] = (weekNo, by, decision) => {
    if (!diaryReg) return
    const w = weeksOf(diaryReg).find((x) => x.no === weekNo)
    const log = diary.weeks[weekNo]
    if (!w || !log || weekStatus(w, log, diaryNow) !== 'submitted') return
    if (currentFeedbacks(log).some((f) => f.by === by)) return
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)]
    const nowIso = diaryNow.toISOString()
    const comment = by === 'mentor' ? pick(decision === 'confirmed' ? MENTOR_OK : MENTOR_REVISION) : pick(decision === 'confirmed' ? ADVISOR_OK : ADVISOR_REVISION)
    const score = by === 'advisor' && decision === 'confirmed' ? Math.round((7 + Math.random() * 2.5) * 2) / 2 : undefined
    const fb: Feedback = { id: uid(), at: nowIso, by, decision, comment, score, submissionNo: log.submissionNo }
    const who = by === 'mentor' ? 'Người hướng dẫn tại DN' : 'GVHD'
    const hist: HistoryItem = {
      at: nowIso, actor: by,
      text: decision === 'revision' ? `${who} yêu cầu chỉnh sửa báo cáo` : by === 'mentor' ? 'Người hướng dẫn tại DN xác nhận báo cáo' : `GVHD nhận xét và chấm điểm quá trình: ${score}/10`,
    }
    update((d) =>
      pushNotice(
        withLog(d, weekNo, (l) => ({ ...l, feedbacks: [...l.feedbacks, fb], history: [hist, ...l.history] })),
        decision === 'revision'
          ? { kind: 'revision', href: `/diary/${weekNo}`, title: `${who} yêu cầu chỉnh sửa báo cáo tuần ${weekNo}`, body: comment }
          : by === 'mentor'
            ? { kind: 'approved', href: `/diary/${weekNo}`, title: `${who} đã phản hồi báo cáo tuần ${weekNo}`, body: comment }
            : { kind: 'approved', href: `/diary/${weekNo}`, title: `GVHD đã nhận xét báo cáo tuần ${weekNo}`, body: `Điểm quá trình: ${score}/10. ${comment}` },
      ),
    )
    toast(hist.text)
  }

  const giveGuidance: Ctx['giveGuidance'] = (incidentId) => {
    const inc = diary.incidents.find((i) => i.id === incidentId)
    if (!inc || inc.guidance) return
    const nowIso = diaryNow.toISOString()
    const guidance = GUIDANCES[Math.floor(Math.random() * GUIDANCES.length)]
    update((d) =>
      pushNotice(
        withLog(
          { ...d, diary: { ...d.diary, incidents: d.diary.incidents.map((i) => (i.id === incidentId ? { ...i, guidance, guidanceAt: nowIso } : i)) } },
          inc.weekNo,
          (l) => ({ ...l, history: [{ at: nowIso, actor: 'advisor', text: 'GVHD gửi hướng dẫn xử lý sự cố' }, ...l.history] }),
          emptyLog(inc.weekNo, { content: '', results: '', nextPlan: '', hours: '', attachmentName: '', attachmentSize: 0 }),
        ),
        { kind: 'info', href: `/diary/${inc.weekNo}`, title: `GVHD đã hướng dẫn xử lý sự cố tuần ${inc.weekNo}`, body: guidance },
      ),
    )
    toast('GVHD đã gửi hướng dẫn xử lý sự cố')
  }

  // ---------- UA4: Báo cáo cuối kỳ & kết quả thực tập ----------
  const final = data.final
  const mkMsg = (from: Message['from'], text: string, to?: Message['to']): Message => ({ id: uid(), from, to, text, at: diaryNow.toISOString() })
  const addFinalHistory = (r: NonNullable<FinalState['report']>, actor: 'student' | 'advisor' | 'mentor' | 'system', text: string) => ({
    ...r,
    history: [{ at: diaryNow.toISOString(), actor, text }, ...r.history],
  })

  const submitFinal: Ctx['submitFinal'] = (fields) => {
    if (!diaryReg) return { ok: false, error: 'Chức năng chỉ mở sau khi Khoa duyệt đăng ký thực tập và phân công GVHD.' }
    const st = finalStatus(final)
    if (st === 'submitted' || st === 'accepted' || st === 'graded') return { ok: false, error: 'Báo cáo đã nộp. Chỉ được nộp lại khi GVHD đánh giá "Cần chỉnh sửa".' }
    const g = finalGates(diaryReg, diary, diaryNow)
    // BR1: phải hoàn thành kỳ thực tập và đủ nhật ký các tuần
    if (!g.ended) return { ok: false, error: 'Bạn chỉ được nộp báo cáo cuối kỳ sau khi hoàn thành kỳ thực tập tại doanh nghiệp.' }
    if (!g.diaryComplete) return { ok: false, error: `Nhật ký chưa đầy đủ (${g.diaryDone}/${g.diaryTotal} tuần). Vui lòng hoàn tất nhật ký các tuần trước khi nộp.` }
    // BR2: trong khung thời gian mở cổng thu bài (lần nộp đầu tiên)
    if (st === 'none' && g.portal !== 'open') return { ok: false, error: g.portal === 'closed' ? 'Cổng thu bài báo cáo cuối kỳ đã đóng.' : 'Cổng thu bài báo cáo cuối kỳ chưa mở.' }
    if (Object.keys(validateFinal(fields)).length) return { ok: false, error: 'Vui lòng điền đủ thông tin bắt buộc.' }
    const prev = final.report
    const last = prev?.versions[prev.versions.length - 1]
    // BR3: sau "Cần chỉnh sửa" phải nộp lại file báo cáo mới
    if (st === 'revision' && last && finalSameFiles(fields, last.snapshot)) {
      return { ok: false, error: 'Bạn cần tải lên file báo cáo đã chỉnh sửa (khác với file đã nộp trước đó).' }
    }
    const no = (prev?.submissionNo ?? 0) + 1
    const nowIso = diaryNow.toISOString()
    update((d) => {
      const base = d.final.report
      const report = {
        fields, submissionNo: no, submittedAt: nowIso,
        versions: [...(base?.versions ?? []), { no, at: nowIso, snapshot: fields }],
        reviews: base?.reviews ?? [],
        history: [{ at: nowIso, actor: 'student' as const, text: no === 1 ? 'Nộp báo cáo cuối kỳ' : `Nộp lại báo cáo sau chỉnh sửa (lần ${no})` }, ...(base?.history ?? [])],
      }
      return pushNotice({ ...d, final: { ...d.final, report } }, { kind: 'info', href: '/final', title: no === 1 ? 'Đã nộp báo cáo cuối kỳ' : 'Đã nộp lại báo cáo cuối kỳ', body: 'Báo cáo đang chờ GVHD kiểm tra.' })
    })
    return { ok: true }
  }

  const sendMessage: Ctx['sendMessage'] = (to, text) => {
    if (!text.trim()) return
    update((d) => ({ ...d, final: { ...d.final, messages: [...d.final.messages, mkMsg('student', text.trim(), to)] } }))
  }

  const simulateReply: Ctx['simulateReply'] = () => {
    const lastToWho = [...final.messages].reverse().find((m) => m.from === 'student')?.to ?? 'advisor'
    const text = lastToWho === 'advisor'
      ? 'Chào em, GVHD đã nhận được câu hỏi. Em xem lại tài liệu hướng dẫn và mẫu báo cáo trên hệ thống, nếu còn vướng mắc em liên hệ trực tiếp qua email nhé.'
      : 'Văn phòng Khoa đã tiếp nhận thông tin của bạn và sẽ phản hồi qua email VLU trong vòng 2 ngày làm việc.'
    update((d) =>
      pushNotice({ ...d, final: { ...d.final, messages: [...d.final.messages, mkMsg(lastToWho === 'advisor' ? 'advisor' : 'faculty', text)] } }, { kind: 'info', href: '/final', title: lastToWho === 'advisor' ? 'GVHD đã trả lời tin nhắn' : 'Khoa đã trả lời tin nhắn', body: text }),
    )
  }

  // Mô phỏng GVHD kiểm tra báo cáo tổng kết
  const simulateFinalReview: Ctx['simulateFinalReview'] = (decision) => {
    const r = final.report
    if (!r || finalStatus(final) !== 'submitted') return
    const items = decision === 'revision' ? [...REVISION_ITEMS].sort(() => Math.random() - 0.5).slice(0, 3) : []
    const comment = decision === 'revision' ? 'Báo cáo chưa đạt yêu cầu, em chỉnh sửa theo các mục dưới đây và nộp lại file mới.' : REVIEW_OK[Math.floor(Math.random() * REVIEW_OK.length)]
    const rv: FinalReview = { id: uid(), at: diaryNow.toISOString(), decision, comment, items, submissionNo: r.submissionNo }
    update((d) =>
      pushNotice(
        { ...d, final: { ...d.final, report: addFinalHistory({ ...d.final.report!, reviews: [rv, ...d.final.report!.reviews] }, 'advisor', decision === 'revision' ? 'GVHD đánh giá "Cần chỉnh sửa"' : 'GVHD kiểm tra: báo cáo đạt yêu cầu') } },
        decision === 'revision'
          ? { kind: 'revision', href: '/final', title: 'GVHD yêu cầu chỉnh sửa báo cáo cuối kỳ', body: `${comment} (${items.length} mục cần sửa)` }
          : { kind: 'approved', href: '/final', title: 'Báo cáo cuối kỳ đạt yêu cầu', body: 'GVHD đã kiểm tra báo cáo. Vui lòng chờ chấm điểm tổng kết và công bố kết quả.' },
      ),
    )
    toast(decision === 'revision' ? 'GVHD yêu cầu chỉnh sửa báo cáo' : 'GVHD xác nhận báo cáo đạt yêu cầu')
  }

  // Mô phỏng phiếu đánh giá của Doanh nghiệp / Người hướng dẫn tại DN
  const simulateMentorEval: Ctx['simulateMentorEval'] = () => {
    if (final.mentorEval) return
    const criteria = MENTOR_CRITERIA.map((label) => ({ label, score: Math.round((7.5 + Math.random() * 2) * 2) / 2 }))
    const score = Math.round((criteria.reduce((a, c) => a + c.score, 0) / criteria.length) * 10) / 10
    const ev: MentorEval = { at: diaryNow.toISOString(), criteria, score, comment: MENTOR_COMMENTS[Math.floor(Math.random() * MENTOR_COMMENTS.length)] }
    update((d) => ({ ...d, final: { ...d.final, mentorEval: ev } }))
    toast('Doanh nghiệp đã gửi phiếu đánh giá (chưa công bố cho sinh viên)')
  }

  // Mô phỏng GVHD chấm điểm tổng kết → hệ thống tổng hợp điểm (BR4) và công bố (BR5)
  const simulateGrading: Ctx['simulateGrading'] = () => {
    if (!diaryReg || finalStatus(final) !== 'accepted' || !final.mentorEval) return
    const advisorScore = Math.round((7 + Math.random() * 2.5) * 2) / 2
    const process = processAvg(diary, diaryReg)
    const total = computeTotal(process, final.mentorEval.score, advisorScore)
    const g: Grading = {
      at: diaryNow.toISOString(), advisorScore, advisorComment: GRADING_COMMENTS[Math.floor(Math.random() * GRADING_COMMENTS.length)],
      processScore: process === null ? null : Math.round(process * 10) / 10, mentorScore: final.mentorEval.score, total, rank: rankOf(total), passed: total >= 5,
    }
    update((d) =>
      pushNotice(
        { ...d, final: { ...d.final, grading: g, report: addFinalHistory(d.final.report!, 'advisor', `GVHD hoàn tất chấm điểm. Điểm tổng kết: ${total}`) } },
        { kind: 'approved', href: '/final', title: 'Đã công bố kết quả thực tập cuối kỳ', body: `Điểm tổng kết: ${total}/10 · ${g.rank}. Xem bảng điểm thành phần và nhận xét của GVHD.` },
      ),
    )
    toast('GVHD đã hoàn tất chấm điểm. Kết quả được công bố')
  }

  // Demo: đưa đồng hồ tới sau ngày kết thúc và điền nhanh các tuần còn thiếu để thử BR1
  const completeInternshipDemo: Ctx['completeInternshipDemo'] = () => {
    if (!diaryReg) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(diaryReg.endDate + 'T00:00:00')
    const offset = Math.max(diary.clockOffset, Math.round((end.getTime() - today.getTime()) / DAY) + 1)
    update((d) => {
      const weeks = { ...d.diary.weeks }
      for (const w of weeksOf(diaryReg)) {
        if (weeks[w.no]?.submissionNo > 0) continue
        const at = new Date(w.end); at.setHours(18, 0, 0, 0)
        const iso = at.toISOString()
        const fields: WeekFields = { content: `Thực hiện các nhiệm vụ được giao trong tuần ${w.no} theo kế hoạch của người hướng dẫn tại doanh nghiệp.`, results: 'Hoàn thành các đầu việc đúng tiến độ.', nextPlan: 'Tiếp tục các nhiệm vụ của tuần kế tiếp.', hours: '40', attachmentName: '', attachmentSize: 0 }
        const score = Math.round((7.5 + Math.random() * 2) * 2) / 2
        weeks[w.no] = {
          weekNo: w.no, fields, submissionNo: 1, late: false, submittedAt: iso,
          versions: [{ no: 1, at: iso, late: false, snapshot: fields }],
          feedbacks: [
            { id: uid(), at: iso, by: 'mentor', decision: 'confirmed', comment: 'Hoàn thành tốt công việc trong tuần.', submissionNo: 1 },
            { id: uid(), at: iso, by: 'advisor', decision: 'confirmed', comment: 'Báo cáo đầy đủ, đạt yêu cầu.', score, submissionNo: 1 },
          ],
          history: [
            { at: iso, actor: 'advisor', text: `GVHD nhận xét và chấm điểm quá trình: ${score}/10` },
            { at: iso, actor: 'mentor', text: 'Người hướng dẫn tại DN xác nhận báo cáo' },
            { at: iso, actor: 'student', text: `Nộp báo cáo tuần ${w.no} (đúng hạn)` },
          ],
        }
      }
      return { ...d, diary: { ...d.diary, clockOffset: offset, weeks } }
    })
    toast('Đã hoàn thành nhanh kỳ thực tập (demo)')
  }

  const updateProfile = (patch: Partial<Profile>) => update((d) => ({ ...d, profile: { ...EMPTY_PROFILE, ...d.profile, ...patch } }))

  const value: Ctx = {
    user,
    profile,
    updateProfile,
    login,
    logout,
    applications: data.applications,
    notices: data.notices,
    unread: data.notices.filter((n) => !n.read).length,
    toasts,
    slotsLeft,
    jobState,
    applicationFor,
    submitApplication,
    cancelApplication,
    simulateEmployer,
    markRead,
    markAllRead,
    registrations: data.registrations,
    portal,
    setPortalClosed,
    approvedSources,
    saveRegistration,
    deleteRegistration,
    simulateFaculty,
    assignAdvisor,
    diaryReg,
    diary,
    diaryNow,
    setClockOffset,
    saveWeek,
    reportIncident,
    simulateFeedback,
    giveGuidance,
    final,
    submitFinal,
    sendMessage,
    simulateFinalReview,
    simulateMentorEval,
    simulateGrading,
    simulateReply,
    completeInternshipDemo,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
