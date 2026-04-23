import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import Icon from '@/components/ui/icon'

interface Topic {
  id: number
  title: string
  body: string
  is_pinned: boolean
  is_closed: boolean
  comments_count: number
  created_at: string
  updated_at: string
  author_nickname: string
  image_url: string | null
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Forum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.forum.topics().then(res => {
      if (Array.isArray(res)) setTopics(res)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <Link to="/catalog" className="hover:text-white transition-colors">Каталог</Link>
          <Link to="/forum" className="text-white font-medium">Форум</Link>
          <Link to="/how-it-works" className="hover:text-white transition-colors">Как это работает</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/cabinet" className="text-white/60 hover:text-white text-sm transition-colors">Кабинет</Link>
          ) : (
            <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Войти</Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Форум</h1>
          <p className="text-white/40 text-sm">Обсуждения, новости и анонсы от Распивошной</p>
        </div>

        {/* Topics */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={24} className="animate-spin text-white/30" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-16 text-white/25">
            <Icon name="MessageSquare" size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Тем пока нет</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/forum/${t.id}`)}
                className="w-full text-left border border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15 rounded-2xl p-4 transition-all group"
              >
                {t.image_url && (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-3">
                    <img src={t.image_url} alt={t.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {t.is_pinned && (
                        <span className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                          <Icon name="Pin" size={11} />
                          Закреплено
                        </span>
                      )}
                      {t.is_closed && (
                        <span className="flex items-center gap-1 text-white/30 text-xs">
                          <Icon name="Lock" size={11} />
                          Закрыто
                        </span>
                      )}
                    </div>
                    <h2 className="text-white font-semibold text-base group-hover:text-orange-300 transition-colors leading-snug">
                      {t.title}
                    </h2>
                    <p className="text-white/40 text-sm mt-1 line-clamp-2 leading-relaxed">{t.body}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/25">
                      <span>@{t.author_nickname}</span>
                      <span>{fmt(t.created_at)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-1 text-white/30 pt-1">
                    <Icon name="MessageCircle" size={16} />
                    <span className="text-xs font-medium">{t.comments_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}