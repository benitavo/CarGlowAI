'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import {
  CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_SECONDS, DEFAULT_CATEGORIES,
  parseConsentCookie, serializeConsent, type ConsentCategories,
} from '@/lib/consent'

// 'unknown' until the client has actually checked for a stored cookie — the server (and
// the first client render, pre-hydration) always renders this, so there's nothing for
// hydration to mismatch against. Nothing that reads consent should treat 'unknown' as a
// yes; every gate below only opens once status === 'decided'.
type ConsentStatus = 'unknown' | 'decided'

interface ConsentContextValue {
  status: ConsentStatus
  categories: ConsentCategories
  marketingGranted: boolean
  bannerOpen: boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (next: { marketing: boolean }) => void
  openBanner: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function writeConsentCookie(next: { marketing: boolean; analytics: boolean }) {
  const value = serializeConsent(next)
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  // Not httpOnly on purpose: both this client provider and server routes (reading it via
  // next/headers `cookies()`, to gate the Meta CAPI) need to read the same cookie.
  document.cookie =
    `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`
}

// Meta sets these once the pixel fires — clear them so no marketing identifier lingers
// once the user withdraws consent.
function clearMetaCookies() {
  document.cookie = '_fbp=; Max-Age=0; Path=/'
  document.cookie = '_fbc=; Max-Age=0; Path=/'
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>('unknown')
  const [categories, setCategories] = useState<ConsentCategories>(DEFAULT_CATEGORIES)
  const [bannerOpen, setBannerOpen] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const stored = parseConsentCookie(readCookie(CONSENT_COOKIE_NAME))
    if (stored) {
      setCategories(stored.categories)
      setBannerOpen(false)
    } else {
      setBannerOpen(true)
    }
    setStatus('decided')
  }, [])

  const persist = useCallback((next: { marketing: boolean; analytics: boolean }) => {
    writeConsentCookie(next)
    if (!next.marketing) clearMetaCookies()
    setCategories({ necessary: true, ...next })
    setStatus('decided')
    setBannerOpen(false)
  }, [])

  const acceptAll = useCallback(() => persist({ marketing: true, analytics: false }), [persist])
  const rejectAll = useCallback(() => persist({ marketing: false, analytics: false }), [persist])
  const savePreferences = useCallback(
    (next: { marketing: boolean }) => persist({ marketing: next.marketing, analytics: false }),
    [persist],
  )
  const openBanner = useCallback(() => setBannerOpen(true), [])

  const value = useMemo<ConsentContextValue>(() => ({
    status,
    categories,
    marketingGranted: status === 'decided' && categories.marketing === true,
    bannerOpen,
    acceptAll,
    rejectAll,
    savePreferences,
    openBanner,
  }), [status, categories, bannerOpen, acceptAll, rejectAll, savePreferences, openBanner])

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within <ConsentProvider>')
  return ctx
}
