import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(form.email, form.password)
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
          <h1 className="text-white text-xl font-semibold mb-6">Вход</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label className="text-white/70 text-sm">Пароль</Label>
              <Input
                type="password"
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-orange-500"
                placeholder="ваш пароль"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

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
              {loading ? 'Входим...' : 'Войти'}
            </Button>
          </form>

          <p className="text-white/40 text-sm text-center mt-6">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-orange-400 hover:text-orange-300 transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}