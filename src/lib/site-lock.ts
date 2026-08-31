const STORAGE_KEY = 'site_unlocked'
const SITE_PASSWORD = 'bZ(1nOa4RpiA'

export const isSiteUnlocked = (): boolean => {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export const tryUnlockSite = (password: string): boolean => {
  if (password === SITE_PASSWORD) {
    localStorage.setItem(STORAGE_KEY, '1')
    return true
  }
  return false
}
