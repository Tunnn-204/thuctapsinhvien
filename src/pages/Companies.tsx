import { ArrowLeft, BadgeCheck, Globe, MapPin, Users } from 'lucide-react'
import { COMPANIES, JOBS } from '../lib/data'
import { formatDate } from '../lib/utils'
import { navigate } from '../lib/router'
import { CompanyLogo } from '../components/ui'
import { JobCard } from '../components/JobCard'

export function Companies() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Doanh nghiệp đã xác thực</h1>
        <p className="mt-1.5 text-stone-500">Danh sách doanh nghiệp đối tác được Nhà trường kiểm duyệt trước khi đăng tin.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {COMPANIES.map((c) => {
          const count = JOBS.filter((j) => j.companyId === c.id).length
          return (
            <article key={c.id} onClick={() => navigate(`/companies/${c.id}`)} className="group cursor-pointer rounded-2xl border border-stone-200/80 bg-white p-5 transition hover:border-vlu-300 hover:shadow-[0_8px_30px_-12px_rgba(112,48,160,0.35)]">
              <div className="flex items-start gap-4">
                <CompanyLogo company={c} size={52} />
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1.5 font-bold text-stone-900 group-hover:text-vlu-700">
                    {c.name} <BadgeCheck size={17} className="shrink-0 text-vlu-500" />
                  </h3>
                  <p className="text-sm text-stone-500">{c.industry}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-600">{c.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-stone-500"><MapPin size={14} />{c.address.split(',').slice(-2).join(',').trim()}</span>
                <span className="font-semibold text-vlu-700">{count} vị trí</span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function CompanyDetail({ id }: { id: string }) {
  const c = COMPANIES.find((x) => x.id === id)
  if (!c) return <p>Không tìm thấy doanh nghiệp.</p>
  const jobs = JOBS.filter((j) => j.companyId === c.id)
  return (
    <div>
      <button onClick={() => navigate('/companies')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-vlu-700"><ArrowLeft size={16} />Danh sách doanh nghiệp</button>
      <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <CompanyLogo company={c} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-stone-900">{c.name}<BadgeCheck size={22} className="text-vlu-500" /></h1>
            <p className="text-stone-500">{c.industry}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-vlu-500" />{c.address}</span>
              <span className="inline-flex items-center gap-1.5"><Users size={15} className="text-vlu-500" />{c.size}</span>
              <span className="inline-flex items-center gap-1.5"><Globe size={15} className="text-vlu-500" />{c.website}</span>
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-3xl leading-relaxed text-stone-700">{c.description}</p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-vlu-50 px-3 py-1.5 text-xs font-semibold text-vlu-700"><BadgeCheck size={14} />Xác thực bởi Nhà trường ngày {formatDate(c.verifiedAt)}</p>
      </section>
      <h2 className="mb-3 mt-8 text-lg font-bold text-stone-900">Vị trí đang tuyển ({jobs.length})</h2>
      <div className="space-y-3">{jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
    </div>
  )
}
