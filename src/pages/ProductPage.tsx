import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  brand: string
  description: string
  price_per_ml: number
  bottle_ml: number
  booked_ml: number
  available_ml: number
  fill_percent: number
  image_url: string | null
  concentration: string
  category: string
}

interface Atomizer {
  id: number
  name: string
  min_ml: number
  max_ml: number
  price: number
}

const CONC_LABEL: Record<string, string> = {
  parfum_water: 'Парфюмерная вода',
  parfum: 'Духи',
  cologne: 'Одеколон',
  eau_de_toilette: 'Туалетная вода',
}

const CONC_VALUES = ['parfum_water', 'parfum', 'cologne', 'eau_de_toilette']

function getAtomizer(atomizers: Atomizer[], ml: number): Atomizer | null {
  return atomizers.find(a => ml >= a.min_ml && ml <= a.max_ml) || atomizers[atomizers.length - 1] || null
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [atomizers, setAtomizers] = useState<Atomizer[]>([])
  const [loading, setLoading] = useState(true)
  const [volume, setVolume] = useState(5)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Product & { concentration: string; category: string }>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

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
      setEditForm(f => ({ ...f, image_url: res.url }))
      toast.success('Фото загружено')
    }
    reader.readAsDataURL(file)
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.catalog.product(Number(id)),
      api.catalog.atomizers()
    ]).then(([prod, atoms]) => {
      if (prod.error) { navigate('/catalog'); return }
      setProduct(prod)
      setEditForm(prod)
      setAtomizers(Array.isArray(atoms) ? atoms : [])
      setLoading(false)
    })
  }, [id, navigate])

  const isBottle = product?.category === 'bottle'

  const atomizer = (!isBottle && product) ? getAtomizer(atomizers, volume) : null
  const perfumePrice = product ? Math.round(product.price_per_ml * (isBottle ? product.bottle_ml : volume) * 100) / 100 : 0
  const total = atomizer ? perfumePrice + atomizer.price : perfumePrice

  const handleOrder = async () => {
    if (!user) { navigate('/login'); return }
    if (!product) return
    setPlacing(true)
    const res = await api.orders.place({ product_id: product.id, volume_ml: isBottle ? product.bottle_ml : volume })
    setPlacing(false)
    if (res.error) { toast.error(res.error); return }
    setSuccess(true)
    if (!isBottle) {
      setProduct(p => p ? { ...p, booked_ml: p.booked_ml + volume, available_ml: p.available_ml - volume } : p)
    }
    toast.success(isBottle ? `Заказ на флакон оформлен!` : `Заказ оформлен! ${volume} мл × ${product.price_per_ml} ₽`)
    setTimeout(() => setSuccess(false), 4000)
  }

  const handleSave = async () => {
    if (!product) return
    setSaving(true)
    const res = await api.catalog.update(product.id, {
      name: editForm.name,
      brand: editForm.brand,
      description: editForm.description,
      price_per_ml: editForm.price_per_ml,
      bottle_ml: editForm.bottle_ml,
      image_url: editForm.image_url,
      concentration: editForm.concentration,
      category: editForm.category,
    })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    setProduct(p => p ? { ...p, ...editForm } as Product : p)
    setEditing(false)
    toast.success('Товар обновлён')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40">Загружаем аромат...</div>
      </div>
    )
  }

  if (!product) return null

  const fillPercent = Math.min(Math.round(product.booked_ml / product.bottle_ml * 100), 100)
  const isAlmostFull = fillPercent >= 80

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1">
            <Icon name="ArrowLeft" size={14} />
            Каталог
          </Link>
          {user && (
            <Link to="/cabinet">
              <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10 text-xs">
                Кабинет
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* Изображение */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center relative group">
            {(editing ? editForm.image_url : product.image_url) ? (
              <img src={(editing ? editForm.image_url : product.image_url) || ''} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl">{isBottle ? '🫙' : '🌸'}</div>
            )}
            {isBottle && !editing && (
              <div className="absolute top-4 left-4 bg-purple-500/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Полноразмерный флакон
              </div>
            )}
            {isAdmin && editing && (
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                {uploadingImage ? (
                  <Icon name="Loader2" size={32} className="animate-spin text-white" />
                ) : (
                  <>
                    <Icon name="Camera" size={32} className="text-white mb-2" />
                    <span className="text-white text-sm font-medium">Сменить фото</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Инфо */}
          <div className="flex flex-col gap-5">
            {/* Кнопка редактирования */}
            {isAdmin && (
              <div className="flex justify-end">
                {editing ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                      {saving ? 'Сохраняю...' : 'Сохранить'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditForm(product) }} className="text-white/50 text-xs">
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="border-white/20 text-white/50 hover:bg-white/10 text-xs gap-1">
                    <Icon name="Pencil" size={12} />
                    Редактировать
                  </Button>
                )}
              </div>
            )}

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Бренд</label>
                  <Input value={editForm.brand || ''} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Название</label>
                  <Input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Описание</label>
                  <textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Цена за мл (₽)</label>
                    <Input type="number" value={editForm.price_per_ml || ''} onChange={e => setEditForm(f => ({ ...f, price_per_ml: Number(e.target.value) }))}
                      className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Объём флакона (мл)</label>
                    <Input type="number" value={editForm.bottle_ml || ''} onChange={e => setEditForm(f => ({ ...f, bottle_ml: Number(e.target.value) }))}
                      className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Концентрация</label>
                    <select value={editForm.concentration || 'parfum_water'} onChange={e => setEditForm(f => ({ ...f, concentration: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-10 appearance-none">
                      {CONC_VALUES.map(c => <option key={c} value={c} className="bg-zinc-900">{CONC_LABEL[c]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Категория</label>
                    <select value={editForm.category || 'decant'} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-10 appearance-none">
                      <option value="decant" className="bg-zinc-900">Отливант</option>
                      <option value="bottle" className="bg-zinc-900">Флакон</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Изображение</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-3 h-10 rounded-md bg-white/10 border border-white/20 text-white/60 hover:text-white text-sm cursor-pointer transition-colors shrink-0">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      {uploadingImage
                        ? <Icon name="Loader2" size={14} className="animate-spin" />
                        : <Icon name="Upload" size={14} />}
                      Загрузить
                    </label>
                    <Input value={editForm.image_url || ''} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white text-xs" placeholder="или вставьте URL..." />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-white/40 text-sm uppercase tracking-widest mb-1">{product.brand}</div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{product.name}</h1>
                  <div className="text-white/40 text-sm mt-1">{CONC_LABEL[product.concentration] || product.concentration}</div>
                </div>

                {product.description && (
                  <p className="text-white/60 text-sm leading-relaxed">{product.description}</p>
                )}
              </>
            )}

            {/* Шкала заполнения — только для отливантов */}
            {!isBottle && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/50">Забронировано</span>
                  <span className={`font-semibold ${isAlmostFull ? 'text-orange-400' : 'text-white'}`}>
                    {product.booked_ml} / {product.bottle_ml} мл
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${isAlmostFull ? 'bg-orange-500' : 'bg-orange-400/60'}`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/30">
                  <span>Свободно: {product.available_ml} мл</span>
                  {isAlmostFull && <span className="text-orange-400 font-medium">Скоро выкуп!</span>}
                </div>
              </div>
            )}

            {/* Цена */}
            <div className="flex items-baseline gap-2">
              {isBottle ? (
                <>
                  <span className="text-orange-400 text-3xl font-bold">{Math.round(product.price_per_ml * product.bottle_ml)} ₽</span>
                  <span className="text-white/40 text-sm">{product.bottle_ml} мл</span>
                </>
              ) : (
                <>
                  <span className="text-orange-400 text-3xl font-bold">{editing ? (editForm.price_per_ml ?? product.price_per_ml) : product.price_per_ml} ₽</span>
                  <span className="text-white/40">/ мл</span>
                </>
              )}
            </div>

            {/* Оформление заказа */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">{isBottle ? 'Заказать флакон' : 'Оформить заказ'}</h3>

              {/* Выбор мл — только для отливантов */}
              {!isBottle && (
                <div>
                  <label className="text-white/50 text-sm mb-2 block">Количество, мл</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setVolume(v => Math.max(1, v - 1))}
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
                    >−</button>
                    <Input
                      type="number"
                      min={1}
                      max={product.available_ml}
                      value={volume}
                      onChange={e => setVolume(Math.max(1, Math.min(product.available_ml, Number(e.target.value))))}
                      className="text-center bg-white/10 border-white/20 text-white w-20 font-semibold text-lg"
                    />
                    <button
                      onClick={() => setVolume(v => Math.min(product.available_ml, v + 1))}
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
                    >+</button>
                    <span className="text-white/30 text-sm">мл</span>
                  </div>
                </div>
              )}

              {/* Атомайзер — только для отливантов */}
              {!isBottle && atomizer && (
                <div className="flex items-center justify-between py-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Icon name="Package" size={14} />
                    <span>{atomizer.name}</span>
                  </div>
                  <span className="text-white/60 text-sm">+{atomizer.price} ₽</span>
                </div>
              )}

              {/* Итог */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-white/50 text-sm">Итого:</span>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">{total} ₽</div>
                  {!isBottle && (
                    <div className="text-white/30 text-xs">{perfumePrice} ₽ парфюм + {atomizer?.price ?? 0} ₽ флакон</div>
                  )}
                </div>
              </div>

              {!isBottle && product.available_ml < 1 ? (
                <div className="bg-white/5 rounded-lg px-4 py-3 text-white/40 text-sm text-center">
                  Весь объём забронирован
                </div>
              ) : success ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm text-center flex items-center justify-center gap-2">
                  <Icon name="CheckCircle" size={16} />
                  Заказ оформлен! Следите за статусом в кабинете.
                </div>
              ) : (
                <Button
                  onClick={handleOrder}
                  disabled={placing || (!isBottle && volume < 1)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl"
                >
                  {placing ? 'Оформляем...' : user ? (isBottle ? 'Заказать флакон' : 'Оформить заказ') : 'Войдите, чтобы заказать'}
                </Button>
              )}

              {!user && (
                <p className="text-white/30 text-xs text-center">
                  <Link to="/login" className="text-orange-400 hover:underline">Войдите</Link> или{' '}
                  <Link to="/register" className="text-orange-400 hover:underline">зарегистрируйтесь</Link>
                </p>
              )}

              <p className="text-white/25 text-xs leading-relaxed pt-1 border-t border-white/5">
                Внимание: товар продаётся на розлив (методом отмеривания) из оригинального флакона строго под ваш заказ после его оплаты. Подробнее о процессе розлива и маркировке читайте в{' '}
                <Link to="/offer" target="_blank" className="text-white/40 hover:text-orange-400 underline underline-offset-2 transition-colors">
                  Договоре оферты
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}