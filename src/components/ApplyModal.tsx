import { DragEvent, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Trash2, UploadCloud } from 'lucide-react'
import { Job } from '../lib/data'
import { ApplyForm, useStore } from '../lib/store'
import { companyOf, cx, formatSize } from '../lib/utils'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary, inputCls, Modal } from './ui'

const ALLOWED_EXT = ['pdf', 'doc', 'docx']
const MAX_MB = 5

type Errors = Partial<Record<'fullName' | 'email' | 'phone' | 'cv', string>>

function validate(f: ApplyForm): Errors {
  const e: Errors = {}
  if (!f.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên.'
  if (!f.email.trim()) e.email = 'Vui lòng nhập email liên hệ.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Email không hợp lệ.'
  if (!f.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.'
  else if (!/^(0|\+84)\d{9}$/.test(f.phone.replace(/[\s.]/g, ''))) e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).'
  if (!f.cvName) e.cv = 'Vui lòng tải lên file CV.'
  return e
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"><AlertCircle size={13} />{error}</span>}
    </label>
  )
}

export function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { user, profile, submitApplication } = useStore()
  const company = companyOf(job.companyId)
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [form, setForm] = useState<ApplyForm>({
    fullName: user?.fullName ?? '',
    email: profile.contactEmail || user?.email || '',
    phone: profile.phone,
    coverLetter: '',
    cvName: '',
    cvSize: 0,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof ApplyForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // BR3: chỉ nhận đúng định dạng cho phép
  const pickFile = (file?: File | null) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXT.includes(ext)) {
      setErrors((e) => ({ ...e, cv: 'Định dạng không hợp lệ. Chỉ chấp nhận file PDF, DOC hoặc DOCX.' }))
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, cv: `File vượt quá dung lượng tối đa ${MAX_MB} MB.` }))
      return
    }
    setForm((f) => ({ ...f, cvName: file.name, cvSize: file.size }))
    setErrors((e) => ({ ...e, cv: undefined }))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  const next = () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length === 0) setStep('confirm')
  }

  const confirm = () => {
    const r = submitApplication(job.id, form)
    if (!r.ok) {
      setSubmitError(r.error)
      return
    }
    setStep('done')
  }

  return (
    <Modal title={step === 'done' ? 'Nộp hồ sơ thành công' : 'Ứng tuyển vị trí thực tập'} onClose={onClose} width="max-w-2xl">
      {step !== 'done' && (
        <div className="mb-5 rounded-xl bg-vlu-50 px-4 py-3">
          <p className="text-sm font-bold text-vlu-900">{job.title}</p>
          <p className="text-xs text-vlu-700">{company.name}</p>
        </div>
      )}

      {step !== 'done' && (
        <ol className="mb-6 flex items-center gap-2 text-xs font-semibold">
          {['Tải CV & điền thông tin', 'Xác nhận nộp hồ sơ'].map((t, i) => {
            const active = (step === 'form' ? 0 : 1) >= i
            return (
              <li key={t} className="flex flex-1 items-center gap-2">
                <span className={cx('grid size-6 place-items-center rounded-full', active ? 'bg-vlu-600 text-white' : 'bg-stone-200 text-stone-500')}>{i + 1}</span>
                <span className={active ? 'text-vlu-800' : 'text-stone-400'}>{t}</span>
                {i === 0 && <span className={cx('h-px flex-1', step === 'confirm' ? 'bg-vlu-400' : 'bg-stone-200')} />}
              </li>
            )
          })}
        </ol>
      )}

      {step === 'form' && (
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-stone-700">File CV <span className="text-rose-500">*</span></p>
            {form.cvName ? (
              <div className="flex items-center gap-3 rounded-xl border border-vlu-200 bg-vlu-50/60 p-3.5">
                <span className="grid size-10 place-items-center rounded-lg bg-white text-vlu-600"><FileText size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900">{form.cvName}</p>
                  <p className="text-xs text-stone-500">{formatSize(form.cvSize)}</p>
                </div>
                <button type="button" onClick={() => setForm((f) => ({ ...f, cvName: '', cvSize: 0 }))} aria-label="Xóa file" className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-rose-600"><Trash2 size={17} /></button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
                className={cx('flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition', drag ? 'border-vlu-500 bg-vlu-50' : errors.cv ? 'border-rose-300 bg-rose-50/40' : 'border-stone-300 hover:border-vlu-400 hover:bg-vlu-50/40')}
              >
                <UploadCloud size={28} className="text-vlu-500" />
                <p className="mt-2 text-sm font-semibold text-stone-800">Kéo thả file vào đây hoặc <span className="text-vlu-600 underline">chọn từ máy</span></p>
                <p className="mt-1 text-xs text-stone-500">Chấp nhận PDF, DOC, DOCX · tối đa {MAX_MB} MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
            {errors.cv && <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"><AlertCircle size={13} />{errors.cv}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" required error={errors.fullName}>
              <input className={inputCls} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            </Field>
            <Field label="Số điện thoại" required error={errors.phone}>
              <input className={inputCls} inputMode="tel" placeholder="0901234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          </div>
          <Field label="Email liên hệ" required error={errors.email}>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Thư giới thiệu (không bắt buộc)">
            <textarea className={inputCls + ' min-h-24 resize-y'} placeholder="Giới thiệu ngắn về bản thân và lý do bạn quan tâm đến vị trí này…" value={form.coverLetter} onChange={(e) => set('coverLetter', e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className={btnSecondary}>Hủy</button>
            <button onClick={next} className={btnPrimary}>Tiếp tục</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <p className="mb-3 text-sm text-stone-600">Vui lòng kiểm tra lại thông tin trước khi nộp. Hồ sơ sẽ được gửi đến <b>{company.name}</b>.</p>
          <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
            {[
              ['Họ và tên', form.fullName],
              ['Email liên hệ', form.email],
              ['Số điện thoại', form.phone],
              ['File CV', `${form.cvName} (${formatSize(form.cvSize)})`],
              ['Thư giới thiệu', form.coverLetter || 'Không có'],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[130px_1fr]">
                <dt className="text-stone-500">{k}</dt>
                <dd className="whitespace-pre-line break-words font-medium text-stone-900">{v}</dd>
              </div>
            ))}
          </dl>
          {submitError && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={16} />{submitError}</p>}
          <p className="mt-4 text-xs text-stone-500">Bạn có thể hủy đơn khi hồ sơ đang ở trạng thái "Chờ doanh nghiệp duyệt".</p>
          <div className="mt-5 flex justify-between gap-2">
            <button onClick={() => setStep('form')} className={btnSecondary}><ArrowLeft size={16} />Chỉnh sửa</button>
            <button onClick={confirm} className={btnPrimary}>Xác nhận nộp hồ sơ</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={36} /></span>
          <h3 className="mt-4 text-xl font-bold text-stone-900">Hồ sơ đã được gửi</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">Hồ sơ ứng tuyển vị trí <b>{job.title}</b> tại {company.name} đang ở trạng thái <b>Chờ doanh nghiệp duyệt</b>. Bạn sẽ nhận thông báo khi có kết quả.</p>
          <div className="mt-6 flex gap-2">
            <button onClick={onClose} className={btnSecondary}>Đóng</button>
            <button onClick={() => { onClose(); navigate('/applications') }} className={btnPrimary}>Theo dõi hồ sơ</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
