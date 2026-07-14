import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const CONC_VALUES = [
  { value: 'parfum_water', label: 'Парфюмерная вода' },
  { value: 'parfum', label: 'Духи' },
  { value: 'cologne', label: 'Одеколон' },
  { value: 'eau_de_toilette', label: 'Туалетная вода' },
]

interface Form {
  name: string
  brand: string
  supplier_id: string
  description: string
  price_per_ml: string
  bottle_ml: string
  concentration: string
  category: string
  image_url: string
}

const EMPTY: Form = {
  name: '', brand: '', supplier_id: '', description: '',
  price_per_ml: '', bottle_ml: '', concentration: 'parfum_water',
  category: 'decant', image_url: '',
}

interface Props {
  onCreated: (product: Record<string, unknown>) => void
  onClose: () => void
}

export default function CreateProductModal({ onCreated, onClose }: Props) {
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof Form, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл слишком большой (макс. 5 МБ)'); return }
    setUploadingImage(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const b64 = ev.target?.result as string
      const res = await api.upload.image(b64, file.name)
      setUploadingImage(false)
      if (res.error) { toast.error(res.error); return }
      set('image_url', res.url)
      toast.success('Фото загружено')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim() || !form.price_per_ml || !form.bottle_ml) {
      toast.error('Заполните: название, бренд, цена за мл, объём флакона')
      return
    }
    setSaving(true)
    const res = await api.admin.createProduct({
      name: form.name.trim(),
      brand: form.brand.trim(),
      supplier_id: form.supplier_id.trim() || undefined,
      description: form.description.trim() || undefined,
      price_per_ml: Number(form.price_per_ml),
      bottle_ml: Number(form.bottle_ml),
      concentration: form.concentration,
      category: form.category,
      image_url: form.image_url.trim() || undefined,
    })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Товар создан')
    onCreated({
      id: res.id,
      name: form.name.trim(),
      brand: form.brand.trim(),
      supplier_id: form.supplier_id.trim(),
      description: form.description.trim(),
      price_per_ml: Number(form.price_per_ml),
      bottle_ml: Number(form.bottle_ml),
      booked_ml: 0,
      active_booked: 0,
      concentration: form.concentration,
      category: form.category,
      image_url: form.image_url.trim() || null,
      is_active: true,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-base">Новый товар</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Фото */}
          <div className="flex gap-3 items-start">
            <div
              className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group relative"
              onClick={() => imgRef.current?.click()}
            >
              {form.image_url ? (
                <img src={form.image_url} className="w-full h-full object-cover" />
              ) : uploadingImage ? (
                <Icon name="Loader2" size={20} className="animate-spin text-white/40" />
              ) : (
                <Icon name="Camera" size={20} className="text-white/20 group-hover:text-white/50 transition-colors" />
              )}
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Бренд <span className="text-red-400">*</span></label>
                <Input value={form.brand} onChange={e => set('brand', e.target.value)}
                  className="bg-white/10 border-white/20 text-white h-9 text-sm" placeholder="Dior" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Артикул поставщика</label>
                <Input value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}
                  className="bg-white/10 border-white/20 text-white h-9 text-sm" placeholder="SKU-12345" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Название <span className="text-red-400">*</span></label>
            <Input value={form.name} onChange={e => set('name', e.target.value)}
              className="bg-white/10 border-white/20 text-white" placeholder="Sauvage EDT" />
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Описание</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Краткое описание..."
              className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm resize-none placeholder:text-white/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Цена за мл (₽) <span className="text-red-400">*</span></label>
              <Input type="number" min="0" step="0.1" value={form.price_per_ml} onChange={e => set('price_per_ml', e.target.value)}
                className="bg-white/10 border-white/20 text-white" placeholder="12.5" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Объём флакона (мл) <span className="text-red-400">*</span></label>
              <Input type="number" min="0" value={form.bottle_ml} onChange={e => set('bottle_ml', e.target.value)}
                className="bg-white/10 border-white/20 text-white" placeholder="100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Концентрация</label>
              <select value={form.concentration} onChange={e => set('concentration', e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-10 appearance-none">
                {CONC_VALUES.map(c => <option key={c.value} value={c.value} className="bg-zinc-900">{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Категория</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-10 appearance-none">
                <option value="decant" className="bg-zinc-900">Отливант</option>
                <option value="bottle" className="bg-zinc-900">Флакон</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">URL изображения</label>
            <Input value={form.image_url} onChange={e => set('image_url', e.target.value)}
              className="bg-white/10 border-white/20 text-white text-xs" placeholder="https://... (или загрузите фото выше)" />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} className="text-white/40 hover:text-white">
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving || uploadingImage}
            className="bg-gold-500 hover:bg-gold-600 text-white px-6">
            {saving ? (
              <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Создаю...</>
            ) : 'Создать товар'}
          </Button>
        </div>
      </div>
    </div>
  )
}