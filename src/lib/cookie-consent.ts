export type CookieCategory = 'necessary' | 'analytics'

export interface CookieConsent {
  necessary: true
  analytics: boolean
  decidedAt: string
}

const STORAGE_KEY = 'cookie_consent'

export const getCookieConsent = (): CookieConsent | null => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CookieConsent
  } catch {
    return null
  }
}

export const setCookieConsent = (analytics: boolean) => {
  const consent: CookieConsent = {
    necessary: true,
    analytics,
    decidedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: consent }))
  return consent
}

export const hasCookieConsent = () => getCookieConsent() !== null

export const isCategoryAllowed = (category: CookieCategory) => {
  const consent = getCookieConsent()
  if (!consent) return category === 'necessary' ? true : false
  return category === 'necessary' ? true : consent.analytics
}
