import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'
import { ForumProductPicker, ForumProduct } from './ForumProductPicker'

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
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm h-9">
              + Новая тема
            </Button>
          )}
        </div>
      </div>

      {form && (
        <div className="border border-teal-500/20 bg-teal-500/5 rounded-2xl p-4 space-y-3">
          <div className="text-white/60 text-sm font-medium">Новая тема</div>
          <Input value={form.title} onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
            placeholder="Заголовок темы" className="bg-white/5 border-white/15 text-white placeholder:text-white/25 h-10" />
          <textarea value={form.body} onChange={e => setForm(f => f ? { ...f, body: e.target.value } : f)}
            placeholder="Текст темы" rows={4}
            className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-teal-500/50 transition-colors" />
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
          <ForumProductPicker selected={form.products} onChange={p => setForm(f => f ? { ...f, products: p } : f)} />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving} className="bg-teal-500 hover:bg-teal-600 text-white text-sm h-9">
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
            <div key={t.id} className={`border rounded-xl p-4 ${t.is_pinned ? 'border-teal-500/20 bg-teal-500/5' : 'border-white/8 bg-white/2'}`}>
              {editTopic?.id === t.id ? (
                <div className="space-y-2">
                  <Input value={editTopic.title} onChange={e => setEditTopic(et => et ? { ...et, title: e.target.value } : et)}
                    className="bg-white/10 border-white/20 text-white h-9 text-sm" />
                  <textarea value={editTopic.body} onChange={e => setEditTopic(et => et ? { ...et, body: e.target.value } : et)}
                    rows={3} className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm resize-none outline-none" />
                  <ForumProductPicker selected={editProducts} onChange={setEditProducts} />
                  <div className="flex gap-2">
                    <Button onClick={handleEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3">
                      {saving ? '...' : 'Сохранить текст'}
                    </Button>
                    <Button onClick={() => handleSaveProducts(t.id)} disabled={savingProducts === t.id}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3">
                      {savingProducts === t.id ? '...' : 'Сохранить товары'}
                    </Button>
                    <Button onClick={() => setEditTopic(null)} variant="ghost" className="text-white/30 text-xs h-8">Отмена</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {t.is_pinned && <span className="text-teal-400 text-xs flex items-center gap-1"><Icon name="Pin" size={10} />Закреплено</span>}
                      {t.is_closed && <span className="text-white/30 text-xs flex items-center gap-1"><Icon name="Lock" size={10} />Закрыто</span>}
                    </div>
                    <a href={`/forum/${t.id}`} target="_blank" className="text-white font-medium text-sm hover:text-teal-300 transition-colors">
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
                      className={`p-1.5 rounded transition-colors ${t.is_pinned ? 'text-teal-400' : 'text-white/25 hover:text-teal-400'}`}>
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