import { ReactNode, useRef, useState } from 'react'
import { AlertCircle, Award, Check, CheckCircle2, CircleDashed, Download, FileText, FlaskConical, GraduationCap, Lock, MessageSquare, Pencil, Send, Trash2, TriangleAlert, Trophy, UploadCloud, UserRound, ArrowRight, BookOpenCheck, CalendarClock } from 'lucide-react'
import { useStore } from '../lib/store'
import { APPENDIX_EXT, APPENDIX_MAX_MB, EMPTY_FINAL_FIELDS, FINAL_STATUS_META, FinalErrors, FinalFields, FinalStatus, GUIDE_DOCS, REPORT_EXT, REPORT_MAX_MB, WEIGHTS, finalGates, finalStatus, guideText, validateFinal } from '../lib/final'
import { cx, formatDate, formatDateTime, formatSize } from '../lib/utils'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary, inputCls, Modal } from '../components/ui'
import { ClockPanel } from './Diary'

function StatusPill({ status }: { status: FinalStatus }) {
  const m = FINAL_STATUS_META[status]
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', m.cls)}>{m.label}</span>
}

function Card({ title, icon: Icon, children, tone }: { title: string; icon?: typeof FileText; children: ReactNode; tone?: 'orange' }) {
  return (
    <section className={cx('rounded-2xl border p-6', tone === 'orange' ? 'border-orange-200 bg-orange-50' : 'border-stone-200/80 bg-white')}>
      <h2 className={cx('mb-4 flex items-center gap-2 font-bold', tone === 'orange' ? 'text-orange-900' : 'text-stone-900')}>{Icon && <Icon size={18} className={tone === 'orange' ? '' : 'text-vlu-600'} />}{title}</h2>
      {children}
    </section>
  )
}

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

function FilePick({ label, hint, exts, maxMb, name, size, onPick, onClear, error, required }: { label: string; hint: string; exts: string[]; maxMb: number; name: string; size: number; onPick: (f: File) => string | null; onClear: () => void; error?: string; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [localErr, setLocalErr] = useState('')
  const pick = (f?: File | null) => {
    if (!f) return
    setLocalErr(onPick(f) ?? '')
  }
  const err = localErr || error
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-stone-700">{label} {required && <span className="text-rose-500">*</span>}</p>
      {name ? (
        <div className="flex items-center gap-3 rounded-xl border border-vlu-200 bg-vlu-50/60 p-3.5">
          <span className="grid size-10 place-items-center rounded-lg bg-white text-vlu-600"><FileText size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">{name}</p>
            <p className="text-xs text-stone-500">{formatSize(size)}</p>
          </div>
          <button onClick={() => { setLocalErr(''); onClear() }} aria-label="Xóa file" className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-rose-600"><Trash2 size={17} /></button>
        </div>
      ) : (
        <div role="button" tabIndex={0} onClick={() => ref.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }} className={cx('flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition', err ? 'border-rose-300 bg-rose-50/40' : 'border-stone-300 hover:border-vlu-400 hover:bg-vlu-50/40')}>
          <UploadCloud size={26} className="text-vlu-500" />
          <p className="mt-2 text-sm font-semibold text-stone-800">Kéo thả hoặc <span className="text-vlu-600 underline">chọn file từ máy</span></p>
          <p className="mt-1 text-xs text-stone-500">{hint}</p>
        </div>
      )}
      <input ref={ref} type="file" hidden accept={exts.map((e) => '.' + e).join(',')} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      {err && <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600"><AlertCircle size={13} className="mt-px shrink-0" />{err}</p>}
    </div>
  )
}

