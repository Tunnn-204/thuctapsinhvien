import { useState } from 'react'
import { ArrowLeft, BadgeCheck, CalendarClock, CheckCircle2, Clock, Download, FileX, Gift, ListChecks, MapPin, Send, UserCheck, Users, Wallet, XCircle } from 'lucide-react'
import { JOBS } from '../lib/data'
import { useStore } from '../lib/store'
import { companyOf, cx, daysLeft, deadlineDate, downloadJd, formatDate } from '../lib/utils'
import { navigate } from '../lib/router'
import { ApplyModal } from '../components/ApplyModal'
import { btnPrimary, btnSecondary, Chip, CompanyLogo, StatusBadge } from '../components/ui'

function Section({ icon: Icon, title, items }: { icon: typeof ListChecks; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-stone-900"><Icon size={18} className="text-vlu-600" />{title}</h2>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-stone-700">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-vlu-400" />{t}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function JobDetail({ id }: { id: string }) {
  const { jobState, slotsLeft, applicationFor } = useStore()
  const [applying, setApplying] = useState(false)
  const job = JOBS.find((j) => j.id === id)
  if (!job) return <p className="text-stone-600">Không tìm thấy vị trí thực tập.</p>
  const company = companyOf(job.companyId)
  const state = jobState(job)
  const left = slotsLeft(job)
  const app = applicationFor(job.id)
  const days = daysLeft(job)
  const pct = Math.round(((job.quota - left) / job.quota) * 100)

  return (
    <div>
      <button onClick={() => (history.length > 1 ? history.back() : navigate('/jobs'))} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Quay lại</button>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <CompanyLogo company={company} size={68} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">{job.title}</h1>
            <button onClick={() => navigate(`/companies/${company.id}`)} className="mt-1 inline-flex items-center gap-1.5 font-semibold text-vlu-700 hover:underline">
              {company.name}<BadgeCheck size={17} className="text-vlu-500" />
            </button>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-vlu-500" />{company.address} · {job.mode}</span>
              <span className="inline-flex items-center gap-1.5"><Wallet size={15} className="text-vlu-500" />{job.allowance}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={15} className="text-vlu-500" />{job.duration}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip tone="brand">{job.major}</Chip>
              {job.skills.map((s) => <Chip key={s}>{s}</Chip>)}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Section icon={ListChecks} title="Mô tả công việc" items={job.description} />
          <Section icon={UserCheck} title="Yêu cầu ứng tuyển" items={job.requirements} />
          <Section icon={Gift} title="Quyền lợi" items={job.benefits} />
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
            <h2 className="mb-3 text-base font-bold text-stone-900">Tài liệu mô tả công việc (JD)</h2>
            {job.hasJd ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-vlu-50/70 p-4">
                <p className="text-sm text-stone-700">JD_{company.name.replace(/\s+/g, '')}.txt</p>
                <button onClick={() => downloadJd(job)} className={btnSecondary + ' !py-2'}><Download size={16} />Tải xuống</button>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-stone-500"><FileX size={17} />Doanh nghiệp chưa đính kèm tài liệu mô tả cho vị trí này.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-stone-500"><CalendarClock size={16} />Hạn nhận hồ sơ</span>
              <span className={cx('text-sm font-bold', state === 'expired' ? 'text-rose-600' : 'text-stone-900')}>{formatDate(deadlineDate(job))}</span>
            </div>
            {state !== 'expired' && <p className={cx('mt-1 text-right text-xs', days <= 3 ? 'font-semibold text-rose-600' : 'text-stone-500')}>Còn {days} ngày</p>}

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-stone-500"><Users size={16} />Chỉ tiêu</span>
                <span className="font-bold text-stone-900">Còn {left}/{job.quota}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div className={cx('h-full rounded-full', left === 0 ? 'bg-stone-400' : 'bg-vlu-500')} style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="mt-6">
              {app ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3.5">
                    <span className="text-sm text-stone-600">Hồ sơ của bạn</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <button onClick={() => navigate('/applications')} className={btnSecondary + ' w-full'}>Xem hồ sơ cá nhân</button>
                </div>
              ) : state === 'open' ? (
                <button onClick={() => setApplying(true)} className={btnPrimary + ' w-full py-3'}><Send size={16} />Ứng tuyển</button>
              ) : (
                <div className="space-y-3">
                  <button disabled className={btnPrimary + ' w-full py-3'}>Ứng tuyển</button>
                  <p className="flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
                    <XCircle size={17} className="mt-0.5 shrink-0 text-stone-400" />
                    {state === 'expired' ? 'Vị trí đã hết thời hạn nhận hồ sơ.' : 'Vị trí đã hết chỉ tiêu tuyển dụng.'}
                  </p>
                </div>
              )}
            </div>
            {!app && state === 'open' && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500"><CheckCircle2 size={14} className="text-emerald-500" />Bạn đủ điều kiện ứng tuyển trong học kỳ này</p>
            )}
          </div>
        </aside>
      </div>

      {applying && <ApplyModal job={job} onClose={() => setApplying(false)} />}
    </div>
  )
}
