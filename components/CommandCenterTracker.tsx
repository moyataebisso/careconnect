'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const BLOCKED = ['/admin', '/dashboard', '/care-seeker', '/auth']

export default function CommandCenterTracker() {
  const pathname = usePathname()
  if (BLOCKED.some((prefix) => pathname.startsWith(prefix))) return null
  return (
    <Script
      src="https://arsi-command-center.vercel.app/t.js"
      data-key="7d606e5a73b5163f030deb1e"
      strategy="afterInteractive"
    />
  )
}
