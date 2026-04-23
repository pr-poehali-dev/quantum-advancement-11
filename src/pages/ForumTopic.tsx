import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface Topic {
  id: number
  title: string
  body: string
  is_pinned: boolean
  is_closed: boolean
  comments_count: number
  created_at: string
  author_nickname: string
  author_id: number
  image_url: string | null
}

interface Comment {
  id: number
  body: string
  created_at: string
  author_nickname: string
  author_id: number
  author_role: string
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ForumTopic() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  const load = useCallback(async () => {
    if (!id) return
    const res = await api.forum.topic(Number(id))
    if (res.error) { navigate('/forum'); return }
    setTopic(res.topic)
    setComments(res.comments || [])
    setLoading(false)
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments, loading])

  const handleSend = async () => {
    if (!text.trim() || !id) return
    if (!user) { toast.error('Войдите, чтобы комментировать'); return }
    setSending(true)
    const res = await api.forum.addComment(Number(id), text.trim())
    setSending(false)
    if (res.error) { toast.error(res.error); return }
    setText('')
    load()
  }

  const handleDeleteComment = async (comment_id: number) => {
    if (!confirm('Удалить комментарий?')) return
    const res = await api.forum.deleteComment(comment_id)
    if (res.error) { toast.error(res.error); return }
    load()
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Icon name="Loader2" size={24} className="animate-spin text-white/30" />
    </div>
  )

  if (!topic) return null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/cabinet" className="text-white/60 hover:text-white text-sm transition-colors">Кабинет</Link>
          ) : (
            <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Войти</Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link to="/forum" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors w-fit">
          <Icon name="ChevronLeft" size={14} />
          Форум
        </Link>

        {/* Topic */}
        <div className="border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {topic.is_pinned && (
                  <span className="flex items-center gap-1 text-orange-400 text-xs font-medium bg-orange-500/10 px-2 py-0.5 rounded-full">
                    <Icon name="Pin" size={10} /> Закреплено
                  </span>
                )}
                {topic.is_closed && (
                  <span className="flex items-center gap-1 text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                    <Icon name="Lock" size={10} /> Закрыто
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white leading-snug">{topic.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                <span>@{topic.author_nickname}</span>
                <span>{fmtDate(topic.created_at)}</span>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={async () => {
                    const res = await api.forum.pinTopic(topic.id, !topic.is_pinned)
                    if (res.error) { toast.error(res.error); return }
                    load()
                  }}
                  className="text-white/25 hover:text-orange-400 transition-colors"
                  title={topic.is_pinned ? 'Открепить' : 'Закрепить'}
                >
                  <Icon name="Pin" size={15} />
                </button>
                <button
                  onClick={async () => {
                    const res = await api.forum.closeTopic(topic.id, !topic.is_closed)
                    if (res.error) { toast.error(res.error); return }
                    load()
                  }}
                  className="text-white/25 hover:text-yellow-400 transition-colors"
                  title={topic.is_closed ? 'Открыть' : 'Закрыть'}
                >
                  <Icon name={topic.is_closed ? 'Unlock' : 'Lock'} size={15} />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Удалить тему и все комментарии?')) return
                    const res = await api.forum.deleteTopic(topic.id)
                    if (res.error) { toast.error(res.error); return }
                    toast.success('Тема удалена')
                    navigate('/forum')
                  }}
                  className="text-white/25 hover:text-red-400 transition-colors"
                  title="Удалить тему"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            )}
          </div>
          {topic.image_url && (
            <img src={topic.image_url} alt={topic.title}
              className="w-full rounded-xl object-cover max-h-80 mt-3 border border-white/8" />
          )}
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap mt-3">{topic.body}</p>
        </div>

        {/* Comments */}
        <div className="mb-2">
          <h2 className="text-white/50 text-xs font-medium uppercase tracking-wide mb-3">
            Комментарии · {comments.length}
          </h2>
          {comments.length === 0 && (
            <div className="text-center py-8 text-white/20 text-sm border border-white/5 rounded-2xl">
              Пока нет комментариев — будь первым!
            </div>
          )}
          <div className="space-y-3">
            {comments.map(c => {
              const isModerator = c.author_role === 'admin' || c.author_role === 'moderator'
              const canDelete = isAdmin || c.author_id === user?.id
              return (
                <div key={c.id} className={`border rounded-xl p-4 ${isModerator ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/8 bg-white/2'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isModerator && <Icon name="Shield" size={12} className="text-orange-400 shrink-0" />}
                      <span className={`text-sm font-medium ${isModerator ? 'text-orange-300' : 'text-white/80'}`}>
                        @{c.author_nickname}
                      </span>
                      <span className="text-white/20 text-xs">{fmtDate(c.created_at)}</span>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDeleteComment(c.id)}
                        className="text-white/15 hover:text-red-400 transition-colors shrink-0">
                        <Icon name="Trash2" size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Comment form */}
        {!topic.is_closed || isAdmin ? (
          user ? (
            <div className="mt-6 border border-white/10 rounded-2xl p-4">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend() }}
                placeholder="Написать комментарий... (Ctrl+Enter — отправить)"
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-orange-500/50 transition-colors mb-3"
              />
              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={sending || !text.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 px-5">
                  {sending ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Отправить'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center py-6 border border-white/8 rounded-2xl">
              <p className="text-white/40 text-sm mb-3">Войдите, чтобы оставить комментарий</p>
              <Link to="/login">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">Войти</Button>
              </Link>
            </div>
          )
        ) : (
          <div className="mt-6 text-center py-4 border border-white/5 rounded-2xl">
            <p className="text-white/25 text-sm flex items-center justify-center gap-2">
              <Icon name="Lock" size={14} />
              Тема закрыта для комментариев
            </p>
          </div>
        )}
      </main>
    </div>
  )
}