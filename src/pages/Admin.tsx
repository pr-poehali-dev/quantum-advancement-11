import { useEffect, useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'
import UsersTab from '@/components/admin/UsersTab'
import MessagesTab from '@/components/admin/MessagesTab'

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
  delivery_option_id: number | null
  delivery_option_name: string | null
  delivery_address: string | null
  delivery_schedule: string | null
  delivery_comment: string | null
  phone: string | null
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

  const [tab, setTab] = useState<'orders' | 'payments' | 'debts' | 'products' | 'users' | 'messages' | 'delivery'>('orders')
  const [ordersSubTab, setOrdersSubTab] = useState<'active' | 'archive'>('active')
  const [adminUnread, setAdminUnread] = useState(0)

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [totalSum, setTotalSum] = useState(0)
  const [totalMl, setTotalMl] = useState(0)
  const [loading, setLoading] = useState(false)

  const [filterNick, setFilterNick] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDelivery, setFilterDelivery] = useState('')
  const [deliveryOptionsList, setDeliveryOptionsList] = useState<{id: number; name: string}[]>([])
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [applying, setApplying] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [debts, setDebts] = useState<Debt[]>([])
  const [debtsLoading, setDebtsLoading] = useState(false)

  const [archivedOrders, setArchivedOrders] = useState<(AdminOrder & { archived_at: string | null; delete_at: string | null; open_debts: number })[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveFilterNick, setArchiveFilterNick] = useState('')
  const [archiveFilterProduct, setArchiveFilterProduct] = useState('')
  const [archiveSelected, setArchiveSelected] = useState<Set<number>>(new Set())
  const [unarchiving, setUnarchiving] = useState(false)

  type AdminProduct = { id: number; name: string; brand: string; price_per_ml: number; bottle_ml: number; booked_ml: number; is_active: boolean; image_url: string | null; description: string | null; active_booked: number; concentration: string; category: string }
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [prodFilterName, setProdFilterName] = useState('')
  const [prodFilterBrand, setProdFilterBrand] = useState('')
  const [prodFilterMinBooked, setProdFilterMinBooked] = useState('')
  const [prodSort, setProdSort] = useState('created_at')
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('desc')
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingCell, setSavingCell] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'admin' && user.role !== 'moderator') { navigate('/'); return }
  }, [user, navigate])

  useEffect(() => {
    if (!user) return
    api.messages.adminInbox().then(res => {
      if (Array.isArray(res)) setAdminUnread(res.filter((d: { has_unread: boolean }) => d.has_unread).length)
    })
  }, [user])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.admin.orders({ nick: filterNick, product: filterProduct, status: filterStatus, delivery: filterDelivery })
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    setOrders(res.orders || [])
    setTotalSum(res.total_sum || 0)
    setTotalMl(res.total_ml || 0)
    setSelected(new Set())
  }, [filterNick, filterProduct, filterStatus, filterDelivery])

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
      api.admin.getDeliveryOptions().then(res => {
        const data = Array.isArray(res) ? res : (typeof res === 'string' ? JSON.parse(res) : null)
        if (Array.isArray(data)) setDeliveryOptionsList(data)
      })
    }
  }, [user, load, loadPayments])

  const loadDebts = useCallback(async () => {
    setDebtsLoading(true)
    const res = await api.admin.debts()
    setDebtsLoading(false)
    if (res.error) { toast.error(res.error); return }
    setDebts(Array.isArray(res) ? res : [])
  }, [])

  const loadArchive = useCallback(async () => {
    setArchiveLoading(true)
    const res = await api.admin.archivedOrders({ nick: archiveFilterNick, product: archiveFilterProduct })
    setArchiveLoading(false)
    if (res.error) { toast.error(res.error); return }
    setArchivedOrders(res.orders || [])
    setArchiveSelected(new Set())
  }, [archiveFilterNick, archiveFilterProduct])

  useEffect(() => {
    if (tab === 'payments') loadPayments()
    if (tab === 'debts') loadDebts()
    if (tab === 'archive') loadArchive()
  }, [tab, loadPayments, loadDebts, loadArchive])

  const handleUnarchive = async () => {
    const ids = archiveSelected.size > 0 ? Array.from(archiveSelected) : archivedOrders.map(o => o.id)
    if (ids.length === 0) return
    const label = archiveSelected.size > 0 ? `${ids.length} выбранных` : `всех ${ids.length}`
    if (!window.confirm(`Вернуть ${label} заказов из архива?`)) return
    setUnarchiving(true)
    const res = await api.admin.unarchiveOrders(ids)
    setUnarchiving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Восстановлено заказов: ${res.restored}`)
    loadArchive()
  }

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

  const handleArchiveSelected = async () => {
    const ids = selected.size > 0 ? Array.from(selected) : orders.map(o => o.id)
    if (ids.length === 0) return
    const label = selected.size > 0 ? `${ids.length} выбранных` : `всех ${ids.length} отфильтрованных`
    if (!window.confirm(`Архивировать ${label} заказов?\n\nДолги по ним сохранятся до погашения. Архивные заказы удаляются через 4 месяца.`)) return
    setArchiving(true)
    const res = await api.admin.archiveOrders(ids)
    setArchiving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Архивировано заказов: ${res.archived}`)
    load()
  }

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    const res = await api.admin.adminProducts({ name: prodFilterName, brand: prodFilterBrand, sort: prodSort, dir: prodSortDir })
    setProductsLoading(false)
    if (res.error) { toast.error(res.error); return }
    setProducts(res.products || [])
  }, [prodFilterName, prodFilterBrand, prodSort, prodSortDir])

  const toggleProdSort = (col: string) => {
    if (prodSort === col) { setProdSortDir(d => d === 'desc' ? 'asc' : 'desc') }
    else { setProdSort(col); setProdSortDir('desc') }
  }

  useEffect(() => {
    if (tab === 'products') loadProducts()
  }, [tab, loadProducts])

  const startEdit = (id: number, field: string, value: string) => {
    setEditingCell({ id, field })
    setEditValue(value)
  }

  const saveCell = async (id: number, field: string) => {
    setSavingCell(true)
    const val = field === 'price_per_ml' ? parseFloat(editValue) : parseInt(editValue)
    if (isNaN(val) || val < 0) { toast.error('Некорректное значение'); setSavingCell(false); return }
    const res = await api.admin.updateProduct({ id, [field]: val })
    setSavingCell(false)
    if (res.error) { toast.error(res.error); return }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
    setEditingCell(null)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
      const items = rows.map(r => ({
        id: r['id'] || r['ID'] || r['Id'] || undefined,
        name: r['name'] || r['название'] || r['Название'] || '',
        brand: r['brand'] || r['бренд'] || r['Бренд'] || '',
        price_per_ml: r['price_per_ml'] || r['цена_мл'] || r['цена'] || r['Цена'] || 0,
        bottle_ml: r['bottle_ml'] || r['флакон_мл'] || r['флакон'] || r['Флакон'] || 0,
        description: r['description'] || r['описание'] || r['Описание'] || '',
        image_url: r['image_url'] || r['фото'] || r['Фото'] || null,
      }))
      const res = await api.admin.importProducts(items)
      setImporting(false)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Создано: ${res.created}, обновлено: ${res.updated}`)
      loadProducts()
    } catch {
      setImporting(false)
      toast.error('Ошибка чтения файла')
    }
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

          <button
            onClick={() => setTab('products')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'products' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Товары
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'users' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Юзеры
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors relative ${tab === 'messages' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Сообщения
            {adminUnread > 0 && tab !== 'messages' && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{adminUnread}</span>
            )}
          </button>
          <button
            onClick={() => setTab('delivery')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'delivery' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Доставка
          </button>
        </div>

        {tab === 'payments' && (
          <PaymentsTab payments={payments} loading={paymentsLoading} onConfirmed={() => { loadPayments(); load(); loadDebts() }} />
        )}

        {tab === 'debts' && (
          <DebtsTab debts={debts} loading={debtsLoading} onChanged={loadDebts} />
        )}



        {tab === 'products' && <>
          {/* Фильтры + импорт */}
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div className="flex-1 min-w-[130px]">
              <label className="text-white/40 text-xs mb-1 block">Название</label>
              <Input value={prodFilterName} onChange={e => setProdFilterName(e.target.value)}
                placeholder="поиск по названию"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="text-white/40 text-xs mb-1 block">Бренд</label>
              <Input value={prodFilterBrand} onChange={e => setProdFilterBrand(e.target.value)}
                placeholder="поиск по бренду"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm" />
            </div>
            <div className="w-[120px]">
              <label className="text-white/40 text-xs mb-1 block">Забронир. мл ≥</label>
              <Input value={prodFilterMinBooked} onChange={e => setProdFilterMinBooked(e.target.value)}
                placeholder="0" type="number"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm" />
            </div>
            <Button onClick={loadProducts} disabled={productsLoading} className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm px-5">
              {productsLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
            </Button>
            <Button variant="ghost" onClick={() => { setProdFilterName(''); setProdFilterBrand(''); setProdFilterMinBooked('') }}
              className="text-white/30 hover:text-white h-9 text-sm">
              Сбросить
            </Button>
            <div className="ml-auto">
              <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-sm px-4">
                <Icon name="Upload" size={14} className="mr-2" />
                {importing ? 'Загружаю...' : 'Импорт из Excel'}
              </Button>
            </div>
          </div>

          {/* Подсказка по формату */}
          <div className="mb-3 text-xs text-white/25 px-1">
            Колонки Excel: <span className="text-white/40">id, name, brand, price_per_ml, bottle_ml</span> — обязательные. Также: description, image_url. Если id совпадает — обновляется цена и объём флакона.
          </div>

          {/* Таблица товаров */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm min-w-[1060px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  {([
                    { key: 'id', label: 'ID', cls: 'text-left w-14' },
                    { key: 'name', label: 'Название', cls: 'text-left' },
                    { key: 'brand', label: 'Бренд', cls: 'text-left w-32' },
                    { key: null, label: 'Конц.', cls: 'text-center w-28' },
                    { key: null, label: 'Категория', cls: 'text-center w-28' },
                    { key: 'price_per_ml', label: '₽/мл', cls: 'text-center w-24' },
                    { key: 'bottle_ml', label: 'Флакон', cls: 'text-center w-24' },
                    { key: 'booked_ml', label: 'Забронир.', cls: 'text-center w-24' },
                    { key: null, label: 'Своб.', cls: 'text-center w-20' },
                    { key: null, label: 'Статус', cls: 'text-center w-20' },
                  ] as { key: string | null; label: string; cls: string }[]).map(col => (
                    <th key={col.label} className={`px-3 py-3 font-medium ${col.cls}`}>
                      {col.key ? (
                        <button onClick={() => toggleProdSort(col.key!)}
                          className="flex items-center gap-1 text-white/40 hover:text-white transition-colors">
                          {col.label}
                          <Icon name={prodSort === col.key ? (prodSortDir === 'desc' ? 'ChevronDown' : 'ChevronUp') : 'ChevronsUpDown'} size={12} className={prodSort === col.key ? 'text-orange-400' : 'text-white/20'} />
                        </button>
                      ) : <span className="text-white/40">{col.label}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productsLoading && (
                  <tr><td colSpan={10} className="py-12 text-center text-white/30">
                    <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
                  </td></tr>
                )}
                {!productsLoading && products.length === 0 && (
                  <tr><td colSpan={10} className="py-12 text-center text-white/20 text-sm">Товары не найдены</td></tr>
                )}
                {!productsLoading && products
                  .filter(p => !prodFilterMinBooked || p.booked_ml >= parseInt(prodFilterMinBooked || '0'))
                  .map(p => {
                    const free = p.bottle_ml - p.booked_ml
                    const fillPct = p.bottle_ml ? Math.round(p.booked_ml / p.bottle_ml * 100) : 0
                    const CONC_LABEL: Record<string, string> = { parfum_water: 'Парф. вода', parfum: 'Духи', cologne: 'Одеколон', eau_de_toilette: 'Туал. вода' }
                    const CAT_LABEL: Record<string, string> = { decant: 'Отливант', bottle: 'Флакон' }
                    return (
                      <tr key={p.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${!p.is_active ? 'opacity-40' : ''}`}>
                        <td className="px-3 py-2.5 text-white/30 text-xs">{p.id}</td>
                        <td className="px-3 py-2.5 text-white/80 max-w-[180px] truncate">{p.name}</td>
                        <td className="px-3 py-2.5 text-white/50 text-xs">{p.brand}</td>

                        {/* Концентрация */}
                        <td className="px-3 py-2.5 text-center">
                          {editingCell?.id === p.id && editingCell?.field === 'concentration' ? (
                            <select autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                              onBlur={() => { api.admin.updateProduct({ id: p.id, concentration: editValue }).then(r => { if (!r.error) setProducts(prev => prev.map(x => x.id === p.id ? { ...x, concentration: editValue } : x)); setEditingCell(null) }) }}
                              className="bg-zinc-800 border border-orange-500/50 text-white text-xs rounded px-1 py-0.5 outline-none">
                              <option value="parfum_water">Парф. вода</option>
                              <option value="parfum">Духи</option>
                              <option value="cologne">Одеколон</option>
                              <option value="eau_de_toilette">Туал. вода</option>
                            </select>
                          ) : (
                            <button onClick={() => startEdit(p.id, 'concentration', p.concentration)}
                              className="text-white/50 hover:text-orange-300 text-xs transition-colors group flex items-center gap-1 mx-auto">
                              {CONC_LABEL[p.concentration] || p.concentration}
                              <Icon name="Pencil" size={10} className="text-white/15 group-hover:text-orange-400" />
                            </button>
                          )}
                        </td>

                        {/* Категория */}
                        <td className="px-3 py-2.5 text-center">
                          {editingCell?.id === p.id && editingCell?.field === 'category' ? (
                            <select autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                              onBlur={() => { api.admin.updateProduct({ id: p.id, category: editValue }).then(r => { if (!r.error) setProducts(prev => prev.map(x => x.id === p.id ? { ...x, category: editValue } : x)); setEditingCell(null) }) }}
                              className="bg-zinc-800 border border-orange-500/50 text-white text-xs rounded px-1 py-0.5 outline-none">
                              <option value="decant">Отливант</option>
                              <option value="bottle">Флакон</option>
                            </select>
                          ) : (
                            <button onClick={() => startEdit(p.id, 'category', p.category)}
                              className={`text-xs px-2 py-0.5 rounded-full transition-colors group flex items-center gap-1 mx-auto ${p.category === 'bottle' ? 'text-purple-300 hover:text-orange-300' : 'text-blue-300 hover:text-orange-300'}`}>
                              {CAT_LABEL[p.category] || p.category}
                              <Icon name="Pencil" size={10} className="text-white/15 group-hover:text-orange-400" />
                            </button>
                          )}
                        </td>

                        {/* цена — inline edit */}
                        <td className="px-3 py-2.5 text-center">
                          {editingCell?.id === p.id && editingCell?.field === 'price_per_ml' ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveCell(p.id, 'price_per_ml'); if (e.key === 'Escape') setEditingCell(null) }}
                                className="w-20 bg-white/10 border border-orange-500/50 text-white text-center text-sm rounded px-1.5 py-0.5 outline-none" />
                              <button onClick={() => saveCell(p.id, 'price_per_ml')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                                <Icon name="Check" size={13} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white"><Icon name="X" size={13} /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(p.id, 'price_per_ml', String(p.price_per_ml))}
                              className="text-white/80 hover:text-orange-300 transition-colors group flex items-center gap-1 mx-auto">
                              {p.price_per_ml} ₽
                              <Icon name="Pencil" size={11} className="text-white/20 group-hover:text-orange-400" />
                            </button>
                          )}
                        </td>

                        {/* флакон мл — inline edit */}
                        <td className="px-3 py-2.5 text-center">
                          {editingCell?.id === p.id && editingCell?.field === 'bottle_ml' ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveCell(p.id, 'bottle_ml'); if (e.key === 'Escape') setEditingCell(null) }}
                                className="w-20 bg-white/10 border border-orange-500/50 text-white text-center text-sm rounded px-1.5 py-0.5 outline-none" />
                              <button onClick={() => saveCell(p.id, 'bottle_ml')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                                <Icon name="Check" size={13} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white"><Icon name="X" size={13} /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(p.id, 'bottle_ml', String(p.bottle_ml))}
                              className="text-white/80 hover:text-orange-300 transition-colors group flex items-center gap-1 mx-auto">
                              {p.bottle_ml}
                              <Icon name="Pencil" size={11} className="text-white/20 group-hover:text-orange-400" />
                            </button>
                          )}
                        </td>

                        {/* забронировано — inline edit */}
                        <td className="px-3 py-2.5 text-center">
                          {editingCell?.id === p.id && editingCell?.field === 'booked_ml' ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveCell(p.id, 'booked_ml'); if (e.key === 'Escape') setEditingCell(null) }}
                                className="w-20 bg-white/10 border border-orange-500/50 text-white text-center text-sm rounded px-1.5 py-0.5 outline-none" />
                              <button onClick={() => saveCell(p.id, 'booked_ml')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                                <Icon name="Check" size={13} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white"><Icon name="X" size={13} /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(p.id, 'booked_ml', String(p.booked_ml))}
                              className="text-white/80 hover:text-orange-300 transition-colors group flex items-center gap-1 mx-auto">
                              <span>{p.booked_ml}</span>
                              <span className="text-white/25 text-xs">({fillPct}%)</span>
                              <Icon name="Pencil" size={11} className="text-white/20 group-hover:text-orange-400" />
                            </button>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <span className={free > 0 ? 'text-green-400' : 'text-red-400/60'}>{free}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={async () => {
                            const res = await api.admin.updateProduct({ id: p.id, is_active: !p.is_active })
                            if (res.error) { toast.error(res.error); return }
                            setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x))
                          }} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${p.is_active ? 'bg-green-500/15 text-green-300 hover:bg-red-500/15 hover:text-red-300' : 'bg-red-500/15 text-red-300 hover:bg-green-500/15 hover:text-green-300'}`}>
                            {p.is_active ? 'Активен' : 'Скрыт'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {products.length > 0 && (
            <div className="mt-3 flex gap-4 text-sm text-white/30 px-1">
              <span>Всего: <span className="text-white/60">{products.length}</span></span>
              <span>Активных: <span className="text-white/60">{products.filter(p => p.is_active).length}</span></span>
              <span>Заполнено полностью: <span className="text-orange-400">{products.filter(p => p.booked_ml >= p.bottle_ml).length}</span></span>
            </div>
          )}
        </>}

        {tab === 'users' && <UsersTab />}

        {tab === 'messages' && <MessagesTab />}

        {tab === 'orders' && <>
        {/* Подвкладки: Активные / Архив */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-5">
          <button onClick={() => setOrdersSubTab('active')}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${ordersSubTab === 'active' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
            Активные
          </button>
          <button onClick={() => { setOrdersSubTab('archive'); loadArchive() }}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors relative ${ordersSubTab === 'archive' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
            Архив
            {archivedOrders.length > 0 && ordersSubTab !== 'archive' && (
              <span className="absolute -top-0.5 -right-0.5 bg-zinc-600 text-white/60 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{archivedOrders.length > 99 ? '99+' : archivedOrders.length}</span>
            )}
          </button>
        </div>

        {/* ── АРХИВ ── */}
        {ordersSubTab === 'archive' && <>
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="text-white/40 text-xs mb-1 block">Ник</label>
              <Input value={archiveFilterNick} onChange={e => setArchiveFilterNick(e.target.value)}
                placeholder="поиск по нику"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-white/40 text-xs mb-1 block">Товар</label>
              <Input value={archiveFilterProduct} onChange={e => setArchiveFilterProduct(e.target.value)}
                placeholder="название / бренд"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm" />
            </div>
            <Button onClick={loadArchive} disabled={archiveLoading} className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm px-5">
              {archiveLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
            </Button>
            <Button variant="ghost" onClick={() => { setArchiveFilterNick(''); setArchiveFilterProduct('') }}
              className="text-white/30 hover:text-white h-9 text-sm">
              Сбросить
            </Button>
          </div>
          <div className={`flex flex-wrap items-center gap-3 mb-4 rounded-xl px-4 py-3 border transition-all ${archiveSelected.size > 0 ? 'bg-zinc-700/30 border-zinc-500/40' : 'bg-white/3 border-white/10'}`}>
            <button onClick={() => { if (archiveSelected.size === archivedOrders.length) setArchiveSelected(new Set()); else setArchiveSelected(new Set(archivedOrders.map(o => o.id))) }}
              className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
              <input type="checkbox" readOnly checked={archivedOrders.length > 0 && archiveSelected.size === archivedOrders.length} className="accent-orange-500 w-4 h-4 pointer-events-none" />
              {archiveSelected.size > 0 ? <span className="text-zinc-300 font-medium">Выбрано: {archiveSelected.size} из {archivedOrders.length}</span> : <span>Выбрать все</span>}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={handleUnarchive} disabled={unarchiving || archivedOrders.length === 0}
                className="bg-zinc-600 hover:bg-zinc-500 text-white h-8 text-xs px-4 disabled:opacity-40 border border-white/10">
                <Icon name="ArchiveRestore" size={13} className="mr-1.5" />
                {unarchiving ? 'Восстанавливаю...' : archiveSelected.size > 0 ? `Вернуть (${archiveSelected.size})` : `Вернуть (все ${archivedOrders.length})`}
              </Button>
              {archiveSelected.size > 0 && <button onClick={() => setArchiveSelected(new Set())} className="text-white/30 hover:text-white text-xs transition-colors">Снять</button>}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-3 py-3 text-left w-10"><input type="checkbox" checked={archivedOrders.length > 0 && archiveSelected.size === archivedOrders.length} onChange={() => { if (archiveSelected.size === archivedOrders.length) setArchiveSelected(new Set()); else setArchiveSelected(new Set(archivedOrders.map(o => o.id))) }} className="accent-orange-500 w-4 h-4 cursor-pointer" /></th>
                  <th className="px-3 py-3 text-left text-white/40 font-medium">Ник</th>
                  <th className="px-3 py-3 text-left text-white/40 font-medium">Товар</th>
                  <th className="px-3 py-3 text-center text-white/40 font-medium">мл</th>
                  <th className="px-3 py-3 text-right text-white/40 font-medium">Сумма</th>
                  <th className="px-3 py-3 text-center text-white/40 font-medium">Статус</th>
                  <th className="px-3 py-3 text-center text-white/40 font-medium">Архивирован</th>
                  <th className="px-3 py-3 text-center text-white/40 font-medium">Удалится</th>
                  <th className="px-3 py-3 text-center text-white/40 font-medium">Долги</th>
                </tr>
              </thead>
              <tbody>
                {archiveLoading && <tr><td colSpan={9} className="py-12 text-center text-white/30"><Icon name="Loader2" size={20} className="animate-spin mx-auto" /></td></tr>}
                {!archiveLoading && archivedOrders.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-white/20 text-sm">Архив пуст</td></tr>}
                {!archiveLoading && archivedOrders.map(o => {
                  const daysLeft = o.delete_at ? Math.ceil((new Date(o.delete_at).getTime() - Date.now()) / 86400000) : null
                  const soonDelete = daysLeft !== null && daysLeft <= 30
                  return (
                    <tr key={o.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${archiveSelected.has(o.id) ? 'bg-white/5' : ''}`}>
                      <td className="px-3 py-3"><input type="checkbox" checked={archiveSelected.has(o.id)} onChange={() => setArchiveSelected(prev => { const n = new Set(prev); if (n.has(o.id)) { n.delete(o.id) } else { n.add(o.id) } return n })} className="accent-orange-500 w-4 h-4 cursor-pointer" /></td>
                      <td className="px-3 py-3 text-white/80 font-medium">{o.nickname}</td>
                      <td className="px-3 py-3"><div className="text-white/80">{o.product_name}</div><div className="text-white/30 text-xs">{o.brand}</div></td>
                      <td className="px-3 py-3 text-center text-white/60">{o.volume_ml}</td>
                      <td className="px-3 py-3 text-right text-white/80 font-medium">{o.total_price.toFixed(2)} ₽</td>
                      <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status] || 'bg-white/10 text-white/40'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                      <td className="px-3 py-3 text-center text-white/40 text-xs">{o.archived_at ? fmt(o.archived_at) : '—'}</td>
                      <td className="px-3 py-3 text-center text-xs">{daysLeft !== null ? <span className={soonDelete ? 'text-red-400 font-medium' : 'text-white/30'}>{daysLeft > 0 ? `${daysLeft} д.` : 'скоро'}</span> : <span className="text-white/20">—</span>}</td>
                      <td className="px-3 py-3 text-center">{o.open_debts > 0 ? <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full">{o.open_debts} открыт.</span> : <span className="text-white/20 text-xs">нет</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {archivedOrders.length > 0 && (
            <div className="mt-3 flex gap-4 text-sm text-white/30 px-1">
              <span>Всего: <span className="text-white/60">{archivedOrders.length}</span></span>
              <span>С открытыми долгами: <span className="text-red-400">{archivedOrders.filter(o => o.open_debts > 0).length}</span></span>
            </div>
          )}
        </>}

        {/* ── АКТИВНЫЕ ЗАКАЗЫ ── */}
        {ordersSubTab === 'active' && <>
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
          <div className="min-w-[160px]">
            <label className="text-white/40 text-xs mb-1 block">Доставка</label>
            <select
              value={filterDelivery}
              onChange={e => setFilterDelivery(e.target.value)}
              className="w-full h-9 bg-white/5 border border-white/15 text-white text-sm rounded-md px-3 appearance-none"
            >
              <option value="">Все варианты</option>
              {deliveryOptionsList.map(d => (
                <option key={d.id} value={d.name} className="bg-zinc-900">{d.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={load} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm px-5">
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
          </Button>
          <Button variant="ghost" onClick={() => { setFilterNick(''); setFilterProduct(''); setFilterStatus(''); setFilterDelivery('') }}
            className="text-white/30 hover:text-white h-9 text-sm">
            Сбросить
          </Button>
        </div>

        {/* Панель групповых действий — всегда видна */}
        <div className={`flex flex-wrap items-center gap-3 mb-4 rounded-xl px-4 py-3 border transition-all ${selected.size > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/3 border-white/10'}`}>
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <input
              type="checkbox"
              readOnly
              checked={orders.length > 0 && selected.size === orders.length}
              className="accent-orange-500 w-4 h-4 pointer-events-none"
            />
            {selected.size > 0
              ? <span className="text-orange-300 font-medium">Выбрано: {selected.size} из {orders.length}</span>
              : <span>Выбрать все</span>
            }
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              disabled={selected.size === 0}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-8 appearance-none disabled:opacity-40"
            >
              <option value="" className="bg-zinc-900">Сменить статус...</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s} className="bg-zinc-900">{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <Button
              onClick={handleBulkStatus}
              disabled={applying || !bulkStatus || selected.size === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs px-4 disabled:opacity-40"
            >
              {applying ? 'Применяю...' : 'Применить'}
            </Button>
            <Button
              onClick={handleArchiveSelected}
              disabled={archiving || orders.length === 0}
              className="bg-zinc-700 hover:bg-zinc-600 text-white h-8 text-xs px-4 disabled:opacity-40 border border-white/10"
              title={selected.size > 0 ? 'Архивировать выбранные заказы' : 'Архивировать все отфильтрованные заказы'}
            >
              <Icon name="Archive" size={13} className="mr-1.5" />
              {archiving ? 'Архивирую...' : selected.size > 0 ? `В архив (${selected.size})` : `В архив (все ${orders.length})`}
            </Button>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="text-white/30 hover:text-white text-xs transition-colors">
                Снять
              </button>
            )}
            <Button
              onClick={() => {
                const printOrders = selected.size > 0 ? orders.filter(o => selected.has(o.id)) : orders
                const buyers = Object.values(
                  printOrders.reduce<Record<string, { nickname: string; phone: string; count: number }>>((acc, o) => {
                    if (!acc[o.nickname]) acc[o.nickname] = { nickname: o.nickname, phone: o.phone || '—', count: 0 }
                    acc[o.nickname].count++
                    return acc
                  }, {})
                ).sort((a, b) => a.nickname.localeCompare(b.nickname, 'ru'))
                const win = window.open('', '_blank')
                if (!win) return
                win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Список покупателей</title><style>
                  body{font-family:Arial,sans-serif;padding:20px;color:#000}
                  h2{margin-bottom:4px}p{margin-bottom:12px;color:#666;font-size:13px}
                  table{border-collapse:collapse;width:100%}
                  th{background:#f0f0f0;padding:8px 12px;text-align:left;border:1px solid #ccc;font-size:13px}
                  td{padding:8px 12px;border:1px solid #ccc;font-size:13px}
                  tr:nth-child(even){background:#fafafa}
                  @media print{button{display:none}}
                </style></head><body>
                <button onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;cursor:pointer">Печать</button>
                <h2>Список покупателей</h2>
                <p>Фильтры: ${[filterNick && 'ник: '+filterNick, filterProduct && 'товар: '+filterProduct, filterStatus && 'статус: '+STATUS_LABEL[filterStatus], filterDelivery && 'доставка: '+filterDelivery].filter(Boolean).join(' · ') || 'все'} · всего покупателей: ${buyers.length}</p>
                <table><thead><tr><th>№</th><th>Ник</th><th>Телефон</th><th>Заказов</th></tr></thead><tbody>
                ${buyers.map((b, i) => `<tr><td>${i+1}</td><td>${b.nickname}</td><td>${b.phone}</td><td>${b.count}</td></tr>`).join('')}
                </tbody></table></body></html>`)
                win.document.close()
              }}
              className="bg-white/10 hover:bg-white/20 text-white h-8 text-xs px-4 border border-white/15"
              title="Список покупателей для печати"
            >
              <Icon name="Printer" size={13} className="mr-1.5" /> Список
            </Button>
          </div>
        </div>

        {/* Таблица */}
        {(() => {
          const sorted = [...orders].sort((a, b) => {
            const av = (a as Record<string, unknown>)[sortField]
            const bv = (b as Record<string, unknown>)[sortField]
            const cmp = typeof av === 'number' && typeof bv === 'number'
              ? av - bv
              : String(av ?? '').localeCompare(String(bv ?? ''), 'ru')
            return sortDir === 'asc' ? cmp : -cmp
          })
          const SortTh = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => (
            <th className={`px-3 py-3 font-medium cursor-pointer select-none hover:text-white/70 transition-colors ${className}`}
              onClick={() => { if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') } else { setSortField(field); setSortDir('asc') } }}>
              <span className="flex items-center gap-1 text-white/40">
                {children}
                {sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : <span className="text-white/15"> ↕</span>}
              </span>
            </th>
          )
          return (
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
                <SortTh field="id" className="text-left">№</SortTh>
                <SortTh field="created_at" className="text-left">Время</SortTh>
                <SortTh field="nickname" className="text-left">Ник</SortTh>
                <SortTh field="product_name" className="text-left">Товар</SortTh>
                <SortTh field="volume_ml" className="text-right">Мл</SortTh>
                <SortTh field="delivery_option_name" className="text-left">Адрес</SortTh>
                <SortTh field="total_price" className="text-right">Сумма</SortTh>
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
                sorted.map(order => (
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
                    <td className="px-3 py-3 text-xs max-w-[180px]">
                      {order.delivery_option_name ? (
                        <div className="space-y-0.5">
                          <div className="text-white/70 font-medium truncate">{order.delivery_option_name}</div>
                          {order.delivery_comment && <div className="text-purple-300/60 truncate italic">{order.delivery_comment}</div>}
                        </div>
                      ) : order.pickup_point ? (
                        <span className="text-white/50">{order.pickup_point}</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
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
                      {['delivery', 'declined'].includes(order.status) && (
                        <ArchiveOrderBtn orderId={order.id} onDone={load} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          )
        })()}

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
        </>}{/* конец ordersSubTab === 'active' */}
        </>}{/* конец tab === 'orders' */}

        {tab === 'delivery' && <DeliveryTab />}
      </div>
    </div>
  )
}

function PaymentsTab({ payments, loading, onConfirmed }: { payments: Payment[]; loading: boolean; onConfirmed: () => void }) {
  type ConfirmedPayment = Payment & { payment_confirmed_amount: number }
  const [subTab, setSubTab] = useState<'pending' | 'confirmed'>('pending')
  const [confirmed, setConfirmed] = useState<ConfirmedPayment[]>([])
  const [confirmedLoading, setConfirmedLoading] = useState(false)

  const loadConfirmed = async () => {
    setConfirmedLoading(true)
    const res = await api.admin.confirmedPayments()
    setConfirmedLoading(false)
    if (Array.isArray(res)) setConfirmed(res)
  }

  useEffect(() => { if (subTab === 'confirmed') loadConfirmed() }, [subTab])

  return (
    <div className="max-w-2xl">
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-5">
        <button onClick={() => setSubTab('pending')}
          className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors relative ${subTab === 'pending' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
          На подтверждение
          {payments.length > 0 && <span className="ml-1.5 bg-orange-500/30 text-orange-200 text-xs rounded-full px-1.5">{payments.length}</span>}
        </button>
        <button onClick={() => setSubTab('confirmed')}
          className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${subTab === 'confirmed' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
          Подтверждённые
        </button>
      </div>

      {subTab === 'pending' && (
        loading ? <div className="flex justify-center py-16"><Icon name="Loader2" size={24} className="animate-spin text-white/30" /></div>
        : payments.length === 0
          ? <div className="text-center py-16 text-white/30"><Icon name="CheckCircle" size={32} className="mx-auto mb-3 text-green-500/40" /><div>Неподтверждённых платежей нет</div></div>
          : <div className="space-y-3">
              <div className="text-white/40 text-sm mb-2">Ожидают подтверждения: <span className="text-white font-semibold">{payments.length}</span></div>
              {payments.map(p => <PaymentCard key={p.order_id} payment={p} onConfirmed={onConfirmed} />)}
            </div>
      )}

      {subTab === 'confirmed' && (
        confirmedLoading ? <div className="flex justify-center py-16"><Icon name="Loader2" size={24} className="animate-spin text-white/30" /></div>
        : confirmed.length === 0
          ? <div className="text-center py-16 text-white/30"><Icon name="Package" size={32} className="mx-auto mb-3 opacity-30" /><div>Подтверждённых платежей нет</div></div>
          : <div className="space-y-3">
              <div className="text-white/40 text-sm mb-2">Подтверждено: <span className="text-white font-semibold">{confirmed.length}</span></div>
              {confirmed.map(p => <ConfirmedPaymentCard key={p.order_id} payment={p} onChanged={loadConfirmed} />)}
            </div>
      )}
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

function ConfirmedPaymentCard({ payment: p, onChanged }: { payment: Payment & { payment_confirmed_amount: number }; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(p.payment_amount))
  const [confirmedAmount, setConfirmedAmount] = useState(String(p.payment_confirmed_amount))
  const [date, setDate] = useState(() => p.payment_date ? p.payment_date.slice(0, 16) : '')
  const [note, setNote] = useState(p.payment_note || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await api.admin.editPayment(p.order_id, {
      payment_amount: parseFloat(amount) || undefined,
      payment_date: date || undefined,
      payment_note: note,
      payment_confirmed_amount: parseFloat(confirmedAmount) || undefined,
    })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Платёж обновлён'); setEditing(false); onChanged()
  }

  return (
    <div className="border border-white/8 bg-white/3 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold">@{p.nickname}</span>
            <span className="text-white/30 text-xs">#{p.order_id}</span>
            {p.payment_date && <span className="text-white/30 text-xs">{new Date(p.payment_date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ подтверждён</span>
          </div>
          <div className="text-white/60 text-sm mt-0.5">{p.brand} · {p.product_name} · {p.volume_ml} мл</div>
          {!editing && (
            <div className="flex gap-4 mt-1.5 text-xs text-white/50">
              <span>Указал: <span className="text-white/80">{p.payment_amount.toFixed(2)} ₽</span></span>
              <span>Подтверждено: <span className="text-green-400">{p.payment_confirmed_amount.toFixed(2)} ₽</span></span>
              <span>К оплате: <span className="text-white/80">{p.total_price.toFixed(2)} ₽</span></span>
              {p.payment_note && <span className="italic text-white/40">«{p.payment_note}»</span>}
            </div>
          )}
        </div>
        <button onClick={() => setEditing(v => !v)} className="text-white/30 hover:text-white/60 transition-colors text-xs shrink-0">
          {editing ? 'Отмена' : '✎ Изменить'}
        </button>
      </div>

      {editing && (
        <div className="space-y-2 pt-2 border-t border-white/8">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Сумма клиента</label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                className="bg-white/5 border-white/15 text-white text-sm h-8" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Подтверждённая сумма</label>
              <Input type="number" step="0.01" value={confirmedAmount} onChange={e => setConfirmedAmount(e.target.value)}
                className="bg-white/5 border-white/15 text-white text-sm h-8" />
            </div>
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">Дата и время</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-1.5 text-white text-sm [color-scheme:dark]" />
          </div>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Комментарий"
            className="bg-white/5 border-white/15 text-white text-sm h-8" />
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-8">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      )}
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

function ArchiveOrderBtn({ orderId, onDone }: { orderId: number; onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const handle = async () => {
    setLoading(true)
    const res = await api.admin.archiveOrder(orderId)
    setLoading(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Заказ архивирован'); onDone()
  }
  return (
    <button onClick={handle} disabled={loading}
      className="mt-1 text-xs text-white/25 hover:text-white/50 transition-colors block">
      {loading ? '...' : '↓ в архив'}
    </button>
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

function DeliveryTab() {
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

      {/* Форма добавления / редактирования */}
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

      {/* Список */}
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