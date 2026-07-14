import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface AdminThread {
  user_id: number
  nickname: string
  last_message: string
  last_at: string
  has_unread: boolean
  unread_count: number
}

interface ThreadMessage {
  id: number
  from_user_id: number
  body: string
  is_read: boolean
  created_at: string
  from_nick: string
  is_mine: boolean
}

export function AdminMessagesTab({ onUnreadChange }: { onUnreadChange: (n: number) => void }) {
  const [threads, setThreads] = useState<AdminThread[]>([])
  const [activeUserId, setActiveUserId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstOpen = useRef(true)

  const activeThread = threads.find(t => t.user_id === activeUserId) ?? null

  const loadThreads = useCallback(async () => {
    const res = await api.messages.adminInbox()
    if (Array.isArray(res)) {
      setThreads(res)
      onUnreadChange(res.filter((d: AdminThread) => d.has_unread).length)
    }
  }, [onUnreadChange])

  const loadThread = useCallback(async (userId: number, silent = false) => {
    const res = await api.messages.thread(userId)
    if (Array.isArray(res)) {
      setMessages(res)
      if (!silent) {
        await api.messages.markRead(userId)
        loadThreads()
      }
    }
  }, [loadThreads])

  useEffect(() => {
    loadThreads()
    const iv = setInterval(() => { if (!document.hidden) loadThreads() }, 30000)
    return () => clearInterval(iv)
  }, [loadThreads])

  useEffect(() => {
    if (!activeUserId) return
    loadThread(activeUserId)
    isFirstOpen.current = true
    const iv = setInterval(() => { if (!document.hidden) loadThread(activeUserId, true) }, 30000)
    return () => clearInterval(iv)
  }, [activeUserId, loadThread])

  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: isFirstOpen.current ? 'instant' : 'smooth' })
    isFirstOpen.current = false
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || !activeUserId) return
    setSending(true)
    const res = await api.messages.reply(activeUserId, text.trim())
    setSending(false)
    if (res.error) { toast.error(res.error); return }
    setText('')
    loadThread(activeUserId)
  }

  return (
    <div className="flex border border-white/10 rounded-2xl overflow-hidden" style={{ height: '620px' }}>
      <div className="w-64 shrink-0 border-r border-white/10 flex flex-col bg-white/2">
        <div className="px-3 py-2.5 border-b border-white/8">
          <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Диалоги</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <div className="text-center py-10 text-white/25 text-xs">Сообщений пока нет</div>
          )}
          {threads.map(t => (
            <button key={t.user_id} onClick={async () => {
              setActiveUserId(t.user_id)
              setMessages([])
              await api.messages.markRead(t.user_id)
              loadThreads()
            }}
              className={`w-full text-left px-3 py-2.5 transition-all border-b border-white/5 ${
                activeUserId === t.user_id
                  ? 'bg-white/10'
                  : t.has_unread
                  ? 'bg-gold-500/8 hover:bg-gold-500/12'
                  : 'hover:bg-white/5'
              }`}>
              <div className="flex items-center gap-2">
                {t.has_unread && activeUserId !== t.user_id && (
                  <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0 animate-pulse" />
                )}
                <span className={`text-sm font-medium truncate flex-1 ${
                  t.has_unread && activeUserId !== t.user_id ? 'text-white' : 'text-white/70'
                }`}>@{t.nickname}</span>
                {t.unread_count > 0 && activeUserId !== t.user_id && (
                  <span className="bg-gold-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0">
                    {t.unread_count > 9 ? '9+' : t.unread_count}
                  </span>
                )}
              </div>
              <div className="text-white/30 text-xs truncate mt-0.5 pl-4">{t.last_message}</div>
              <div className="text-white/20 text-[10px] pl-4 mt-0.5">{fmt(t.last_at)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
            Выберите диалог слева
          </div>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 shrink-0">
              <Icon name="MessageCircle" size={14} className="text-gold-400" />
              <span className="text-white font-medium text-sm">@{activeThread.nickname}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-white/25 text-sm">Нет сообщений</div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 transition-all ${
                    m.is_mine
                      ? 'bg-gold-500/20 border border-gold-500/30'
                      : !m.is_read
                      ? 'bg-gold-500/10 border border-gold-500/25'
                      : 'bg-white/8 border border-white/10'
                  }`}>
                    <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">{m.body}</div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${m.is_mine ? 'justify-end text-white/30' : 'text-white/25'}`}>
                      {fmt(m.created_at)}
                      {m.is_mine && <span>{m.is_read ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex gap-2 shrink-0">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Ответить... (Enter — отправить)"
                rows={1}
                className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-gold-500/50 transition-colors"
              />
              <Button onClick={handleSend} disabled={sending || !text.trim()}
                className="bg-gold-500 hover:bg-gold-600 text-white h-9 w-9 p-0 rounded-xl shrink-0">
                <Icon name="Send" size={15} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}