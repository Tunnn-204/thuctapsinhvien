import { FormEvent, useState } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { SEMESTER } from '../lib/data'
import { useStore } from '../lib/store'
import { btnPrimary, inputCls } from '../components/ui'

export function Login() {
  const { login } = useStore()
  const [email, setEmail] = useState('tung.thetung@vanlanguni.vn')
  const [password, setPassword] = useState('123456')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = login(email, password)
    if (!r.ok) setError(r.error)
    else window.location.hash = '#/jobs'
  }

  const logoUrl = new URL('../assets/vlu-logo.png', import.meta.url).href;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-vlu-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-vlu-600/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[380px] rounded-full bg-vlu-500/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <img src="https://Tunnn-204.github.io/thuctapsinhvien/vlu-logo.png" alt="Logo Đại học Văn Lang" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-sm font-semibold leading-tight">Đại học Văn Lang</p>
            <p className="text-xs text-vlu-200">Cổng thông tin thực tập</p>
          </div>
        </div>
        <div className="relative">
          <p className="mb-3 text-sm font-medium text-vlu-200">{SEMESTER}</p>
          <h1 className="max-w-md text-5xl font-extrabold leading-[1.1] tracking-tight">Hệ thống quản lý thực tập</h1>
        </div>
        <p className="relative text-xs text-vlu-300">© Đại học Văn Lang · Phòng Đào tạo</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="https://Tunnn-204.github.io/thuctapsinhvien/vlu-logo.png" alt="Logo Đại học Văn Lang" className="h-10 w-auto object-contain" />
            <p className="text-sm font-bold text-vlu-800">Đại học Văn Lang</p>
          </div>
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-stone-900">Đăng nhập</h2>
          <p className="mt-1.5 text-center text-sm text-stone-500">Sử dụng tài khoản Email VLU (SSO) của bạn để tiếp tục.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {error && (
              <div role="alert" className="flex gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700">Email VLU</span>
              <input className={inputCls} type="email" autoComplete="username" placeholder="ten.sinhvien@vanlanguni.vn" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700">Mật khẩu</span>
              <div className="relative">
                <input className={inputCls + ' pr-11'} type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:text-stone-700">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button type="submit" className={btnPrimary + ' w-full py-3'}>Đăng nhập</button>
          </form>

        </div>
      </main>
    </div>
  )
}