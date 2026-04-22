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

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()

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

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'moderator') load()
  }, [user, load])

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
        <h1 className="text-xl font-bold mb-6">Все заказы</h1>

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
                        <div className={`text-xs mt-0.5 ${order.payment_confirmed ? 'text-green-400' : 'text-white/30'}`}>
                          {order.payment_confirmed ? '✓' : '⏳'} {order.payment_amount} ₽
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
      </div>
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