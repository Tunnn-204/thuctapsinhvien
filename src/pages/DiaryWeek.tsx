import { ReactNode, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, CalendarClock, ClipboardCheck, FileText, FlaskConical, GraduationCap, Lightbulb, Lock, Pencil, Save, Send, ShieldAlert, Star, Trash2, TriangleAlert, UploadCloud, UserRound } from 'lucide-react'
import { useStore } from '../lib/store'
import { ATTACH_EXT, ATTACH_MAX_MB, EMPTY_FIELDS, INCIDENT_CATEGORIES, WeekErrors, WeekFields, currentFeedbacks, weekStatus, weeksOf, validateWeek } from '../lib/diary'
import { cx, formatDate, formatDateTime, formatSize } from '../lib/utils'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary, inputCls, Modal } from '../components/ui'
import { ClockPanel, WeekBadge } from './Diary'

function Field({ label, error, required, hint, children }: { label: string; error?: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label} {required && <span className="text-rose-500">*</span>}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600"><AlertCircle size={13} className="mt-px shrink-0" />{error}</span>}
    </label>
  )
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-stone-800">{value || 'Không có'}</p>
    </div>
  )
}

const ACTOR_DOT: Record<string, string> = { student: 'bg-vlu-500', mentor: 'bg-sky-500', advisor: 'bg-amber-500', system: 'bg-rose-500' }
const ACTOR_LABEL: Record<string, string> = { student: 'Sinh viên', mentor: 'Người HD tại DN', advisor: 'GVHD', system: 'Hệ thống' }

