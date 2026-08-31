import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { hasCookieConsent, setCookieConsent } from '@/lib/cookie-consent'
import { initAnalyticsIfAllowed } from '@/lib/analytics'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(true)

  useEffect(() => {
    if (!hasCookieConsent()) {
      setVisible(true)
    } else {
      initAnalyticsIfAllowed()
    }
  }, [])

  const accept = (analytics: boolean) => {
    setCookieConsent(analytics)
    initAnalyticsIfAllowed()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-choco-900 border border-gold-500/20 rounded-2xl shadow-2xl shadow-black/50 p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0">
            <span className="text-lg">🍪</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm mb-1">Мы используем файлы cookie</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Cookie помогают сайту работать и улучшать сервис. Часть из них необходима для функционирования сайта, часть — используется для аналитики. Подробнее в{' '}
              <Link to="/privacy" className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors">Политике конфиденциальности</Link>.
            </p>
          </div>
        </div>

        {settingsOpen && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div>
                <div className="text-white text-sm font-medium">Необходимые</div>
                <div className="text-white/40 text-xs mt-0.5">Обеспечивают базовую работу сайта. Всегда включены.</div>
              </div>
              <div className="w-10 h-6 rounded-full bg-gold-500/40 flex items-center px-0.5 shrink-0">
                <div className="w-5 h-5 rounded-full bg-gold-500 ml-auto" />
              </div>
            </div>
            <label className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
              <div>
                <div className="text-white text-sm font-medium">Аналитические</div>
                <div className="text-white/40 text-xs mt-0.5">Помогают понять, как посетители используют сайт.</div>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsChecked(v => !v)}
                className={`w-10 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${analyticsChecked ? 'bg-gold-500' : 'bg-white/15'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${analyticsChecked ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          {settingsOpen ? (
            <>
              <Button onClick={() => accept(analyticsChecked)} className="bg-gold-500 hover:bg-gold-600 text-white flex-1">
                Сохранить выбор
              </Button>
              <Button onClick={() => setSettingsOpen(false)} variant="outline" className="border-white/20 text-white/70 hover:bg-white/5 hover:text-white">
                Назад
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => accept(true)} className="bg-gold-500 hover:bg-gold-600 text-white flex-1">
                Принять все
              </Button>
              <Button onClick={() => accept(false)} variant="outline" className="border-white/20 text-white/70 hover:bg-white/5 hover:text-white flex-1">
                Только необходимые
              </Button>
              <Button onClick={() => setSettingsOpen(true)} variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5">
                Настроить
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
