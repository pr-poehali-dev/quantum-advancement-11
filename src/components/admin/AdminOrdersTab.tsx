import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  delivery_option_id: number | null
  delivery_option_name: string | null
  delivery_address: string | null
  delivery_schedule: string | null
  delivery_comment: string | null
  phone: string | null
  customer_code: string | null
  pickup_batch: number | null
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
  awaiting_payment: 'bg-teal-500/20 text-teal-300',
  waiting: 'bg-purple-500/15 text-purple-300',
  delivery: 'bg-green-500/15 text-green-300',
  declined: 'bg-red-500/15 text-red-400',
}

const ALL_STATUSES = Object.keys(STATUS_LABEL)

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
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
  const [pendingStatus, setPendingStatus] = useState('')
  const [batchInput, setBatchInput] = useState('')

  const handleChange = async (newStatus: string) => {
    if (newStatus === order.status) { setEditing(false); return }
    if (newStatus === 'delivery') {
      setPendingStatus(newStatus)
      setBatchInput('')
      return
    }
    setSaving(true)
    const res = await api.admin.setStatus([order.id], newStatus)
    setSaving(false)
    setEditing(false)
    if (res.error) { toast.error(res.error); return }
    onChanged()
  }

  const confirmDelivery = async () => {
    if (!batchInput) return
    setSaving(true)
    const res = await api.admin.setStatus([order.id], 'delivery', Number(batchInput))
    setSaving(false)
    setPendingStatus('')
    setEditing(false)
    if (res.error) { toast.error(res.error); return }
    onChanged()
  }

  if (saving) return <Icon name="Loader2" size={14} className="animate-spin text-white/40" />

  if (pendingStatus === 'delivery') {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min="1"
          value={batchInput}
          onChange={e => setBatchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') confirmDelivery(); if (e.key === 'Escape') { setPendingStatus(''); setEditing(false) } }}
          placeholder="№ выкупа"
          className="bg-zinc-800 border border-teal-500/50 text-white text-xs rounded-md px-2 h-7 w-20"
        />
        <button onClick={confirmDelivery} className="text-teal-400 hover:text-teal-300 text-xs px-1">✓</button>
        <button onClick={() => { setPendingStatus(''); setEditing(false) }} className="text-white/30 hover:text-white/60 text-xs px-1">✕</button>
      </div>
    )
  }

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
      {order.status === 'delivery' && order.pickup_batch ? <span className="ml-1 opacity-60">#{order.pickup_batch}</span> : null}
    </button>
  )
}

interface AdminOrdersTabProps {
  orders: AdminOrder[]
  totalSum: number
  totalMl: number
  loading: boolean
  filterNick: string
  setFilterNick: (v: string) => void
  filterProduct: string
  setFilterProduct: (v: string) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  filterDelivery: string
  setFilterDelivery: (v: string) => void
  filterBatch: string
  setFilterBatch: (v: string) => void
  deliveryOptionsList: { id: number; name: string }[]
  sortField: string
  setSortField: (v: string) => void
  sortDir: 'asc' | 'desc'
  setSortDir: (v: 'asc' | 'desc') => void
  selected: Set<number>
  setSelected: React.Dispatch<React.SetStateAction<Set<number>>>
  bulkStatus: string
  setBulkStatus: (v: string) => void
  bulkBatch: string
  setBulkBatch: (v: string) => void
  applying: boolean
  archiving: boolean
  ordersSubTab: 'active' | 'archive'
  setOrdersSubTab: (v: 'active' | 'archive') => void
  archivedOrders: (AdminOrder & { archived_at: string | null; delete_at: string | null; open_debts: number })[]
  archiveLoading: boolean
  archiveFilterNick: string
  setArchiveFilterNick: (v: string) => void
  archiveFilterProduct: string
  setArchiveFilterProduct: (v: string) => void
  archiveSelected: Set<number>
  setArchiveSelected: React.Dispatch<React.SetStateAction<Set<number>>>
  unarchiving: boolean
  cleaningUp: boolean
  onLoad: () => void
  onLoadArchive: () => void
  onBulkStatus: () => void
  onArchiveSelected: () => void
  onUnarchive: () => void
  onCleanupInactive: () => void
}

