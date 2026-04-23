import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Dialog {
  user_id: number
  nickname: string
  last_body: string
  last_at: string
  has_unread: boolean
}

interface Message {
  id: number
  from_user_id: number
  body: string
  is_read: boolean
  created_at: string
  from_nick: string
  is_mine: boolean
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesTab() {
  const [dialogs, setDialogs] = useState<Dialog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDialog, setActiveDialog] = useState<Dialog | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const loadDialogs = useCallback(async () => {
    setLoading(true)
    const res = await api.messages.adminInbox()
    setLoading(false)
    setDialogs(Array.isArray(res) ? res : [])
  }, [])

  useEffect(() => { loadDialogs() }, [loadDialogs])

  const openDialog = async (d: Dialog) => {
    setActiveDialog(d)
    setMsgLoading(true)
    const res = await api.messages.thread(d.user_id)
    setMsgLoading(false)
    setMessages(Array.isArray(res) ? res : [])
    setDialogs(prev => prev.map(x => x.user_id === d.user_id ? { ...x, has_unread: false } : x))
  }

  const sendReply = async () => {
    if (!replyText.trim() || !activeDialog) return
    setSending(true)
    const res = await api.messages.reply(activeDialog.user_id, replyText.trim())
    setSending(false)
    if (res.error) { toast.error(res.error); return }
    setReplyText('')
    const updated = await api.messages.thread(activeDialog.user_id)
    setMessages(Array.isArray(updated) ? updated : [])
    loadDialogs()
  }

  const unreadCount = dialogs.filter(d => d.has_unread).length

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Список диалогов */}
      <div className="w-64 shrink-0 border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2 bg-white/3">
          <Icon name="MessageCircle" size={14} className="text-orange-400" />
          <span className="text-white/70 text-sm font-medium">Диалоги</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCount}</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center"><Icon name="Loader2" size={16} className="animate-spin mx-auto text-white/30" /></div>
          )}
          {!loading && dialogs.length === 0 && (
            <div className="py-8 text-center text-white/20 text-sm">Нет сообщений</div>
          )}
          {!loading && dialogs.map(d => (
            <button key={d.user_id} onClick={() => openDialog(d)}
              className={`w-full px-3 py-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${activeDialog?.user_id === d.user_id ? 'bg-white/8' : ''}`}>
              <div className="flex items-center gap-2 mb-0.5">
                {d.has_unread && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                <span className={`text-sm truncate ${d.has_unread ? 'text-white font-medium' : 'text-white/70'}`}>@{d.nickname}</span>
                <span className="text-white/25 text-xs ml-auto shrink-0">{fmt(d.last_at).split(', ')[0]}</span>
              </div>
              <div className="text-white/30 text-xs truncate pl-4">{d.last_body}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Чат */}
      <div className="flex-1 border border-white/10 rounded-xl overflow-hidden flex flex-col">
        {!activeDialog ? (
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm flex-col gap-2">
            <Icon name="MessageCircle" size={32} />
            <span>Выберите диалог</span>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-white/3">
              <Icon name="User" size={14} className="text-white/40" />
              <span className="text-white font-medium text-sm">@{activeDialog.nickname}</span>
              <button onClick={() => setActiveDialog(null)} className="ml-auto text-white/25 hover:text-white"><Icon name="X" size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {msgLoading && <div className="py-8 text-center"><Icon name="Loader2" size={16} className="animate-spin mx-auto text-white/30" /></div>}
              {!msgLoading && messages.length === 0 && (
                <div className="text-center py-8 text-white/20 text-sm">Нет сообщений</div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${m.is_mine ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/8 border border-white/10'}`}>
                    {!m.is_mine && <div className="text-blue-400 text-xs font-medium mb-1">@{activeDialog.nickname}</div>}
                    <div className="text-white text-sm whitespace-pre-wrap">{m.body}</div>
                    <div className="text-xs text-white/25 mt-1 text-right">{fmt(m.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex gap-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Ответить... (Enter — отправить, Shift+Enter — новая строка)"
                rows={2}
                className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-orange-500/50 transition-colors" />
              <Button onClick={sendReply} disabled={sending || !replyText.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white h-9 w-9 p-0 rounded-xl shrink-0 self-end">
                <Icon name="Send" size={15} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
