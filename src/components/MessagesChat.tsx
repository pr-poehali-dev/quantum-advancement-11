import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface Message {
  id: number
  from_user_id: number
  to_user_id: number
  body: string
  is_read: boolean
  created_at: string
  from_nick: string
  is_mine: boolean
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesChat({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [prevUnread, setPrevUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  const load = useCallback(async (silent = false) => {
    const res = await api.messages.inbox()
    if (!res.error) {
      const msgs: Message[] = Array.isArray(res) ? res : []
      setMessages(msgs)
      const unread = msgs.filter(m => !m.is_mine && !m.is_read).length
      if (onUnreadChange) onUnreadChange(unread)
      if (!silent) setPrevUnread(unread)
    }
    setLoading(false)
  }, [onUnreadChange])

  useEffect(() => {
    load()
    const iv = setInterval(() => { if (!document.hidden) load(true) }, 30000)
    return () => clearInterval(iv)
  }, [load])

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    const res = await api.messages.send(text.trim())
    setSending(false)
    if (res.error) { toast.error(res.error); return }
    setText('')
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-white/30">
      <Icon name="Loader2" size={20} className="animate-spin" />
    </div>
  )

  const unreadIds = new Set(messages.filter(m => !m.is_mine && !m.is_read).map(m => m.id))
  const hasNew = unreadIds.size > 0

  return (
    <div className="flex flex-col h-[500px] bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Icon name="MessageCircle" size={16} className="text-orange-400" />
        <span className="text-white font-medium text-sm">Поддержка</span>
        {hasNew && (
          <span className="bg-orange-500 text-white text-[10px] rounded-full px-2 py-0.5 font-bold animate-pulse">
            {unreadIds.size} новых
          </span>
        )}
        <span className="text-white/30 text-xs ml-auto">Ответим в ближайшее время</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-white/25 text-sm">
            Напишите нам — мы ответим как можно быстрее
          </div>
        )}
        {messages.map((m, i) => {
          const isNew = unreadIds.has(m.id)
          const prevMsg = messages[i - 1]
          const isFirstNew = isNew && (!prevMsg || !unreadIds.has(prevMsg.id))
          return (
            <div key={m.id}>
              {isFirstNew && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-orange-500/30" />
                  <span className="text-orange-400 text-xs font-medium">Новые сообщения</span>
                  <div className="flex-1 h-px bg-orange-500/30" />
                </div>
              )}
              <div className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 transition-all ${
                  m.is_mine
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : isNew
                    ? 'bg-orange-500/10 border border-orange-500/25 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                    : 'bg-white/8 border border-white/10'
                }`}>
                  {!m.is_mine && (
                    <div className="text-orange-400 text-xs font-medium mb-1">{m.from_nick}</div>
                  )}
                  <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">{m.body}</div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${m.is_mine ? 'justify-end text-white/30' : 'text-white/25'}`}>
                    {fmt(m.created_at)}
                    {m.is_mine && <span>{m.is_read ? '✓✓' : '✓'}</span>}
                    {isNew && <span className="text-orange-400">●</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Напишите сообщение... (Enter — отправить)"
          rows={1}
          className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-orange-500/50 transition-colors"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="bg-orange-500 hover:bg-orange-600 text-white h-9 w-9 p-0 rounded-xl shrink-0"
        >
          <Icon name="Send" size={15} />
        </Button>
      </div>
    </div>
  )
}