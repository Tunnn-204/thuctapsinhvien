import { Job, COMPANIES } from './data'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function deadlineDate(job: Job): Date {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  d.setDate(d.getDate() + job.deadlineOffset)
  return d
}

export function formatDate(d: Date | string | number) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(d: Date | string | number) {
  const date = new Date(d)
  return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${formatDate(date)}`
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

export function daysLeft(job: Job) {
  return Math.ceil((deadlineDate(job).getTime() - Date.now()) / 86400000)
}

export function companyOf(companyId: string) {
  return COMPANIES.find((c) => c.id === companyId)!
}

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function downloadJd(job: Job) {
  const company = companyOf(job.companyId)
  const text = [
    `MÔ TẢ CÔNG VIỆC – ${job.title.toUpperCase()}`,
    `Doanh nghiệp: ${company.name}`,
    `Địa điểm: ${company.address} (${job.mode})`,
    `Thời gian thực tập: ${job.duration}`,
    `Phụ cấp: ${job.allowance}`,
    `Hạn nhận hồ sơ: ${formatDate(deadlineDate(job))}`,
    '',
    'MÔ TẢ CÔNG VIỆC',
    ...job.description.map((x) => `- ${x}`),
    '',
    'YÊU CẦU ỨNG TUYỂN',
    ...job.requirements.map((x) => `- ${x}`),
    '',
    'QUYỀN LỢI',
    ...job.benefits.map((x) => `- ${x}`),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `JD_${company.name.replace(/\s+/g, '')}_${job.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
