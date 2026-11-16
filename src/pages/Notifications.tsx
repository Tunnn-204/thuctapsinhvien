import { BellOff, CheckCheck } from 'lucide-react'
import { useStore } from '../lib/store'
import { cx, formatDateTime } from '../lib/utils'
import { navigate } from '../lib/router'
import { NoticeIcon } from '../components/Shell'
import { btnSecondary } from '../components/ui'

export function Notifications() {
  const { notices, unread, markRead, markAllRead } = useStore()
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Thông báo</h1>
          <p className="mt-1.5 text-stone-500">Hệ thống tự động thông báo mỗi khi doanh nghiệp thay đổi trạng thái duyệt CV của bạn.</p>
        </div>
        <button onClick={markAllRead} disabled={!unread} className={btnSecondary}><CheckCheck size={16} />Đánh dấu tất cả đã đọc</button>
      </div>
      {notices.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <BellOff size={36} className="text-stone-300" />
          <p className="mt-3 font-semibold text-stone-800">Chưa có thông báo nào</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white">
          {notices.map((n) => (
            <li key={n.id}>
              <button onClick={() => { markRead(n.id); navigate(n.href ?? '/applications') }} className={cx('flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-stone-50', !n.read && 'bg-vlu-50/50')}>
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-stone-200"><NoticeIcon kind={n.kind} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-stone-900">{n.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-stone-600">{n.body}</span>
                  <span className="mt-1.5 block text-xs text-stone-400">{formatDateTime(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-vlu-500" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
