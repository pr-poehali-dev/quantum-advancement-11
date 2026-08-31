import { isCategoryAllowed } from '@/lib/cookie-consent'

let analyticsLoaded = false

/**
 * Загружает скрипты аналитики (Яндекс.Метрика, Google Analytics и т.п.)
 * только если пользователь дал согласие на аналитические cookie.
 * Добавляйте реальные скрипты внутрь loadScripts().
 */
const loadScripts = () => {
  if (analyticsLoaded) return
  analyticsLoaded = true
  // Пример подключения счётчиков (сейчас закомментировано — подключите свои):
  // const ym = document.createElement('script')
  // ym.src = 'https://mc.yandex.ru/metrika/tag.js'
  // document.head.appendChild(ym)
}

export const initAnalyticsIfAllowed = () => {
  if (isCategoryAllowed('analytics')) {
    loadScripts()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('cookie-consent-changed', ((e: CustomEvent) => {
    if (e.detail?.analytics) loadScripts()
  }) as EventListener)
}
