import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

import AdminOrdersTab from '@/components/admin/AdminOrdersTab'
import AdminProductsTab from '@/components/admin/AdminProductsTab'
import UsersTab from '@/components/admin/UsersTab'
import WarehouseTab from '@/components/admin/WarehouseTab'
import { PaymentsTab, DebtsTab, AdminMessagesTab, DeliveryTab, AdminForumTab } from '@/components/admin/AdminTabsContent'
import type { Payment, Debt } from '@/components/admin/AdminTabsContent'

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
  customer_code: string | null
  pickup_batch: number | null
}

type AdminProduct = { id: number; name: string; brand: string; price_per_ml: number; bottle_ml: number; booked_ml: number; is_active: boolean; image_url: string | null; description: string | null; active_booked: number; concentration: string; category: string; supplier_id: string }

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'orders' | 'payments' | 'debts' | 'products' | 'users' | 'messages' | 'delivery' | 'forum' | 'settings' | 'broadcast' | 'warehouse'>('orders')
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
  const [filterBatch, setFilterBatch] = useState('')
  const [deliveryOptionsList, setDeliveryOptionsList] = useState<{id: number; name: string}[]>([])
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkBatch, setBulkBatch] = useState('')
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
  const [cleaningUp, setCleaningUp] = useState(false)

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [prodFilterName, setProdFilterName] = useState('')
  const [prodFilterBrand, setProdFilterBrand] = useState('')
  const [prodFilterMinBooked, setProdFilterMinBooked] = useState('')
  const [prodFilterCategory, setProdFilterCategory] = useState('')
  const [prodSort, setProdSort] = useState('created_at')
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('desc')
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingCell, setSavingCell] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [deletingProducts, setDeletingProducts] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (user.role !== 'admin' && user.role !== 'moderator') { navigate('/'); return }
  }, [user, authLoading, navigate])

  const refreshUnread = useCallback(() => {
    if (!user) return
    api.messages.adminInbox().then(res => {
      if (Array.isArray(res)) setAdminUnread(res.filter((d: { has_unread: boolean }) => d.has_unread).length)
    })
  }, [user])

  useEffect(() => {
    refreshUnread()
    const iv = setInterval(() => {
      if (!document.hidden) refreshUnread()
    }, 60000)
    return () => clearInterval(iv)
  }, [refreshUnread])

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

  const handleCleanupInactive = async () => {
    if (!window.confirm('Отменить все заказы в статусе «Принят» у пользователей, не заходивших более 60 дней?\n\nЗабронированные мл будут освобождены.')) return
    setCleaningUp(true)
    const res = await api.admin.cleanupInactiveOrders()
    setCleaningUp(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Отменено заказов: ${res.cancelled}`)
    load()
  }

  const handleBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return
    if (bulkStatus === 'delivery' && !bulkBatch) { toast.error('Укажите номер выкупа'); return }
    setApplying(true)
    const res = await api.admin.setStatus(Array.from(selected), bulkStatus, bulkStatus === 'delivery' ? Number(bulkBatch) : undefined)
    setApplying(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Статус обновлён у ${res.updated} заказ(ов)`)
    setBulkBatch('')
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
    const STRING_FIELDS = ['supplier_id', 'name', 'brand', 'description', 'image_url', 'concentration', 'category']
    let val: string | number
    if (STRING_FIELDS.includes(field)) {
      val = editValue.trim()
    } else {
      const num = field === 'price_per_ml' ? parseFloat(editValue) : parseInt(editValue)
      if (isNaN(num) || num < 0) { toast.error('Некорректное значение'); setSavingCell(false); return }
      val = num
    }
    const res = await api.admin.updateProduct({ id, [field]: val })
    setSavingCell(false)
    if (res.error) { toast.error(res.error); return }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
    setEditingCell(null)
  }

  const deleteProducts = async (ids: number[]) => {
    if (!window.confirm(`Удалить ${ids.length} товар(ов)? Это действие необратимо.`)) return
    setDeletingProducts(true)
    const res = await api.admin.deleteProducts(ids)
    setDeletingProducts(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Удалено товаров: ${res.deleted}`)
    setSelectedProducts(new Set())
    setProducts(prev => prev.filter(p => !ids.includes(p.id)))
  }

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return null

  return (
    <div className="min-h-screen bg-choco-950 text-white">
      {/* Header */}
      <header className="border-b border-gold-500/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-choco-950/90 backdrop-blur-sm z-20">
        <Link to="/" className="font-serif text-gold-400 font-semibold text-xl tracking-wide hover:text-gold-300 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-gold-400/70 text-xs hidden sm:block">Модератор</span>
          <Link to="/cabinet">
            <Button size="sm" className="bg-zinc-700 hover:bg-zinc-600 text-white border border-white/10 text-xs">Кабинет</Button>
          </Link>
          <Link to="/catalog">
            <Button size="sm" className="bg-zinc-700 hover:bg-zinc-600 text-white border border-white/10 text-xs">Каталог</Button>
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
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setTab('debts')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors relative ${tab === 'debts' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Долги
            {debts.filter(d => !d.resolved && d.client_request).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {debts.filter(d => !d.resolved && d.client_request).length}
              </span>
            )}
            {debts.filter(d => !d.resolved && !d.client_request).length > 0 && debts.filter(d => !d.resolved && d.client_request).length === 0 && (
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
              <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{adminUnread}</span>
            )}
          </button>
          <button
            onClick={() => setTab('delivery')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'delivery' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Доставка
          </button>
          <button
            onClick={() => setTab('forum')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'forum' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Форум
          </button>
          <button
            onClick={() => setTab('warehouse')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'warehouse' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Склад
          </button>
          <button
            onClick={() => setTab('broadcast')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'broadcast' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Рассылка
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'settings' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Настройки
          </button>
        </div>

        {tab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            totalSum={totalSum}
            totalMl={totalMl}
            loading={loading}
            filterNick={filterNick} setFilterNick={setFilterNick}
            filterProduct={filterProduct} setFilterProduct={setFilterProduct}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filterDelivery={filterDelivery} setFilterDelivery={setFilterDelivery}
            filterBatch={filterBatch} setFilterBatch={setFilterBatch}
            deliveryOptionsList={deliveryOptionsList}
            sortField={sortField} setSortField={setSortField}
            sortDir={sortDir} setSortDir={setSortDir}
            selected={selected} setSelected={setSelected}
            bulkStatus={bulkStatus} setBulkStatus={setBulkStatus}
            bulkBatch={bulkBatch} setBulkBatch={setBulkBatch}
            applying={applying}
            archiving={archiving}
            ordersSubTab={ordersSubTab} setOrdersSubTab={setOrdersSubTab}
            archivedOrders={archivedOrders}
            archiveLoading={archiveLoading}
            archiveFilterNick={archiveFilterNick} setArchiveFilterNick={setArchiveFilterNick}
            archiveFilterProduct={archiveFilterProduct} setArchiveFilterProduct={setArchiveFilterProduct}
            archiveSelected={archiveSelected} setArchiveSelected={setArchiveSelected}
            unarchiving={unarchiving}
            cleaningUp={cleaningUp}
            onLoad={load}
            onLoadArchive={loadArchive}
            onBulkStatus={handleBulkStatus}
            onArchiveSelected={handleArchiveSelected}
            onUnarchive={handleUnarchive}
            onCleanupInactive={handleCleanupInactive}
          />
        )}

        {tab === 'payments' && (
          <PaymentsTab payments={payments} loading={paymentsLoading} onConfirmed={() => { loadPayments(); load(); loadDebts() }} />
        )}

        {tab === 'debts' && (
          <DebtsTab debts={debts} loading={debtsLoading} onChanged={loadDebts} />
        )}

        {tab === 'products' && (
          <AdminProductsTab
            products={products}
            productsLoading={productsLoading}
            prodFilterName={prodFilterName} setProdFilterName={setProdFilterName}
            prodFilterBrand={prodFilterBrand} setProdFilterBrand={setProdFilterBrand}
            prodFilterMinBooked={prodFilterMinBooked} setProdFilterMinBooked={setProdFilterMinBooked}
            prodFilterCategory={prodFilterCategory} setProdFilterCategory={setProdFilterCategory}
            prodSort={prodSort}
            prodSortDir={prodSortDir}
            editingCell={editingCell} setEditingCell={setEditingCell}
            editValue={editValue} setEditValue={setEditValue}
            savingCell={savingCell}
            importing={importing} setImporting={setImporting}
            setProducts={setProducts}
            onLoadProducts={loadProducts}
            onToggleProdSort={toggleProdSort}
            onSaveCell={saveCell}
            onStartEdit={startEdit}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            onDeleteProducts={deleteProducts}
            deletingProducts={deletingProducts}
          />
        )}

        {tab === 'users' && <UsersTab />}

        {tab === 'messages' && (
          <AdminMessagesTab onUnreadChange={setAdminUnread} />
        )}

        {tab === 'delivery' && <DeliveryTab />}

        {tab === 'forum' && <AdminForumTab />}

        {tab === 'warehouse' && <WarehouseTab />}

        {tab === 'broadcast' && <BroadcastTab />}

        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function SettingsTab() {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.settings.get('payment_details').then(res => {
      setLoading(false)
      if (!res.error) setValue(res.value || '')
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await api.settings.set('payment_details', value)
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Реквизиты сохранены')
  }

  if (loading) return <div className="py-12 text-center text-white/30"><Icon name="Loader2" size={24} className="animate-spin mx-auto" /></div>

  return (
    <div className="max-w-lg space-y-4">
      <div className="text-white/60 text-sm font-medium">Реквизиты для оплаты</div>
      <div className="text-white/30 text-xs">Отображается покупателям при отметке оплаты. Можно указать номер карты, СБП, другие реквизиты.</div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={5}
        placeholder={"Например:\nСбербанк 4276 1234 5678 9012\nПо СБП: +7 900 000-00-00"}
        className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/20 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-gold-500/50 transition-colors"
      />
      <Button onClick={handleSave} disabled={saving} className="bg-gold-500 hover:bg-gold-600 text-white text-sm">
        {saving ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  )
}

function BroadcastTab() {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  const handleSend = async () => {
    if (!text.trim()) { toast.error('Введите текст сообщения'); return }
    if (!confirm(`Отправить сообщение всем пользователям с подключённым Telegram?`)) return
    setSending(true)
    setResult(null)
    const res = await api.admin.broadcast(text)
    setSending(false)
    if (res.error) { toast.error(res.error); return }
    setResult(res)
    toast.success(`Отправлено: ${res.sent} из ${res.total}`)
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <div className="text-white/60 text-sm font-medium mb-1">Рассылка через Telegram-бота</div>
        <div className="text-white/30 text-xs">Сообщение получат все покупатели, подключившие уведомления. Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;.</div>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        placeholder={"Например:\n<b>Новый выкуп!</b>\nДобавили свежие позиции в каталог — заходите выбирать 🌸"}
        className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/20 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-gold-500/50 transition-colors"
      />
      <div className="flex items-center gap-3">
        <Button onClick={handleSend} disabled={sending || !text.trim()} className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm">
          {sending ? 'Отправляем...' : 'Отправить всем'}
        </Button>
        {result && (
          <span className="text-white/40 text-xs">
            Отправлено {result.sent} из {result.total}
            {result.failed > 0 && `, не доставлено: ${result.failed}`}
          </span>
        )}
      </div>
    </div>
  )
}