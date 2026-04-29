import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

type DeliveryOption = { id: number; name: string; description: string | null; address: string | null; schedule: string | null; is_active: boolean; sort_order: number }

export function DeliveryTab() {
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
