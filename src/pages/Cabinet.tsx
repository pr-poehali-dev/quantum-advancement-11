import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface Order {
  id: number
  product_id: number
  product_name: string
  brand: string
  image_url: string | null
  volume_ml: number
  price_per_ml: number
  atomizer_price: number
  total_price: number
  atomizer_name: string | null
  status: string
  payment_confirmed: boolean
  payment_amount: number | null
  payment_date: string | null
  payment_note: string | null
  pickup_point: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Принят',
  fixed: 'Зафиксирован',
  awaiting_payment: 'Ожидает оплаты',
  waiting: 'Ожидается',
  delivery: 'Раздача',
  declined: 'Отказано',
}

const STATUS_COLOR: Record<string, string> = {
  accepted: 'bg-white/10 text-white/60',
  fixed: 'bg-blue-500/15 text-blue-300',
  awaiting_payment: 'bg-orange-500/20 text-orange-300 animate-pulse',
  waiting: 'bg-purple-500/15 text-purple-300',
  delivery: 'bg-green-500/15 text-green-300',
  declined: 'bg-red-500/15 text-red-400',
}

const ARCHIVABLE = ['delivery', 'declined']
const DELETABLE = ['accepted', 'fixed']

export default function Cabinet() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'payment'>('active')

  // Форма оплаты
  const [payForm, setPayForm] = useState<{ order_id: number; amount: string; note: string } | null>(null)
  const [paying, setSaving] = useState(false)

  // Форма пункта выдачи
  const [pickupForm, setPickupForm] = useState<{ order_id: number; point: string } | null>(null)
  const [pickupSaving, setPickupSaving] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [user])

  const load = () => {
    setLoading(true)
    api.orders.my().then(data => {
      setOrders(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleDelete = async (order_id: number) => {
    if (!confirm('Удалить заказ?')) return
    const res = await api.orders.delete(order_id)
    if (res.error) { toast.error(res.error); return }
    toast.success('Заказ удалён')
    load()
  }

  const handleArchive = async (order_id: number) => {
    const res = await api.orders.archive(order_id)
    if (res.error) { toast.error(res.error); return }
    toast.success('Заказ перемещён в архив')
    load()
  }

  const handlePay = async () => {
    if (!payForm) return
    setSaving(true)
    const res = await api.orders.pay({ order_id: payForm.order_id, payment_amount: Number(payForm.amount), payment_note: payForm.note })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Отметка об оплате отправлена! Модератор проверит.')
    setPayForm(null)
    load()
  }

  const handlePickup = async () => {
    if (!pickupForm || !pickupForm.point.trim()) return
    setPickupSaving(true)
    const res = await api.orders.pickup(pickupForm.order_id, pickupForm.point)
    setPickupSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Пункт выдачи выбран!')
    setPickupForm(null)
    load()
  }

  const awaitingPayment = orders.filter(o => o.status === 'awaiting_payment')
  const activeOrders = orders.filter(o => o.status !== 'awaiting_payment')
  const paymentTotal = awaitingPayment.reduce((s, o) => s + o.total_price, 0)

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors hidden sm:block">
            Каталог
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs">
                Админ
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white text-xs">
            Выйти
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {/* Профиль */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-lg">
            {user.nickname[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">@{user.nickname}</div>
            <div className="text-white/40 text-sm">{user.email}</div>
          </div>
        </div>

        {/* Мигающий баннер "Ожидает оплаты" */}
        {awaitingPayment.length > 0 && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/40 rounded-xl px-5 py-4 flex items-start gap-3 cursor-pointer hover:bg-orange-500/15 transition-colors"
            onClick={() => setTab('payment')}>
            <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
            <div>
              <div className="text-orange-300 font-semibold text-sm">
                Ожидает оплаты: {awaitingPayment.length} {awaitingPayment.length === 1 ? 'заказ' : 'заказа'}
              </div>
              <div className="text-orange-400/70 text-xs mt-0.5">
                Итого к оплате: <span className="font-bold">{paymentTotal.toFixed(2)} ₽</span> — внесите платёж в течение 2 дней
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-orange-400 ml-auto mt-0.5 shrink-0" />
          </div>
        )}

        {/* Табы */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'active' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Заказы
          </button>
          <button
            onClick={() => setTab('payment')}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors relative ${tab === 'payment' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            К оплате
            {awaitingPayment.length > 0 && (
              <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            )}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : tab === 'active' ? (
          <>
            {activeOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🌸</div>
                <div className="text-white/40 text-sm">Пока нет активных заказов</div>
                <Link to="/catalog">
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm">Перейти в каталог</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onDelete={() => handleDelete(order.id)}
                    onArchive={() => handleArchive(order.id)}
                    onPickup={() => setPickupForm({ order_id: order.id, point: order.pickup_point || '' })}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {awaitingPayment.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-white/40 text-sm">Нет заказов, ожидающих оплаты</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Блок реквизитов */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-1">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Реквизиты для оплаты</div>
                  <div className="text-white font-mono text-sm">Карта: <span className="text-orange-300">4276 •••• •••• 1234</span></div>
                  <div className="text-white/50 text-xs">Получатель: Организатор распива</div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                    <span className="text-white/50 text-sm">Итого к оплате:</span>
                    <span className="text-orange-400 font-bold">{paymentTotal.toFixed(2)} ₽</span>
                  </div>
                </div>

                {awaitingPayment.map(order => (
                  <div key={order.id} className="bg-white/5 border border-orange-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/10 flex items-center justify-center shrink-0 text-lg">
                        {order.image_url ? <img src={order.image_url} className="w-full h-full object-cover rounded-lg" /> : '🌸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/40 text-xs">{order.brand}</div>
                        <div className="text-white text-sm font-medium truncate">{order.product_name}</div>
                        <div className="text-white/50 text-xs mt-0.5">{order.volume_ml} мл · {order.atomizer_name}</div>
                      </div>
                      <div className="text-orange-400 font-bold shrink-0">{order.total_price} ₽</div>
                    </div>

                    {order.payment_amount ? (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-green-400 text-xs flex items-center gap-2">
                        <Icon name="Clock" size={12} />
                        Оплата {order.payment_amount} ₽ — ожидаем подтверждения модератора
                      </div>
                    ) : (
                      payForm?.order_id === order.id ? (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-white/40 text-xs mb-1 block">Сумма оплаты (₽)</label>
                              <Input type="number" value={payForm.amount}
                                onChange={e => setPayForm(f => f ? { ...f, amount: e.target.value } : f)}
                                className="bg-white/10 border-white/20 text-white text-sm h-9" />
                            </div>
                            <div>
                              <label className="text-white/40 text-xs mb-1 block">Комментарий (дата и время)</label>
                              <Input value={payForm.note}
                                onChange={e => setPayForm(f => f ? { ...f, note: e.target.value } : f)}
                                placeholder="напр. 22 апр, 14:30"
                                className="bg-white/10 border-white/20 text-white text-sm h-9" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handlePay} disabled={paying || !payForm.amount}
                              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
                              {paying ? 'Отправляем...' : 'Я оплатил(а) — отправить'}
                            </Button>
                            <Button variant="ghost" onClick={() => setPayForm(null)}
                              className="text-white/40 hover:text-white text-sm h-9">Отмена</Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => setPayForm({ order_id: order.id, amount: String(order.total_price), note: '' })}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 mt-1">
                          Отметить оплату
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модалка выбора пункта выдачи */}
      {pickupForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">Выбрать пункт выдачи</h3>
            <p className="text-white/40 text-sm">Введите адрес или название пункта, где хотите получить заказ</p>
            <Input
              value={pickupForm.point}
              onChange={e => setPickupForm(f => f ? { ...f, point: e.target.value } : f)}
              placeholder="напр. Офис на Ленина, 12"
              className="bg-white/10 border-white/20 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handlePickup} disabled={pickupSaving || !pickupForm.point.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {pickupSaving ? 'Сохраняем...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={() => setPickupForm(null)}
                className="border-white/20 text-white/50 hover:bg-white/10">Отмена</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onDelete, onArchive, onPickup }: {
  order: Order
  onDelete: () => void
  onArchive: () => void
  onPickup: () => void
}) {
  const canDelete = DELETABLE.includes(order.status)
  const canArchive = ARCHIVABLE.includes(order.status)
  const needsPickup = order.status === 'waiting' && !order.pickup_point

  return (
    <div className={`bg-white/5 border rounded-xl p-4 transition-colors ${needsPickup ? 'border-purple-500/40' : 'border-white/10'}`}>
      <div className="flex items-start gap-3">
        <Link to={`/catalog/${order.product_id}`} className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/10 flex items-center justify-center shrink-0 text-xl hover:opacity-80 transition-opacity overflow-hidden">
          {order.image_url ? <img src={order.image_url} className="w-full h-full object-cover" /> : '🌸'}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="text-white/40 text-xs">{order.brand}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[order.status] ?? 'bg-white/10 text-white/50'}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <div className="text-white text-sm font-medium truncate">{order.product_name}</div>
          <div className="text-white/40 text-xs mt-0.5">
            {order.volume_ml} мл · {order.atomizer_name} · <span className="text-white/60 font-medium">{order.total_price} ₽</span>
          </div>
        </div>
      </div>

      {/* Пункт выдачи (статус waiting) */}
      {order.status === 'waiting' && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {order.pickup_point ? (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Icon name="MapPin" size={13} />
                {order.pickup_point}
              </div>
              <button onClick={onPickup} className="text-white/30 hover:text-white/60 text-xs transition-colors">Изменить</button>
            </div>
          ) : (
            <button onClick={onPickup}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 text-sm hover:bg-purple-500/20 transition-colors">
              <Icon name="MapPin" size={14} />
              Выбрать пункт выдачи
            </button>
          )}
        </div>
      )}

      {/* Статус раздачи */}
      {order.status === 'delivery' && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-green-400 text-sm">
            <Icon name="PackageCheck" size={14} />
            Готово к получению!
            {order.pickup_point && <span className="text-white/40 text-xs">· {order.pickup_point}</span>}
          </div>
          <button onClick={onArchive} className="text-white/30 hover:text-white/50 text-xs transition-colors">В архив</button>
        </div>
      )}

      {/* Отказано */}
      {order.status === 'declined' && (
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
          <button onClick={onArchive} className="text-white/30 hover:text-white/50 text-xs transition-colors">В архив</button>
        </div>
      )}

      {/* Кнопка удаления (принят / зафиксирован) */}
      {canDelete && (
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
          <button onClick={onDelete}
            className="text-red-400/50 hover:text-red-400 text-xs transition-colors flex items-center gap-1">
            <Icon name="Trash2" size={12} />
            Удалить заказ
          </button>
        </div>
      )}
    </div>
  )
}
