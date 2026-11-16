import { ReactNode, useRef, useState } from 'react'
import { AlertCircle, BadgeCheck, Camera, Check, GraduationCap, IdCard, Lock, Mail, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react'
import { EMPTY_PROFILE, Profile as ProfileData, useStore } from '../lib/store'
import { SEMESTER } from '../lib/data'
import { cx } from '../lib/utils'
import { btnPrimary, btnSecondary, inputCls } from '../components/ui'
import { Avatar } from '../components/Shell'

type Errors = Partial<Record<'fullName' | 'dob' | 'phone' | 'contactEmail' | 'website' | 'avatar', string>>

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

function Card({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
      <h2 className="font-bold text-stone-900">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-stone-500">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function validate(p: ProfileData): Errors {
  const e: Errors = {}
  if (!p.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên.'
  if (p.dob && new Date(p.dob) > new Date()) e.dob = 'Ngày sinh không hợp lệ.'
  if (p.phone && !/^(0|\+84)\d{9}$/.test(p.phone.replace(/[\s.]/g, ''))) e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).'
  if (p.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail.trim())) e.contactEmail = 'Email không hợp lệ.'
  if (p.website && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/.test(p.website.trim())) e.website = 'Đường dẫn không hợp lệ.'
  return e
}

/** Thu nhỏ ảnh đại diện về 256px để lưu gọn trong trình duyệt */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = 256
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error('Không đọc được ảnh'))
    img.src = url
  })
}