export function DiaryWeek({ no }: { no: number }) {
  const { diaryReg, diary, diaryNow, saveWeek, reportIncident, simulateFeedback, giveGuidance } = useStore()
  const weekInfo = diaryReg ? weeksOf(diaryReg).find((w) => w.no === no) : undefined
  const log = diary.weeks[no]
  const [fields, setFields] = useState<WeekFields>(log?.fields ?? EMPTY_FIELDS)
  const [errors, setErrors] = useState<WeekErrors>({})
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [incident, setIncident] = useState(false)
  const [incCat, setIncCat] = useState(INCIDENT_CATEGORIES[0])
  const [incText, setIncText] = useState('')
  const [incErr, setIncErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const back = () => navigate('/diary')
  if (!diaryReg || !weekInfo) {
    return (
      <div>
        <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>
        <p className="flex items-start gap-2 rounded-xl bg-vlu-50 p-4 text-sm text-vlu-900 ring-1 ring-inset ring-vlu-200"><Lock size={18} className="mt-0.5 shrink-0" />Chức năng nhật ký chỉ mở sau khi Khoa duyệt đăng ký thực tập và phân công GVHD.</p>
      </div>
    )
  }

  const st = weekStatus(weekInfo, log, diaryNow)
  const editable = st === 'todo' || st === 'draft' || st === 'overdue' || st === 'revision'
  const isLateNow = diaryNow > weekInfo.deadline
  const fb = currentFeedbacks(log)
  const revisionFbs = fb.filter((f) => f.decision === 'revision')
  const incidents = diary.incidents.filter((i) => i.weekNo === no)
  const allFeedbacks = [...(log?.feedbacks ?? [])].sort((a, b) => b.at.localeCompare(a.at))
  const lastVersion = log?.versions[log.versions.length - 1]
  const unchangedAfterRevision = st === 'revision' && lastVersion && JSON.stringify(fields) === JSON.stringify(lastVersion.snapshot)

  const set = (k: keyof WeekFields, v: string) => { setFields((f) => ({ ...f, [k]: v })); setSaved(false) }

  const pickFile = (file?: File | null) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ATTACH_EXT.includes(ext)) return setFormError(`Định dạng file không hợp lệ. Chấp nhận: ${ATTACH_EXT.join(', ').toUpperCase()}.`)
    if (file.size > ATTACH_MAX_MB * 1024 * 1024) return setFormError(`File vượt quá ${ATTACH_MAX_MB} MB.`)
    setFormError('')
    setFields((f) => ({ ...f, attachmentName: file.name, attachmentSize: file.size }))
  }

  const saveDraft = () => {
    const r = saveWeek(no, fields, false)
    if (!r.ok) return setFormError(r.error)
    setFormError('')
    setSaved(true)
  }
  const review = () => {
    const errs = validateWeek(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return setFormError('Vui lòng điền đầy đủ các trường bắt buộc.')
    if (unchangedAfterRevision) return setFormError('Bạn chưa chỉnh sửa nội dung báo cáo theo yêu cầu. Vui lòng cập nhật rồi nộp lại.')
    setFormError('')
    setConfirm(true)
  }
  const submit = () => {
    const r = saveWeek(no, fields, true)
    if (!r.ok) {
      setConfirm(false)
      return setFormError(r.error)
    }
    setConfirm(false)
  }
  const sendIncident = () => {
    const r = reportIncident(no, incCat, incText)
    if (!r.ok) return setIncErr(r.error)
    setIncident(false)
    setIncText('')
    setIncErr('')
  }

  return (
    <div>
      <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Nhật ký & Tiến độ thực tập</button>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{diaryReg.companyName}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900">Tuần {no} · {formatDate(weekInfo.start)} – {formatDate(weekInfo.end)}</h1>
            <p className={cx('mt-2 inline-flex items-center gap-1.5 text-sm', st === 'overdue' ? 'font-semibold text-rose-600' : 'text-stone-500')}><CalendarClock size={15} />Hạn nộp báo cáo: {formatDateTime(weekInfo.deadline)}</p>
          </div>
          <div className="flex items-center gap-2">
            {log?.late && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">Nộp trễ hạn</span>}
            <WeekBadge status={st} />
          </div>
        </div>
      </section>

      {st === 'revision' && (
        <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="flex items-center gap-2 font-bold text-orange-900"><Pencil size={18} />Yêu cầu chỉnh sửa báo cáo tuần {no}</h2>
          <ul className="mt-3 space-y-3">
            {revisionFbs.map((f) => (
              <li key={f.id} className="rounded-xl bg-white/70 p-4 text-sm text-orange-950">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-orange-700">{f.by === 'mentor' ? 'Người hướng dẫn tại DN' : 'GVHD'} · {formatDateTime(f.at)}</p>
                {f.comment}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-orange-800">Bạn cần cập nhật nội dung báo cáo của tuần này và nộp lại.</p>
        </section>
      )}
      {st === 'overdue' && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-inset ring-rose-200"><TriangleAlert size={18} className="mt-0.5 shrink-0" />Tuần này đã quá hạn nộp. Hệ thống đã cảnh báo GVHD. Hãy nộp báo cáo sớm nhất và trao đổi với GVHD nếu có lý do khách quan.</p>
      )}
      {st === 'future' && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-stone-100 p-4 text-sm text-stone-700"><Lock size={18} className="mt-0.5 shrink-0" />Chưa đến tuần thực tập này nên chưa thể ghi nhật ký.</p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-stone-900"><ClipboardCheck size={18} className="text-vlu-600" />Nhật ký & báo cáo tuần</h2>
            {editable ? (
              <div className="space-y-4">
                {formError && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{formError}</p>}
                <Field label="Công việc đã thực hiện trong tuần" required error={errors.content} hint="Mô tả các đầu việc theo từng ngày hoặc từng nhiệm vụ.">
                  <textarea className={inputCls + ' min-h-32 resize-y'} value={fields.content} onChange={(e) => set('content', e.target.value)} />
                </Field>
                <Field label="Kết quả đạt được và khó khăn gặp phải" required error={errors.results}>
                  <textarea className={inputCls + ' min-h-24 resize-y'} value={fields.results} onChange={(e) => set('results', e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <Field label="Kế hoạch tuần tới"><textarea className={inputCls + ' min-h-20 resize-y'} value={fields.nextPlan} onChange={(e) => set('nextPlan', e.target.value)} /></Field>
                  <Field label="Số giờ làm việc" required error={errors.hours}><input className={inputCls} type="number" min={1} max={60} value={fields.hours} onChange={(e) => set('hours', e.target.value)} /></Field>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-stone-700">Báo cáo định kỳ / minh chứng công việc</p>
                  {fields.attachmentName ? (
                    <div className="flex items-center gap-3 rounded-xl border border-vlu-200 bg-vlu-50/60 p-3.5">
                      <span className="grid size-10 place-items-center rounded-lg bg-white text-vlu-600"><FileText size={20} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900">{fields.attachmentName}</p>
                        <p className="text-xs text-stone-500">{formatSize(fields.attachmentSize)}</p>
                      </div>
                      <button onClick={() => { setFields((f) => ({ ...f, attachmentName: '', attachmentSize: 0 })); setSaved(false) }} aria-label="Xóa file" className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-rose-600"><Trash2 size={17} /></button>
                    </div>
                  ) : (
                    <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }} className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-4 py-6 text-center transition hover:border-vlu-400 hover:bg-vlu-50/40">
                      <UploadCloud size={26} className="text-vlu-500" />
                      <p className="mt-2 text-sm font-semibold text-stone-800">Kéo thả hoặc <span className="text-vlu-600 underline">chọn file từ máy</span></p>
                      <p className="mt-1 text-xs text-stone-500">PDF, Word, Excel, ảnh, ZIP · tối đa {ATTACH_MAX_MB} MB · không bắt buộc</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" hidden accept={ATTACH_EXT.map((e) => '.' + e).join(',')} onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
                </div>
                {isLateNow && st !== 'revision' && <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-inset ring-amber-200"><TriangleAlert size={17} className="mt-0.5 shrink-0" />Nộp bây giờ sẽ bị tính là trễ hạn và hệ thống sẽ cảnh báo GVHD.</p>}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-100 pt-4">
                  {saved && <span className="mr-auto text-sm font-medium text-emerald-600">Đã lưu nháp</span>}
                  <button onClick={saveDraft} className={btnSecondary}><Save size={16} />Lưu nháp</button>
                  <button onClick={review} className={btnPrimary}><Send size={16} />{st === 'revision' ? 'Nộp lại báo cáo tuần' : 'Nộp báo cáo tuần'}</button>
                </div>
              </div>
            ) : st === 'future' ? (
              <p className="text-sm text-stone-500">Biểu mẫu sẽ mở khi đến tuần thực tập.</p>
            ) : (
              <div className="space-y-5">
                {(st === 'submitted' || st === 'done') && (
                  <p className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600"><Lock size={16} />Báo cáo đã nộp{lastVersion && (log?.versions.length ?? 0) > 1 ? ` (lần ${lastVersion.no})` : ''}, đang được xem xét. Bạn chỉ chỉnh sửa lại khi có yêu cầu "Cần chỉnh sửa".</p>
                )}
                <ReadField label="Công việc đã thực hiện" value={log!.fields.content} />
                <ReadField label="Kết quả và khó khăn" value={log!.fields.results} />
                <ReadField label="Kế hoạch tuần tới" value={log!.fields.nextPlan} />
                <div className="flex flex-wrap gap-x-10 gap-y-3">
                  <ReadField label="Số giờ làm việc" value={`${log!.fields.hours} giờ`} />
                  <ReadField label="Tệp đính kèm" value={log!.fields.attachmentName ? `${log!.fields.attachmentName} (${formatSize(log!.fields.attachmentSize)})` : ''} />
                </div>
              </div>
            )}
          </section>

          {log && log.versions.length > 0 && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
              <h2 className="mb-3 font-bold text-stone-900">Các lần nộp ({log.versions.length})</h2>
              <ul className="space-y-2">
                {[...log.versions].reverse().map((v) => (
                  <li key={v.no}>
                    <details className="group rounded-xl border border-stone-200 px-4 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-stone-900">Lần nộp {v.no}{v.late && <span className="ml-2 text-xs font-semibold text-rose-600">Trễ hạn</span>}</span>
                        <span className="text-xs text-stone-500">{formatDateTime(v.at)}</span>
                      </summary>
                      <div className="mt-3 space-y-3 border-t border-stone-100 pt-3">
                        <ReadField label="Công việc" value={v.snapshot.content} />
                        <ReadField label="Kết quả và khó khăn" value={v.snapshot.results} />
                        <ReadField label="Kế hoạch tuần tới" value={v.snapshot.nextPlan} />
                        <ReadField label="Giờ làm / Tệp" value={`${v.snapshot.hours} giờ${v.snapshot.attachmentName ? ' · ' + v.snapshot.attachmentName : ''}`} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 font-bold text-stone-900">Phản hồi & nhận xét</h2>
            {allFeedbacks.length === 0 ? (
              <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">Chưa có phản hồi. Người hướng dẫn tại DN và GVHD sẽ nhận xét sau khi bạn nộp báo cáo.</p>
            ) : (
              <ul className="space-y-3">
                {allFeedbacks.map((f) => (
                  <li key={f.id} className={cx('rounded-xl p-4 text-sm', f.by === 'mentor' ? 'bg-sky-50' : 'bg-amber-50/70')}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-600">
                        {f.by === 'mentor' ? <UserRound size={13} /> : <GraduationCap size={13} />}
                        {f.by === 'mentor' ? 'Người HD tại DN' : 'GVHD'}
                      </span>
                      <span className="text-[11px] text-stone-500">Lần nộp {f.submissionNo}</span>
                    </div>
                    <p className="text-stone-800">{f.comment}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={cx('font-semibold', f.decision === 'revision' ? 'text-orange-700' : 'text-emerald-700')}>{f.decision === 'revision' ? 'Cần chỉnh sửa' : 'Xác nhận'}</span>
                      {typeof f.score === 'number' && <span className="inline-flex items-center gap-1 font-bold text-amber-700"><Star size={13} className="fill-amber-400 text-amber-400" />Điểm quá trình: {f.score}/10</span>}
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400">{formatDateTime(f.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold text-stone-900"><ShieldAlert size={17} className="text-rose-500" />Sự cố trong tuần</h2>
              {st !== 'future' && <button onClick={() => setIncident(true)} className={btnSecondary + ' !px-3 !py-1.5 !text-xs'}>Báo cáo sự cố</button>}
            </div>
            {incidents.length === 0 ? (
              <p className="text-sm text-stone-500">Chưa có sự cố nào được báo cáo. Nếu gặp vấn đề ảnh hưởng tiến độ, hãy báo ngay để GVHD hỗ trợ.</p>
            ) : (
              <ul className="space-y-3">
                {incidents.map((i) => (
                  <li key={i.id} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm">
                    <p className="text-xs font-bold text-rose-700">{i.category}</p>
                    <p className="mt-1 text-stone-800">{i.text}</p>
                    <p className="mt-1 text-[11px] text-stone-400">{formatDateTime(i.at)}</p>
                    {i.guidance ? (
                      <div className="mt-3 flex gap-2 rounded-lg bg-white p-3 text-stone-800 ring-1 ring-amber-200">
                        <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                        <div><p className="text-xs font-bold text-amber-700">Hướng dẫn xử lý từ GVHD</p><p className="mt-0.5">{i.guidance}</p></div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-stone-500">Đã cảnh báo GVHD, đang chờ hướng dẫn xử lý.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 font-bold text-stone-900">Lịch sử tuần {no}</h2>
            {!log || log.history.length === 0 ? (
              <p className="text-sm text-stone-500">Chưa có hoạt động nào.</p>
            ) : (
              <ol className="relative ml-1.5 space-y-4 border-l border-stone-200 pl-5">
                {log.history.map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span className={cx('absolute -left-[25px] top-1.5 size-2.5 rounded-full ring-4 ring-white', ACTOR_DOT[h.actor])} />
                    <p className="text-stone-800">{h.text}</p>
                    <p className="text-xs text-stone-400">{ACTOR_LABEL[h.actor]} · {formatDateTime(h.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-stone-500"><FlaskConical size={14} />Demo: giả lập phản hồi</p>
            {st === 'submitted' ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {!fb.some((f) => f.by === 'mentor') && (
                  <>
                    <button onClick={() => simulateFeedback(no, 'mentor', 'confirmed')} className="rounded-lg bg-sky-600 px-2 py-2 text-white hover:bg-sky-700">NHD xác nhận</button>
                    <button onClick={() => simulateFeedback(no, 'mentor', 'revision')} className="rounded-lg bg-orange-600 px-2 py-2 text-white hover:bg-orange-700">NHD: Cần chỉnh sửa</button>
                  </>
                )}
                {!fb.some((f) => f.by === 'advisor') && (
                  <>
                    <button onClick={() => simulateFeedback(no, 'advisor', 'confirmed')} className="rounded-lg bg-vlu-600 px-2 py-2 text-white hover:bg-vlu-700">GVHD nhận xét + chấm điểm</button>
                    <button onClick={() => simulateFeedback(no, 'advisor', 'revision')} className="rounded-lg bg-orange-600 px-2 py-2 text-white hover:bg-orange-700">GVHD: Cần chỉnh sửa</button>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-500">Nộp báo cáo để giả lập phản hồi từ Người hướng dẫn tại DN và GVHD.</p>
            )}
            {incidents.some((i) => !i.guidance) && (
              <button onClick={() => giveGuidance(incidents.find((i) => !i.guidance)!.id)} className="mt-2 w-full rounded-lg bg-amber-600 px-2 py-2 text-xs font-semibold text-white hover:bg-amber-700">GVHD hướng dẫn xử lý sự cố</button>
            )}
          </section>
          <ClockPanel />
        </aside>
      </div>

      {confirm && (
        <Modal title="Xác nhận nộp báo cáo tuần" onClose={() => setConfirm(false)}>
          <p className="text-sm text-stone-600">Báo cáo tuần {no} sẽ được gửi tới Người hướng dẫn tại DN và GVHD.</p>
          <dl className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
            {[
              ['Công việc', fields.content],
              ['Kết quả / khó khăn', fields.results],
              ['Số giờ', `${fields.hours} giờ`],
              ['Tệp đính kèm', fields.attachmentName || 'Không có'],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-stone-500">{k}</dt><dd className="line-clamp-3 break-words font-medium text-stone-900">{v}</dd></div>
            ))}
          </dl>
          {isLateNow && st !== 'revision' && <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-inset ring-amber-200"><TriangleAlert size={17} className="mt-0.5 shrink-0" />Báo cáo này nộp trễ hạn. Hệ thống sẽ tự động cảnh báo GVHD và gửi nhắc nhở cho bạn.</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setConfirm(false)} className={btnSecondary}>Xem lại</button>
            <button onClick={submit} className={btnPrimary}>Xác nhận nộp</button>
          </div>
        </Modal>
      )}

      {incident && (
        <Modal title={`Báo cáo sự cố · Tuần ${no}`} onClose={() => setIncident(false)} width="max-w-lg">
          <p className="mb-4 text-sm text-stone-600">Hệ thống sẽ tự động cảnh báo GVHD để hỗ trợ bạn xử lý.</p>
          <div className="space-y-4">
            <Field label="Loại sự cố" required>
              <select className={inputCls} value={incCat} onChange={(e) => setIncCat(e.target.value)}>{INCIDENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Mô tả sự cố" required error={incErr}>
              <textarea className={inputCls + ' min-h-28 resize-y'} value={incText} onChange={(e) => setIncText(e.target.value)} placeholder="Nêu rõ điều gì đã xảy ra và ảnh hưởng đến tiến độ như thế nào…" />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setIncident(false)} className={btnSecondary}>Hủy</button>
            <button onClick={sendIncident} className={btnPrimary}>Gửi cảnh báo</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
