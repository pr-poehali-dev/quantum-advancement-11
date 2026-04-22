import { useEffect, useState, useCallback } from 'react'
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

interface ClientDebt {
  id: number
  type: 'client_owes' | 'we_owe'
  amount: number
  reason: string
  resolved: boolean
  created_at: string
  client_request: string | null
  client_card: string | null
  client_request_at: string | null
  order_id: number | null
  resolve_note: string | null
}

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Принят', fixed: 'Зафиксирован', awaiting_payment: 'Ожидает оплаты',
  waiting: 'Ожидается', delivery: 'Раздача', declined: 'Отказано',
}
const STATUS_COLOR: Record<string, string> = {
  accepted: 'bg-white/10 text-white/60', fixed: 'bg-blue-500/15 text-blue-300',
  awaiting_payment: 'bg-orange-500/20 text-orange-300 animate-pulse',
  waiting: 'bg-purple-500/15 text-purple-300', delivery: 'bg-green-500/15 text-green-300',
  declined: 'bg-red-500/15 text-red-400',
}

type Tab = 'active' | 'payment' | 'delivery' | 'declined' | 'debts'

export default function Cabinet() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [debts, setDebts] = useState<ClientDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('active')

  // оплата
  const [paySelected, setPaySelected] = useState<Set<number>>(new Set())
  const [payNote, setPayNote] = useState('')
  const [paying, setPaying] = useState(false)

  // выдача
  const [pickupForm, setPickupForm] = useState<{ order_id: number; point: string } | null>(null)
  const [pickupSaving, setPickupSaving] = useState(false)

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.orders.my(), api.orders.myDebts()]).then(([ord, dbt]) => {
      setOrders(Array.isArray(ord) ? ord : [])
      setDebts(Array.isArray(dbt) ? dbt : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  const handleLogout = async () => { await logout(); navigate('/') }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить заказ?')) return
    const r = await api.orders.delete(id)
    if (r.error) { toast.error(r.error); return }
    toast.success('Заказ удалён'); load()
  }

  const handleArchive = async (id: number) => {
    const r = await api.orders.archive(id)
    if (r.error) { toast.error(r.error); return }
    toast.success('Убрано в архив'); load()
  }

  const handlePickup = async () => {
    if (!pickupForm?.point.trim()) return
    setPickupSaving(true)
    const r = await api.orders.pickup(pickupForm.order_id, pickupForm.point)
    setPickupSaving(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Пункт выдачи сохранён'); setPickupForm(null); load()
  }

  const togglePayOrder = (id: number) => {
    setPaySelected(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n })
  }
  const togglePayAll = () => {
    const unpaid = awaitingPayment.filter(o => !o.payment_amount)
    setPaySelected(paySelected.size === unpaid.length ? new Set() : new Set(unpaid.map(o => o.id)))
  }

  const handlePay = async () => {
    if (paySelected.size === 0) { toast.error('Отметьте заказы'); return }
    setPaying(true)
    const r = await api.orders.pay({ order_ids: Array.from(paySelected), payment_amount: selectedPayTotal, payment_note: payNote } as Parameters<typeof api.orders.pay>[0])
    setPaying(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Отметка отправлена модератору')
    setPaySelected(new Set()); setPayNote(''); load()
  }

  // Группировка
  const activeOrders    = orders.filter(o => ['accepted','fixed'].includes(o.status))
  const awaitingPayment = orders.filter(o => o.status === 'awaiting_payment')
  const deliveryOrders  = orders.filter(o => ['waiting','delivery'].includes(o.status))
  const declinedOrders  = orders.filter(o => o.status === 'declined')
  const paymentTotal    = awaitingPayment.reduce((s, o) => s + o.total_price, 0)
  const selectedPayTotal = awaitingPayment.filter(o => paySelected.has(o.id)).reduce((s, o) => s + o.total_price, 0)
  const activeDebts = debts.filter(d => !d.resolved)
  const weOweTotal = activeDebts.filter(d => d.type === 'we_owe').reduce((s, d) => s + d.amount, 0)
  const clientOwesTotal = activeDebts.filter(d => d.type === 'client_owes').reduce((s, d) => s + d.amount, 0)

  if (!user) return null

  const tabs: { id: Tab; label: string; badge?: number | string }[] = [
    { id: 'active', label: 'Заказы', badge: activeOrders.length || undefined },
    { id: 'payment', label: 'К оплате', badge: awaitingPayment.length || undefined },
    { id: 'delivery', label: 'В пути', badge: deliveryOrders.length || undefined },
    { id: 'declined', label: 'Отказано', badge: declinedOrders.length || undefined },
    { id: 'debts', label: 'Долги', badge: activeDebts.length || undefined },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">Распивошная</Link>
        <div className="flex items-center gap-3">
          <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors hidden sm:block">Каталог</Link>
          {(user.role === 'admin' || user.role === 'moderator') && (
            <Link to="/admin"><Button variant="outline" size="sm" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs">Админ</Button></Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white text-xs">Выйти</Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {/* Профиль */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-lg">
            {user.nickname[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">@{user.nickname}</div>
            <div className="text-white/40 text-sm">{user.email}</div>
          </div>
        </div>

        {/* Мигающий баннер оплаты */}
        {awaitingPayment.length > 0 && tab !== 'payment' && (
          <div className="mb-4 bg-orange-500/10 border border-orange-500/40 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-orange-500/15 transition-colors"
            onClick={() => setTab('payment')}>
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
            <span className="text-orange-300 text-sm font-medium">Ожидает оплаты: {awaitingPayment.length} заказ(а) на {paymentTotal.toFixed(0)} ₽</span>
            <Icon name="ChevronRight" size={14} className="text-orange-400 ml-auto shrink-0" />
          </div>
        )}

        {/* Мигающий баннер долгов */}
        {weOweTotal > 0 && tab !== 'debts' && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-500/15 transition-colors"
            onClick={() => setTab('debts')}>
            <Icon name="Info" size={14} className="text-blue-400 shrink-0" />
            <span className="text-blue-300 text-sm">Организатор должен вам <span className="font-bold">{weOweTotal.toFixed(2)} ₽</span></span>
            <Icon name="ChevronRight" size={14} className="text-blue-400 ml-auto shrink-0" />
          </div>
        )}

        {/* Табы */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit py-2 px-3 text-xs sm:text-sm rounded-lg font-medium transition-colors relative whitespace-nowrap ${tab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
              {t.label}
              {t.badge ? (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/50'}`}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            {/* АКТИВНЫЕ ЗАКАЗЫ */}
            {tab === 'active' && (
              activeOrders.length === 0 ? (
                <EmptyState icon="ShoppingBag" text="Нет активных заказов">
                  <Link to="/catalog"><Button className="mt-3 bg-orange-500 hover:bg-orange-600 text-white text-sm">В каталог</Button></Link>
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map(o => (
                    <OrderCard key={o.id} order={o}
                      onDelete={() => handleDelete(o.id)}
                      onArchive={undefined}
                      onPickup={undefined}
                    />
                  ))}
                </div>
              )
            )}

            {/* К ОПЛАТЕ */}
            {tab === 'payment' && (
              awaitingPayment.length === 0 ? (
                <EmptyState icon="CheckCircle" text="Нет заказов к оплате" />
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Реквизиты</div>
                    <div className="text-white font-mono text-sm">Карта: <span className="text-orange-300">4276 •••• •••• 1234</span></div>
                    <div className="text-white/40 text-xs">Получатель: Организатор распива</div>
                  </div>
                  {awaitingPayment.filter(o => !o.payment_amount).length > 0 && (
                    <button onClick={togglePayAll} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors px-1">
                      <input type="checkbox" readOnly checked={paySelected.size === awaitingPayment.filter(o => !o.payment_amount).length} className="accent-orange-500 w-3.5 h-3.5 pointer-events-none" />
                      Выбрать все неоплаченные
                    </button>
                  )}
                  {awaitingPayment.map(o => (
                    <div key={o.id}
                      onClick={() => !o.payment_amount && togglePayOrder(o.id)}
                      className={`border rounded-xl p-4 transition-all ${o.payment_amount ? 'bg-white/3 border-white/8 opacity-60' : paySelected.has(o.id) ? 'bg-orange-500/8 border-orange-500/40 cursor-pointer' : 'bg-white/5 border-white/10 cursor-pointer hover:border-white/20'}`}>
                      <div className="flex items-center gap-3">
                        {!o.payment_amount && <input type="checkbox" readOnly checked={paySelected.has(o.id)} className="accent-orange-500 w-4 h-4 shrink-0 pointer-events-none" />}
                        <ProductThumb order={o} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white/40 text-xs">{o.brand}</div>
                          <div className="text-white text-sm font-medium truncate">{o.product_name}</div>
                          <div className="text-white/40 text-xs">{o.volume_ml} мл · {o.atomizer_name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-orange-400 font-bold">{o.total_price} ₽</div>
                          {o.payment_amount && <div className="text-green-400/70 text-xs flex items-center gap-1 justify-end mt-0.5"><Icon name="Clock" size={10} />ожидает проверки</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {paySelected.size > 0 && (
                    <div className="sticky bottom-4 bg-zinc-900 border border-orange-500/30 rounded-xl p-4 space-y-3 shadow-2xl shadow-black/60">
                      <div className="flex justify-between items-center">
                        <div className="text-white/50 text-sm">Выбрано: <span className="text-white font-medium">{paySelected.size}</span></div>
                        <div className="text-orange-400 font-bold text-xl">{selectedPayTotal.toFixed(2)} ₽</div>
                      </div>
                      <div>
                        <label className="text-white/40 text-xs mb-1 block">Комментарий (дата, время, способ)</label>
                        <Input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="22 апр, 14:30, Тинькофф" className="bg-white/10 border-white/20 text-white text-sm h-9" />
                      </div>
                      <Button onClick={handlePay} disabled={paying} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-10">
                        {paying ? 'Отправляем...' : `Я оплатил(а) ${selectedPayTotal.toFixed(2)} ₽ — отправить`}
                      </Button>
                    </div>
                  )}
                </div>
              )
            )}

            {/* В ПУТИ / РАЗДАЧА */}
            {tab === 'delivery' && (
              deliveryOrders.length === 0 ? (
                <EmptyState icon="Package" text="Нет заказов в пути" />
              ) : (
                <div className="space-y-3">
                  {deliveryOrders.map(o => (
                    <OrderCard key={o.id} order={o}
                      onDelete={undefined}
                      onArchive={o.status === 'delivery' ? () => handleArchive(o.id) : undefined}
                      onPickup={o.status === 'waiting' ? () => setPickupForm({ order_id: o.id, point: o.pickup_point || '' }) : undefined}
                    />
                  ))}
                </div>
              )
            )}

            {/* ОТКАЗАНО */}
            {tab === 'declined' && (
              declinedOrders.length === 0 ? (
                <EmptyState icon="XCircle" text="Нет отказанных заказов" />
              ) : (
                <div className="space-y-3">
                  {declinedOrders.map(o => (
                    <OrderCard key={o.id} order={o}
                      onDelete={undefined}
                      onArchive={() => handleArchive(o.id)}
                      onPickup={undefined}
                    />
                  ))}
                </div>
              )
            )}

            {/* ДОЛГИ */}
            {tab === 'debts' && (
              <DebtsTab debts={debts} onChanged={load} />
            )}
          </>
        )}
      </div>

      {/* Модалка пункта выдачи */}
      {pickupForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">Пункт выдачи</h3>
            <Input value={pickupForm.point} onChange={e => setPickupForm(f => f ? { ...f, point: e.target.value } : f)}
              placeholder="Адрес или название" className="bg-white/10 border-white/20 text-white" autoFocus />
            <div className="flex gap-2">
              <Button onClick={handlePickup} disabled={pickupSaving || !pickupForm.point.trim()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {pickupSaving ? 'Сохраняю...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={() => setPickupForm(null)} className="border-white/20 text-white/50 hover:bg-white/10">Отмена</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, text, children }: { icon: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-14">
      <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={36} className="mx-auto mb-3 text-white/15" />
      <div className="text-white/40 text-sm">{text}</div>
      {children}
    </div>
  )
}

function ProductThumb({ order }: { order: Order }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/10 flex items-center justify-center shrink-0 overflow-hidden text-base">
      {order.image_url ? <img src={order.image_url} className="w-full h-full object-cover" /> : '🌸'}
    </div>
  )
}

function OrderCard({ order: o, onDelete, onArchive, onPickup }: {
  order: Order
  onDelete?: () => void
  onArchive?: () => void
  onPickup?: () => void
}) {
  return (
    <div className={`bg-white/5 border rounded-xl p-4 transition-colors ${o.status === 'declined' ? 'border-red-500/15' : 'border-white/10'}`}>
      <div className="flex items-start gap-3">
        <Link to={`/catalog/${o.product_id}`} className="hover:opacity-80 transition-opacity shrink-0">
          <ProductThumb order={o} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="text-white/40 text-xs">{o.brand}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.status] ?? 'bg-white/10 text-white/50'}`}>
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>
          <div className="text-white text-sm font-medium truncate">{o.product_name}</div>
          <div className="text-white/40 text-xs mt-0.5">{o.volume_ml} мл · {o.atomizer_name} · <span className="text-white/60 font-medium">{o.total_price} ₽</span></div>
        </div>
      </div>

      {/* Пункт выдачи (ожидается) */}
      {o.status === 'waiting' && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {o.pickup_point ? (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-purple-300"><Icon name="MapPin" size={13} />{o.pickup_point}</div>
              {onPickup && <button onClick={onPickup} className="text-white/30 hover:text-white/60 text-xs transition-colors">Изменить</button>}
            </div>
          ) : onPickup ? (
            <button onClick={onPickup} className="w-full flex items-center justify-center gap-2 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 text-sm hover:bg-purple-500/20 transition-colors">
              <Icon name="MapPin" size={14} />Выбрать пункт выдачи
            </button>
          ) : null}
        </div>
      )}

      {/* Раздача */}
      {o.status === 'delivery' && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-green-400 text-sm">
            <Icon name="PackageCheck" size={14} />Готово к получению!
            {o.pickup_point && <span className="text-white/40 text-xs">· {o.pickup_point}</span>}
          </div>
          {onArchive && <button onClick={onArchive} className="text-white/30 hover:text-white/50 text-xs transition-colors">Получил, убрать</button>}
        </div>
      )}

      {/* Действия */}
      <div className="mt-3 pt-3 border-t border-white/8 flex gap-3 justify-end">
        {onArchive && o.status === 'declined' && (
          <button onClick={onArchive} className="text-white/30 hover:text-white/50 text-xs transition-colors">В архив</button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 text-xs transition-colors flex items-center gap-1">
            <Icon name="Trash2" size={12} />Удалить
          </button>
        )}
      </div>
    </div>
  )
}

function DebtsTab({ debts, onChanged }: { debts: ClientDebt[]; onChanged: () => void }) {
  const active = debts.filter(d => !d.resolved)
  const resolved = debts.filter(d => d.resolved)
  const [showResolved, setShowResolved] = useState(false)

  const weOwe = active.filter(d => d.type === 'we_owe')
  const clientOwes = active.filter(d => d.type === 'client_owes')

  if (debts.length === 0) return <EmptyState icon="HandCoins" text="Долгов нет" />

  return (
    <div className="space-y-4">
      {/* Суммы */}
      {(weOwe.length > 0 || clientOwes.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {weOwe.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="text-blue-400/70 text-xs mb-1">Нам должны вам</div>
              <div className="text-blue-300 font-bold text-xl">{weOwe.reduce((s, d) => s + d.amount, 0).toFixed(2)} ₽</div>
            </div>
          )}
          {clientOwes.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-red-400/70 text-xs mb-1">Вы должны нам</div>
              <div className="text-red-300 font-bold text-xl">{clientOwes.reduce((s, d) => s + d.amount, 0).toFixed(2)} ₽</div>
            </div>
          )}
        </div>
      )}

      {/* Активные долги */}
      {active.map(d => <DebtClientCard key={d.id} debt={d} onChanged={onChanged} />)}

      {/* Закрытые */}
      {resolved.length > 0 && (
        <div>
          <button onClick={() => setShowResolved(v => !v)} className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors">
            <Icon name={showResolved ? 'ChevronUp' : 'ChevronDown'} size={12} />
            Закрытые ({resolved.length})
          </button>
          {showResolved && <div className="space-y-2 mt-2">{resolved.map(d => <DebtClientCard key={d.id} debt={d} onChanged={onChanged} />)}</div>}
        </div>
      )}
    </div>
  )
}

function DebtClientCard({ debt: d, onChanged }: { debt: ClientDebt; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [requestType, setRequestType] = useState<'refund' | 'credit'>('credit')
  const [card, setCard] = useState('')
  const [saving, setSaving] = useState(false)

  const isWeOwe = d.type === 'we_owe'

  const handleRequest = async () => {
    if (requestType === 'refund' && !card.trim()) { toast.error('Укажите номер карты'); return }
    setSaving(true)
    const r = await api.orders.debtRequest(d.id, requestType, card || undefined)
    setSaving(false)
    if (r.error) { toast.error(r.error); return }
    toast.success(requestType === 'refund' ? 'Запрос на возврат отправлен' : 'Запрос на зачёт отправлен')
    setShowForm(false); onChanged()
  }

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${d.resolved ? 'border-white/8 opacity-50' : isWeOwe ? 'border-blue-500/20 bg-blue-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isWeOwe ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
              {isWeOwe ? 'Организатор должен вам' : 'Вы должны организатору'}
            </span>
            {d.order_id && <span className="text-white/30 text-xs">заказ #{d.order_id}</span>}
          </div>
          <div className="text-white/60 text-sm">{d.reason}</div>
          {d.resolve_note && <div className="text-green-400/60 text-xs mt-1 italic">Закрыт: {d.resolve_note}</div>}
          {d.client_request && !d.resolved && (
            <div className="text-white/40 text-xs mt-1 flex items-center gap-1">
              <Icon name="Clock" size={10} />
              {d.client_request === 'refund' ? `Запрошен возврат${d.client_card ? ` на карту ${d.client_card}` : ''}` : 'Запрошен зачёт в выкуп'}
            </div>
          )}
        </div>
        <div className={`font-bold text-lg shrink-0 ${isWeOwe ? 'text-blue-300' : 'text-red-300'}`}>{d.amount.toFixed(2)} ₽</div>
      </div>

      {/* Кнопки действия — только для долгов организатора */}
      {isWeOwe && !d.resolved && !d.client_request && (
        !showForm ? (
          <div className="flex gap-2">
            <button onClick={() => { setRequestType('credit'); setShowForm(true) }}
              className="flex-1 text-xs py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 rounded-lg transition-colors">
              Зачесть в следующий выкуп
            </button>
            <button onClick={() => { setRequestType('refund'); setShowForm(true) }}
              className="flex-1 text-xs py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/60 rounded-lg transition-colors">
              Вернуть на карту
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex gap-2">
              <button onClick={() => setRequestType('credit')}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${requestType === 'credit' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/10 text-white/40'}`}>
                Зачесть
              </button>
              <button onClick={() => setRequestType('refund')}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${requestType === 'refund' ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                Возврат
              </button>
            </div>
            {requestType === 'refund' && (
              <Input value={card} onChange={e => setCard(e.target.value)} placeholder="Номер карты для перевода"
                className="bg-white/10 border-white/20 text-white text-sm h-9" />
            )}
            <div className="flex gap-2">
              <Button onClick={handleRequest} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
                {saving ? '...' : requestType === 'refund' ? 'Запросить возврат' : 'Запросить зачёт'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white/40 text-sm h-9">Отмена</Button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
