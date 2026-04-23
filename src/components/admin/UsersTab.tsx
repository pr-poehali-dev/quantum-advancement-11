import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface AdminUser {
  id: number
  nickname: string
  email: string
  phone: string
  role: string
  created_at: string
  is_blocked: boolean
  blocked_reason: string | null
  admin_note: string | null
  admin_tags: string[]
  order_count: number
  total_spent: number
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

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdminUser & { newTag: string }>>({})
  const [saving, setSaving] = useState(false)

  const [blockModal, setBlockModal] = useState<{ user: AdminUser; unblock?: boolean } | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blocking, setBlocking] = useState(false)

  const [chatUser, setChatUser] = useState<AdminUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const [broadcastModal, setBroadcastModal] = useState(false)
  const [broadcastSelected, setBroadcastSelected] = useState<Set<number>>(new Set())
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.admin.users(search)
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    setUsers(res.users || [])
  }, [search])

  useEffect(() => { load() }, [load])

  const openChat = async (u: AdminUser) => {
    setChatUser(u)
    setChatLoading(true)
    const res = await api.messages.thread(u.id)
    setChatLoading(false)
    setMessages(Array.isArray(res) ? res : [])
  }

  const sendReply = async () => {
    if (!replyText.trim() || !chatUser) return
    setSending(true)
    const res = await api.messages.reply(chatUser.id, replyText.trim())
    setSending(false)
    if (res.error) { toast.error(res.error); return }
    setReplyText('')
    const updated = await api.messages.thread(chatUser.id)
    setMessages(Array.isArray(updated) ? updated : [])
  }

  const saveUser = async () => {
    if (!editUser) return
    setSaving(true)
    const res = await api.admin.updateUser({
      user_id: editUser.id,
      nickname: editForm.nickname,
      email: editForm.email,
      phone: editForm.phone,
      role: editForm.role,
      admin_note: editForm.admin_note,
      admin_tags: editForm.admin_tags,
    })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Данные обновлены')
    setEditUser(null)
    load()
  }

  const doBlock = async () => {
    if (!blockModal) return
    setBlocking(true)
    const res = await api.admin.blockUser(blockModal.user.id, !blockModal.unblock, blockReason)
    setBlocking(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(blockModal.unblock ? 'Пользователь разблокирован' : 'Пользователь заблокирован')
    setBlockModal(null)
    setBlockReason('')
    load()
  }

  const doBroadcast = async () => {
    if (!broadcastText.trim() || broadcastSelected.size === 0) return
    setBroadcasting(true)
    const res = await api.messages.broadcast(Array.from(broadcastSelected), broadcastText.trim())
    setBroadcasting(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Отправлено ${res.sent} пользователям`)
    setBroadcastModal(false)
    setBroadcastSelected(new Set())
    setBroadcastText('')
  }

  const ROLE_LABEL: Record<string, string> = { buyer: 'Покупатель', moderator: 'Модератор', admin: 'Админ' }

  return (
    <div>
      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-white/40 text-xs mb-1 block">Поиск по нику, почте, телефону</label>
          <Input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="@ник / email / +7..."
            className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm" />
        </div>
        <Button onClick={load} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-5 text-sm">
          {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
        </Button>
        <Button variant="ghost" onClick={() => setSearch('')} className="text-white/30 hover:text-white h-9 text-sm">Сбросить</Button>
        {broadcastSelected.size > 0 && (
          <Button onClick={() => setBroadcastModal(true)}
            className="ml-auto bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 text-sm">
            <Icon name="Send" size={13} className="mr-1.5" />
            Написать выбранным ({broadcastSelected.size})
          </Button>
        )}
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" className="accent-orange-500 w-4 h-4 cursor-pointer"
                  checked={users.length > 0 && broadcastSelected.size === users.length}
                  onChange={() => setBroadcastSelected(broadcastSelected.size === users.length ? new Set() : new Set(users.map(u => u.id)))} />
              </th>
              <th className="px-3 py-3 text-left text-white/40 font-medium">Ник / контакты</th>
              <th className="px-3 py-3 text-center text-white/40 font-medium w-24">Роль</th>
              <th className="px-3 py-3 text-center text-white/40 font-medium w-20">Заказы</th>
              <th className="px-3 py-3 text-right text-white/40 font-medium w-28">Сумма</th>
              <th className="px-3 py-3 text-center text-white/40 font-medium w-24">Теги</th>
              <th className="px-3 py-3 text-center text-white/40 font-medium w-28">Статус</th>
              <th className="px-3 py-3 text-center text-white/40 font-medium w-28">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="py-12 text-center text-white/30"><Icon name="Loader2" size={20} className="animate-spin mx-auto" /></td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-white/20 text-sm">Пользователи не найдены</td></tr>
            )}
            {!loading && users.map(u => (
              <tr key={u.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${u.is_blocked ? 'opacity-50' : ''}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" className="accent-orange-500 w-4 h-4 cursor-pointer"
                    checked={broadcastSelected.has(u.id)}
                    onChange={() => setBroadcastSelected(prev => { const n = new Set(prev); if (n.has(u.id)) { n.delete(u.id) } else { n.add(u.id) } return n })} />
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-white/90">@{u.nickname}</div>
                  <div className="text-white/35 text-xs">{u.email} · {u.phone}</div>
                  {u.admin_note && <div className="text-yellow-400/60 text-xs mt-0.5 italic">📝 {u.admin_note}</div>}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-orange-500/20 text-orange-300' : u.role === 'moderator' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/50'}`}>
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-white/60">{u.order_count}</td>
                <td className="px-3 py-3 text-right text-white/70">{u.total_spent.toFixed(0)} ₽</td>
                <td className="px-3 py-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {u.admin_tags.map(tag => (
                      <span key={tag} className="bg-purple-500/15 text-purple-300 text-xs px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  {u.is_blocked
                    ? <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full">Заблокирован</span>
                    : <span className="bg-green-500/15 text-green-400 text-xs px-2 py-0.5 rounded-full">Активен</span>}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openChat(u)} title="Написать" className="p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                      <Icon name="MessageCircle" size={15} />
                    </button>
                    <button onClick={() => { setEditUser(u); setEditForm({ ...u, newTag: '' }) }} title="Редактировать" className="p-1.5 rounded-lg text-white/30 hover:text-orange-400 hover:bg-orange-500/10 transition-colors">
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button onClick={() => { setBlockModal({ user: u, unblock: u.is_blocked }); setBlockReason('') }} title={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      className={`p-1.5 rounded-lg transition-colors ${u.is_blocked ? 'text-white/30 hover:text-green-400 hover:bg-green-500/10' : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}>
                      <Icon name={u.is_blocked ? 'UserCheck' : 'UserX'} size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length > 0 && (
        <div className="mt-3 text-xs text-white/30 px-1">Найдено: {users.length}</div>
      )}

      {/* Модал редактирования */}
      {editUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold">Редактирование @{editUser.nickname}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Ник</label>
                <Input value={editForm.nickname || ''} onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))} className="bg-white/10 border-white/20 text-white h-9 text-sm" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Роль</label>
                <select value={editForm.role || 'buyer'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-9 appearance-none">
                  <option value="buyer" className="bg-zinc-900">Покупатель</option>
                  <option value="moderator" className="bg-zinc-900">Модератор</option>
                  <option value="admin" className="bg-zinc-900">Админ</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Email</label>
              <Input value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="bg-white/10 border-white/20 text-white h-9 text-sm" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Телефон</label>
              <Input value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="bg-white/10 border-white/20 text-white h-9 text-sm" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Заметка для админа (не видна клиенту)</label>
              <textarea value={editForm.admin_note || ''} onChange={e => setEditForm(f => ({ ...f, admin_note: e.target.value }))}
                rows={2} className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm resize-none" placeholder="Личная заметка..." />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Теги (внутренние статусы)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(editForm.admin_tags || []).map(tag => (
                  <span key={tag} className="bg-purple-500/15 text-purple-300 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    {tag}
                    <button onClick={() => setEditForm(f => ({ ...f, admin_tags: (f.admin_tags || []).filter(t => t !== tag) }))} className="text-purple-400 hover:text-white">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={editForm.newTag || ''} onChange={e => setEditForm(f => ({ ...f, newTag: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && editForm.newTag?.trim()) {
                      setEditForm(f => ({ ...f, admin_tags: [...(f.admin_tags || []), f.newTag!.trim()], newTag: '' }))
                    }
                  }}
                  placeholder="Новый тег, Enter" className="bg-white/10 border-white/20 text-white h-8 text-sm flex-1" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={saveUser} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={() => setEditUser(null)} className="border-white/20 text-white/50 hover:bg-white/10">Отмена</Button>
            </div>
          </div>
        </div>
      )}

      {/* Модал блокировки */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBlockModal(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold">
              {blockModal.unblock ? 'Разблокировать' : 'Заблокировать'} @{blockModal.user.nickname}?
            </h3>
            {!blockModal.unblock && (
              <div>
                <label className="text-white/40 text-xs mb-1 block">Причина (необязательно)</label>
                <Input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                  placeholder="Например: нарушение правил"
                  className="bg-white/10 border-white/20 text-white h-9 text-sm" />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={doBlock} disabled={blocking}
                className={`flex-1 ${blockModal.unblock ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white`}>
                {blocking ? '...' : blockModal.unblock ? 'Разблокировать' : 'Заблокировать'}
              </Button>
              <Button variant="outline" onClick={() => setBlockModal(null)} className="border-white/20 text-white/50 hover:bg-white/10">Отмена</Button>
            </div>
          </div>
        </div>
      )}

      {/* Чат с пользователем */}
      {chatUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setChatUser(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg flex flex-col h-[560px]" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <Icon name="MessageCircle" size={15} className="text-orange-400" />
              <span className="text-white font-medium text-sm">@{chatUser.nickname}</span>
              <button onClick={() => setChatUser(null)} className="ml-auto text-white/30 hover:text-white"><Icon name="X" size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatLoading && <div className="text-center py-8"><Icon name="Loader2" size={20} className="animate-spin mx-auto text-white/30" /></div>}
              {!chatLoading && messages.length === 0 && (
                <div className="text-center py-8 text-white/25 text-sm">Нет сообщений с этим пользователем</div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${m.is_mine ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/8 border border-white/10'}`}>
                    {!m.is_mine && <div className="text-blue-400 text-xs font-medium mb-1">@{chatUser.nickname}</div>}
                    <div className="text-white text-sm whitespace-pre-wrap">{m.body}</div>
                    <div className="text-xs text-white/25 mt-1 text-right">{fmt(m.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex gap-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Ответить... (Enter — отправить)"
                rows={1}
                className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-orange-500/50" />
              <Button onClick={sendReply} disabled={sending || !replyText.trim()} className="bg-orange-500 hover:bg-orange-600 text-white h-9 w-9 p-0 rounded-xl shrink-0">
                <Icon name="Send" size={15} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модал рассылки */}
      {broadcastModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBroadcastModal(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold">Рассылка {broadcastSelected.size} пользователям</h3>
            <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
              rows={4} placeholder="Текст сообщения..."
              className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm resize-none outline-none" />
            <div className="flex gap-2">
              <Button onClick={doBroadcast} disabled={broadcasting || !broadcastText.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {broadcasting ? 'Отправляю...' : 'Отправить'}
              </Button>
              <Button variant="outline" onClick={() => setBroadcastModal(false)} className="border-white/20 text-white/50 hover:bg-white/10">Отмена</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
