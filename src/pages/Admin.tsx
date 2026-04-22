import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface AdminOrder {
  id: number
  created_at: string
  nickname: string
  product_name: string
  brand: string
  volume_ml: number
  total_price: number
  atomizer_price: number
  price_per_ml: number
  status: string
  pickup_point: string | null
  payment_amount: number | null
  payment_confirmed: boolean
  payment_note: string | null
  atomizer_name: string | null
  product_id: number
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
  awaiting_payment: 'bg-orange-500/20 text-orange-300',
  waiting: 'bg-purple-500/15 text-purple-300',
  delivery: 'bg-green-500/15 text-green-300',
  declined: 'bg-red-500/15 text-red-400',
}

const ALL_STATUSES = Object.keys(STATUS_LABEL)

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface Payment {
  order_id: number
  created_at: string
  nickname: string
  product_name: string
  brand: string
  volume_ml: number
  total_price: number
  payment_amount: number
  payment_note: string | null
  payment_date: string | null
  diff: number
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'orders' | 'payments'>('orders')

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [totalSum, setTotalSum] = useState(0)
  const [totalMl, setTotalMl] = useState(0)
  const [loading, setLoading] = useState(false)

  const [filterNick, setFilterNick] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [applying, setApplying] = useState(false)

  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'admin' && user.role !== 'moderator') { navigate('/'); return }
  }, [user, navigate])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.admin.orders({ nick: filterNick, product: filterProduct, status: filterStatus })
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    setOrders(res.orders || [])
    setTotalSum(res.total_sum || 0)
    setTotalMl(res.total_ml || 0)
    setSelected(new Set())
  }, [filterNick, filterProduct, filterStatus])

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true)
    const res = await api.admin.payments()
    setPaymentsLoading(false)
    if (res.error) { toast.error(res.error); return }
    setPayments(Array.isArray(res) ? res : [])
  }, [])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'moderator') {
      load()
      loadPayments()
    }
  }, [user, load, loadPayments])

  useEffect(() => {
    if (tab === 'payments') loadPayments()
  }, [tab, loadPayments])

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(orders.map(o => o.id)))
    }
  }

  const handleBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return
    setApplying(true)
    const res = await api.admin.setStatus(Array.from(selected), bulkStatus)
    setApplying(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Статус обновлён у ${res.updated} заказ(ов)`)
    load()
  }

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-20">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-orange-400/70 text-xs hidden sm:block">Модератор</span>
          <Link to="/cabinet">
            <Button variant="outline" size="sm" className="border-white/20 text-white/50 hover:bg-white/10 text-xs">Кабинет</Button>
          </Link>
          <Link to="/catalog">
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white text-xs">Каталог</Button>
          </Link>
        </div>
      </header>

      <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto">
        {/* Табы */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('orders')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'orders' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Заказы
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors relative ${tab === 'payments' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Платежи
            {payments.length > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            )}
          </button>
        </div>

        {tab === 'payments' && (
          <PaymentsTab payments={payments} loading={paymentsLoading} onConfirmed={() => { loadPayments(); load() }} />
        )}

        {tab === 'orders' && <>
        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-white/40 text-xs mb-1 block">Ник</label>
            <Input
              value={filterNick}
              onChange={e => setFilterNick(e.target.value)}
              placeholder="поиск по нику"
              className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-white/40 text-xs mb-1 block">Товар</label>
            <Input
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              placeholder="название / бренд"
              className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="text-white/40 text-xs mb-1 block">Статус</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full h-9 bg-white/5 border border-white/15 text-white text-sm rounded-md px-3 appearance-none"
            >
              <option value="">Все статусы</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s} className="bg-zinc-900">{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <Button onClick={load} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm px-5">
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
          </Button>
          <Button variant="ghost" onClick={() => { setFilterNick(''); setFilterProduct(''); setFilterStatus('') }}
            className="text-white/30 hover:text-white h-9 text-sm">
            Сбросить
          </Button>
        </div>

        {/* Групповая смена статуса */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
            <span className="text-orange-300 text-sm font-medium">Выбрано: {selected.size}</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-8 appearance-none"
            >
              <option value="" className="bg-zinc-900">Выбрать статус...</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s} className="bg-zinc-900">{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <Button
              onClick={handleBulkStatus}
              disabled={applying || !bulkStatus}
              className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs px-4"
            >
              {applying ? 'Применяю...' : 'Применить'}
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-white/30 hover:text-white text-xs ml-auto">
              Снять выбор
            </button>
          </div>
        )}

        {/* Таблица */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-3 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selected.size === orders.length}
                    onChange={toggleAll}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left text-white/40 font-medium">№</th>
                <th className="px-3 py-3 text-left text-white/40 font-medium">Время</th>
                <th className="px-3 py-3 text-left text-white/40 font-medium">Ник</th>
                <th className="px-3 py-3 text-left text-white/40 font-medium">Товар</th>
                <th className="px-3 py-3 text-right text-white/40 font-medium">Мл</th>
                <th className="px-3 py-3 text-left text-white/40 font-medium">Адрес</th>
                <th className="px-3 py-3 text-right text-white/40 font-medium">Сумма</th>
                <th className="px-3 py-3 text-left text-white/40 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-white/30">
                    <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-white/30">
                    Заказов не найдено
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr
                    key={order.id}
                    className={`border-b border-white/5 hover:bg-white/3 transition-colors ${selected.has(order.id) ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="accent-orange-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 text-white/50 font-mono text-xs">#{order.id}</td>
                    <td className="px-3 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(order.created_at)}</td>
                    <td className="px-3 py-3">
                      <span className="text-white font-medium">@{order.nickname}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Link to={`/catalog/${order.product_id}`} className="hover:text-orange-300 transition-colors">
                        <div className="text-white/80 leading-tight">{order.product_name}</div>
                        <div className="text-white/30 text-xs">{order.brand}</div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-white font-semibold">{order.volume_ml}</span>
                      <span className="text-white/30 text-xs"> мл</span>
                    </td>
                    <td className="px-3 py-3 text-white/50 text-xs max-w-[140px] truncate">
                      {order.pickup_point || <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-orange-400 font-semibold">{order.total_price} ₽</span>
                      {order.payment_amount && (
                        <div className={`text-xs mt-1 flex items-center gap-1 ${order.payment_confirmed ? 'text-green-400' : 'text-yellow-400/70'}`}>
                          <Icon name={order.payment_confirmed ? 'CheckCircle' : 'Clock'} size={10} />
                          {order.payment_amount} ₽
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusCell order={order} onChanged={load} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Итого */}
        {orders.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">Заказов:</span>
              <span className="text-white font-bold">{orders.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">Миллилитров:</span>
              <span className="text-white font-bold">{totalMl} мл</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">Сумма:</span>
              <span className="text-orange-400 font-bold text-lg">{totalSum.toFixed(2)} ₽</span>
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  )
}

function PaymentsTab({ payments, loading, onConfirmed }: { payments: Payment[]; loading: boolean; onConfirmed: () => void }) {
  if (loading) return (
    <div className="flex justify-center py-16">
      <Icon name="Loader2" size={24} className="animate-spin text-white/30" />
    </div>
  )

  if (payments.length === 0) return (
    <div className="text-center py-16 text-white/30">
      <Icon name="CheckCircle" size={32} className="mx-auto mb-3 text-green-500/40" />
      <div>Неподтверждённых платежей нет</div>
    </div>
  )

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="text-white/40 text-sm mb-4">
        Ожидают подтверждения: <span className="text-white font-semibold">{payments.length}</span>
      </div>
      {payments.map(p => (
        <PaymentCard key={p.order_id} payment={p} onConfirmed={onConfirmed} />
      ))}
    </div>
  )
}

function PaymentCard({ payment: p, onConfirmed }: { payment: Payment; onConfirmed: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const diff = p.payment_amount - p.total_price
  const isShort = diff < -0.01
  const isExact = Math.abs(diff) <= 0.01

  const handle = async () => {
    setConfirming(true)
    const res = await api.admin.confirmPayment(p.order_id)
    setConfirming(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Оплата @${p.nickname} подтверждена → статус «Ожидается»`)
    onConfirmed()
  }

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${isShort ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10 bg-white/5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-semibold">@{p.nickname}</span>
            <span className="text-white/30 text-xs">#{p.order_id}</span>
            {p.payment_date && <span className="text-white/30 text-xs">{new Date(p.payment_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <div className="text-white/60 text-sm">{p.brand} · {p.product_name}</div>
          <div className="text-white/40 text-xs">{p.volume_ml} мл</div>
          {p.payment_note && (
            <div className="text-white/40 text-xs mt-1 italic">«{p.payment_note}»</div>
          )}
        </div>

        {/* Суммы */}
        <div className="text-right shrink-0 space-y-1">
          <div className="text-white/40 text-xs">Нужно оплатить</div>
          <div className="text-white font-semibold">{p.total_price.toFixed(2)} ₽</div>
          <div className="text-white/40 text-xs mt-1">Клиент указал</div>
          <div className={`font-bold text-lg ${isShort ? 'text-yellow-400' : 'text-green-400'}`}>
            {p.payment_amount.toFixed(2)} ₽
          </div>
          {isShort && (
            <div className="text-yellow-400 text-xs font-medium">
              Недоплата: {Math.abs(diff).toFixed(2)} ₽
            </div>
          )}
          {isExact && (
            <div className="text-green-400/60 text-xs">Сумма совпадает</div>
          )}
        </div>
      </div>

      <Button
        onClick={handle}
        disabled={confirming}
        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold h-9 text-sm"
      >
        {confirming ? 'Подтверждаю...' : '✓ Подтвердить оплату → перевести в «Ожидается»'}
      </Button>
    </div>
  )
}

function ConfirmPayBtn({ order, onConfirmed }: { order: AdminOrder; onConfirmed: () => void }) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    const res = await api.admin.confirmPayment(order.id)
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Оплата @${order.nickname} подтверждена`)
    onConfirmed()
  }

  return (
    <div className="mt-1 text-right">
      <div className="text-yellow-400/70 text-xs mb-1 flex items-center justify-end gap-1">
        <Icon name="Clock" size={10} />
        {order.payment_amount} ₽ · {order.payment_note || 'без комментария'}
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className="text-xs bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded px-2 py-0.5 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : '✓ Подтвердить'}
      </button>
    </div>
  )
}

function StatusCell({ order, onChanged }: { order: AdminOrder; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChange = async (newStatus: string) => {
    if (newStatus === order.status) { setEditing(false); return }
    setSaving(true)
    const res = await api.admin.setStatus([order.id], newStatus)
    setSaving(false)
    setEditing(false)
    if (res.error) { toast.error(res.error); return }
    onChanged()
  }

  if (saving) return <Icon name="Loader2" size={14} className="animate-spin text-white/40" />

  if (editing) {
    return (
      <select
        autoFocus
        defaultValue={order.status}
        onBlur={() => setEditing(false)}
        onChange={e => handleChange(e.target.value)}
        className="bg-zinc-800 border border-white/20 text-white text-xs rounded-md px-2 h-7 appearance-none"
      >
        {Object.entries(STATUS_LABEL).map(([val, label]) => (
          <option key={val} value={val} className="bg-zinc-900">{label}</option>
        ))}
      </select>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Нажмите для смены статуса"
      className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLOR[order.status] ?? 'bg-white/10 text-white/50'}`}
    >
      {STATUS_LABEL[order.status] ?? order.status}
    </button>
  )
}