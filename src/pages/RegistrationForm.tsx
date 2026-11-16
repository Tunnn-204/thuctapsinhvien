import { useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Building2, DoorClosed, FileText, Lock, Pencil, Save, Send, Trash2, UploadCloud } from 'lucide-react'
import { JOBS } from '../lib/data'
import { useStore } from '../lib/store'
import { EVIDENCE_EXT, EVIDENCE_MAX_MB, RegErrors, RegInput, ROUND, addDays, formatDateISO, pickEditable, roundDates, toISODate, validateReg } from '../lib/registration'
import { companyOf, cx, formatSize } from '../lib/utils'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary, inputCls, Modal } from '../components/ui'

function Field({ label, error, required, hint, children }: { label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label} {required && <span className="text-rose-500">*</span>}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600"><AlertCircle size={13} className="mt-px shrink-0" />{error}</span>}
    </label>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
      <h2 className="mb-4 font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  )
}

export function RegistrationForm({ id, appId, self }: { id?: string; appId?: string | null; self?: boolean }) {
  const { registrations, applications, saveRegistration, portal } = useStore()
  const existing = id ? registrations.find((r) => r.id === id) : undefined
  const d = roundDates()
  const roundStart = toISODate(d.start)
  const roundEnd = toISODate(d.end)

  const [form, setForm] = useState<RegInput | null>(() => {
    if (existing) return pickEditable(existing)
    const base = {
      companyName: '', companyAddress: '', position: '', startDate: roundStart,
      endDate: toISODate(addDays(roundStart, 84)), mentorName: '', mentorTitle: '', mentorPhone: '', mentorEmail: '',
      evidenceName: '', evidenceSize: 0, note: '',
    }
    if (appId) {
      const app = applications.find((a) => a.id === appId)
      const job = app && JOBS.find((j) => j.id === app.jobId)
      if (!app || !job || app.status !== 'approved') return null
      const c = companyOf(job.companyId)
      return { ...base, source: 'system', applicationId: app.id, companyName: c.name, companyAddress: c.address, position: job.title }
    }
    return self ? { ...base, source: 'self' } : null
  })
  const [errors, setErrors] = useState<RegErrors>({})
  const [formError, setFormError] = useState('')
  const [step, setStep] = useState<'review' | 'confirm' | null>(null)
  const [modalError, setModalError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const back = () => navigate(existing ? `/registration/${existing.id}` : '/registration')

  if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
    return (
      <div>
        <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>
        <p className="flex items-start gap-2 rounded-xl bg-vlu-50 p-4 text-sm text-vlu-900 ring-1 ring-inset ring-vlu-200"><Lock size={18} className="mt-0.5 shrink-0" />Hồ sơ đang chờ phê duyệt hoặc đã được duyệt nên không thể chỉnh sửa.</p>
      </div>
    )
  }
  if (!existing && registrations.length > 0) {
    return (
      <div>
        <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>
        <p className="flex items-start gap-2 rounded-xl bg-vlu-50 p-4 text-sm text-vlu-900 ring-1 ring-inset ring-vlu-200"><Lock size={18} className="mt-0.5 shrink-0" />Bạn đã có hồ sơ đăng ký trong đợt thực tập này. Mỗi sinh viên chỉ được có 01 hồ sơ; hãy rút hồ sơ hiện tại nếu muốn lập hồ sơ khác.</p>
        <button onClick={() => navigate(`/registration/${registrations[0].id}`)} className={btnPrimary + ' mt-4'}>Xem hồ sơ hiện tại</button>
      </div>
    )
  }
  if (!form) {
    return (
      <div>
        <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>
        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">Bạn chỉ có thể đăng ký với đơn vị đã được Doanh nghiệp duyệt tiếp nhận CV, hoặc doanh nghiệp tự tìm có giấy tiếp nhận.</p>
      </div>
    )
  }

  const set = (k: keyof RegInput, v: string) => setForm((f) => ({ ...f!, [k]: v }))
  const isSystem = form.source === 'system'
  const isRevision = existing?.status === 'revision'
  const open = portal === 'open' || isRevision
  const errMsg = (k: keyof RegInput) => errors[k]

  const pickFile = (file?: File | null) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!EVIDENCE_EXT.includes(ext)) return setErrors((e) => ({ ...e, evidenceName: 'Định dạng không hợp lệ. Chấp nhận PDF, JPG, PNG, DOC, DOCX.' }))
    if (file.size > EVIDENCE_MAX_MB * 1024 * 1024) return setErrors((e) => ({ ...e, evidenceName: `File vượt quá ${EVIDENCE_MAX_MB} MB.` }))
    setForm((f) => ({ ...f!, evidenceName: file.name, evidenceSize: file.size }))
    setErrors((e) => ({ ...e, evidenceName: undefined }))
  }

  const saveDraft = () => {
    const r = saveRegistration(form, existing?.id, false)
    if (!r.ok) return setFormError(r.error)
    navigate(`/registration/${r.id}`)
  }

  const review = () => {
    const errs = validateReg(form)
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return setFormError('Vui lòng kiểm tra lại các trường được đánh dấu.')
    setModalError('')
    setStep('review')
  }

  const send = () => {
    const r = saveRegistration(form, existing?.id, true)
    if (!r.ok) return setModalError(r.error)
    setStep(null)
    navigate(`/registration/${r.id}`)
  }

  return (
    <div>
      <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">{isRevision ? 'Cập nhật hồ sơ đăng ký' : existing ? 'Chỉnh sửa hồ sơ đăng ký' : 'Lập hồ sơ đăng ký thực tập'}</h1>
      <p className="mt-1.5 text-stone-500">{ROUND.name}</p>

      {isRevision && (
        <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-orange-900"><Pencil size={17} />Yêu cầu chỉnh sửa từ Khoa</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-orange-900">{existing?.revisionNote}</p>
        </section>
      )}
      {!open && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
          <DoorClosed size={18} className="mt-0.5 shrink-0" />
          {portal === 'upcoming' ? 'Cổng đăng ký chưa mở. Bạn có thể lưu bản nháp và gửi khi cổng mở.' : 'Cổng đăng ký đã đóng. Bạn có thể lưu bản nháp nhưng không thể gửi hồ sơ cho Khoa.'}
        </p>
      )}
      {formError && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-inset ring-rose-200"><AlertCircle size={18} className="mt-0.5 shrink-0" />{formError}</p>}

      <div className="mt-6 space-y-5">
        <Card title="Đơn vị thực tập">
          {isSystem ? (
            <div className="flex items-start gap-3 rounded-xl bg-vlu-50/60 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-vlu-600"><Building2 size={20} /></span>
              <div>
                <p className="font-semibold text-stone-900">{form.companyName}</p>
                <p className="text-sm text-stone-600">{form.position}</p>
                <p className="mt-1 text-xs text-stone-500">{form.companyAddress}</p>
                <p className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Doanh nghiệp đã duyệt tiếp nhận CV trên hệ thống</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên doanh nghiệp" required error={errMsg('companyName')}><input className={inputCls} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} /></Field>
              <Field label="Vị trí thực tập" required error={errMsg('position')}><input className={inputCls} value={form.position} onChange={(e) => set('position', e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Địa chỉ" required error={errMsg('companyAddress')}><input className={inputCls} value={form.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} /></Field></div>
            </div>
          )}
        </Card>

        <Card title="Thời gian thực tập">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngày bắt đầu" required error={errMsg('startDate')} hint={`Trong khoảng ${formatDateISO(roundStart)} – ${formatDateISO(roundEnd)}`}>
              <input type="date" className={inputCls} min={roundStart} max={roundEnd} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Ngày kết thúc" required error={errMsg('endDate')} hint={`Tối thiểu ${ROUND.minDays / 7} tuần`}>
              <input type="date" className={inputCls} min={roundStart} max={roundEnd} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Người hướng dẫn tại doanh nghiệp">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" required error={errMsg('mentorName')}><input className={inputCls} value={form.mentorName} onChange={(e) => set('mentorName', e.target.value)} /></Field>
            <Field label="Chức danh" required error={errMsg('mentorTitle')}><input className={inputCls} placeholder="VD: Trưởng nhóm kỹ thuật" value={form.mentorTitle} onChange={(e) => set('mentorTitle', e.target.value)} /></Field>
            <Field label="Số điện thoại" required error={errMsg('mentorPhone')}><input className={inputCls} inputMode="tel" value={form.mentorPhone} onChange={(e) => set('mentorPhone', e.target.value)} /></Field>
            <Field label="Email" required error={errMsg('mentorEmail')}><input type="email" className={inputCls} value={form.mentorEmail} onChange={(e) => set('mentorEmail', e.target.value)} /></Field>
          </div>
        </Card>

        <Card title={isSystem ? 'Minh chứng bổ sung' : 'Giấy tiếp nhận thực tập'}>
          {isSystem && <p className="mb-3 text-sm text-stone-600">Kết quả Doanh nghiệp duyệt CV trên hệ thống được đính kèm tự động. Bạn có thể đính kèm thêm minh chứng (không bắt buộc).</p>}
          {!isSystem && <p className="mb-3 text-sm text-stone-600">Bắt buộc đính kèm giấy tiếp nhận có xác nhận của doanh nghiệp <span className="text-rose-500">*</span></p>}
          {form.evidenceName ? (
            <div className="flex items-center gap-3 rounded-xl border border-vlu-200 bg-vlu-50/60 p-3.5">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-vlu-600"><FileText size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{form.evidenceName}</p>
                <p className="text-xs text-stone-500">{formatSize(form.evidenceSize)}</p>
              </div>
              <button onClick={() => setForm((f) => ({ ...f!, evidenceName: '', evidenceSize: 0 }))} aria-label="Xóa file" className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-rose-600"><Trash2 size={17} /></button>
            </div>
          ) : (
            <div
              role="button" tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
              className={cx('flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition', errors.evidenceName ? 'border-rose-300 bg-rose-50/40' : 'border-stone-300 hover:border-vlu-400 hover:bg-vlu-50/40')}
            >
              <UploadCloud size={28} className="text-vlu-500" />
              <p className="mt-2 text-sm font-semibold text-stone-800">Kéo thả hoặc <span className="text-vlu-600 underline">chọn file từ máy</span></p>
              <p className="mt-1 text-xs text-stone-500">PDF, JPG, PNG, DOC, DOCX · tối đa {EVIDENCE_MAX_MB} MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
          {errors.evidenceName && <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"><AlertCircle size={13} />{errors.evidenceName}</p>}
          <div className="mt-4">
            <Field label="Ghi chú cho Khoa (không bắt buộc)"><textarea className={inputCls + ' min-h-20 resize-y'} value={form.note} onChange={(e) => set('note', e.target.value)} /></Field>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-5">
        <button onClick={back} className={btnSecondary}>Hủy</button>
        <button onClick={saveDraft} className={btnSecondary}><Save size={16} />Lưu nháp</button>
        <button onClick={review} disabled={!open} className={btnPrimary}><Send size={16} />{isRevision ? 'Kiểm tra & gửi duyệt lại' : 'Kiểm tra & gửi cho Khoa'}</button>
      </div>

      {step && (
        <Modal title={step === 'review' ? 'Kiểm tra lại thông tin đơn đăng ký' : 'Xác nhận gửi hồ sơ'} onClose={() => setStep(null)} width="max-w-2xl">
          {step === 'review' ? (
            <>
              <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
                {[
                  ['Đơn vị thực tập', `${form.companyName} (${isSystem ? 'xác nhận trên hệ thống' : 'tự tìm'})`],
                  ['Địa chỉ', form.companyAddress],
                  ['Vị trí', form.position],
                  ['Thời gian', `${formatDateISO(form.startDate)} – ${formatDateISO(form.endDate)}`],
                  ['Người hướng dẫn DN', `${form.mentorName} · ${form.mentorTitle}`],
                  ['Liên hệ', `${form.mentorPhone} · ${form.mentorEmail}`],
                  ['Minh chứng', form.evidenceName ? `${form.evidenceName} (${formatSize(form.evidenceSize)})` : 'Kết quả duyệt CV trên hệ thống'],
                  ['Ghi chú', form.note || 'Không có'],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="break-words font-medium text-stone-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex justify-between gap-2">
                <button onClick={() => setStep(null)} className={btnSecondary}><ArrowLeft size={16} />Chỉnh sửa</button>
                <button onClick={() => setStep('confirm')} className={btnPrimary}><Send size={16} />Gửi đăng ký cho Khoa</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-stone-600">Bạn xác nhận gửi hồ sơ đăng ký thực tập tại <b>{form.companyName}</b> cho Khoa. Hồ sơ sẽ ở trạng thái <b>Chờ Khoa phê duyệt</b> và bạn không thể chỉnh sửa cho đến khi Khoa phản hồi.</p>
              {modalError && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{modalError}</p>}
              <div className="mt-6 flex justify-between gap-2">
                <button onClick={() => setStep('review')} className={btnSecondary}>Quay lại</button>
                <button onClick={send} className={btnPrimary}>Xác nhận gửi</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
