import { ReactNode, useEffect, useRef, useState } from 'react'
import { Bell, Briefcase, Building2, CheckCheck, CheckCircle2, ClipboardSignature, FileText, NotebookPen, Trophy, TriangleAlert, Info, LogOut, PencilLine, XCircle } from 'lucide-react'
import logo from '../assets/vlu-logo.png'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { cx, timeAgo } from '../lib/utils'
import { SEMESTER } from '../lib/data'

const NAV = [
  { to: '/jobs', label: 'Tin tuyển dụng thực tập', icon: Briefcase, match: 'jobs' },
  { to: '/companies', label: 'Doanh nghiệp', icon: Building2, match: 'companies' },
  { to: '/applications', label: 'Hồ sơ cá nhân', icon: FileText, match: 'applications' },
  { to: '/registration', label: 'Đăng ký thực tập với Khoa', icon: ClipboardSignature, match: 'registration' },
  { to: '/diary', label: 'Nhật ký & Tiến độ thực tập', icon: NotebookPen, match: 'diary' },
  { to: '/final', label: 'Báo cáo cuối kỳ & Kết quả', icon: Trophy, match: 'final' },
]

export const NoticeIcon = ({ kind }: { kind: 'approved' | 'rejected' | 'info' | 'revision' | 'warning' }) =>
  kind === 'warning' ? (
    <TriangleAlert size={18} className="text-rose-600" />
  ) : kind === 'revision' ? (
    <PencilLine size={18} className="text-amber-600" />
  ) : kind === 'approved' ? (
    <CheckCircle2 size={18} className="text-emerald-600" />
  ) : kind === 'rejected' ? (
    <XCircle size={18} className="text-rose-600" />
  ) : (
    <Info size={18} className="text-vlu-600" />
  )

function Bell_() {
  const { notices, unread, markRead, markAllRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', on)
    return () => document.removeEventListener('mousedown', on)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Thông báo" className="relative rounded-xl p-2.5 text-stone-600 transition hover:bg-vlu-50 hover:text-vlu-700">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-bold text-stone-900">Thông báo</p>
            <button onClick={markAllRead} disabled={!unread} className="inline-flex items-center gap-1 text-xs font-semibold text-vlu-600 disabled:text-stone-300">
              <CheckCheck size={14} /> Đánh dấu đã đọc
            </button>
          </div>
          <ul className="max-h-[360px] divide-y divide-stone-100 overflow-y-auto">
            {notices.length === 0 && <li className="px-4 py-8 text-center text-sm text-stone-500">Chưa có thông báo nào.</li>}
            {notices.slice(0, 6).map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => { markRead(n.id); setOpen(false); navigate(n.href ?? '/applications') }}
                  className={cx('flex w-full gap-3 px-4 py-3 text-left transition hover:bg-stone-50', !n.read && 'bg-vlu-50/60')}
                >
                  <span className="mt-0.5"><NoticeIcon kind={n.kind} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-stone-900">{n.title}</span>
                    <span className="line-clamp-2 block text-xs leading-relaxed text-stone-600">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-stone-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-vlu-500" />}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => { setOpen(false); navigate('/notifications') }} className="w-full border-t border-stone-100 py-3 text-center text-sm font-semibold text-vlu-600 hover:bg-vlu-50">
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  )
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  const initial = name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover ring-2 ring-white" />
  ) : (
    <span style={{ width: size, height: size, fontSize: size * 0.4 }} className="grid shrink-0 place-items-center rounded-full bg-vlu-100 font-bold text-vlu-700">{initial}</span>
  )
}

export function Shell({ active, children }: { active: string; children: ReactNode }) {
  const { user, profile, logout, toasts } = useStore()
  if (!user) return null
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <a href="#/jobs" className="flex items-center gap-2.5">
            <img src={logo} alt="Logo Đại học Văn Lang" className="h-10 w-auto object-contain" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-extrabold text-vlu-800">VLU Internship</span>
              <span className="block text-[11px] text-stone-500">{SEMESTER}</span>
            </span>
          </a>
          <div className="ml-auto flex items-center gap-2">
            <Bell_ />
            <a href="#/profile" title="Thông tin cá nhân" className={cx('flex items-center gap-3 rounded-xl border-l border-stone-200 py-1 pl-3 pr-1.5 transition hover:bg-vlu-50', active === 'profile' && 'bg-vlu-50')}>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-semibold text-stone-900">{user.fullName}</span>
                <span className="block text-[11px] text-stone-500">{user.studentId} · {user.cohort}</span>
              </span>
              <Avatar name={user.fullName} src={profile.avatar} size={36} />
            </a>
            <button onClick={logout} aria-label="Đăng xuất" title="Đăng xuất" className="rounded-xl p-2.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"><LogOut size={19} /></button>
          </div>
        </div>
        <div className="border-t border-stone-100">
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1.5">
            {NAV.map((n) => (
              <a key={n.to} href={'#' + n.to} className={cx('inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition', active === n.match ? 'bg-vlu-50 text-vlu-700' : 'text-stone-600 hover:bg-stone-100')}>
                <n.icon size={16} />{n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl bg-vlu-900 px-4 py-3 text-sm text-white shadow-2xl">
            <Bell size={16} className="mt-0.5 shrink-0 text-vlu-300" />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
