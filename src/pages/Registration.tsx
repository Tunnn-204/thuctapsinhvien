import { useState } from 'react'
import { NotebookPen, ArrowLeft, Ban, BadgeCheck, Building2, CalendarDays, CalendarRange, Check, ClipboardSignature, DoorClosed, DoorOpen, FileCheck2, FileText, FlaskConical, GraduationCap, Lock, Mail, MapPin, Pencil, Phone, Search, Send, UserRound, Clock3 } from 'lucide-react'
import { JOBS } from '../lib/data'
import { useStore } from '../lib/store'
import { ROUND, Registration, facultyOf, formatDateISO, roundDates, scheduleFor } from '../lib/registration'
import { companyOf, cx, formatDate, formatDateTime, formatSize } from '../lib/utils'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary, CompanyLogo, Modal, RegStatusBadge } from '../components/ui'

function PortalBanner() {
  const { user, portal } = useStore()
  const d = roundDates()
  const label = portal === 'open' ? 'Cổng đăng ký đang mở' : portal === 'upcoming' ? 'Cổng đăng ký chưa mở' : 'Cổng đăng ký đã đóng'
  const days = Math.ceil((d.portalClose.getTime() - Date.now()) / 86400000)
  return (
    <section className="relative overflow-hidden rounded-2xl bg-vlu-800 p-6 text-white">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-vlu-600/50 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-vlu-200">{facultyOf(user!.major)}</p>
          <h2 className="mt-1 text-xl font-bold">{ROUND.name}</h2>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-vlu-100">
            <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-vlu-300" />Mở cổng: {formatDate(d.portalOpen)} – {formatDate(d.portalClose)}</span>
            <span className="inline-flex items-center gap-2"><CalendarRange size={16} className="text-vlu-300" />Thời gian thực tập: {formatDate(d.start)} – {formatDate(d.end)}</span>
          </div>
        </div>
        <div className={cx('inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 ring-inset', portal === 'open' ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30' : 'bg-rose-400/15 text-rose-200 ring-rose-300/30')}>
          {portal === 'open' ? <DoorOpen size={17} /> : <DoorClosed size={17} />}
          {label}
          {portal === 'open' && <span className="font-normal text-emerald-100/80">· còn {days} ngày</span>}
        </div>
      </div>
    </section>
  )
}

function SourceCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-5">
      <h3 className="font-bold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-500">{hint}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function RegistrationHome() {
  const { registrations, approvedSources, portal, setPortalClosed } = useStore()
  const reg = registrations[0]
  const open = portal === 'open'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Đăng ký thực tập với Khoa</h1>
        <p className="mt-1.5 text-stone-500">Gửi hồ sơ đăng ký chính thức để Ban chủ nhiệm Khoa phê duyệt và phân công Giảng viên hướng dẫn.</p>
      </div>
      <PortalBanner />

      <div className="mt-6">
        {reg ? (
          <article className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Hồ sơ đăng ký của bạn</p>
                <h3 className="mt-1 text-lg font-bold text-stone-900">{reg.companyName}</h3>
                <p className="text-sm text-stone-500">{reg.position}</p>
              </div>
              <RegStatusBadge status={reg.status} />
            </div>
            <p className="mt-3 text-sm text-stone-600">Thời gian thực tập: {formatDateISO(reg.startDate)} – {formatDateISO(reg.endDate)}</p>
            {reg.status === 'revision' && <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-900 ring-1 ring-inset ring-orange-200">Khoa yêu cầu bạn chỉnh sửa hồ sơ. Vui lòng cập nhật và gửi duyệt lại.</p>}
            <button onClick={() => navigate(`/registration/${reg.id}`)} className={btnPrimary + ' mt-5'}>{reg.status === 'revision' ? 'Xem yêu cầu chỉnh sửa' : 'Xem chi tiết hồ sơ'}</button>
          </article>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-bold text-stone-900">Lập hồ sơ đăng ký</h2>
            {!open && (
              <p className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
                <DoorClosed size={17} className="mt-0.5 shrink-0" />
                {portal === 'upcoming' ? 'Cổng đăng ký chưa mở. Bạn chỉ có thể lưu bản nháp.' : 'Cổng đăng ký của đợt đã đóng nên bạn không thể gửi hồ sơ cho Khoa. Bạn vẫn có thể lưu bản nháp.'}
              </p>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <SourceCard title="Đơn vị đã được Doanh nghiệp xác nhận trên hệ thống" hint="Chọn vị trí mà Doanh nghiệp đã duyệt tiếp nhận CV của bạn.">
                {approvedSources.length === 0 ? (
                  <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
                    <p>Bạn chưa có kết quả "Đã được duyệt" từ Doanh nghiệp, nên chưa thể đăng ký theo hình thức này.</p>
                    <button onClick={() => navigate('/jobs')} className={btnSecondary + ' mt-3 !py-2'}><Search size={15} />Tìm vị trí thực tập</button>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {approvedSources.map((a) => {
                      const job = JOBS.find((j) => j.id === a.jobId)!
                      const c = companyOf(job.companyId)
                      return (
                        <li key={a.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                          <CompanyLogo company={c} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-stone-900">{job.title}</p>
                            <p className="truncate text-xs text-stone-500">{c.name}</p>
                          </div>
                          <button onClick={() => navigate(`/registration/new?app=${a.id}`)} className={btnPrimary + ' !px-3.5 !py-2'}>Lập hồ sơ</button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </SourceCard>
              <SourceCard title="Doanh nghiệp tự tìm" hint="Nhập thông tin doanh nghiệp và đính kèm giấy tiếp nhận thực tập hợp lệ.">
                <div className="flex gap-3 rounded-xl bg-vlu-50/60 p-4 text-sm text-vlu-900">
                  <FileCheck2 size={20} className="mt-0.5 shrink-0 text-vlu-600" />
                  <p>Bắt buộc đính kèm giấy tiếp nhận có xác nhận của doanh nghiệp (PDF, ảnh hoặc Word).</p>
                </div>
                <button onClick={() => navigate('/registration/new?self=1')} className={btnSecondary + ' mt-3 w-full'}><Building2 size={16} />Lập hồ sơ cho doanh nghiệp tự tìm</button>
              </SourceCard>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3.5">
        <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500"><FlaskConical size={14} />Demo: giả lập Khoa thiết lập cổng đăng ký</span>
        <button onClick={() => setPortalClosed(portal !== 'closed')} className={btnSecondary + ' !py-1.5 !text-xs'}>
          {portal === 'closed' ? 'Mở lại cổng đăng ký' : 'Đóng cổng đăng ký'}
        </button>
      </div>
    </div>
  )
}

const STEP_LABELS = ['Lập hồ sơ', 'Gửi cho Khoa', 'Khoa phê duyệt', 'Phân công GVHD']

function Stepper({ reg }: { reg: Registration }) {
  const state = (i: number): 'done' | 'current' | 'warn' | 'todo' => {
    if (i === 0) return 'done'
    if (i === 1) return reg.status === 'draft' ? 'current' : 'done'
    if (i === 2) return reg.status === 'approved' ? 'done' : reg.status === 'pending' ? 'current' : reg.status === 'revision' ? 'warn' : 'todo'
    return reg.advisor ? 'done' : reg.status === 'approved' ? 'current' : 'todo'
  }
  return (
    <ol className="flex items-start">
      {STEP_LABELS.map((l, i) => {
        const s = state(i)
        return (
          <li key={l} className="flex flex-1 flex-col items-center text-center last:flex-none sm:flex-row sm:items-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <span className={cx('grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold', s === 'done' && 'bg-vlu-600 text-white', s === 'current' && 'bg-vlu-100 text-vlu-700 ring-2 ring-vlu-500', s === 'warn' && 'bg-orange-100 text-orange-700 ring-2 ring-orange-400', s === 'todo' && 'bg-stone-200 text-stone-400')}>
                {s === 'done' ? <Check size={15} /> : i === 2 && s === 'warn' ? <Pencil size={14} /> : i + 1}
              </span>
              <span className={cx('text-xs font-semibold', s === 'todo' ? 'text-stone-400' : 'text-stone-800')}>{i === 2 && s === 'warn' ? 'Cần chỉnh sửa' : l}</span>
            </div>
            {i < 3 && <span className={cx('mx-2 hidden h-px flex-1 sm:block', state(i + 1) !== 'todo' ? 'bg-vlu-300' : 'bg-stone-200')} />}
          </li>
        )
      })}
    </ol>
  )
}

function Info({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-vlu-50 text-vlu-600"><Icon size={16} /></span>
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{label}</p>
        <div className="break-words text-sm font-medium text-stone-900">{children}</div>
      </div>
    </div>
  )
}

export function RegistrationDetail({ id }: { id: string }) {
  const { registrations, deleteRegistration, simulateFaculty, assignAdvisor, portal } = useStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const reg = registrations.find((r) => r.id === id)
  if (!reg) {
    return (
      <div>
        <button onClick={() => navigate('/registration')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>
        <p className="text-stone-600">Hồ sơ không tồn tại hoặc đã được rút.</p>
      </div>
    )
  }
  const locked = reg.status === 'approved' && !!reg.advisor
  const canEdit = reg.status === 'draft' || reg.status === 'revision'
  const canWithdraw = !locked

  const remove = () => {
    const r = deleteRegistration(reg.id)
    if (r.ok) navigate('/registration')
    else {
      setError(r.error)
      setConfirmDelete(false)
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/registration')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Đăng ký thực tập với Khoa</button>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{ROUND.name}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900">{reg.companyName}</h1>
            <p className="text-stone-500">{reg.position}</p>
          </div>
          <RegStatusBadge status={reg.status} />
        </div>
        <div className="mt-6 border-t border-stone-100 pt-5"><Stepper reg={reg} /></div>
      </section>

      {reg.status === 'revision' && (
        <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="flex items-center gap-2 font-bold text-orange-900"><Pencil size={18} />Ban chủ nhiệm Khoa yêu cầu chỉnh sửa</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-orange-900">{reg.revisionNote}</p>
          <p className="mt-2 text-xs text-orange-800">Bạn cần cập nhật hồ sơ theo yêu cầu thì mới có thể gửi duyệt lại.</p>
          <button onClick={() => navigate(`/registration/${reg.id}/edit`)} className={btnPrimary + ' mt-4'}><Pencil size={16} />Cập nhật hồ sơ</button>
        </section>
      )}

      {reg.status === 'pending' && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200"><Clock3 size={18} className="mt-0.5 shrink-0" />Hồ sơ đang chờ Ban chủ nhiệm Khoa phê duyệt. Trong thời gian này bạn không thể chỉnh sửa hồ sơ.</p>
      )}
      {reg.status === 'approved' && !reg.advisor && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200"><BadgeCheck size={18} className="mt-0.5 shrink-0" />Hồ sơ đã được duyệt. Khoa sẽ phân công Giảng viên hướng dẫn trong thời gian sớm nhất.</p>
      )}
      {locked && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-vlu-50 p-4 text-sm text-vlu-900 ring-1 ring-inset ring-vlu-200"><Lock size={18} className="mt-0.5 shrink-0" />Hồ sơ đã được duyệt và phân công GVHD. Bạn không thể tự xóa hoặc thay đổi đơn vị thực tập. Nếu cần thay đổi, vui lòng liên hệ Ban chủ nhiệm Khoa.</p>
      )}
      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">{error}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 font-bold text-stone-900">Thông tin đơn vị thực tập</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Info icon={Building2} label="Đơn vị">{reg.companyName} <span className="ml-1 text-xs font-normal text-stone-500">({reg.source === 'system' ? 'Xác nhận trên hệ thống' : 'Doanh nghiệp tự tìm'})</span></Info>
              <Info icon={MapPin} label="Địa chỉ">{reg.companyAddress}</Info>
              <Info icon={ClipboardSignature} label="Vị trí thực tập">{reg.position}</Info>
              <Info icon={CalendarRange} label="Thời gian">{formatDateISO(reg.startDate)} – {formatDateISO(reg.endDate)}</Info>
              <Info icon={FileText} label="Minh chứng">
                {reg.source === 'system' && <span className="block">Kết quả duyệt CV trên hệ thống</span>}
                {reg.evidenceName && <span className="block">{reg.evidenceName} <span className="text-xs font-normal text-stone-500">({formatSize(reg.evidenceSize)})</span></span>}
              </Info>
              {reg.note && <Info icon={FileText} label="Ghi chú">{reg.note}</Info>}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 font-bold text-stone-900">Người hướng dẫn tại doanh nghiệp</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Info icon={UserRound} label="Họ tên và chức danh">{reg.mentorName} · {reg.mentorTitle}</Info>
              <Info icon={Phone} label="Điện thoại">{reg.mentorPhone}</Info>
              <Info icon={Mail} label="Email">{reg.mentorEmail}</Info>
            </div>
          </section>

          {reg.status === 'approved' && reg.advisor && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
              <h2 className="mb-4 font-bold text-stone-900">Lịch trình thực tập</h2>
              <ol className="relative ml-2 space-y-5 border-l border-vlu-200 pl-6">
                {scheduleFor(reg).map((s) => (
                  <li key={s.title} className="relative">
                    <span className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-vlu-500 ring-4 ring-white" />
                    <p className="text-xs font-semibold text-vlu-700">{formatDate(s.date)}</p>
                    <p className="text-sm text-stone-800">{s.title}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-stone-900"><GraduationCap size={18} className="text-vlu-600" />Giảng viên hướng dẫn</h2>
            {reg.advisor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full bg-vlu-100 font-bold text-vlu-700">{reg.advisor.name.split(' ').pop()![0]}</span>
                  <div>
                    <p className="font-semibold text-stone-900">{reg.advisor.name}</p>
                    <p className="text-xs text-stone-500">{reg.advisor.title}</p>
                  </div>
                </div>
                <Info icon={Mail} label="Email">{reg.advisor.email}</Info>
                <Info icon={Phone} label="Điện thoại">{reg.advisor.phone}</Info>
                <Info icon={MapPin} label="Văn phòng">{reg.advisor.office}</Info>
              </div>
            ) : (
              <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">Chưa được phân công. Thông tin GVHD sẽ hiển thị sau khi Khoa duyệt và phân công.</p>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 font-bold text-stone-900">Thao tác</h2>
            <div className="space-y-2.5">
              {locked && <button onClick={() => navigate('/diary')} className={btnPrimary + ' w-full'}><NotebookPen size={16} />Mở Nhật ký & Tiến độ</button>}
              {canEdit && reg.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/registration/${reg.id}/edit`)} className={btnPrimary + ' w-full'}><Send size={16} />{portal === 'open' ? 'Kiểm tra & gửi cho Khoa' : 'Tiếp tục chỉnh sửa'}</button>
                </>
              )}
              {canEdit && reg.status === 'revision' && <button onClick={() => navigate(`/registration/${reg.id}/edit`)} className={btnPrimary + ' w-full'}><Pencil size={16} />Cập nhật và gửi duyệt lại</button>}
              {!canEdit && <button disabled className={btnSecondary + ' w-full'}><Lock size={15} />Không thể chỉnh sửa</button>}
              {canWithdraw ? (
                <button onClick={() => setConfirmDelete(true)} className={btnSecondary + ' w-full hover:!border-rose-300 hover:!bg-rose-50 hover:!text-rose-700'}><Ban size={15} />Rút hồ sơ</button>
              ) : (
                <button disabled className={btnSecondary + ' w-full'}><Lock size={15} />Không thể xóa hồ sơ</button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-4 font-bold text-stone-900">Lịch sử xử lý</h2>
            <ol className="space-y-3">
              {reg.history.map((h, i) => (
                <li key={i} className="text-sm">
                  <p className="text-stone-800">{h.text}</p>
                  <p className="text-xs text-stone-400">{formatDateTime(h.at)}</p>
                </li>
              ))}
            </ol>
          </section>

          {(reg.status === 'pending' || (reg.status === 'approved' && !reg.advisor)) && (
            <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-stone-500"><FlaskConical size={14} />Demo: giả lập phản hồi của Khoa</p>
              <div className="flex flex-wrap gap-2">
                {reg.status === 'pending' ? (
                  <>
                    <button onClick={() => simulateFaculty(reg.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Duyệt hồ sơ</button>
                    <button onClick={() => simulateFaculty(reg.id, 'revision')} className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700">Yêu cầu chỉnh sửa</button>
                  </>
                ) : (
                  <button onClick={() => assignAdvisor(reg.id)} className="rounded-lg bg-vlu-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-vlu-700">Phân công GVHD</button>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      {confirmDelete && (
        <Modal title="Rút hồ sơ đăng ký?" onClose={() => setConfirmDelete(false)} width="max-w-md">
          <p className="text-sm leading-relaxed text-stone-600">Hồ sơ đăng ký thực tập tại <b>{reg.companyName}</b> sẽ bị xóa khỏi hệ thống. Bạn có thể lập hồ sơ mới nếu cổng đăng ký vẫn đang mở.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(false)} className={btnSecondary}>Giữ lại</button>
            <button onClick={remove} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Xác nhận rút</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

