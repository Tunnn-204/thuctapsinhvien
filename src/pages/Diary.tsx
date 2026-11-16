import { ReactNode, useState } from 'react'
import { AlertTriangle, ArrowRight, BellRing, CalendarClock, CheckCircle2, ClipboardSignature, FastForward, FlaskConical, GraduationCap, Lock, NotebookPen, RotateCcw, ShieldAlert, Star, UserRound } from 'lucide-react'
import { useStore } from '../lib/store'
import { WEEK_STATUS_META, WeekStatus, avgScore, weekScore, weekStatus, weeksOf } from '../lib/diary'
import { cx, formatDate, formatDateTime } from '../lib/utils'
import { formatDateISO, parseISODate } from '../lib/registration'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary } from '../components/ui'

export function WeekBadge({ status }: { status: WeekStatus }) {
  const m = WEEK_STATUS_META[status]
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', m.cls)}>{m.label}</span>
}

/** Đồng hồ giả lập để thử hạn nộp / trễ hạn (chỉ dùng cho demo) */
export function ClockPanel() {
  const { diary, diaryNow, diaryReg, setClockOffset } = useStore()
  const off = diary.clockOffset
  const toStart = () => {
    if (!diaryReg) return
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    setClockOffset(Math.max(0, Math.round((parseISODate(diaryReg.startDate).getTime() - t.getTime()) / 86400000)))
  }
  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500"><FlaskConical size={14} />Demo: đồng hồ hệ thống giả lập</p>
      <p className="text-sm text-stone-800">Hôm nay (giả lập): <b>{formatDate(diaryNow)}</b>{off !== 0 && <span className="text-stone-500"> · lệch {off > 0 ? '+' : ''}{off} ngày</span>}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setClockOffset(off + 1)} className={btnSecondary + ' !px-3 !py-1.5 !text-xs'}>+1 ngày</button>
        <button onClick={() => setClockOffset(off + 7)} className={btnSecondary + ' !px-3 !py-1.5 !text-xs'}><FastForward size={13} />+7 ngày</button>
        <button onClick={toStart} className={btnSecondary + ' !px-3 !py-1.5 !text-xs'}>Tới ngày bắt đầu</button>
        <button onClick={() => setClockOffset(0)} disabled={off === 0} className={btnSecondary + ' !px-3 !py-1.5 !text-xs'}><RotateCcw size={13} />Về hôm nay</button>
      </div>
    </section>
  )
}