export function Profile() {
  const { user, profile, updateProfile } = useStore()
  const [form, setForm] = useState<ProfileData>({ ...profile, fullName: user!.fullName })
  const [errors, setErrors] = useState<Errors>({})
  const [skill, setSkill] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const base: ProfileData = { ...EMPTY_PROFILE, ...profile, fullName: user!.fullName }
  const dirty = JSON.stringify(form) !== JSON.stringify(base)
  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false) }

  const addSkill = () => {
    const v = skill.trim()
    if (v && !form.skills.some((x) => x.toLowerCase() === v.toLowerCase()) && form.skills.length < 12) set('skills', [...form.skills, v])
    setSkill('')
  }

  const pickAvatar = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrors((e) => ({ ...e, avatar: 'Vui lòng chọn file ảnh (JPG, PNG).' }))
    if (file.size > 5 * 1024 * 1024) return setErrors((e) => ({ ...e, avatar: 'Ảnh vượt quá 5 MB.' }))
    try {
      set('avatar', await resizeImage(file))
      setErrors((e) => ({ ...e, avatar: undefined }))
    } catch {
      setErrors((e) => ({ ...e, avatar: 'Không đọc được ảnh này.' }))
    }
  }

  const save = () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    updateProfile({ ...form, fullName: form.fullName.trim(), phone: form.phone.trim(), contactEmail: form.contactEmail.trim(), website: form.website.trim() })
    setSaved(true)
  }

  const fields = [form.fullName, form.dob, form.gender, form.phone, form.contactEmail, form.address, form.bio, form.skills.length ? 'x' : '', form.avatar]
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Thông tin cá nhân</h1>
        <p className="mt-1.5 text-stone-500">Cập nhật thông tin liên lạc để doanh nghiệp, GVHD và Khoa liên hệ với bạn.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 text-center">
            <div className="relative mx-auto w-fit">
              <Avatar name={form.fullName || user!.fullName} src={form.avatar} size={112} />
              <button onClick={() => fileRef.current?.click()} aria-label="Đổi ảnh đại diện" className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full bg-vlu-600 text-white shadow-md ring-4 ring-white transition hover:bg-vlu-700"><Camera size={16} /></button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickAvatar(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            {form.avatar && <button onClick={() => set('avatar', '')} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-rose-600"><Trash2 size={13} />Xóa ảnh</button>}
            {errors.avatar && <p className="mt-2 text-xs font-medium text-rose-600">{errors.avatar}</p>}
            <h2 className="mt-4 text-lg font-bold text-stone-900">{form.fullName || user!.fullName}</h2>
            <p className="text-sm text-stone-500">{user!.email}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200"><BadgeCheck size={14} />Đủ điều kiện thực tập</p>
            <div className="mt-5 text-left">
              <div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-stone-600">Mức độ hoàn thiện hồ sơ</span><span className="font-bold text-vlu-700">{pct}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-vlu-500 transition-all" style={{ width: `${pct}%` }} /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-stone-900"><Lock size={15} className="text-stone-400" />Thông tin từ Nhà trường</h2>
            <p className="mb-4 text-xs text-stone-500">Đồng bộ từ hệ thống đào tạo, không thể chỉnh sửa.</p>
            <dl className="space-y-3 text-sm">
              {[
                [IdCard, 'Mã số sinh viên', user!.studentId],
                [Mail, 'Email VLU (SSO)', user!.email],
                [GraduationCap, 'Ngành · Khóa', `${user!.major} · ${user!.cohort}`],
              ].map(([Icon, k, v]) => {
                const I = Icon as typeof Mail
                return (
                  <div key={k as string} className="flex gap-3">
                    <I size={16} className="mt-0.5 shrink-0 text-vlu-500" />
                    <div className="min-w-0"><dt className="text-xs text-stone-500">{k as string}</dt><dd className="break-words font-medium text-stone-900">{v as string}</dd></div>
                  </div>
                )
              })}
              <p className="border-t border-stone-100 pt-3 text-xs text-stone-500">{SEMESTER}</p>
            </dl>
          </section>
        </aside>

        <div className="space-y-5">
          <Card title="Thông tin cá nhân">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Họ và tên" required error={errors.fullName}><input className={inputCls} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></Field></div>
              <Field label="Ngày sinh" error={errors.dob}><input type="date" className={inputCls} max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
              <Field label="Giới tính">
                <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value as ProfileData['gender'])}>
                  <option value="">Chưa chọn</option><option>Nam</option><option>Nữ</option><option>Khác</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card title="Thông tin liên lạc" desc="Thông tin này sẽ được điền sẵn khi bạn ứng tuyển vị trí thực tập.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Số điện thoại" error={errors.phone}><input className={inputCls} inputMode="tel" placeholder="0901234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label="Email liên hệ" error={errors.contactEmail} hint="Bỏ trống để dùng Email VLU."><input type="email" className={inputCls} placeholder={user!.email} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Địa chỉ liên hệ"><input className={inputCls} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" value={form.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><Field label="Portfolio / LinkedIn / GitHub" error={errors.website}><input className={inputCls} placeholder="linkedin.com/in/ten-ban" value={form.website} onChange={(e) => set('website', e.target.value)} /></Field></div>
            </div>
          </Card>

          <Card title="Kỹ năng và giới thiệu bản thân">
            <div className="space-y-4">
              <Field label="Kỹ năng" hint="Nhấn Enter để thêm, tối đa 12 kỹ năng.">
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="VD: React, Giao tiếp…" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
                  <button type="button" onClick={addSkill} disabled={!skill.trim()} className={btnSecondary + ' shrink-0'} aria-label="Thêm kỹ năng"><Plus size={16} />Thêm</button>
                </div>
              </Field>
              {form.skills.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <li key={s} className="inline-flex items-center gap-1 rounded-full bg-vlu-50 py-1 pl-3 pr-1.5 text-sm font-medium text-vlu-700">
                      {s}
                      <button onClick={() => set('skills', form.skills.filter((x) => x !== s))} aria-label={`Xóa ${s}`} className="grid size-5 place-items-center rounded-full hover:bg-vlu-200"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <Field label="Giới thiệu bản thân"><textarea className={inputCls + ' min-h-28 resize-y'} maxLength={600} placeholder="Mục tiêu nghề nghiệp, điểm mạnh và định hướng thực tập của bạn…" value={form.bio} onChange={(e) => set('bio', e.target.value)} /><span className="mt-1 block text-right text-xs text-stone-400">{form.bio.length}/600</span></Field>
            </div>
          </Card>

          <Card title="Tùy chọn thông báo">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 size-4 accent-vlu-600" checked={form.notifyEmail} onChange={(e) => set('notifyEmail', e.target.checked)} />
              <span>
                <span className="block text-sm font-semibold text-stone-800">Gửi thông báo qua email</span>
                <span className="block text-sm text-stone-500">Nhận email khi doanh nghiệp, Khoa hoặc GVHD thay đổi trạng thái hồ sơ và khi có nhắc hạn nộp báo cáo.</span>
              </span>
            </label>
          </Card>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            {saved && !dirty && <span className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Check size={16} />Đã lưu thay đổi</span>}
            {dirty && <span className="mr-auto text-sm text-stone-500">Bạn có thay đổi chưa lưu</span>}
            <button onClick={() => { setForm(base); setErrors({}); setSaved(false) }} disabled={!dirty} className={btnSecondary}><RotateCcw size={15} />Hoàn tác</button>
            <button onClick={save} disabled={!dirty} className={cx(btnPrimary)}><Save size={16} />Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  )
}
