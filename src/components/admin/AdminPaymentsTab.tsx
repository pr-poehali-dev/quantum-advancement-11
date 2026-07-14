import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

export interface Payment {
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
    // Создаём заказ в МойСклад (тихо, не блокируем UI)
    api.moysklad.createOrder(p.order_id).then(msRes => {
      if (msRes.error) console.warn('МойСклад: не удалось создать заказ:', msRes.error)
      else toast.info(`МойСклад: заказ #${p.order_id} создан`, { duration: 3000 })
    }).catch(e => console.warn('МойСклад ошибка:', e))
    onConfirmed()
  }

  return (
    <div className={`border rounded-xl p-4 space-y-4 ${isShort ? 'border-yellow-500/30 bg-yellow-500/5' : isOver ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-white/5'}`}>
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

      <div className="flex gap-2">
        <Button onClick={handle} disabled={confirming} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold h-10 text-sm">
          {confirming ? 'Подтверждаю...' : `✓ Подтвердить ${ca.toFixed(2)} ₽ → «Ожидается»`}
        </Button>
        <Button onClick={async () => {
          if (!confirm('Удалить отметку о платеже?')) return
          const res = await api.admin.deletePayment(p.order_id)
          if (res.error) { toast.error(res.error); return }
          toast.success('Платёж удалён'); onConfirmed()
        }} variant="ghost" className="text-red-400/50 hover:text-red-400 h-10 px-3 border border-white/10">
          <Icon name="Trash2" size={14} />
        </Button>
      </div>
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
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditing(v => !v)} className="text-white/30 hover:text-white/60 transition-colors text-xs">
            {editing ? 'Отмена' : '✎'}
          </button>
          {!editing && (
            <button onClick={async () => {
              if (!confirm('Удалить отметку о платеже?')) return
              const res = await api.admin.deletePayment(p.order_id)
              if (res.error) { toast.error(res.error); return }
              toast.success('Платёж удалён'); onChanged()
            }} className="text-red-400/40 hover:text-red-400 transition-colors">
              <Icon name="Trash2" size={13} />
            </button>
          )}
        </div>
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

export function PaymentsTab({ payments, loading, onConfirmed }: { payments: Payment[]; loading: boolean; onConfirmed: () => void }) {
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
          {payments.length > 0 && <span className="ml-1.5 bg-teal-500/30 text-teal-200 text-xs rounded-full px-1.5">{payments.length}</span>}
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