import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { Company } from '../lib/data'
import { AppStatus, JobState } from '../lib/store'
import { RegStatus } from '../lib/registration'
import { cx } from '../lib/utils'

export function CompanyLogo({ company, size = 48 }: { company: Company; size?: number }) {
  const initials = company.name
    .split(' ')
    .filter((w) => /^[A-Za-zÀ-ỹ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-xl font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${company.hue} 55% 42%), hsl(${company.hue + 25} 60% 56%))`,
      }}
    >
      {initials}
    </div>
  )
}

export const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  pending: { label: 'Chờ doanh nghiệp duyệt', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  approved: { label: 'Đã được duyệt', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  rejected: { label: 'Bị từ chối', cls: 'bg-rose-50 text-rose-800 ring-rose-200' },
  cancelled: { label: 'Đã hủy', cls: 'bg-stone-100 text-stone-600 ring-stone-200' },
}

export function StatusBadge({ status }: { status: AppStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', m.cls)}>
      {m.label}
    </span>
  )
}

export function JobStateBadge({ state }: { state: JobState }) {
  if (state === 'open') return null
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200">
      {state === 'expired' ? 'Hết hạn nhận hồ sơ' : 'Hết chỉ tiêu'}
    </span>
  )
}

export function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'brand' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        tone === 'brand' ? 'bg-vlu-50 text-vlu-700' : 'bg-stone-100 text-stone-600',
      )}
    >
      {children}
    </span>
  )
}

export function Modal({
  title,
  onClose,
  children,
  width = 'max-w-xl',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', on)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-vlu-900/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl', width)}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-lg font-bold text-vlu-900">{title}</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-vlu-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-vlu-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none disabled:active:scale-100'
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-vlu-300 hover:bg-vlu-50 hover:text-vlu-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
export const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-vlu-500 focus:outline-none focus:ring-4 focus:ring-vlu-100'

export const REG_STATUS_META: Record<RegStatus, { label: string; cls: string }> = {
  draft: { label: 'Bản nháp', cls: 'bg-stone-100 text-stone-600 ring-stone-200' },
  pending: { label: 'Chờ Khoa phê duyệt', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  revision: { label: 'Cần chỉnh sửa', cls: 'bg-orange-50 text-orange-800 ring-orange-200' },
  approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
}

export function RegStatusBadge({ status }: { status: RegStatus }) {
  const m = REG_STATUS_META[status]
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', m.cls)}>
      {m.label}
    </span>
  )
}
