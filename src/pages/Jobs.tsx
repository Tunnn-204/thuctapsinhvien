import { FormEvent, useMemo, useState } from 'react'
import { Lightbulb, RotateCcw, Search, SearchX } from 'lucide-react'
import { JOBS, MAJORS, SEMESTER } from '../lib/data'
import { useStore } from '../lib/store'
import { companyOf, deadlineDate } from '../lib/utils'
import { JobCard } from '../components/JobCard'
import { btnPrimary, btnSecondary, inputCls } from '../components/ui'

const ALL_SKILLS = Array.from(new Set(JOBS.flatMap((j) => j.skills))).sort((a, b) => a.localeCompare(b, 'vi'))
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase()

type Filters = { q: string; major: string; skill: string; onlyOpen: boolean }

export function Jobs({ initialMajor = '', hint = false }: { initialMajor?: string; hint?: boolean }) {
  const { jobState } = useStore()
  const [draft, setDraft] = useState<Filters>({ q: '', major: initialMajor, skill: '', onlyOpen: false })
  const [applied, setApplied] = useState<Filters>(draft)

  const results = useMemo(() => {
    const q = norm(applied.q.trim())
    return JOBS.filter((j) => {
      if (applied.major && j.major !== applied.major) return false
      if (applied.skill && !j.skills.includes(applied.skill)) return false
      if (applied.onlyOpen && jobState(j) !== 'open') return false
      if (q) {
        const hay = norm([j.title, companyOf(j.companyId).name, j.major, ...j.skills].join(' '))
        return q.split(/\s+/).every((w) => hay.includes(w))
      }
      return true
    }).sort((a, b) => {
      const oa = jobState(a) === 'open' ? 0 : 1
      const ob = jobState(b) === 'open' ? 0 : 1
      return oa - ob || deadlineDate(a).getTime() - deadlineDate(b).getTime()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, jobState])

  // Ngành, kỹ năng và bộ lọc "còn hạn / còn chỉ tiêu" áp dụng ngay; từ khóa áp dụng khi bấm "Tìm kiếm"
  const change = (patch: Partial<Filters>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setApplied((a) => ({ ...a, ...patch }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setApplied(draft)
  }
  const reset = () => {
    const empty = { q: '', major: '', skill: '', onlyOpen: false }
    setDraft(empty)
    setApplied(empty)
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold text-vlu-600">{SEMESTER}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">Tin tuyển dụng thực tập</h1>
        <p className="mt-1.5 text-stone-500">Các vị trí từ doanh nghiệp đã được Nhà trường xác thực.</p>
      </div>

      {hint && (
        <div className="mb-5 flex gap-3 rounded-2xl bg-vlu-50 p-4 text-sm text-vlu-900 ring-1 ring-inset ring-vlu-200">
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-vlu-600" />
          <p>Hồ sơ trước đó đã bị từ chối. Dưới đây là các vị trí cùng ngành đang nhận hồ sơ, bạn có thể nộp sang doanh nghiệp khác.</p>
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_180px]">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input className={inputCls + ' pl-10'} placeholder="Nhập từ khóa: vị trí, doanh nghiệp, kỹ năng…" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} aria-label="Từ khóa" />
          </div>
          <select className={inputCls} value={draft.major} onChange={(e) => change({ major: e.target.value })} aria-label="Ngành">
            <option value="">Tất cả ngành</option>
            {MAJORS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select className={inputCls} value={draft.skill} onChange={(e) => change({ skill: e.target.value })} aria-label="Kỹ năng">
            <option value="">Tất cả kỹ năng</option>
            {ALL_SKILLS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" className="size-4 accent-vlu-600" checked={draft.onlyOpen} onChange={(e) => change({ onlyOpen: e.target.checked })} />
            Chỉ hiện vị trí còn hạn và còn chỉ tiêu
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className={btnSecondary + ' !py-2'}><RotateCcw size={15} />Xóa lọc</button>
            <button type="submit" className={btnPrimary + ' !py-2'}><Search size={16} />Tìm kiếm</button>
          </div>
        </div>
      </form>

      <p className="mb-3 mt-6 text-sm text-stone-500">
        <span className="font-bold text-stone-900">{results.length}</span> vị trí phù hợp
      </p>
      {results.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <SearchX size={36} className="text-stone-300" />
          <p className="mt-3 font-semibold text-stone-800">Không tìm thấy vị trí phù hợp</p>
          <p className="mt-1 text-sm text-stone-500">Thử đổi từ khóa hoặc bỏ bớt tiêu chí lọc.</p>
          <button onClick={reset} className={btnSecondary + ' mt-5'}>Xóa bộ lọc</button>
        </div>
      ) : (
        <div className="space-y-3">{results.map((j) => <JobCard key={j.id} job={j} />)}</div>
      )}
    </div>
  )
}
