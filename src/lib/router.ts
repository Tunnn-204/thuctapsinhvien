import { useEffect, useState } from 'react'

export function navigate(to: string) {
  window.location.hash = to
}

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/jobs')
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash || '#/jobs')
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [pathPart, queryPart = ''] = hash.replace(/^#/, '').split('?')
  return {
    raw: hash,
    path: pathPart.split('/').filter(Boolean),
    query: new URLSearchParams(queryPart),
  }
}
