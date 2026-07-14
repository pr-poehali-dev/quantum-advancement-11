import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface TopicProduct {
  id: number
  name: string
  brand: string
  description: string
  price_per_ml: number
  bottle_ml: number
  booked_ml: number
  available_ml: number
  image_url: string | null
  fill_percent: number
  concentration: string
  category: string
}

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
  products: TopicProduct[]
}

interface Comment {
  id: number
  body: string
  created_at: string
  author_nickname: string
  author_id: number
  author_role: string
  parent_id: number | null
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Сжимает изображение до максимальных размеров, сохраняя пропорции
function resizeImage(file: File, maxW = 1200, maxH = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = reject
    img.src = url
  })
}

// Один комментарий + его дочерние ответы
function CommentItem({
  comment,
  allComments,
  depth,
  user,
  isAdmin,
  topicId,
  isClosed,
  onReply,
  onDelete,
  replyingTo,
  replyText,
  setReplyText,
  sendingReply,
  onSendReply,
  onCancelReply,
}: {
  comment: Comment
  allComments: Comment[]
  depth: number
  user: { id: number; role: string; nickname?: string } | null
  isAdmin: boolean
  topicId: number
  isClosed: boolean
  onReply: (id: number) => void
  onDelete: (id: number) => void
  replyingTo: number | null
  replyText: string
  setReplyText: (t: string) => void
  sendingReply: boolean
  onSendReply: () => void
  onCancelReply: () => void
}) {
  const children = allComments.filter(c => c.parent_id === comment.id)
  const isMod = comment.author_role === 'admin' || comment.author_role === 'moderator'
  const canDelete = isAdmin || comment.author_id === user?.id
  const canReply = user && (!isClosed || isAdmin) && depth < 4

  return (
    <div className={depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-white/8 pl-3 sm:pl-4' : ''}>
      <div className={`border rounded-xl p-3.5 ${isMod ? 'border-teal-500/20 bg-teal-500/5' : 'border-white/8 bg-white/2'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isMod && <Icon name="Shield" size={12} className="text-teal-400 shrink-0" />}
            <span className={`text-sm font-medium ${isMod ? 'text-teal-300' : 'text-white/80'}`}>
              @{comment.author_nickname}
            </span>
            <span className="text-white/20 text-xs">{fmtDate(comment.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-white/25 hover:text-teal-400 transition-colors text-xs flex items-center gap-1"
              >
                <Icon name="CornerDownRight" size={13} />
                <span className="hidden sm:inline">Ответить</span>
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(comment.id)} className="text-white/15 hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={13} />
              </button>
            )}
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
      </div>

      {/* Форма ответа прямо под комментарием */}
      {replyingTo === comment.id && (
        <div className="mt-2 ml-0 bg-white/3 border border-white/10 rounded-xl p-3">
          <div className="text-white/40 text-xs mb-2 flex items-center gap-1">
            <Icon name="CornerDownRight" size={12} />
            Ответ для @{comment.author_nickname}
          </div>
          <textarea
            autoFocus
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSendReply() }}
            placeholder="Ваш ответ... (Ctrl+Enter — отправить)"
            rows={2}
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-teal-500/50 transition-colors mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={onSendReply} disabled={sendingReply || !replyText.trim()}
              className="bg-teal-500 hover:bg-teal-600 text-white text-xs h-8 px-4">
              {sendingReply ? <Icon name="Loader2" size={13} className="animate-spin" /> : 'Отправить'}
            </Button>
            <Button onClick={onCancelReply} variant="ghost" className="text-white/30 text-xs h-8">Отмена</Button>
          </div>
        </div>
      )}

      {/* Дочерние ответы */}
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              allComments={allComments}
              depth={depth + 1}
              user={user}
              isAdmin={isAdmin}
              topicId={topicId}
              isClosed={isClosed}
              onReply={onReply}
              onDelete={onDelete}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              sendingReply={sendingReply}
              onSendReply={onSendReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  )
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
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
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
  }, [loading])

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

  const handleSendReply = async () => {
    if (!replyText.trim() || !replyingTo || !id) return
    setSendingReply(true)
    const res = await api.forum.addComment(Number(id), replyText.trim(), replyingTo)
    setSendingReply(false)
    if (res.error) { toast.error(res.error); return }
    setReplyText('')
    setReplyingTo(null)
    load()
  }

  const handleDeleteComment = async (comment_id: number) => {
    if (!confirm('Удалить комментарий?')) return
    const res = await api.forum.deleteComment(comment_id)
    if (res.error) { toast.error(res.error); return }
    load()
  }

  const handleReply = (commentId: number) => {
    if (replyingTo === commentId) {
      setReplyingTo(null)
      setReplyText('')
    } else {
      setReplyingTo(commentId)
      setReplyText('')
    }
  }

  // Только корневые комментарии (без parent_id)
  const rootComments = comments.filter(c => !c.parent_id)

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Icon name="Loader2" size={24} className="animate-spin text-white/30" />
    </div>
  )

  if (!topic) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-teal-400 transition-colors">
          Распивошная
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link to="/catalog" className="text-white/50 hover:text-white transition-colors">Каталог</Link>
          <Link to="/forum" className="text-white/50 hover:text-white transition-colors">Форум</Link>
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
        <Link to="/forum" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors w-fit">
          <Icon name="ChevronLeft" size={14} />
          Форум
        </Link>

        {/* Тема */}
        <div className="border border-white/10 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {topic.is_pinned && (
                  <span className="flex items-center gap-1 text-teal-400 text-xs font-medium bg-teal-500/10 px-2 py-0.5 rounded-full">
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
                <button onClick={async () => { const r = await api.forum.pinTopic(topic.id, !topic.is_pinned); if (!r.error) load() }}
                  className={`p-1.5 rounded transition-colors ${topic.is_pinned ? 'text-teal-400' : 'text-white/25 hover:text-teal-400'}`}
                  title={topic.is_pinned ? 'Открепить' : 'Закрепить'}>
                  <Icon name="Pin" size={15} />
                </button>
                <button onClick={async () => { const r = await api.forum.closeTopic(topic.id, !topic.is_closed); if (!r.error) load() }}
                  className="text-white/25 hover:text-yellow-400 transition-colors p-1.5"
                  title={topic.is_closed ? 'Открыть' : 'Закрыть'}>
                  <Icon name={topic.is_closed ? 'Unlock' : 'Lock'} size={15} />
                </button>
                <button onClick={async () => {
                  if (!confirm('Удалить тему и все комментарии?')) return
                  const r = await api.forum.deleteTopic(topic.id)
                  if (r.error) { toast.error(r.error); return }
                  toast.success('Тема удалена'); navigate('/forum')
                }} className="text-white/25 hover:text-red-400 transition-colors p-1.5">
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Изображение — с max-width/max-height, пропорции сохранены */}
          {topic.image_url && (
            <div className="mt-3 mb-3">
              <img
                src={topic.image_url}
                alt={topic.title}
                className="rounded-xl border border-white/8"
                style={{ maxWidth: '100%', maxHeight: '480px', width: 'auto', height: 'auto', display: 'block' }}
              />
            </div>
          )}
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{topic.body}</p>
        </div>

        {/* Карточки товаров */}
        {topic.products && topic.products.length > 0 && (
          <div className="mb-6">
            <div className="text-white/40 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Icon name="ShoppingBag" size={12} />
              Товары в этой теме
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topic.products.map(p => (
                <div key={p.id} className="border border-white/10 bg-white/3 rounded-2xl overflow-hidden hover:border-teal-500/30 hover:bg-white/5 transition-all group">
                  {p.image_url && (
                    <div className="h-44 overflow-hidden bg-white/5">
                      <img src={p.image_url} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-white/40 text-xs mb-0.5">{p.brand}</div>
                    <div className="text-white font-semibold text-sm leading-snug mb-1">{p.name}</div>
                    {p.description && (
                      <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-2">{p.description}</p>
                    )}
                    {/* Заполненность */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-white/30 mb-1">
                        <span>Осталось {p.available_ml} мл</span>
                        <span>{p.fill_percent}% заполнен</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500/60 rounded-full transition-all"
                          style={{ width: `${p.fill_percent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-teal-300 font-bold text-sm">{p.price_per_ml} ₽/мл</div>
                      {p.available_ml > 0 ? (
                        <Link to={`/catalog/${p.id}`}
                          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                          Заказать
                        </Link>
                      ) : (
                        <span className="text-white/20 text-xs">Нет в наличии</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Комментарии */}
        <div className="mb-4">
          <h2 className="text-white/50 text-xs font-medium uppercase tracking-wide mb-4">
            Комментарии · {comments.length}
          </h2>

          {comments.length === 0 && (
            <div className="text-center py-8 text-white/20 text-sm border border-white/5 rounded-2xl mb-4">
              Пока нет комментариев — будь первым!
            </div>
          )}

          <div className="space-y-3">
            {rootComments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                allComments={comments}
                depth={0}
                user={user}
                isAdmin={isAdmin}
                topicId={Number(id)}
                isClosed={topic.is_closed}
                onReply={handleReply}
                onDelete={handleDeleteComment}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                sendingReply={sendingReply}
                onSendReply={handleSendReply}
                onCancelReply={() => { setReplyingTo(null); setReplyText('') }}
              />
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Форма нового комментария */}
        {!topic.is_closed || isAdmin ? (
          user ? (
            <div className="border border-white/10 rounded-2xl p-4">
              <div className="text-white/40 text-xs mb-2">Новый комментарий</div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend() }}
                placeholder="Написать комментарий... (Ctrl+Enter — отправить)"
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-teal-500/50 transition-colors mb-3"
              />
              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={sending || !text.trim()}
                  className="bg-teal-500 hover:bg-teal-600 text-white text-sm h-9 px-5">
                  {sending ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Отправить'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border border-white/8 rounded-2xl">
              <p className="text-white/40 text-sm mb-3">Войдите, чтобы оставить комментарий</p>
              <Link to="/login">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white text-sm h-9">Войти</Button>
              </Link>
            </div>
          )
        ) : (
          <div className="text-center py-4 border border-white/5 rounded-2xl">
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

export { resizeImage }