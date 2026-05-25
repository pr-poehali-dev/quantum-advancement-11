import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nickname: '', email: '', phone: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Необходимо принять условия оферты и правила участия'); return }
    if (!agreedPrivacy) { setError('Необходимо дать согласие на обработку персональных данных'); return }
    setError('')
    setLoading(true)
    const res = await register(form)
    setLoading(false)
    if (res.error) return setError(res.error)
    navigate('/catalog')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-white font-bold text-2xl tracking-wide hover:text-orange-400 transition-colors">
            Распивошная
          </Link>
          <p className="text-white/50 mt-2 text-sm">Нишевый парфюм от 1 мл</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-white text-xl font-semibold mb-6">Регистрация</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/70 text-sm">Ник</Label>
              <Input
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-orange-500"
                placeholder="например: aromalover"
                value={form.nickname}
                onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Email</Label>
              <Input
                type="email"
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-orange-500"
                placeholder="mail@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Телефон</Label>
              <Input
                type="tel"
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-orange-500"
                placeholder="+7 900 000 00 00"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Пароль</Label>
              <Input
                type="password"
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-orange-500"
                placeholder="минимум 6 символов"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mt-2">
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setError('') }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  agreed
                    ? 'bg-orange-500 border-orange-500'
                    : error && !agreed
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-white/30 bg-white/5 group-hover:border-white/50'
                }`}>
                  {agreed && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-white/50 text-sm leading-snug select-none">
                Я прочитал(а) и принимаю{' '}
                <Link to="/offer" target="_blank" onClick={e => e.stopPropagation()} className="text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2">
                  договор оферты
                </Link>
                {' '}и{' '}
                <Link to="/rules" target="_blank" onClick={e => e.stopPropagation()} className="text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2">
                  правила участия
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={e => { setAgreedPrivacy(e.target.checked); if (e.target.checked) setError('') }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  agreedPrivacy
                    ? 'bg-orange-500 border-orange-500'
                    : error && !agreedPrivacy
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-white/30 bg-white/5 group-hover:border-white/50'
                }`}>
                  {agreedPrivacy && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-white/50 text-sm leading-snug select-none">
                Я даю согласие на обработку персональных данных в соответствии с{' '}
                <Link to="/privacy" target="_blank" onClick={e => e.stopPropagation()} className="text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2">
                  Политикой конфиденциальности
                </Link>
              </span>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl mt-2"
            >
              {loading ? 'Регистрируемся...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <p className="text-white/40 text-sm text-center mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}