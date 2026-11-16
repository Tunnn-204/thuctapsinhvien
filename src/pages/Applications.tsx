import { useState } from 'react'
import { Ban, Check, ClipboardSignature, CheckCircle2, FileText, FlaskConical, Inbox, MapPin, Phone, Search, X } from 'lucide-react'
import { JOBS } from '../lib/data'
import { AppStatus, Application, useStore } from '../lib/store'
import { companyOf, cx, formatDateTime, formatSize } from '../lib/utils'
import { navigate } from '../lib/router'
import { btnPrimary, btnSecondary, CompanyLogo, Modal, StatusBadge } from '../components/ui'

const TABS: { key: 'all' | AppStatus; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Bị từ chối' },
  { key: 'cancelled', label: 'Đã hủy' },
]

function Progress({ status }: { status: AppStatus }) {
  if (status === 'cancelled') return null
  const final = status === 'approved' ? 'Được duyệt' : status === 'rejected' ? 'Bị từ chối' : 'Kết quả'
  const steps = [
    { label: 'Đã nộp hồ sơ', done: true },
    { label: 'Doanh nghiệp xem xét', done: status !== 'pending' },
    { label: final, done: status !== 'pending' },
  ]
  return (
    <ol className="mt-4 flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={cx('grid size-5 shrink-0 place-items-center rounded-full', s.done ? (i === 2 && status === 'rejected' ? 'bg-rose-500 text-white' : i === 2 ? 'bg-emerald-500 text-white' : 'bg-vlu-600 text-white') : 'bg-stone-200 text-stone-400')}>
            {s.done ? (i === 2 && status === 'rejected' ? <X size={12} /> : <Check size={12} />) : i + 1}
          </span>
          <span className={cx('whitespace-nowrap font-medium', s.done ? 'text-stone-800' : 'text-stone-400')}>{s.label}</span>
          {i < 2 && <span className={cx('h-px flex-1', steps[i + 1].done ? 'bg-vlu-300' : 'bg-stone-200')} />}
        </li>
      ))}
    </ol>
  )
}

function AppCard({ app, onCancel }: { app: Application; onCancel: () => void }) {
  const { simulateEmployer } = useStore()
  const job = JOBS.find((j) => j.id === app.jobId)!
  const company = companyOf(job.companyId)
  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5">
      <div className="flex gap-4">
        <CompanyLogo company={company} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="cursor-pointer font-bold text-stone-900 hover:text-vlu-700" onClick={() => navigate(`/jobs/${job.id}`)}>{job.title}</h3>
              <p className="text-sm text-stone-500">{company.name}</p>
            </div>
            <StatusBadge status={app.status} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-stone-500">
            <span className="inline-flex items-center gap-1.5"><FileText size={14} />{app.cvName} · {formatSize(app.cvSize)}</span>
            <span className="inline-flex items-center gap-1.5"><Phone size={14} />{app.phone}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">Nộp lúc {formatDateTime(app.createdAt)}{app.status !== 'pending' && ` · Cập nhật ${formatDateTime(app.updatedAt)}`}</p>

          <Progress status={app.status} />

          {app.status === 'rejected' && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-900 ring-1 ring-inset ring-rose-100">
              <p className="font-semibold">Lý do từ chối</p>
              <p className="mt-0.5 text-rose-800">{app.rejectReason}</p>
            </div>
          )}
          {app.status === 'approved' && (
            <div className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>Doanh nghiệp đã duyệt tiếp nhận hồ sơ. Bạn có thể gửi đăng ký thực tập chính thức cho Khoa với đơn vị này.</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {app.status === 'pending' && <button onClick={onCancel} className={btnSecondary + ' !py-2 hover:!border-rose-300 hover:!bg-rose-50 hover:!text-rose-700'}><Ban size={15} />Hủy ứng tuyển</button>}
            {app.status === 'rejected' && <button onClick={() => navigate(`/jobs?major=${encodeURIComponent(job.major)}&hint=1`)} className={btnPrimary + ' !py-2'}><Search size={15} />Tìm nơi thực tập khác</button>}
            {app.status === 'approved' && <button onClick={() => navigate(`/registration/new?app=${app.id}`)} className={btnPrimary + ' !py-2'}><ClipboardSignature size={15} />Đăng ký thực tập với Khoa</button>}
            {app.status === 'cancelled' && <button onClick={() => navigate(`/jobs/${job.id}`)} className={btnSecondary + ' !py-2'}>Xem lại vị trí</button>}
          </div>

          {app.status === 'pending' && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3">
              <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500"><FlaskConical size={14} />Demo: giả lập phản hồi của doanh nghiệp</span>
              <button onClick={() => simulateEmployer(app.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Duyệt CV</button>
              <button onClick={() => simulateEmployer(app.id, 'rejected')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">Từ chối CV</button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export function Applications() {
  const { applications, cancelApplication } = useStore()
  const [tab, setTab] = useState<'all' | AppStatus>('all')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const list = tab === 'all' ? applications : applications.filter((a) => a.status === tab)
  const target = applications.find((a) => a.id === cancelId)
  const targetJob = target && JOBS.find((j) => j.id === target.jobId)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Hồ sơ cá nhân</h1>
          <p className="mt-1.5 text-stone-500">Theo dõi các vị trí thực tập bạn đã ứng tuyển và kết quả duyệt CV.</p>
        </div>
        <button onClick={() => navigate('/jobs')} className={btnPrimary}><Search size={16} />Tìm vị trí mới</button>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-xl bg-white p-1.5 ring-1 ring-stone-200/80">
        {TABS.map((t) => {
          const n = t.key === 'all' ? applications.length : applications.filter((a) => a.status === t.key).length
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={cx('whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition', tab === t.key ? 'bg-vlu-600 text-white' : 'text-stone-600 hover:bg-stone-100')}>
              {t.label} <span className={cx('ml-1 text-xs', tab === t.key ? 'text-vlu-200' : 'text-stone-400')}>{n}</span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <Inbox size={36} className="text-stone-300" />
          <p className="mt-3 font-semibold text-stone-800">{tab === 'all' ? 'Bạn chưa ứng tuyển vị trí nào' : 'Không có hồ sơ ở trạng thái này'}</p>
          <p className="mt-1 text-sm text-stone-500">Bắt đầu bằng việc tìm kiếm vị trí thực tập phù hợp với ngành của bạn.</p>
          <button onClick={() => navigate('/jobs')} className={btnPrimary + ' mt-5'}>Xem tin tuyển dụng</button>
        </div>
      ) : (
        <div className="space-y-3">{list.map((a) => <AppCard key={a.id} app={a} onCancel={() => setCancelId(a.id)} />)}</div>
      )}

      {target && targetJob && (
        <Modal title="Hủy đơn ứng tuyển?" onClose={() => setCancelId(null)} width="max-w-md">
          <p className="text-sm leading-relaxed text-stone-600">Bạn sắp hủy hồ sơ ứng tuyển vị trí <b>{targetJob.title}</b> tại {companyOf(targetJob.companyId).name}. Chỉ tiêu sẽ được hoàn lại cho vị trí này.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setCancelId(null)} className={btnSecondary}>Giữ lại</button>
            <button onClick={() => { cancelApplication(target.id); setCancelId(null) }} className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Xác nhận hủy</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
