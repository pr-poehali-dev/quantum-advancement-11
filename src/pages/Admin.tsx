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

interface Debt {
  id: number
  type: 'client_owes' | 'we_owe'
  amount: number
  reason: string
  resolved: boolean
  created_at: string
  user_id: number
  nickname: string
  order_id: number | null
  resolve_note: string | null
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'orders' | 'payments' | 'debts'>('orders')

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

  const [debts, setDebts] = useState<Debt[]>([])
  const [debtsLoading, setDebtsLoading] = useState(false)

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

  const loadDebts = useCallback(async () => {
    setDebtsLoading(true)
    const res = await api.admin.debts()
    setDebtsLoading(false)
    if (res.error) { toast.error(res.error); return }
    setDebts(Array.isArray(res) ? res : [])
  }, [])

  useEffect(() => {
    if (tab === 'payments') loadPayments()
    if (tab === 'debts') loadDebts()
  }, [tab, loadPayments, loadDebts])

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
          <button
            onClick={() => setTab('debts')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors relative ${tab === 'debts' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Долги
            {debts.filter(d => !d.resolved).length > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-400" />
            )}
          </button>
        </div>

        {tab === 'payments' && (
          <PaymentsTab payments={payments} loading={paymentsLoading} onConfirmed={() => { loadPayments(); load(); loadDebts() }} />
        )}

        {tab === 'debts' && (
          <DebtsTab debts={debts} loading={debtsLoading} onChanged={loadDebts} />
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
  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={24} className="animate-spin text-white/30" /></div>
  if (payments.length === 0) return (
    <div className="text-center py-16 text-white/30">
      <Icon name="CheckCircle" size={32} className="mx-auto mb-3 text-green-500/40" />
      <div>Неподтверждённых платежей нет</div>
    </div>
  )
  return (
    <div className="space-y-3 max-w-2xl">
      <div className="text-white/40 text-sm mb-2">Ожидают подтверждения: <span className="text-white font-semibold">{payments.length}</span></div>
      {payments.map(p => <PaymentCard key={p.order_id} payment={p} onConfirmed={onConfirmed} />)}
    </div>
  )
}

function PaymentCard({ payment: p, onConfirmed }: { payment: Payment; onConfirmed: () => void }) {
  const [confirmedAmount, setConfirmedAmount] = useState(String(p.payment_amount))
  const [debtNote, setDebtNote] = useState('')
  const [confirming, setConfirming] = useState(false)

  const ca = parseFloat(confirmedAmount) || 0
  const diff = ca - p.total_price
  const isShort = diff < -0.01
  const isOver = diff > 0.01

  const handle = async () => {
    if (!ca) { toast.error('Введите фактическую сумму'); return }
    setConfirming(true)
    const res = await api.admin.confirmPayment(p.order_id, ca, debtNote || undefined)
    setConfirming(false)
    if (res.error) { toast.error(res.error); return }
    const msg = isShort
      ? `Подтверждено. Долг клиента ${Math.abs(diff).toFixed(2)} ₽ зафиксирован.`
      : isOver
        ? `Подтверждено. Наш долг ${diff.toFixed(2)} ₽ зафиксирован.`
        : `Оплата @${p.nickname} подтверждена → «Ожидается»`
    toast.success(msg)
    onConfirmed()
  }

  return (
    <div className={`border rounded-xl p-4 space-y-4 ${isShort ? 'border-yellow-500/30 bg-yellow-500/5' : isOver ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-white/5'}`}>
      {/* Шапка */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold">@{p.nickname}</span>
            <span className="text-white/30 text-xs">#{p.order_id}</span>
            {p.payment_date && <span className="text-white/30 text-xs">{new Date(p.payment_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <div className="text-white/60 text-sm mt-0.5">{p.brand} · {p.product_name} · {p.volume_ml} мл</div>
          {p.payment_note && <div className="text-white/40 text-xs mt-1 italic">«{p.payment_note}»</div>}
        </div>
      </div>

      {/* Суммы */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-white/40 text-xs mb-1">Нужно было</div>
          <div className="text-white font-semibold">{p.total_price.toFixed(2)} ₽</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-white/40 text-xs mb-1">Клиент указал</div>
          <div className={`font-semibold ${isShort ? 'text-yellow-400' : 'text-green-400'}`}>{p.payment_amount.toFixed(2)} ₽</div>
        </div>
        <div className={`rounded-lg p-3 text-center ${isShort ? 'bg-yellow-500/10' : isOver ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
          <div className="text-white/40 text-xs mb-1">Разница</div>
          <div className={`font-semibold ${isShort ? 'text-yellow-400' : isOver ? 'text-blue-300' : 'text-green-400'}`}>
            {diff > 0 ? '+' : ''}{diff.toFixed(2)} ₽
          </div>
        </div>
      </div>

      {/* Фактическая сумма */}
      <div>
        <label className="text-white/50 text-xs mb-1.5 block">Фактически поступило (можно скорректировать)</label>
        <Input
          type="number"
          step="0.01"
          value={confirmedAmount}
          onChange={e => setConfirmedAmount(e.target.value)}
          className="bg-white/10 border-white/20 text-white font-semibold text-base h-10"
        />
        {(isShort || isOver) && (
          <div>
            <label className="text-white/40 text-xs mt-2 mb-1 block">
              {isShort ? 'Причина недоплаты / комментарий к долгу клиента' : 'Комментарий к нашему долгу'}
            </label>
            <Input
              value={debtNote}
              onChange={e => setDebtNote(e.target.value)}
              placeholder="необязательно"
              className="bg-white/10 border-white/20 text-white text-sm h-9"
            />
          </div>
        )}
      </div>

      <Button onClick={handle} disabled={confirming} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold h-10 text-sm">
        {confirming ? 'Подтверждаю...' : `✓ Подтвердить ${ca.toFixed(2)} ₽ → перевести в «Ожидается»`}
      </Button>
    </div>
  )
}

function DebtsTab({ debts, loading, onChanged }: { debts: Debt[]; loading: boolean; onChanged: () => void }) {
  const [showResolved, setShowResolved] = useState(false)
  const [addForm, setAddForm] = useState<{ user_id: string; type: 'client_owes' | 'we_owe'; amount: string; reason: string; order_id: string } | null>(null)
  const [addSaving, setAddSaving] = useState(false)

  const active = debts.filter(d => !d.resolved)
  const resolved = debts.filter(d => d.resolved)
  const clientOwes = active.filter(d => d.type === 'client_owes').reduce((s, d) => s + d.amount, 0)
  const weOwe = active.filter(d => d.type === 'we_owe').reduce((s, d) => s + d.amount, 0)

  const handleAdd = async () => {
    if (!addForm?.user_id || !addForm.amount || !addForm.reason) { toast.error('Заполните все поля'); return }
    setAddSaving(true)
    const res = await api.admin.addDebt({
      user_id: Number(addForm.user_id),
      type: addForm.type,
      amount: Number(addForm.amount),
      reason: addForm.reason,
      order_id: addForm.order_id ? Number(addForm.order_id) : undefined,
    })
    setAddSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Долг добавлен')
    setAddForm(null)
    onChanged()
  }

  if (loading) return <div className="flex justify-center py-16"><Icon name="Loader2" size={24} className="animate-spin text-white/30" /></div>

  return (
    <div className="max-w-2xl space-y-4">
      {/* Сводка */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="text-red-400/70 text-xs mb-1">Клиенты должны нам</div>
          <div className="text-red-300 font-bold text-2xl">{clientOwes.toFixed(2)} ₽</div>
          <div className="text-red-400/40 text-xs">{active.filter(d => d.type === 'client_owes').length} долг(ов)</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="text-blue-400/70 text-xs mb-1">Мы должны клиентам</div>
          <div className="text-blue-300 font-bold text-2xl">{weOwe.toFixed(2)} ₽</div>
          <div className="text-blue-400/40 text-xs">{active.filter(d => d.type === 'we_owe').length} долг(ов)</div>
        </div>
      </div>

      {/* Кнопка добавить вручную */}
      {!addForm ? (
        <button onClick={() => setAddForm({ user_id: '', type: 'we_owe', amount: '', reason: '', order_id: '' })}
          className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-colors">
          <Icon name="Plus" size={14} /> Добавить долг вручную
        </button>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="text-white/60 text-sm font-medium">Новый долг</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/40 text-xs mb-1 block">ID пользователя</label>
              <Input value={addForm.user_id} onChange={e => setAddForm(f => f ? { ...f, user_id: e.target.value } : f)}
                placeholder="user_id" className="bg-white/10 border-white/20 text-white h-9 text-sm" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Тип</label>
              <select value={addForm.type} onChange={e => setAddForm(f => f ? { ...f, type: e.target.value as 'client_owes' | 'we_owe' } : f)}
                className="w-full h-9 bg-white/10 border border-white/20 text-white text-sm rounded-md px-2 appearance-none">
                <option value="we_owe" className="bg-zinc-900">Мы должны клиенту</option>
                <option value="client_owes" className="bg-zinc-900">Клиент должен нам</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Сумма ₽</label>
              <Input type="number" value={addForm.amount} onChange={e => setAddForm(f => f ? { ...f, amount: e.target.value } : f)}
                className="bg-white/10 border-white/20 text-white h-9 text-sm" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Номер заказа (если есть)</label>
              <Input value={addForm.order_id} onChange={e => setAddForm(f => f ? { ...f, order_id: e.target.value } : f)}
                placeholder="необязательно" className="bg-white/10 border-white/20 text-white h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">Причина</label>
            <Input value={addForm.reason} onChange={e => setAddForm(f => f ? { ...f, reason: e.target.value } : f)}
              placeholder="напр. Товар не поступил" className="bg-white/10 border-white/20 text-white h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={addSaving} className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9">
              {addSaving ? 'Сохраняю...' : 'Добавить'}
            </Button>
            <Button variant="ghost" onClick={() => setAddForm(null)} className="text-white/40 text-sm h-9">Отмена</Button>
          </div>
        </div>
      )}

      {/* Активные долги */}
      {active.length === 0 ? (
        <div className="text-center py-8 text-white/30 text-sm">Активных долгов нет</div>
      ) : (
        <div className="space-y-2">
          {active.map(d => <DebtRow key={d.id} debt={d} onResolved={onChanged} />)}
        </div>
      )}

      {/* Закрытые */}
      {resolved.length > 0 && (
        <div>
          <button onClick={() => setShowResolved(v => !v)} className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors">
            <Icon name={showResolved ? 'ChevronUp' : 'ChevronDown'} size={12} />
            Закрытые долги ({resolved.length})
          </button>
          {showResolved && (
            <div className="space-y-2 mt-2">
              {resolved.map(d => <DebtRow key={d.id} debt={d} onResolved={onChanged} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DebtRow({ debt: d, onResolved }: { debt: Debt; onResolved: () => void }) {
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [showResolve, setShowResolve] = useState(false)

  const handle = async () => {
    setResolving(true)
    const res = await api.admin.resolveDebt(d.id, resolveNote)
    setResolving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Долг закрыт')
    onResolved()
  }

  const isClient = d.type === 'client_owes'

  return (
    <div className={`border rounded-xl p-3 ${d.resolved ? 'border-white/5 opacity-50' : isClient ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isClient ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
              {isClient ? 'Должен нам' : 'Мы должны'}
            </span>
            <span className="text-white font-semibold text-sm">@{d.nickname}</span>
            {d.order_id && <span className="text-white/30 text-xs">#{d.order_id}</span>}
            <span className="text-white/30 text-xs">{new Date(d.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="text-white/60 text-xs mt-1">{d.reason}</div>
          {d.resolve_note && <div className="text-green-400/60 text-xs mt-0.5 italic">Закрыт: {d.resolve_note}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className={`font-bold ${isClient ? 'text-red-300' : 'text-blue-300'}`}>{d.amount.toFixed(2)} ₽</div>
          {!d.resolved && (
            <button onClick={() => setShowResolve(v => !v)} className="text-white/30 hover:text-white/60 text-xs transition-colors mt-1">
              Закрыть
            </button>
          )}
        </div>
      </div>
      {showResolve && !d.resolved && (
        <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
          <Input value={resolveNote} onChange={e => setResolveNote(e.target.value)}
            placeholder="Как закрыт? (зачёт, возврат...)"
            className="bg-white/10 border-white/20 text-white text-sm h-8 flex-1" />
          <Button onClick={handle} disabled={resolving} className="bg-green-600 hover:bg-green-500 text-white text-xs h-8 px-3">
            {resolving ? '...' : 'Закрыть'}
          </Button>
        </div>
      )}
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