function Stat({ icon: Icon, label, value, tone = 'brand' }: { icon: typeof Star; label: string; value: ReactNode; tone?: 'brand' | 'ok' | 'warn' | 'bad' }) {
  const tones = { brand: 'bg-vlu-50 text-vlu-600', ok: 'bg-emerald-50 text-emerald-600', warn: 'bg-orange-50 text-orange-600', bad: 'bg-rose-50 text-rose-600' }
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
      <span className={cx('grid size-9 place-items-center rounded-lg', tones[tone])}><Icon size={18} /></span>
      <p className="mt-3 text-2xl font-extrabold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}

export function DiaryHome() {
  const { diaryReg, registrations, diary, diaryNow, user } = useStore()

  // BR1: chỉ mở khi đã được Khoa duyệt và phân công GVHD
  if (!diaryReg) {
    const reg = registrations[0]
    const steps = [
      { ok: !!reg && reg.status !== 'draft', label: 'Đã gửi đăng ký thực tập cho Khoa' },
      { ok: reg?.status === 'approved', label: 'Ban chủ nhiệm Khoa đã duyệt hồ sơ' },
      { ok: !!reg?.advisor, label: 'Đã được phân công Giảng viên hướng dẫn' },
    ]
    return (
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Nhật ký & Tiến độ thực tập</h1>
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-stone-200/80 bg-white p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-vlu-50 text-vlu-600"><Lock size={26} /></span>
          <h2 className="mt-4 text-xl font-bold text-stone-900">Chức năng chưa được mở</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">Bạn chỉ có thể ghi nhật ký tuần và nộp báo cáo định kỳ sau khi Khoa duyệt đăng ký thực tập và phân công GVHD.</p>
          <ul className="mt-6 space-y-2.5 text-left">
            {steps.map((s) => (
              <li key={s.label} className={cx('flex items-center gap-3 rounded-xl px-4 py-3 text-sm', s.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-stone-50 text-stone-600')}>
                {s.ok ? <CheckCircle2 size={18} className="text-emerald-600" /> : <span className="size-[18px] rounded-full border-2 border-stone-300" />}
                {s.label}
              </li>
            ))}
          </ul>
          <button onClick={() => navigate(reg ? `/registration/${reg.id}` : '/registration')} className={btnPrimary + ' mt-6'}><ClipboardSignature size={16} />{reg ? 'Xem hồ sơ đăng ký' : 'Đăng ký thực tập với Khoa'}</button>
        </div>
      </div>
    )
  }

  const weeks = weeksOf(diaryReg)
  const rows = weeks.map((w) => ({ w, log: diary.weeks[w.no], st: weekStatus(w, diary.weeks[w.no], diaryNow) }))
  const submitted = rows.filter((r) => r.log && r.log.submissionNo > 0)
  const onTime = submitted.filter((r) => !r.log!.late).length
  const lateCount = submitted.filter((r) => r.log!.late).length + rows.filter((r) => r.st === 'overdue').length
  const avg = avgScore(rows.map((r) => r.log))
  const started = rows.filter((r) => r.st !== 'future').length
  const currentNo = rows.find((r) => diaryNow >= r.w.start && diaryNow <= r.w.deadline)?.w.no

  // Việc cần xử lý: trễ hạn, cần chỉnh sửa, sắp đến hạn, sự cố chờ hướng dẫn
  const actions: { key: string; tone: 'bad' | 'warn' | 'info'; text: string; weekNo: number }[] = []
  rows.forEach(({ w, st }) => {
    if (st === 'overdue') actions.push({ key: `o${w.no}`, tone: 'bad', weekNo: w.no, text: `Tuần ${w.no} đã quá hạn nộp báo cáo (hạn ${formatDate(w.deadline)}). GVHD đã được cảnh báo.` })
    if (st === 'revision') actions.push({ key: `r${w.no}`, tone: 'warn', weekNo: w.no, text: `Tuần ${w.no} cần chỉnh sửa theo nhận xét. Vui lòng cập nhật và nộp lại.` })
    if ((st === 'todo' || st === 'draft') && w.deadline.getTime() - diaryNow.getTime() <= 2 * 86400000) actions.push({ key: `d${w.no}`, tone: 'info', weekNo: w.no, text: `Tuần ${w.no} sắp đến hạn nộp (${formatDate(w.deadline)}).` })
  })
  diary.incidents.filter((i) => !i.guidance).forEach((i) => actions.push({ key: i.id, tone: 'info', weekNo: i.weekNo, text: `Sự cố tuần ${i.weekNo} đang chờ GVHD hướng dẫn xử lý.` }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Nhật ký & Tiến độ thực tập</h1>
        <p className="mt-1.5 text-stone-500">Ghi nhật ký công việc và nộp báo cáo đúng hạn theo từng tuần thực tập.</p>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-vlu-800 p-6 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-vlu-600/50 blur-3xl" />
        <div className="relative grid gap-5 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-sm text-vlu-200">Đơn vị thực tập</p>
            <p className="mt-1 text-xl font-bold">{diaryReg.companyName}</p>
            <p className="text-sm text-vlu-100">{diaryReg.position}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-vlu-100"><CalendarClock size={16} className="text-vlu-300" />{formatDateISO(diaryReg.startDate)} – {formatDateISO(diaryReg.endDate)} · {weeks.length} tuần</p>
          </div>
          <div className="text-sm">
            <p className="flex items-center gap-1.5 text-vlu-200"><GraduationCap size={15} />GVHD</p>
            <p className="mt-1 font-semibold">{diaryReg.advisor!.name}</p>
            <p className="text-vlu-200">{diaryReg.advisor!.email}</p>
          </div>
          <div className="text-sm">
            <p className="flex items-center gap-1.5 text-vlu-200"><UserRound size={15} />Người hướng dẫn tại DN</p>
            <p className="mt-1 font-semibold">{diaryReg.mentorName}</p>
            <p className="text-vlu-200">{diaryReg.mentorTitle}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={NotebookPen} label={`Báo cáo đã nộp / ${started} tuần đã bắt đầu`} value={`${submitted.length}/${started}`} />
        <Stat icon={CheckCircle2} label="Nộp đúng hạn" value={onTime} tone="ok" />
        <Stat icon={AlertTriangle} label="Trễ hạn / quá hạn" value={lateCount} tone={lateCount ? 'bad' : 'ok'} />
        <Stat icon={Star} label="Điểm quá trình trung bình" value={avg === null ? '—' : avg.toFixed(1)} tone="warn" />
      </div>

      {actions.length > 0 && (
        <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-orange-900"><BellRing size={18} />Cần xử lý ({actions.length})</h2>
          <ul className="space-y-2">
            {actions.map((a) => (
              <li key={a.key}>
                <button onClick={() => navigate(`/diary/${a.weekNo}`)} className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left text-sm shadow-sm ring-1 ring-orange-100 transition hover:ring-orange-300">
                  <span className={cx('size-2 shrink-0 rounded-full', a.tone === 'bad' ? 'bg-rose-500' : a.tone === 'warn' ? 'bg-orange-500' : 'bg-vlu-500')} />
                  <span className="flex-1 text-stone-800">{a.text}</span>
                  <ArrowRight size={16} className="text-stone-400" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 text-lg font-bold text-stone-900">Các tuần thực tập</h2>
          <ul className="space-y-2.5">
            {rows.map(({ w, log, st }) => {
              const score = weekScore(log)
              const disabled = st === 'future'
              return (
                <li key={w.no}>
                  <button
                    disabled={disabled && !diary.incidents.some((i) => i.weekNo === w.no)}
                    onClick={() => navigate(`/diary/${w.no}`)}
                    className={cx('flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition', w.no === currentNo ? 'border-vlu-400 ring-4 ring-vlu-100' : 'border-stone-200/80', disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-vlu-300 hover:shadow-[0_8px_30px_-12px_rgba(112,48,160,0.35)]')}
                  >
                    <span className={cx('grid size-12 shrink-0 place-items-center rounded-xl text-center text-sm font-extrabold leading-tight', w.no === currentNo ? 'bg-vlu-600 text-white' : 'bg-vlu-50 text-vlu-700')}>
                      <span><span className="block text-[10px] font-semibold opacity-80">TUẦN</span>{w.no}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">{formatDate(w.start)} – {formatDate(w.end)}</span>
                        {w.no === currentNo && <span className="rounded-md bg-vlu-100 px-1.5 py-0.5 text-[11px] font-bold text-vlu-700">Tuần hiện tại</span>}
                        {log?.late && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">Nộp trễ</span>}
                      </span>
                      <span className="mt-1 block text-xs text-stone-500">
                        Hạn nộp: {formatDate(w.deadline)}
                        {log && log.submittedAt && <> · Nộp {formatDateTime(log.submittedAt)}</>}
                        {(log?.versions.length ?? 0) > 1 && <> · {log!.versions.length} lần nộp</>}
                      </span>
                    </span>
                    {typeof score === 'number' && <span className="hidden items-center gap-1 text-sm font-bold text-amber-600 sm:inline-flex"><Star size={14} className="fill-amber-400 text-amber-400" />{score}</span>}
                    <WeekBadge status={st} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-stone-900"><ShieldAlert size={17} className="text-rose-500" />Cảnh báo đã gửi GVHD</h2>
            {diary.alerts.length === 0 ? (
              <p className="text-sm text-stone-500">Chưa có cảnh báo nào. Hãy nộp báo cáo đúng hạn mỗi tuần.</p>
            ) : (
              <ul className="space-y-3">
                {diary.alerts.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="text-stone-800">{a.text}</p>
                    <p className="text-xs text-stone-400">{formatDateTime(a.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <ClockPanel />
        </aside>
      </div>
      <p className="mt-6 text-xs text-stone-400">{user?.fullName} · Dữ liệu nhật ký, phản hồi và điểm quá trình được lưu theo từng tuần.</p>
    </div>
  )
}