const ext = (n: string) => n.split('.').pop()?.toLowerCase() ?? ''

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function Gate({ ok, title, detail, action }: { ok: boolean; title: string; detail: ReactNode; action?: ReactNode }) {
  return (
    <li className={cx('flex items-start gap-3 rounded-xl px-4 py-3.5', ok ? 'bg-emerald-50' : 'bg-stone-50')}>
      {ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleDashed size={20} className="mt-0.5 shrink-0 text-stone-400" />}
      <div className="min-w-0 flex-1">
        <p className={cx('text-sm font-semibold', ok ? 'text-emerald-900' : 'text-stone-800')}>{title}</p>
        <p className="mt-0.5 text-sm text-stone-600">{detail}</p>
      </div>
      {action}
    </li>
  )
}

const Score = ({ v }: { v: number | null }) => <span className="font-bold tabular-nums">{v === null ? '—' : v.toFixed(1)}</span>

export function FinalPage() {
  const s = useStore()
  const { diaryReg, registrations, diary, diaryNow, final, submitFinal } = s
  const [fields, setFields] = useState<FinalFields>(final.report?.fields ?? EMPTY_FINAL_FIELDS)
  const [pledge, setPledge] = useState(false)
  const [errors, setErrors] = useState<FinalErrors>({})
  const [formError, setFormError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const [to, setTo] = useState<'advisor' | 'faculty'>('advisor')

  if (!diaryReg) {
    const reg = registrations[0]
    return (
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Báo cáo cuối kỳ & Kết quả</h1>
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-stone-200/80 bg-white p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-vlu-50 text-vlu-600"><Lock size={26} /></span>
          <h2 className="mt-4 text-xl font-bold text-stone-900">Chức năng chưa được mở</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">Bạn cần được Khoa duyệt đăng ký thực tập và phân công GVHD, sau đó hoàn thành kỳ thực tập và nhật ký các tuần để nộp báo cáo cuối kỳ.</p>
          <button onClick={() => navigate(reg ? `/registration/${reg.id}` : '/registration')} className={btnPrimary + ' mt-6'}>{reg ? 'Xem hồ sơ đăng ký' : 'Đăng ký thực tập với Khoa'}</button>
        </div>
      </div>
    )
  }

  const g = finalGates(diaryReg, diary, diaryNow)
  const st = finalStatus(final)
  const report = final.report
  const lastReview = report?.reviews.find((r) => r.submissionNo === report.submissionNo)
  const canFill = st === 'none' || st === 'revision'
  const gatesOk = g.ended && g.diaryComplete && (st === 'revision' || g.portal === 'open')
  const lastVersion = report?.versions[report.versions.length - 1]
  const sameFile = st === 'revision' && lastVersion && fields.reportName === lastVersion.snapshot.reportName && fields.reportSize === lastVersion.snapshot.reportSize
  const grading = final.grading
  const set = (k: keyof FinalFields, v: string) => setFields((f) => ({ ...f, [k]: v }))

  // BR2: đúng quy chuẩn định dạng của Nhà trường
  const pickReport = (f: File) => {
    if (!REPORT_EXT.includes(ext(f.name))) return `Sai quy chuẩn định dạng. Báo cáo chính chỉ chấp nhận file ${REPORT_EXT.join(', ').toUpperCase()}.`
    if (f.size > REPORT_MAX_MB * 1024 * 1024) return `File vượt quá ${REPORT_MAX_MB} MB.`
    setFields((x) => ({ ...x, reportName: f.name, reportSize: f.size }))
    setErrors((e) => ({ ...e, reportName: undefined }))
    return null
  }
  const pickAppendix = (f: File) => {
    if (!APPENDIX_EXT.includes(ext(f.name))) return `Phụ lục chỉ chấp nhận: ${APPENDIX_EXT.join(', ').toUpperCase()}.`
    if (f.size > APPENDIX_MAX_MB * 1024 * 1024) return `File vượt quá ${APPENDIX_MAX_MB} MB.`
    setFields((x) => ({ ...x, appendixName: f.name, appendixSize: f.size }))
    return null
  }

  const review = () => {
    const errs = validateFinal(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return setFormError('Vui lòng điền đầy đủ các trường bắt buộc.')
    if (sameFile) return setFormError('Bạn cần tải lên file báo cáo đã chỉnh sửa, khác với file đã nộp trước đó.')
    if (!pledge) return setFormError('Vui lòng xác nhận cam kết trước khi nộp.')
    setFormError('')
    setConfirm(true)
  }
  const submit = () => {
    const r = submitFinal(fields)
    setConfirm(false)
    if (!r.ok) return setFormError(r.error)
    setFormError('')
    setPledge(false)
  }

  const stages = [
    { label: 'Đủ điều kiện nộp', done: g.ended && g.diaryComplete },
    { label: 'Nộp báo cáo', done: !!report },
    { label: 'GVHD kiểm tra', done: st === 'accepted' || st === 'graded', warn: st === 'revision' },
    { label: 'Công bố kết quả', done: st === 'graded' },
  ]
  const firstTodo = stages.findIndex((x) => !x.done)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Báo cáo cuối kỳ & Kết quả</h1>
          <p className="mt-1.5 text-stone-500">{diaryReg.companyName} · GVHD {diaryReg.advisor!.name}</p>
        </div>
        <StatusPill status={st} />
      </div>

      <ol className="mb-6 flex rounded-2xl border border-stone-200/80 bg-white p-4">
        {stages.map((x, i) => (
          <li key={x.label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={cx('grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold', x.done ? 'bg-vlu-600 text-white' : x.warn ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400' : i === firstTodo ? 'bg-vlu-100 text-vlu-700 ring-2 ring-vlu-500' : 'bg-stone-200 text-stone-400')}>{x.done ? <Check size={14} /> : i + 1}</span>
            <span className={cx('hidden text-xs font-semibold sm:block', x.done || i === firstTodo ? 'text-stone-800' : 'text-stone-400')}>{x.warn ? 'Cần chỉnh sửa' : x.label}</span>
            {i < stages.length - 1 && <span className={cx('mx-1 h-px flex-1', x.done ? 'bg-vlu-300' : 'bg-stone-200')} />}
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {st === 'graded' && grading ? (
            <section className="relative overflow-hidden rounded-2xl bg-vlu-800 p-7 text-white">
              <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-vlu-600/50 blur-3xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-vlu-200"><Award size={16} />Điểm tổng kết học phần thực tập</p>
                  <p className="mt-2 text-6xl font-extrabold tracking-tight">{grading.total.toFixed(1)}<span className="text-2xl font-semibold text-vlu-300"> / 10</span></p>
                  <p className="mt-2 text-sm text-vlu-100">Công bố lúc {formatDateTime(grading.at)}</p>
                </div>
                <div className="text-right">
                  <span className={cx('inline-flex rounded-full px-4 py-1.5 text-sm font-bold', grading.passed ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/40' : 'bg-rose-400/20 text-rose-200 ring-1 ring-rose-300/40')}>{grading.passed ? 'Đạt' : 'Không đạt'}</span>
                  <p className="mt-3 text-2xl font-bold">{grading.rank}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="flex items-start gap-4 rounded-2xl border border-dashed border-stone-300 bg-white p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500"><Lock size={20} /></span>
              <div>
                <h2 className="font-bold text-stone-900">Điểm và nhận xét tổng kết chưa được công bố</h2>
                <p className="mt-1 text-sm text-stone-600">Bạn chỉ xem được điểm thành phần, đánh giá của Doanh nghiệp và nhận xét tổng kết sau khi GVHD hoàn tất chấm điểm trên hệ thống.</p>
              </div>
            </section>
          )}

          {!report && (
            <Card title="Điều kiện nộp báo cáo" icon={BookOpenCheck}>
              <ul className="space-y-2.5">
                <Gate ok={g.ended} title="Đã hoàn thành kỳ thực tập tại doanh nghiệp" detail={g.ended ? 'Kỳ thực tập đã kết thúc.' : `Kỳ thực tập kết thúc ngày ${formatDate(new Date(diaryReg.endDate + 'T00:00:00'))}.`} />
                <Gate ok={g.diaryComplete} title="Nhật ký công việc các tuần đầy đủ" detail={`Đã nộp ${g.diaryDone}/${g.diaryTotal} tuần${g.diaryComplete ? '.' : ' (tuần cần chỉnh sửa hoặc quá hạn chưa nộp đều chưa tính).'}`} action={!g.diaryComplete && <button onClick={() => navigate('/diary')} className={btnSecondary + ' !px-3 !py-1.5 !text-xs'}>Mở nhật ký <ArrowRight size={13} /></button>} />
                <Gate ok={g.portal === 'open'} title="Cổng thu bài cuối kỳ của Khoa" detail={<>Mở từ <b>{formatDate(g.window.open)}</b> đến hết <b>{formatDate(g.window.close)}</b>. {g.portal === 'upcoming' ? 'Cổng chưa mở.' : g.portal === 'closed' ? 'Cổng đã đóng.' : 'Cổng đang mở.'}</>} />
              </ul>
            </Card>
          )}

          {st === 'revision' && lastReview && (
            <Card title="GVHD yêu cầu chỉnh sửa báo cáo" icon={Pencil} tone="orange">
              <p className="text-[15px] leading-relaxed text-orange-950">{lastReview.comment}</p>
              <ol className="mt-3 space-y-2">
                {lastReview.items.map((it, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-white/70 p-3.5 text-sm text-orange-950"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange-200 text-xs font-bold text-orange-800">{i + 1}</span>{it}</li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-orange-800">Chỉnh sửa theo các mục trên và tải lên file báo cáo mới, rồi bấm "Cập nhật báo cáo".</p>
            </Card>
          )}

          {canFill ? (
            <Card title={st === 'revision' ? 'Cập nhật báo cáo cuối kỳ' : 'Nộp báo cáo cuối kỳ'} icon={Send}>
              {!gatesOk && <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-inset ring-amber-200"><TriangleAlert size={17} className="mt-0.5 shrink-0" />Bạn chưa đủ điều kiện nộp báo cáo. Vui lòng xem mục điều kiện bên trên.</p>}
              {formError && <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{formError}</p>}
              <fieldset disabled={!gatesOk} className="space-y-4 disabled:opacity-60">
                <Field label="Tên đề tài / tiêu đề báo cáo" required error={errors.title}><input className={inputCls} value={fields.title} onChange={(e) => set('title', e.target.value)} /></Field>
                <Field label="Tóm tắt nội dung báo cáo" required error={errors.summary} hint="Tối thiểu 50 ký tự."><textarea className={inputCls + ' min-h-28 resize-y'} value={fields.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
                <FilePick label="File báo cáo tổng kết" required hint={`Chỉ ${REPORT_EXT.join(', ').toUpperCase()} · tối đa ${REPORT_MAX_MB} MB · tên file khuyến nghị BCTT_MSSV_HoVaTen.pdf`} exts={REPORT_EXT} maxMb={REPORT_MAX_MB} name={fields.reportName} size={fields.reportSize} onPick={pickReport} onClear={() => setFields((f) => ({ ...f, reportName: '', reportSize: 0 }))} error={errors.reportName} />
                <FilePick label="Phụ lục (không bắt buộc)" hint={`${APPENDIX_EXT.join(', ').toUpperCase()} · tối đa ${APPENDIX_MAX_MB} MB`} exts={APPENDIX_EXT} maxMb={APPENDIX_MAX_MB} name={fields.appendixName} size={fields.appendixSize} onPick={pickAppendix} onClear={() => setFields((f) => ({ ...f, appendixName: '', appendixSize: 0 }))} />
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-stone-700">
                  <input type="checkbox" className="mt-0.5 size-4 accent-vlu-600" checked={pledge} onChange={(e) => setPledge(e.target.checked)} />
                  Tôi cam đoan nội dung báo cáo do chính tôi thực hiện, trung thực và đúng quy định của Nhà trường.
                </label>
                <div className="flex justify-end border-t border-stone-100 pt-4">
                  <button type="button" onClick={review} disabled={!gatesOk} className={btnPrimary}><Send size={16} />{st === 'revision' ? 'Cập nhật báo cáo' : 'Nộp báo cáo cuối kỳ'}</button>
                </div>
              </fieldset>
            </Card>
          ) : (
            report && (
              <Card title="Báo cáo đã nộp" icon={FileText}>
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-xs text-stone-500">Tiêu đề</dt><dd className="font-semibold text-stone-900">{report.fields.title}</dd></div>
                  <div><dt className="text-xs text-stone-500">Tóm tắt</dt><dd className="whitespace-pre-line text-stone-800">{report.fields.summary}</dd></div>
                  <div><dt className="text-xs text-stone-500">File báo cáo</dt><dd className="font-medium text-stone-900">{report.fields.reportName} <span className="text-xs font-normal text-stone-500">({formatSize(report.fields.reportSize)})</span></dd></div>
                  {report.fields.appendixName && <div><dt className="text-xs text-stone-500">Phụ lục</dt><dd className="font-medium text-stone-900">{report.fields.appendixName} <span className="text-xs font-normal text-stone-500">({formatSize(report.fields.appendixSize)})</span></dd></div>}
                  <div><dt className="text-xs text-stone-500">Nộp lúc</dt><dd className="text-stone-800">{formatDateTime(report.submittedAt)}{report.versions.length > 1 && ` · lần nộp ${report.submissionNo}`}</dd></div>
                </dl>
                {(st === 'accepted' || st === 'graded') && lastReview && <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-900"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{lastReview.comment}</p>}
                {st === 'submitted' && <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900"><CalendarClock size={17} className="mt-0.5 shrink-0" />Báo cáo đang chờ GVHD kiểm tra. Bạn sẽ nhận thông báo khi có kết quả.</p>}
              </Card>
            )
          )}

          {st === 'graded' && grading && (
            <>
              <Card title="Bảng điểm thành phần" icon={Trophy}>
                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                      <tr><th className="px-4 py-3 font-semibold">Thành phần</th><th className="px-4 py-3 text-right font-semibold">Trọng số</th><th className="px-4 py-3 text-right font-semibold">Điểm</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr><td className="px-4 py-3">Điểm quá trình (GVHD chấm các tuần)</td><td className="px-4 py-3 text-right text-stone-500">{WEIGHTS.process * 100}%</td><td className="px-4 py-3 text-right"><Score v={grading.processScore} /></td></tr>
                      <tr><td className="px-4 py-3">Phiếu đánh giá của Doanh nghiệp / Người HD tại DN</td><td className="px-4 py-3 text-right text-stone-500">{WEIGHTS.mentor * 100}%</td><td className="px-4 py-3 text-right"><Score v={grading.mentorScore} /></td></tr>
                      <tr><td className="px-4 py-3">Điểm chấm báo cáo tổng kết của GVHD</td><td className="px-4 py-3 text-right text-stone-500">{WEIGHTS.advisor * 100}%</td><td className="px-4 py-3 text-right"><Score v={grading.advisorScore} /></td></tr>
                      <tr className="bg-vlu-50/70 font-bold text-vlu-900"><td className="px-4 py-3">Điểm tổng kết</td><td className="px-4 py-3 text-right">100%</td><td className="px-4 py-3 text-right text-lg tabular-nums">{grading.total.toFixed(1)}</td></tr>
                    </tbody>
                  </table>
                </div>
                {grading.processScore === null && <p className="mt-3 text-xs text-stone-500">Chưa có điểm quá trình nên hệ thống quy đổi lại trọng số của các thành phần còn lại.</p>}
              </Card>

              {final.mentorEval && (
                <Card title="Đánh giá của Doanh nghiệp / Người hướng dẫn tại DN" icon={UserRound}>
                  <ul className="space-y-3">
                    {final.mentorEval.criteria.map((c) => (
                      <li key={c.label} className="text-sm">
                        <div className="mb-1 flex justify-between"><span className="text-stone-700">{c.label}</span><span className="font-bold tabular-nums text-stone-900">{c.score.toFixed(1)}</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${c.score * 10}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl bg-sky-50 p-4 text-sm leading-relaxed text-stone-800">{final.mentorEval.comment}</p>
                </Card>
              )}

              <Card title="Nhận xét tổng kết của GVHD" icon={GraduationCap}>
                <p className="rounded-xl bg-amber-50/70 p-4 text-[15px] leading-relaxed text-stone-800">{grading.advisorComment}</p>
                <p className="mt-2 text-xs text-stone-500">{diaryReg.advisor!.name} · {formatDateTime(grading.at)}</p>
              </Card>
            </>
          )}
        </div>

        <aside className="space-y-5">
          <Card title="Tài liệu hướng dẫn từ Nhà trường" icon={Download}>
            <ul className="space-y-2">
              {GUIDE_DOCS.map((d) => (
                <li key={d.id}>
                  <button onClick={() => download(d.file, guideText(d.id, diaryReg))} className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3 text-left text-sm transition hover:border-vlu-300 hover:bg-vlu-50/50">
                    <FileText size={18} className="shrink-0 text-vlu-600" />
                    <span className="flex-1 font-medium text-stone-800">{d.name}</span>
                    <Download size={15} className="text-stone-400" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-vlu-50/60 p-4 text-xs leading-relaxed text-stone-700">
              <p className="font-bold text-vlu-800">Quy chuẩn nộp bài</p>
              <p className="mt-1">Báo cáo chính: <b>{REPORT_EXT.join(', ').toUpperCase()}</b>, tối đa {REPORT_MAX_MB} MB. Phụ lục: {APPENDIX_EXT.join(', ').toUpperCase()}.</p>
              <p className="mt-1">Cổng thu bài: {formatDate(g.window.open)} – {formatDate(g.window.close)}.</p>
            </div>
          </Card>

          <Card title="Trao đổi với GVHD / Khoa" icon={MessageSquare}>
            <div className="mb-3 space-y-1 text-xs text-stone-500">
              <p>GVHD: {diaryReg.advisor!.name} · {diaryReg.advisor!.email}</p>
              <p>Khoa: khoa@vanlanguni.vn · {diaryReg.advisor!.phone}</p>
            </div>
            {final.messages.length > 0 && (
              <ul className="mb-3 max-h-64 space-y-2 overflow-y-auto">
                {final.messages.map((m) => (
                  <li key={m.id} className={cx('max-w-[92%] rounded-xl px-3.5 py-2.5 text-sm', m.from === 'student' ? 'ml-auto bg-vlu-600 text-white' : 'bg-stone-100 text-stone-800')}>
                    <p className={cx('mb-0.5 text-[11px] font-semibold', m.from === 'student' ? 'text-vlu-200' : 'text-stone-500')}>{m.from === 'student' ? `Bạn → ${m.to === 'advisor' ? 'GVHD' : 'Khoa'}` : m.from === 'advisor' ? 'GVHD' : 'Khoa'}</p>
                    {m.text}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <select value={to} onChange={(e) => setTo(e.target.value as 'advisor' | 'faculty')} className={inputCls + ' !w-28 shrink-0 !px-2.5'} aria-label="Người nhận">
                <option value="advisor">GVHD</option>
                <option value="faculty">Khoa</option>
              </select>
              <input className={inputCls} placeholder="Nhập câu hỏi…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && msg.trim()) { s.sendMessage(to, msg); setMsg('') } }} />
              <button onClick={() => { s.sendMessage(to, msg); setMsg('') }} disabled={!msg.trim()} aria-label="Gửi" className={btnPrimary + ' !px-3'}><Send size={16} /></button>
            </div>
          </Card>

          {report && (
            <Card title="Lịch sử báo cáo cuối kỳ">
              <ol className="relative ml-1.5 space-y-4 border-l border-stone-200 pl-5">
                {report.history.map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span className={cx('absolute -left-[25px] top-1.5 size-2.5 rounded-full ring-4 ring-white', h.actor === 'student' ? 'bg-vlu-500' : 'bg-amber-500')} />
                    <p className="text-stone-800">{h.text}</p>
                    <p className="text-xs text-stone-400">{formatDateTime(h.at)}</p>
                  </li>
                ))}
              </ol>
              {report.versions.length > 1 && <p className="mt-4 text-xs text-stone-500">Đã lưu {report.versions.length} phiên bản file: {report.versions.map((v) => v.snapshot.reportName).join(' → ')}</p>}
            </Card>
          )}

          <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-stone-500"><FlaskConical size={14} />Demo: giả lập các bên liên quan</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button onClick={s.completeInternshipDemo} className="col-span-2 rounded-lg bg-stone-800 px-2 py-2 text-white hover:bg-stone-900">Hoàn thành nhanh kỳ thực tập và nhật ký</button>
              <button onClick={() => s.simulateFinalReview('confirmed')} disabled={st !== 'submitted'} className="rounded-lg bg-emerald-600 px-2 py-2 text-white hover:bg-emerald-700 disabled:bg-stone-300">GVHD: Đạt yêu cầu</button>
              <button onClick={() => s.simulateFinalReview('revision')} disabled={st !== 'submitted'} className="rounded-lg bg-orange-600 px-2 py-2 text-white hover:bg-orange-700 disabled:bg-stone-300">GVHD: Cần chỉnh sửa</button>
              <button onClick={s.simulateMentorEval} disabled={!!final.mentorEval} className="rounded-lg bg-sky-600 px-2 py-2 text-white hover:bg-sky-700 disabled:bg-stone-300">DN gửi phiếu đánh giá {final.mentorEval && '✓'}</button>
              <button onClick={s.simulateGrading} disabled={st !== 'accepted' || !final.mentorEval} className="rounded-lg bg-vlu-600 px-2 py-2 text-white hover:bg-vlu-700 disabled:bg-stone-300">GVHD chấm điểm</button>
              <button onClick={s.simulateReply} disabled={!final.messages.some((m) => m.from === 'student')} className="col-span-2 rounded-lg border border-stone-300 bg-white px-2 py-2 text-stone-700 hover:bg-stone-100 disabled:opacity-50">GVHD / Khoa trả lời tin nhắn</button>
            </div>
            {st === 'accepted' && !final.mentorEval && <p className="mt-2 text-xs text-stone-500">GVHD chỉ chấm điểm được khi đã có phiếu đánh giá của doanh nghiệp.</p>}
          </section>
          <ClockPanel />
        </aside>
      </div>

      {confirm && (
        <Modal title="Xác nhận nộp báo cáo lên hệ thống" onClose={() => setConfirm(false)}>
          <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
            {[
              ['Tiêu đề', fields.title],
              ['File báo cáo', `${fields.reportName} (${formatSize(fields.reportSize)})`],
              ['Phụ lục', fields.appendixName || 'Không có'],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[110px_1fr]"><dt className="text-stone-500">{k}</dt><dd className="break-words font-medium text-stone-900">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-stone-600">Sau khi nộp, báo cáo sẽ chuyển sang trạng thái <b>Chờ GVHD kiểm tra</b> và bạn không thể thay đổi cho đến khi có phản hồi.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setConfirm(false)} className={btnSecondary}>Xem lại</button>
            <button onClick={submit} className={btnPrimary}>Xác nhận nộp báo cáo</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

