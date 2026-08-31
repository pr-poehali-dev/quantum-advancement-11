import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isSiteUnlocked, tryUnlockSite } from '@/lib/site-lock'

export default function SiteLockGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isSiteUnlocked)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tryUnlockSite(password)) {
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen bg-choco-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-serif text-gold-400 font-semibold text-2xl tracking-wide">
            Распивошная
          </div>
          <p className="text-white/50 mt-2 text-sm">Сайт временно недоступен</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-white text-lg font-semibold mb-1">Доступ по паролю</h1>
          <p className="text-white/40 text-sm mb-6">Введите пароль, чтобы продолжить</p>

          <Input
            type="password"
            autoFocus
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold-500"
            placeholder="Пароль"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
          />

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
              Неверный пароль
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-xl mt-4"
          >
            Войти
          </Button>
        </div>
      </form>
    </div>
  )
}
