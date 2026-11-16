import { CalendarClock, MapPin, Users, Wallet } from 'lucide-react'
import { Job } from '../lib/data'
import { useStore } from '../lib/store'
import { companyOf, cx, daysLeft, formatDate, deadlineDate } from '../lib/utils'
import { navigate } from '../lib/router'
import { Chip, CompanyLogo, JobStateBadge, StatusBadge } from './ui'

export function JobCard({ job }: { job: Job }) {
  const { jobState, slotsLeft, applicationFor } = useStore()
  const company = companyOf(job.companyId)
  const state = jobState(job)
  const left = daysLeft(job)
  const app = applicationFor(job.id)
  return (
    <article
      onClick={() => navigate(`/jobs/${job.id}`)}
      className={cx(
        'group flex cursor-pointer gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 transition hover:border-vlu-300 hover:shadow-[0_8px_30px_-12px_rgba(112,48,160,0.35)]',
        state !== 'open' && 'opacity-80',
      )}
    >
      <CompanyLogo company={company} size={52} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-stone-900 group-hover:text-vlu-700">{job.title}</h3>
            <p className="mt-0.5 text-sm text-stone-500">{company.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {app && app.status !== 'cancelled' && <StatusBadge status={app.status} />}
            <JobStateBadge state={state} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-stone-600">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-vlu-500" />{job.location} · {job.mode}</span>
          <span className="inline-flex items-center gap-1.5"><Wallet size={14} className="text-vlu-500" />{job.allowance}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-vlu-500" />Còn {slotsLeft(job)}/{job.quota} chỉ tiêu</span>
          <span className={cx('inline-flex items-center gap-1.5', state === 'open' && left <= 3 && 'font-semibold text-rose-600')}>
            <CalendarClock size={14} className={state === 'open' && left <= 3 ? 'text-rose-500' : 'text-vlu-500'} />
            Hạn {formatDate(deadlineDate(job))}
            {state === 'open' && left <= 3 && ` (còn ${left} ngày)`}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip tone="brand">{job.major}</Chip>
          {job.skills.map((s) => <Chip key={s}>{s}</Chip>)}
        </div>
      </div>
    </article>
  )
}
