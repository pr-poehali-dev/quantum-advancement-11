import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

interface ForumTopicItem {
  id: number
  title: string
  body: string
  is_pinned: boolean
  is_closed: boolean
  comments_count: number
  created_at: string
  image_url?: string | null
}

interface ForumProduct { id: number; name: string; brand: string; image_url: string | null; price_per_ml: number }

// ─── ADMIN MESSAGES TAB ───────────────────────────────────────────────────────

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
                  ? 'bg-orange-500/8 hover:bg-orange-500/12'
                  : 'hover:bg-white/5'
              }`}>
              <div className="flex items-center gap-2">
                {t.has_unread && activeUserId !== t.user_id && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-pulse" />
                )}
                <span className={`text-sm font-medium truncate flex-1 ${
                  t.has_unread && activeUserId !== t.user_id ? 'text-white' : 'text-white/70'
                }`}>@{t.nickname}</span>
                {t.unread_count > 0 && activeUserId !== t.user_id && (
                  <span className="bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0">
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
              <Icon name="MessageCircle" size={14} className="text-orange-400" />
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
                      ? 'bg-orange-500/20 border border-orange-500/30'
                      : !m.is_read
                      ? 'bg-orange-500/10 border border-orange-500/25'
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
                className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-orange-500/50 transition-colors"
              />
              <Button onClick={handleSend} disabled={sending || !text.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white h-9 w-9 p-0 rounded-xl shrink-0">
                <Icon name="Send" size={15} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── DELIVERY TAB ─────────────────────────────────────────────────────────────

export function DeliveryTab() {
  type DeliveryOption = { id: number; name: string; description: string | null; address: string | null; schedule: string | null; is_active: boolean; sort_order: number }
  const [options, setOptions] = useState<DeliveryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState({ name: '', description: '', address: '', schedule: '', sort_order: '0' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const loadOptions = async () => {
    setLoading(true)
    const res = await api.admin.getDeliveryOptions()
    setLoading(false)
    if (res?.error) { toast.error('Ошибка загрузки: ' + res.error); return }
    const data = Array.isArray(res) ? res : (typeof res === 'string' ? JSON.parse(res) : null)
    if (Array.isArray(data)) setOptions(data)
    else toast.error('Не удалось загрузить варианты доставки')
  }

  useEffect(() => { loadOptions() }, [])

  const startNew = () => {
    setForm({ name: '', description: '', address: '', schedule: '', sort_order: String(options.length + 1) })
    setEditId('new')
  }

  const startEdit = (o: DeliveryOption) => {
    setForm({ name: o.name, description: o.description || '', address: o.address || '', schedule: o.schedule || '', sort_order: String(o.sort_order) })
    setEditId(o.id)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Введите название'); return }
    setSaving(true)
    const data = { name: form.name.trim(), description: form.description.trim() || null, address: form.address.trim() || null, schedule: form.schedule.trim() || null, sort_order: Number(form.sort_order) || 0 }
    const res = editId === 'new'
      ? await api.admin.createDeliveryOption(data)
      : await api.admin.updateDeliveryOption(editId as number, data)
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(editId === 'new' ? 'Добавлено' : 'Сохранено')
    setEditId(null); loadOptions()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить способ доставки?')) return
    setDeleting(id)
    const res = await api.admin.deleteDeliveryOption(id)
    setDeleting(null)
    if (res.error) { toast.error(res.error); return }
    toast.success('Удалено'); loadOptions()
  }

  const handleToggle = async (o: DeliveryOption) => {
    await api.admin.updateDeliveryOption(o.id, { is_active: !o.is_active })
    loadOptions()
  }

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={24} className="animate-spin text-white/30" /></div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-white/40 text-sm">Способы получения заказа</div>
        <Button onClick={startNew} className="bg-purple-600 hover:bg-purple-700 text-white text-sm h-9 gap-2">
          <Icon name="Plus" size={14} /> Добавить
        </Button>
      </div>

      {editId !== null && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="text-sm font-medium text-white">{editId === 'new' ? 'Новый способ получения' : 'Редактировать'}</div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">Название *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Самовывоз — кафе Правда"
              className="bg-white/5 border-white/10 text-white placeholder-white/20 text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">Адрес</label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="ул. Ленина, д. 1"
              className="bg-white/5 border-white/10 text-white placeholder-white/20 text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">График работы</label>
            <Input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
              placeholder="Пн–Пт: 10:00–19:00"
              className="bg-white/5 border-white/10 text-white placeholder-white/20 text-sm" />
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">Порядок сортировки</label>
            <Input value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
              placeholder="1"
              className="bg-white/5 border-white/10 text-white placeholder-white/20 text-sm w-24" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white text-sm">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button onClick={() => setEditId(null)} variant="ghost" className="text-white/40 text-sm">Отмена</Button>
          </div>
        </div>
      )}

      {options.length === 0 ? (
        <div className="text-center py-12 text-white/20 text-sm">Нет способов доставки</div>
      ) : options.map(o => (
        <div key={o.id} className={`bg-white/3 border rounded-xl p-4 transition-all ${o.is_active ? 'border-white/8' : 'border-white/4 opacity-50'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white">{o.name}</div>
              {o.address && <div className="text-white/50 text-xs mt-1 flex items-center gap-1"><Icon name="MapPin" size={11} />{o.address}</div>}
              {o.schedule && <div className="text-white/40 text-xs mt-0.5 flex items-center gap-1"><Icon name="Clock" size={11} />{o.schedule}</div>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleToggle(o)} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${o.is_active ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/30 hover:text-white/50'}`}>
                {o.is_active ? 'Активен' : 'Скрыт'}
              </button>
              <button onClick={() => startEdit(o)} className="text-white/30 hover:text-white transition-colors p-1">
                <Icon name="Pencil" size={14} />
              </button>
              <button onClick={() => handleDelete(o.id)} disabled={deleting === o.id} className="text-red-400/40 hover:text-red-400 transition-colors p-1">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── FORUM TAB ────────────────────────────────────────────────────────────────

function ProductPicker({ selected, onChange }: { selected: ForumProduct[]; onChange: (p: ForumProduct[]) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ForumProduct[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await api.admin.adminProducts({ name: query.trim() })
      setSearching(false)
      const list = Array.isArray(res) ? res : (res?.products ?? [])
      setResults(list.filter((p: ForumProduct) => !selected.find(s => s.id === p.id)).slice(0, 8))
    }, 300)
    return () => clearTimeout(t)
  }, [query, selected])

  const add = (p: ForumProduct) => { onChange([...selected, p]); setQuery(''); setResults([]) }
  const remove = (id: number) => onChange(selected.filter(p => p.id !== id))

  return (
    <div className="space-y-2">
      <label className="text-white/40 text-xs block">Товары в теме (до 10 штук)</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1">
              {p.image_url && <img src={p.image_url} className="w-6 h-6 rounded object-cover" />}
              <span className="text-white/80 text-xs">{p.brand} {p.name}</span>
              <button onClick={() => remove(p.id)} className="text-white/30 hover:text-red-400 ml-0.5"><Icon name="X" size={12} /></button>
            </div>
          ))}
        </div>
      )}
      {selected.length < 10 && (
        <div className="relative">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск товара по названию..."
            className="bg-white/5 border-white/15 text-white placeholder:text-white/25 h-9 text-sm"
          />
          {(results.length > 0 || searching) && (
            <div className="absolute z-20 top-10 left-0 right-0 bg-zinc-900 border border-white/15 rounded-xl overflow-hidden shadow-xl">
              {searching && <div className="px-3 py-2 text-white/30 text-xs">Ищем...</div>}
              {results.map(p => (
                <button key={p.id} onClick={() => add(p)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/8 transition-colors text-left">
                  {p.image_url && <img src={p.image_url} className="w-8 h-8 rounded object-cover shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{p.brand} · {p.name}</div>
                    <div className="text-white/30 text-xs">{p.price_per_ml} ₽/мл</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminForumTab() {
  const [topics, setTopics] = useState<ForumTopicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ title: string; body: string; imageFile?: File | null; imagePreview?: string; products: ForumProduct[] } | null>(null)
  const [editTopic, setEditTopic] = useState<ForumTopicItem | null>(null)
  const [editProducts, setEditProducts] = useState<ForumProduct[]>([])
  const [savingProducts, setSavingProducts] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await api.forum.topics()
    if (Array.isArray(res)) setTopics(res)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const resizeImg = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file)
      img.onload = () => {
        let { width, height } = img
        const ratio = Math.min(1200 / width, 900 / height, 1)
        width = Math.round(width * ratio); height = Math.round(height * ratio)
        const c = document.createElement('canvas'); c.width = width; c.height = height
        c.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = reject; img.src = url
    })

  const handleCreate = async () => {
    if (!form?.title.trim() || !form.body.trim()) { toast.error('Заполните заголовок и текст'); return }
    setSaving(true)
    let image_b64: string | undefined
    if (form.imageFile) { try { image_b64 = await resizeImg(form.imageFile) } catch { /* ok */ } }
    const res = await api.forum.createTopic({ title: form.title.trim(), body: form.body.trim(), image_b64 })
    if (res.error) { setSaving(false); toast.error(res.error); return }
    if (form.products.length > 0 && res.id) {
      await api.forum.setTopicProducts(res.id, form.products.map(p => p.id))
    }
    setSaving(false)
    toast.success('Тема опубликована, участники получат уведомление')
    setForm(null); load()
  }

  const handleEdit = async () => {
    if (!editTopic?.title.trim() || !editTopic.body.trim()) { toast.error('Заполните поля'); return }
    setSaving(true)
    const res = await api.forum.editTopic(editTopic.id, { title: editTopic.title.trim(), body: editTopic.body.trim() })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Тема обновлена'); setEditTopic(null); load()
  }

  const handleSaveProducts = async (topicId: number) => {
    setSavingProducts(topicId)
    const res = await api.forum.setTopicProducts(topicId, editProducts.map(p => p.id))
    setSavingProducts(null)
    if (res.error) { toast.error(res.error); return }
    toast.success('Товары обновлены'); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-medium">Темы форума</div>
          <div className="text-white/30 text-xs mt-0.5">Создавайте темы — покупатели смогут оставлять комментарии</div>
        </div>
        <div className="flex gap-2">
          <a href="/forum" target="_blank"
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
            <Icon name="ExternalLink" size={12} />Открыть форум
          </a>
          {!form && (
            <Button onClick={() => setForm({ title: '', body: '', products: [] })}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
              + Новая тема
            </Button>
          )}
        </div>
      </div>

      {form && (
        <div className="border border-orange-500/20 bg-orange-500/5 rounded-2xl p-4 space-y-3">
          <div className="text-white/60 text-sm font-medium">Новая тема</div>
          <Input value={form.title} onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
            placeholder="Заголовок темы" className="bg-white/5 border-white/15 text-white placeholder:text-white/25 h-10" />
          <textarea value={form.body} onChange={e => setForm(f => f ? { ...f, body: e.target.value } : f)}
            placeholder="Текст темы" rows={4}
            className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-orange-500/50 transition-colors" />
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">Изображение (необязательно)</label>
            {form.imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={form.imagePreview} alt="preview" className="rounded-xl w-full h-40 object-cover border border-white/10" />
                <button onClick={() => setForm(f => f ? { ...f, imageFile: null, imagePreview: undefined } : f)}
                  className="absolute top-2 right-2 bg-black/60 text-white/70 hover:text-white rounded-full p-1">
                  <Icon name="X" size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer w-fit bg-white/5 border border-white/15 hover:border-white/25 rounded-xl px-4 py-2 text-white/40 hover:text-white/60 text-sm transition-colors">
                <Icon name="ImagePlus" size={16} />Выбрать изображение
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  setForm(f => f ? { ...f, imageFile: file, imagePreview: URL.createObjectURL(file) } : f)
                }} />
              </label>
            )}
          </div>
          <ProductPicker selected={form.products} onChange={p => setForm(f => f ? { ...f, products: p } : f)} />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
              {saving ? <><Icon name="Loader2" size={14} className="animate-spin mr-1" />Публикую...</> : 'Опубликовать'}
            </Button>
            <Button onClick={() => setForm(null)} variant="ghost" className="text-white/40 text-sm h-9">Отмена</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Icon name="Loader2" size={20} className="animate-spin text-white/30" /></div>
      ) : topics.length === 0 ? (
        <div className="text-center py-10 text-white/25 text-sm border border-white/5 rounded-2xl">
          Тем пока нет — создайте первую!
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t.id} className={`border rounded-xl p-4 ${t.is_pinned ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/8 bg-white/2'}`}>
              {editTopic?.id === t.id ? (
                <div className="space-y-2">
                  <Input value={editTopic.title} onChange={e => setEditTopic(et => et ? { ...et, title: e.target.value } : et)}
                    className="bg-white/10 border-white/20 text-white h-9 text-sm" />
                  <textarea value={editTopic.body} onChange={e => setEditTopic(et => et ? { ...et, body: e.target.value } : et)}
                    rows={3} className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm resize-none outline-none" />
                  <ProductPicker selected={editProducts} onChange={setEditProducts} />
                  <div className="flex gap-2">
                    <Button onClick={handleEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3">
                      {saving ? '...' : 'Сохранить текст'}
                    </Button>
                    <Button onClick={() => handleSaveProducts(t.id)} disabled={savingProducts === t.id}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8 px-3">
                      {savingProducts === t.id ? '...' : 'Сохранить товары'}
                    </Button>
                    <Button onClick={() => setEditTopic(null)} variant="ghost" className="text-white/30 text-xs h-8">Отмена</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {t.is_pinned && <span className="text-orange-400 text-xs flex items-center gap-1"><Icon name="Pin" size={10} />Закреплено</span>}
                      {t.is_closed && <span className="text-white/30 text-xs flex items-center gap-1"><Icon name="Lock" size={10} />Закрыто</span>}
                    </div>
                    <a href={`/forum/${t.id}`} target="_blank" className="text-white font-medium text-sm hover:text-orange-300 transition-colors">
                      {t.title}
                    </a>
                    <p className="text-white/40 text-xs mt-1 line-clamp-2">{t.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-white/25 text-xs">
                      <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{t.comments_count}</span>
                      <span>{new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => api.forum.pinTopic(t.id, !t.is_pinned).then(load)}
                      className={`p-1.5 rounded transition-colors ${t.is_pinned ? 'text-orange-400' : 'text-white/25 hover:text-orange-400'}`}>
                      <Icon name="Pin" size={14} />
                    </button>
                    <button onClick={() => api.forum.closeTopic(t.id, !t.is_closed).then(load)}
                      className={`p-1.5 rounded transition-colors ${t.is_closed ? 'text-yellow-400' : 'text-white/25 hover:text-yellow-400'}`}>
                      <Icon name={t.is_closed ? 'Unlock' : 'Lock'} size={14} />
                    </button>
                    <button onClick={() => { setEditTopic(t); setEditProducts([]) }}
                      className="p-1.5 rounded text-white/25 hover:text-blue-400 transition-colors">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Удалить тему?')) return
                      const r = await api.forum.deleteTopic(t.id)
                      if (r.error) { toast.error(r.error); return }
                      toast.success('Тема удалена'); load()
                    }} className="p-1.5 rounded text-white/25 hover:text-red-400 transition-colors">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