export default function AdminOrdersTab({
  orders, totalSum, totalMl, loading,
  filterNick, setFilterNick, filterProduct, setFilterProduct,
  filterStatus, setFilterStatus, filterDelivery, setFilterDelivery,
  filterBatch, setFilterBatch,
  deliveryOptionsList,
  sortField, setSortField, sortDir, setSortDir,
  selected, setSelected, bulkStatus, setBulkStatus, bulkBatch, setBulkBatch,
  applying, archiving,
  ordersSubTab, setOrdersSubTab,
  archivedOrders, archiveLoading,
  archiveFilterNick, setArchiveFilterNick,
  archiveFilterProduct, setArchiveFilterProduct,
  archiveSelected, setArchiveSelected,
  unarchiving,
  cleaningUp,
  onLoad, onLoadArchive, onBulkStatus, onArchiveSelected, onUnarchive, onCleanupInactive,
}: AdminOrdersTabProps) {
  const [syncingMs, setSyncingMs] = useState(false)

  const handleSyncOrdersToMs = async () => {
    const ids = selected.size > 0 ? Array.from(selected) : orders.map(o => o.id)
    if (ids.length === 0) { toast.error('Нет заказов для отправки'); return }
    setSyncingMs(true)
    const res = await api.moysklad.syncOrders(ids)
    setSyncingMs(false)
    if (res.error) { toast.error('МойСклад: ' + res.error); return }
    const { created, skipped, errors } = res
    if (errors?.length) toast.error(`Ошибки (${errors.length}): ${errors[0]}`)
    else toast.success(`МойСклад: создано ${created}, пропущено (уже есть) ${skipped}`)
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

  const filteredOrders = filterBatch
    ? orders.filter(o => o.pickup_batch === Number(filterBatch))
    : orders

  const sorted = [...filteredOrders].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortField]
    const bv = (b as Record<string, unknown>)[sortField]
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av ?? '').localeCompare(String(bv ?? ''), 'ru')
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortTh = ({ field, children, className = '' }: { field: string; children: React.ReactNode; className?: string }) => (
    <th className={`px-3 py-3 font-medium cursor-pointer select-none hover:text-white/70 transition-colors ${className}`}
      onClick={() => { if (sortField === field) { setSortDir(sortDir === 'asc' ? 'desc' : 'asc') } else { setSortField(field); setSortDir('asc') } }}>
      <span className="flex items-center gap-1 text-white/40">
        {children}
        {sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : <span className="text-white/15"> ↕</span>}
      </span>
    </th>
  )

  return (
    <>
      {/* Подвкладки: Активные / Архив */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-5">
        <button onClick={() => setOrdersSubTab('active')}
          className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${ordersSubTab === 'active' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
          Активные
        </button>
        <button onClick={() => { setOrdersSubTab('archive'); onLoadArchive() }}
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
          <Button onClick={onLoadArchive} disabled={archiveLoading} className="bg-teal-500 hover:bg-teal-600 text-white h-9 text-sm px-5">
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
            <input type="checkbox" readOnly checked={archivedOrders.length > 0 && archiveSelected.size === archivedOrders.length} className="accent-teal-500 w-4 h-4 pointer-events-none" />
            {archiveSelected.size > 0 ? <span className="text-zinc-300 font-medium">Выбрано: {archiveSelected.size} из {archivedOrders.length}</span> : <span>Выбрать все</span>}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={onUnarchive} disabled={unarchiving || archivedOrders.length === 0}
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
                <th className="px-3 py-3 text-left w-10"><input type="checkbox" checked={archivedOrders.length > 0 && archiveSelected.size === archivedOrders.length} onChange={() => { if (archiveSelected.size === archivedOrders.length) setArchiveSelected(new Set()); else setArchiveSelected(new Set(archivedOrders.map(o => o.id))) }} className="accent-teal-500 w-4 h-4 cursor-pointer" /></th>
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
                    <td className="px-3 py-3"><input type="checkbox" checked={archiveSelected.has(o.id)} onChange={() => setArchiveSelected(prev => { const n = new Set(prev); if (n.has(o.id)) { n.delete(o.id) } else { n.add(o.id) } return n })} className="accent-teal-500 w-4 h-4 cursor-pointer" /></td>
                    <td className="px-3 py-3 text-white/80 font-medium">{o.nickname}</td>
                    <td className="px-3 py-3"><div className="text-white/80">{o.product_name}</div><div className="text-white/30 text-xs">{o.brand}</div></td>
                    <td className="px-3 py-3 text-center text-white/60">{o.volume_ml}</td>
                    <td className="px-3 py-3 text-right text-white/80 font-medium">{o.total_price.toFixed(2)} ₽</td>
                    <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status] || 'bg-white/10 text-white/40'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td className="px-3 py-3 text-center text-white/40 text-xs">{o.archived_at ? fmt(o.archived_at) : '—'}</td>
                    <td className="px-3 py-3 text-center text-xs">{daysLeft !== null ? <span className={soonDelete ? 'text-red-400 font-medium' : 'text-white/30'}>{daysLeft > 0 ? `${daysLeft} д.` : 'скоро'}</span> : <span className="text-white/20">—</span>}</td>
                    <td className="px-3 py-3 text-center">{o.open_debts > 0 ? <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full">{o.open_debts}</span> : <span className="text-white/20 text-xs">—</span>}</td>
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
        <div className="min-w-[110px]">
          <label className="text-white/40 text-xs mb-1 block">Выкуп №</label>
          <Input
            type="number"
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            placeholder="номер"
            className="bg-white/5 border-white/15 text-white placeholder:text-white/20 h-9 text-sm"
          />
        </div>
        <Button onClick={onLoad} disabled={loading} className="bg-teal-500 hover:bg-teal-600 text-white h-9 text-sm px-5">
          {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
        </Button>
        <Button variant="ghost" onClick={() => { setFilterNick(''); setFilterProduct(''); setFilterStatus(''); setFilterDelivery(''); setFilterBatch('') }}
          className="text-white/30 hover:text-white h-9 text-sm">
          Сбросить
        </Button>
      </div>

      {/* Панель групповых действий */}
      <div className={`flex flex-wrap items-center gap-3 mb-4 rounded-xl px-4 py-3 border transition-all ${selected.size > 0 ? 'bg-teal-500/10 border-teal-500/30' : 'bg-white/3 border-white/10'}`}>
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <input
            type="checkbox"
            readOnly
            checked={orders.length > 0 && selected.size === orders.length}
            className="accent-teal-500 w-4 h-4 pointer-events-none"
          />
          {selected.size > 0
            ? <span className="text-teal-300 font-medium">Выбрано: {selected.size} из {orders.length}</span>
            : <span>Выбрать все</span>
          }
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={bulkStatus}
            onChange={e => { setBulkStatus(e.target.value); setBulkBatch('') }}
            disabled={selected.size === 0}
            className="bg-white/10 border border-white/20 text-white text-sm rounded-md px-3 h-8 appearance-none disabled:opacity-40"
          >
            <option value="" className="bg-zinc-900">Сменить статус...</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s} className="bg-zinc-900">{STATUS_LABEL[s]}</option>
            ))}
          </select>
          {bulkStatus === 'delivery' && (
            <input
              type="number"
              min="1"
              value={bulkBatch}
              onChange={e => setBulkBatch(e.target.value)}
              placeholder="№ выкупа"
              className="bg-white/10 border border-teal-500/50 text-white text-sm rounded-md px-3 h-8 w-28 placeholder:text-white/30"
            />
          )}
          <Button
            onClick={onBulkStatus}
            disabled={applying || !bulkStatus || selected.size === 0}
            className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs px-4 disabled:opacity-40"
          >
            {applying ? 'Применяю...' : 'Применить'}
          </Button>
          <Button
            onClick={onArchiveSelected}
            disabled={archiving || orders.length === 0}
            className="bg-zinc-700 hover:bg-zinc-600 text-white h-8 text-xs px-4 disabled:opacity-40 border border-white/10"
            title={selected.size > 0 ? 'Архивировать выбранные заказы' : 'Архивировать все отфильтрованные заказы'}
          >
            <Icon name="Archive" size={13} className="mr-1.5" />
            {archiving ? 'Архивирую...' : selected.size > 0 ? `В архив (${selected.size})` : `В архив (все ${orders.length})`}
          </Button>
          <Button
            onClick={onCleanupInactive}
            disabled={cleaningUp}
            variant="ghost"
            className="text-white/30 hover:text-red-400 h-8 text-xs px-3 border border-white/10 disabled:opacity-40"
            title="Архивировать заказы в статусе «Принят» пользователей, не заходивших 60+ дней"
          >
            <Icon name="UserX" size={13} className="mr-1.5" />
            {cleaningUp ? 'Очищаю...' : '60 дней'}
          </Button>
          <Button
            onClick={handleSyncOrdersToMs}
            disabled={syncingMs || orders.length === 0}
            className="bg-emerald-700 hover:bg-emerald-600 text-white h-8 text-xs px-4 disabled:opacity-40 border border-emerald-500/30"
            title={selected.size > 0 ? 'Отправить выбранные заказы в МойСклад' : 'Отправить все отфильтрованные заказы в МойСклад'}
          >
            <Icon name="Send" size={13} className="mr-1.5" />
            {syncingMs ? 'Отправляю...' : selected.size > 0 ? `МойСклад (${selected.size})` : `МойСклад (${orders.length})`}
          </Button>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-white/30 hover:text-white text-xs transition-colors">
              Снять
            </button>
          )}
          <Button
            onClick={() => {
              const printOrders = selected.size > 0 ? orders.filter(o => selected.has(o.id)) : orders
              type BuyerEntry = { nickname: string; phone: string; customer_code: string; count: number }
              const map: Record<string, BuyerEntry> = {}
              for (const o of printOrders) {
                if (!map[o.nickname]) map[o.nickname] = { nickname: o.nickname, phone: o.phone || '—', customer_code: o.customer_code || '—', count: 0 }
                map[o.nickname].count++
              }
              const buyers = Object.values(map).sort((a, b) => a.nickname.localeCompare(b.nickname, 'ru'))
              const filters = [filterNick && ('ник: '+filterNick), filterProduct && ('товар: '+filterProduct), filterStatus && ('статус: '+STATUS_LABEL[filterStatus]), filterDelivery && ('доставка: '+filterDelivery), filterBatch && ('выкуп: №'+filterBatch)].filter(Boolean).join(' · ') || 'все'
              const rows = buyers.map((b, i) =>
                '<tr><td>'+(i+1)+'</td><td>'+b.nickname+'</td><td style="font-family:monospace;font-weight:bold;color:#c05000">'+b.customer_code+'</td><td>'+b.phone+'</td><td>'+b.count+'</td><td style="width:40px">&nbsp;</td></tr>'
              ).join('')
              const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Список покупателей</title>'
                +'<style>body{font-family:Arial,sans-serif;padding:20px;color:#000}h2{margin-bottom:4px}p{margin-bottom:12px;color:#666;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#f0f0f0;padding:8px 12px;text-align:left;border:1px solid #ccc;font-size:13px}td{padding:8px 12px;border:1px solid #ccc;font-size:13px}tr:nth-child(even){background:#fafafa}@media print{button{display:none}}</style>'
                +'</head><body>'
                +'<button onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;cursor:pointer">Печать</button>'
                +'<h2>Список покупателей</h2>'
                +'<p>Фильтры: '+filters+' · всего покупателей: '+buyers.length+'</p>'
                +'<table><thead><tr><th>№</th><th>Ник</th><th>Номер клиента</th><th>Телефон</th><th>Заказов</th><th>✓</th></tr></thead><tbody>'
                +rows
                +'</tbody></table></body></html>'
              const win = window.open('', '_blank')
              if (!win) return
              win.document.write(html)
              win.document.close()
            }}
            className="bg-zinc-700 hover:bg-zinc-600 text-white h-8 text-xs px-4 border border-white/10"
            title="Список покупателей для печати"
          >
            <Icon name="Printer" size={13} className="mr-1.5" /> Список
          </Button>
        </div>
      </div>

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
                  className="accent-teal-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <SortTh field="id" className="text-left">№</SortTh>
              <SortTh field="created_at" className="text-left">Время</SortTh>
              <SortTh field="nickname" className="text-left">Ник</SortTh>
              <SortTh field="product_name" className="text-left">Товар</SortTh>
              <SortTh field="volume_ml" className="text-right">Мл</SortTh>
              <SortTh field="delivery_option_name" className="text-left">Адрес</SortTh>
              <SortTh field="total_price" className="text-right">Сумма</SortTh>
              <SortTh field="pickup_batch" className="text-center">Выкуп</SortTh>
              <th className="px-3 py-3 text-left text-white/40 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-white/30">
                  <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-white/30">
                  Заказов не найдено
                </td>
              </tr>
            ) : (
              sorted.map(order => (
                <tr
                  key={order.id}
                  className={`border-b border-white/5 hover:bg-white/3 transition-colors ${selected.has(order.id) ? 'bg-teal-500/5' : ''}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="accent-teal-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3 text-white/50 font-mono text-xs">#{order.id}</td>
                  <td className="px-3 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(order.created_at)}</td>
                  <td className="px-3 py-3">
                    <span className="text-white font-medium">@{order.nickname}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Link to={`/catalog/${order.product_id}`} className="hover:text-teal-300 transition-colors">
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
                    <span className="text-teal-400 font-semibold">{order.total_price} ₽</span>
                    {order.payment_amount && (
                      <div className={`text-xs mt-1 flex items-center gap-1 ${order.payment_confirmed ? 'text-green-400' : 'text-yellow-400/70'}`}>
                        <Icon name={order.payment_confirmed ? 'CheckCircle' : 'Clock'} size={10} />
                        {order.payment_amount} ₽
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {order.pickup_batch
                      ? <span className="text-teal-400 font-mono font-semibold text-sm">№{order.pickup_batch}</span>
                      : <span className="text-white/20 text-xs">—</span>
                    }
                  </td>
                  <td className="px-3 py-3">
                    <StatusCell order={order} onChanged={onLoad} />
                    {['delivery', 'declined'].includes(order.status) && (
                      <ArchiveOrderBtn orderId={order.id} onDone={onLoad} />
                    )}
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
            <span className="text-teal-400 font-bold text-lg">{totalSum.toFixed(2)} ₽</span>
          </div>
        </div>
      )}
      </>}
    </>
  )
}