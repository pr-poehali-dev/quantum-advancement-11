import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

export interface Debt {
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
  client_request: 'refund' | 'credit' | null
  client_card: string | null
  client_request_at: string | null
}

function DebtRow({ debt: d, onResolved }: { debt: Debt; onResolved: () => void }) {
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [showResolve, setShowResolve] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(String(d.amount))
  const [editReason, setEditReason] = useState(d.reason)
  const [saving, setSaving] = useState(false)
  const [confirmingRequest, setConfirmingRequest] = useState(false)

  const handle = async () => {
    setResolving(true)
    const res = await api.admin.resolveDebt(d.id, resolveNote)
    setResolving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Долг закрыт'); onResolved()
  }

  const handleEdit = async () => {
    setSaving(true)
    const res = await api.admin.editDebt(d.id, { amount: parseFloat(editAmount) || undefined, reason: editReason })
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Долг обновлён'); setEditing(false); onResolved()
  }

  const handleConfirmRequest = async () => {
    setConfirmingRequest(true)
    const res = await api.admin.resolveDebtRequest(d.id, resolveNote || undefined)
    setConfirmingRequest(false)
    if (res.error) { toast.error(res.error); return }
    toast.success('Запрос подтверждён, долг списан'); onResolved()
  }

  const isClient = d.type === 'client_owes'
  const hasRequest = !d.resolved && d.client_request

  return (
    <div className={`border rounded-xl p-3 transition-all ${
      d.resolved ? 'border-white/5 opacity-50'
      : hasRequest ? 'border-yellow-500/40 bg-yellow-500/5'
      : isClient ? 'border-red-500/20 bg-red-500/5'
      : 'border-blue-500/20 bg-blue-500/5'
    }`}>
      {hasRequest && (
        <div className="flex items-start gap-2 mb-3 pb-3 border-b border-yellow-500/20">
          <Icon name="Bell" size={14} className="text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-yellow-300 text-xs font-medium">
              Клиент запросил {d.client_request === 'refund' ? 'возврат на карту' : 'зачёт в счёт заказов'}
            </div>
            {d.client_card && <div className="text-yellow-200/60 text-xs mt-0.5">Карта: {d.client_card}</div>}
            {d.client_request_at && <div className="text-white/30 text-xs">{new Date(d.client_request_at).toLocaleDateString('ru-RU')}</div>}
          </div>
          <div className="flex gap-1 shrink-0">
            <input
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder="комментарий (необяз.)"
              className="bg-white/5 border border-white/15 rounded px-2 py-1 text-white text-xs w-40 hidden sm:block"
            />
            <Button onClick={handleConfirmRequest} disabled={confirmingRequest}
              className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs h-7 px-3 font-semibold">
              {confirmingRequest ? '...' : '✓ Выполнено'}
            </Button>
          </div>
        </div>
      )}

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
          {!editing
            ? <div className="text-white/60 text-xs mt-1">{d.reason}</div>
            : <div className="mt-2 space-y-1.5">
                <Input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-xs h-7 w-28" />
                <Input value={editReason} onChange={e => setEditReason(e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-xs h-7" />
                <div className="flex gap-1">
                  <Button onClick={handleEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3">
                    {saving ? '...' : 'Сохранить'}
                  </Button>
                  <Button onClick={() => setEditing(false)} variant="ghost" className="text-white/30 text-xs h-7">Отмена</Button>
                </div>
              </div>
          }
          {d.resolve_note && <div className="text-green-400/60 text-xs mt-0.5 italic">Закрыт: {d.resolve_note}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className={`font-bold ${isClient ? 'text-red-300' : 'text-blue-300'}`}>{d.amount.toFixed(2)} ₽</div>
          {!d.resolved && !editing && (
            <div className="flex flex-col items-end gap-0.5 mt-1">
              <button onClick={() => setEditing(true)} className="text-white/25 hover:text-white/50 text-xs transition-colors">✎ изменить</button>
              <button onClick={() => setShowResolve(v => !v)} className="text-white/30 hover:text-white/60 text-xs transition-colors">Списать</button>
            </div>
          )}
        </div>
      </div>

      {showResolve && !d.resolved && (
        <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
          <Input value={resolveNote} onChange={e => setResolveNote(e.target.value)}
            placeholder="Как закрыт? (зачёт, возврат...)"
            className="bg-white/10 border-white/20 text-white text-sm h-8 flex-1" />
          <Button onClick={handle} disabled={resolving} className="bg-green-600 hover:bg-green-500 text-white text-xs h-8 px-3">
            {resolving ? '...' : 'Списать'}
          </Button>
        </div>
      )}
    </div>
  )
}

export function DebtsTab({ debts, loading, onChanged }: { debts: Debt[]; loading: boolean; onChanged: () => void }) {
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

      {active.length === 0 ? (
        <div className="text-center py-8 text-white/30 text-sm">Активных долгов нет</div>
      ) : (
        <div className="space-y-2">
          {active.map(d => <DebtRow key={d.id} debt={d} onResolved={onChanged} />)}
        </div>
      )}

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
