import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'
import MessagesChat from '@/components/MessagesChat'
import CustomerIdCard from '@/components/CustomerIdCard'

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
  delivery_option_id: number | null
  delivery_comment: string | null
  delivery_option_name: string | null
  delivery_address: string | null
  delivery_schedule: string | null
  pickup_batch: number | null
  is_archived: boolean
  client_received: boolean
}

interface DeliveryOption {
  id: number
  name: string
  description: string | null
  address: string | null
  schedule: string | null
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
  awaiting_payment: 'bg-gold-500/20 text-gold-300',
  waiting: 'bg-purple-500/15 text-purple-300', delivery: 'bg-green-500/15 text-green-300',
  declined: 'bg-red-500/15 text-red-400',
}

type MainTab = 'orders' | 'debts' | 'messages'
type OrderTab = 'new' | 'payment' | 'transit' | 'ready' | 'received'

export default function Cabinet() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [debts, setDebts] = useState<ClientDebt[]>([])
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<MainTab>('orders')
  const [orderTab, setOrderTab] = useState<OrderTab>('new')
  const [unreadCount, setUnreadCount] = useState(0)
  const [tgLinked, setTgLinked] = useState<boolean | null>(null)
  const [tgCode, setTgCode] = useState('')
  const [tgCodeLoading, setTgCodeLoading] = useState(false)
  const tgCodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // оплата
  const [paySelected, setPaySelected] = useState<Set<number>>(new Set())
  const [payNote, setPayNote] = useState('')
  const [payDateTime, setPayDateTime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)

  // доставка
  const [deliverySelected, setDeliverySelected] = useState<Set<number>>(new Set())
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<number | null>(null)
  const [deliveryComment, setDeliveryComment] = useState('')
  const [deliverySaving, setDeliverySaving] = useState(false)

  // реквизиты
  const [paymentDetails, setPaymentDetails] = useState('')
  const [payAgreed, setPayAgreed] = useState(false)

  // долги
  const [debtRequestId, setDebtRequestId] = useState<number | null>(null)
  const [debtRequestType, setDebtRequestType] = useState<'refund' | 'credit'>('credit')
  const [debtCard, setDebtCard] = useState('')
  const [debtSaving, setDebtSaving] = useState(false)

  useEffect(() => { if (!authLoading && !user) navigate('/login') }, [user, authLoading, navigate])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.orders.my(),
      api.orders.myDebts(),
      api.orders.deliveryOptions(),
      api.settings.get('payment_details'),
    ]).then(([ord, dbt, dlv, settings]) => {
      setOrders(Array.isArray(ord) ? ord : [])
      setDebts(Array.isArray(dbt) ? dbt : [])
      setDeliveryOptions(Array.isArray(dlv) ? dlv : [])
      if (settings && !settings.error) setPaymentDetails(settings.value || '')
      setLoading(false)
    })
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  useEffect(() => {
    if (!user) return
    api.auth.telegramStatus().then(r => { if (!r.error) setTgLinked(r.linked) })
  }, [user])

  const handleGenerateTgCode = async () => {
    setTgCodeLoading(true)
    const r = await api.auth.generateLinkCode()
    setTgCodeLoading(false)
    if (r.code) {
      setTgCode(r.code)
      if (tgCodeTimer.current) clearTimeout(tgCodeTimer.current)
      tgCodeTimer.current = setTimeout(() => setTgCode(''), 10 * 60 * 1000)
    }
  }

  const handleUnlinkTg = async () => {
    if (!confirm('Отключить Telegram-уведомления?')) return
    await api.auth.unlinkTelegram()
    setTgLinked(false)
    setTgCode('')
    toast.success('Telegram отключён')
  }

  useEffect(() => {
    if (!user) return
    const check = () => api.messages.unreadCount().then(r => { if (!r.error) setUnreadCount(r.count || 0) })
    check()
    const iv = setInterval(() => { if (!document.hidden) check() }, 60000)
    return () => clearInterval(iv)
  }, [user])

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

  const handleMarkReceived = async (id: number) => {
    const r = await api.orders.markReceived(id)
    if (r.error) { toast.error(r.error); return }
    toast.success('Отмечено как полученное'); load()
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
    if (!payAgreed) { toast.error('Необходимо подтвердить согласие с договором оферты'); return }
    if (!payDateTime) { toast.error('Укажите дату и время платежа'); return }
    const actualAmount = payAmount ? parseFloat(payAmount) : selectedPayTotal
    if (isNaN(actualAmount) || actualAmount <= 0) { toast.error('Укажите корректную сумму'); return }
    setPaying(true)
    const r = await api.orders.pay({ order_ids: Array.from(paySelected), payment_amount: actualAmount, payment_note: payNote, payment_date: payDateTime } as Parameters<typeof api.orders.pay>[0])
    setPaying(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Отметка отправлена модератору')
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setPaySelected(new Set()); setPayNote(''); setPayAmount(''); setPayDateTime(now.toISOString().slice(0, 16)); setPayAgreed(false); load()
  }

  const toggleDeliveryOrder = (id: number) => {
    setDeliverySelected(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n })
  }
  const toggleDeliveryAll = () => {
    setDeliverySelected(s => s.size === waitingOrders.length ? new Set() : new Set(waitingOrders.map(o => o.id)))
  }
  const handleSaveDelivery = async () => {
    if (!selectedDeliveryOption) { toast.error('Выберите вариант доставки'); return }
    setDeliverySaving(true)
    const r = await api.orders.setDelivery({ order_ids: Array.from(deliverySelected), delivery_option_id: selectedDeliveryOption, delivery_comment: deliveryComment })
    setDeliverySaving(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Способ получения сохранён')
    setDeliverySelected(new Set()); setDeliveryComment(''); load()
  }

  const handleDebtRequest = async () => {
    if (!debtRequestId) return
    setDebtSaving(true)
    const r = await api.orders.debtRequest({ debt_id: debtRequestId, request_type: debtRequestType, card: debtCard })
    setDebtSaving(false)
    if (r.error) { toast.error(r.error); return }
    toast.success('Запрос отправлен')
    setDebtRequestId(null); setDebtCard(''); load()
  }

  // Группировка заказов
  const newOrders        = orders.filter(o => ['accepted', 'fixed'].includes(o.status) && !o.is_archived)
  const awaitingPayment  = orders.filter(o => o.status === 'awaiting_payment' && !o.is_archived)
  const waitingOrders    = orders.filter(o => o.status === 'waiting' && !o.is_archived)
  const deliveryOrders   = orders.filter(o => o.status === 'delivery' && !o.client_received)
  const receivedOrders   = orders.filter(o => o.client_received)
  const transitOrders    = waitingOrders
  const paymentTotal     = awaitingPayment.reduce((s, o) => s + o.total_price, 0)
  const selectedPayTotal = awaitingPayment.filter(o => paySelected.has(o.id)).reduce((s, o) => s + o.total_price, 0)
  const activeDebts      = debts.filter(d => !d.resolved)
  const resolvedDebts    = debts.filter(d => d.resolved)
  const weOweTotal       = activeDebts.filter(d => d.type === 'we_owe').reduce((s, d) => s + d.amount, 0)
  const clientOwesTotal  = activeDebts.filter(d => d.type === 'client_owes').reduce((s, d) => s + d.amount, 0)

  if (!user) return null

  const orderTabs: { id: OrderTab; label: string; badge?: number }[] = [
    { id: 'new',      label: 'Новые',              badge: newOrders.length || undefined },
    { id: 'payment',  label: 'К оплате',            badge: awaitingPayment.length || undefined },
    { id: 'transit',  label: 'В пути',              badge: transitOrders.length || undefined },
    { id: 'ready',    label: 'Готов к получению',   badge: deliveryOrders.length || undefined },
    { id: 'received', label: 'Архив' },
  ]

  return (
    <div className="min-h-screen bg-choco-950 text-white">
      <header className="border-b border-gold-500/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-choco-950/90 backdrop-blur-sm z-10">
        <Link to="/" className="font-serif text-gold-400 font-semibold text-xl tracking-wide hover:text-gold-300 transition-colors">Распивошная</Link>
        <div className="flex items-center gap-3">
          <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors hidden sm:block">Каталог</Link>
          {(user.role === 'admin' || user.role === 'moderator') && (
            <Link to="/admin"><Button variant="outline" size="sm" className="border-gold-500/40 text-gold-400 hover:bg-gold-500/10 text-xs">Админ</Button></Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white text-xs">Выйти</Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {/* Профиль */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-lg shrink-0">
            {user.nickname[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">@{user.nickname}</div>
            <div className="text-white/40 text-sm">{user.email}</div>
          </div>
          {user.customer_code && (
            <CustomerIdCard nickname={user.nickname} customerCode={user.customer_code} />
          )}
        </div>

        {/* Telegram-уведомления */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-[#0088cc] shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" />
            </svg>
            <span className="font-medium text-sm">Telegram-уведомления</span>
            {tgLinked === true && (
              <span className="ml-auto text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Подключён</span>
            )}
            {tgLinked === false && (
              <span className="ml-auto text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Не подключён</span>
            )}
          </div>

          {tgLinked === true ? (
            <div className="space-y-2">
              <p className="text-white/50 text-sm">Бот будет присылать уведомления о статусах заказов.</p>
              <button onClick={handleUnlinkTg} className="text-xs text-red-400/70 hover:text-red-400 transition-colors underline">
                Отключить
              </button>
            </div>
          ) : tgLinked === false ? (
            <div className="space-y-3">
              <p className="text-white/50 text-sm">Подключи бота, чтобы получать уведомления о статусах заказов.</p>
              {!tgCode ? (
                <Button
                  size="sm"
                  onClick={handleGenerateTgCode}
                  disabled={tgCodeLoading}
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs"
                >
                  {tgCodeLoading ? 'Генерируем...' : 'Подключить Telegram'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm">Открой бота и отправь ему этот код:</p>
                  <div className="flex items-center gap-3">
                    <div className="bg-choco-950 border border-white/20 rounded-xl px-5 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-gold-400 select-all">
                      {tgCode}
                    </div>
                    <a
                      href={`https://t.me/raspivoshnaya_bot?start=${tgCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      Открыть бота
                    </a>
                  </div>
                  <p className="text-white/30 text-xs">Код действителен 10 минут. После привязки обнови страницу.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Баннеры */}
        {awaitingPayment.length > 0 && mainTab !== 'orders' && (
          <div className="mb-4 bg-gold-500/10 border border-gold-500/40 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gold-500/15 transition-colors"
            onClick={() => { setMainTab('orders'); setOrderTab('payment') }}>
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shrink-0" />
            <span className="text-gold-300 text-sm font-medium">Ожидает оплаты: {awaitingPayment.length} заказ(а) на {paymentTotal.toFixed(0)} ₽</span>
            <Icon name="ChevronRight" size={14} className="text-gold-400 ml-auto shrink-0" />
          </div>
        )}
        {weOweTotal > 0 && mainTab !== 'debts' && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-500/15 transition-colors"
            onClick={() => setMainTab('debts')}>
            <Icon name="Info" size={14} className="text-blue-400 shrink-0" />
            <span className="text-blue-300 text-sm font-medium">Вам должны: {weOweTotal.toFixed(0)} ₽</span>
            <Icon name="ChevronRight" size={14} className="text-blue-400 ml-auto shrink-0" />
          </div>
        )}

        {/* ═══ ГЛАВНЫЕ ВКЛАДКИ ═══ */}
        <div className="flex border-b border-white/10 mb-6 gap-1">
          {([
            { id: 'orders' as MainTab, label: 'Заказы', badge: (newOrders.length + awaitingPayment.length + waitingOrders.length + deliveryOrders.length) || undefined },
            { id: 'debts' as MainTab, label: 'Долги', badge: activeDebts.length || undefined },
            { id: 'messages' as MainTab, label: 'Сообщения', badge: mainTab === 'messages' ? undefined : (unreadCount || undefined) },
          ]).map(t => (
            <button key={t.id} onClick={() => { setMainTab(t.id); if (t.id === 'messages') setUnreadCount(0) }}
              className={`relative px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                mainTab === t.id ? 'border-gold-500 text-white' : 'border-transparent text-white/40 hover:text-white'
              }`}>
              {t.label}
              {t.badge ? (
                <span className="ml-2 text-xs bg-gold-500/20 text-gold-300 rounded-full px-1.5 py-0.5">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            {/* ══════════ ВКЛАДКА ЗАКАЗЫ ══════════ */}
            {mainTab === 'orders' && (
              <div>
                {/* Подвкладки заказов */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 flex-wrap">
                  {orderTabs.map(t => (
                    <button key={t.id} onClick={() => setOrderTab(t.id)}
                      className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        orderTab === t.id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                      }`}>
                      {t.label}
                      {t.badge ? <span className={`text-xs rounded-full px-1.5 py-0.5 ${orderTab === t.id ? 'bg-gold-500/30 text-gold-200' : 'bg-white/10 text-white/60'}`}>{t.badge}</span> : null}
                    </button>
                  ))}
                </div>

                {/* — Новые — */}
                {orderTab === 'new' && (
                  <div className="space-y-3">
                    {newOrders.length === 0 ? (
                      <Empty text="Нет активных заказов" />
                    ) : newOrders.map(o => (
                      <OrderCard key={o.id} order={o}>
                        <button onClick={() => handleDelete(o.id)}
                          className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1">
                          <Icon name="Trash2" size={12} /> Отменить
                        </button>
                      </OrderCard>
                    ))}
                  </div>
                )}

                {/* — К оплате — */}
                {orderTab === 'payment' && (
                  <div>
                    {awaitingPayment.length === 0 ? <Empty text="Нет заказов к оплате" /> : (
                      <>
                        <div className="text-white/50 text-xs mb-3">Чтобы произвести оплату, отметьте нужные позиции</div>
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={togglePayAll} className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              paySelected.size > 0 ? 'bg-gold-500 border-gold-500' : 'border-white/20'
                            }`}>
                              {paySelected.size > 0 && <Icon name="Check" size={10} className="text-white" />}
                            </div>
                            Выбрать все
                          </button>
                          {paySelected.size > 0 && (
                            <span className="text-sm text-gold-300 font-medium">{selectedPayTotal.toFixed(0)} ₽</span>
                          )}
                        </div>
                        <div className="space-y-3 mb-4">
                          {awaitingPayment.map(o => (
                            <div key={o.id} onClick={() => togglePayOrder(o.id)}
                              className={`cursor-pointer rounded-xl border transition-all ${
                                paySelected.has(o.id) ? 'border-gold-500/50 bg-gold-500/5' : 'border-white/8 hover:border-white/15'
                              }`}>
                              <div className="p-4 flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  paySelected.has(o.id) ? 'bg-gold-500 border-gold-500' : 'border-white/20'
                                }`}>
                                  {paySelected.has(o.id) && <Icon name="Check" size={12} className="text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{o.brand} — {o.product_name}</div>
                                  <div className="text-white/50 text-xs mt-0.5">{o.volume_ml} мл · {o.atomizer_name}</div>
                                  {o.payment_amount ? (
                                    <div className="text-yellow-400/80 text-xs mt-1 flex items-center gap-1">
                                      <Icon name="Clock" size={11} /> Ожидает подтверждения ({o.payment_amount.toFixed(0)} ₽)
                                    </div>
                                  ) : null}
                                </div>
                                <div className="text-white font-semibold text-sm shrink-0">{o.total_price.toFixed(0)} ₽</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {paySelected.size > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/50">Итого к оплате:</span>
                              <span className="font-bold text-gold-300">{selectedPayTotal.toFixed(0)} ₽</span>
                            </div>
                            {paymentDetails && (
                              <div className="bg-gold-500/8 border border-gold-500/20 rounded-lg px-3 py-2">
                                <div className="text-white/40 text-xs mb-1">Реквизиты для оплаты:</div>
                                <div className="text-white/90 text-sm whitespace-pre-wrap">{paymentDetails}</div>
                              </div>
                            )}
                            <div className="text-sm font-medium pt-1">Отметить оплату</div>
                            <div>
                              <label className="text-white/40 text-xs mb-1 block">Дата и время платежа *</label>
                              <input type="datetime-local" value={payDateTime} onChange={e => setPayDateTime(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm [color-scheme:dark]" />
                            </div>
                            <div>
                              <label className="text-white/40 text-xs mb-1 block">
                                Сумма перевода (если отличается от {selectedPayTotal.toFixed(0)} ₽)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={payAmount}
                                onChange={e => setPayAmount(e.target.value)}
                                placeholder={`${selectedPayTotal.toFixed(0)} ₽ (по умолчанию)`}
                                className="bg-white/5 border-white/10 text-white placeholder-white/30 text-sm"
                              />
                              {payAmount && parseFloat(payAmount) !== selectedPayTotal && (
                                <div className="text-xs mt-1 text-gold-300/70">
                                  Разница: {(parseFloat(payAmount) - selectedPayTotal).toFixed(2)} ₽ — модератор учтёт при проверке
                                </div>
                              )}
                            </div>
                            <Input value={payNote} onChange={e => setPayNote(e.target.value)}
                              placeholder="Комментарий к платежу (необязательно)"
                              className="bg-white/5 border-white/10 text-white placeholder-white/30 text-sm" />
                            <label className="flex items-start gap-3 cursor-pointer group">
                              <div className="relative shrink-0 mt-0.5">
                                <input type="checkbox" checked={payAgreed} onChange={e => setPayAgreed(e.target.checked)} className="sr-only" />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  payAgreed ? 'bg-gold-500 border-gold-500' : 'border-white/30 bg-white/5 group-hover:border-white/50'
                                }`}>
                                  {payAgreed && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                              </div>
                              <span className="text-white/50 text-xs leading-snug select-none">
                                Я согласен с условиями{' '}
                                <Link to="/offer" target="_blank" onClick={e => e.stopPropagation()} className="text-gold-400 hover:text-gold-300 transition-colors underline underline-offset-2">
                                  Договора оферты
                                </Link>
                                {' '}и подтверждаю заказ на индивидуальный розлив парфюмерии в транспортировочную тару.
                              </span>
                            </label>
                            <Button onClick={handlePay} disabled={paying || !payAgreed}
                              className="w-full bg-gold-500 hover:bg-gold-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                              {paying ? 'Отправка...' : `Отметить оплату ${payAmount ? parseFloat(payAmount).toFixed(0) : selectedPayTotal.toFixed(0)} ₽`}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* — В пути — */}
                {orderTab === 'transit' && (
                  <div>
                    {waitingOrders.length === 0 ? <Empty text="Нет заказов в пути" /> : (
                      <div className="space-y-4">

                        {/* ── Ожидаются ── */}
                        {waitingOrders.length > 0 && (
                          <>
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Ожидаются</div>

                            {/* Список заказов с галочками */}
                            <div className="flex items-center justify-between mb-2">
                              <button onClick={toggleDeliveryAll} className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  deliverySelected.size === waitingOrders.length && waitingOrders.length > 0 ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                                }`}>
                                  {deliverySelected.size === waitingOrders.length && waitingOrders.length > 0 && <Icon name="Check" size={10} className="text-white" />}
                                </div>
                                Выбрать все
                              </button>
                            </div>

                            <div className="space-y-2">
                              {waitingOrders.map(o => (
                                <div key={o.id} onClick={() => toggleDeliveryOrder(o.id)}
                                  className={`cursor-pointer rounded-xl border transition-all ${
                                    deliverySelected.has(o.id) ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/8 hover:border-white/15'
                                  }`}>
                                  <div className="p-4 flex items-start gap-3">
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                      deliverySelected.has(o.id) ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                                    }`}>
                                      {deliverySelected.has(o.id) && <Icon name="Check" size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{o.brand} — {o.product_name}</div>
                                      <div className="text-white/50 text-xs mt-0.5">{o.volume_ml} мл · {o.atomizer_name}</div>
                                      {o.delivery_option_name && (
                                        <div className="text-purple-300/70 text-xs mt-1 flex items-center gap-1">
                                          <Icon name="MapPin" size={11} /> {o.delivery_option_name}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-white font-semibold text-sm shrink-0">{o.total_price.toFixed(0)} ₽</div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Блок выбора доставки — виден всегда */}
                            <div className={`rounded-xl border p-4 space-y-3 transition-all ${
                              deliverySelected.size > 0 ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/8 bg-white/3'
                            }`}>
                              <div className="text-sm font-medium text-white/80">Способ получения</div>

                              {/* Варианты */}
                              <div className="space-y-2">
                                {deliveryOptions.map(opt => {
                                  const isSelected = selectedDeliveryOption === opt.id
                                  return (
                                    <div key={opt.id}>
                                      <button onClick={() => setSelectedDeliveryOption(isSelected ? null : opt.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${
                                          isSelected ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/8 hover:border-white/20 bg-white/3'
                                        }`}>
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                          isSelected ? 'border-purple-400' : 'border-white/30'
                                        }`}>
                                          {isSelected && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                                        </div>
                                        <span className="text-sm text-white">{opt.name}</span>
                                      </button>
                                      {/* Карточка с деталями — появляется при выборе */}
                                      {isSelected && (opt.address || opt.schedule) && (
                                        <div className="mt-1.5 mx-1 px-3 py-2 bg-purple-500/6 border border-purple-500/15 rounded-lg space-y-1">
                                          {opt.address && (
                                            <div className="text-xs text-white/55 flex items-start gap-1.5">
                                              <Icon name="MapPin" size={11} className="shrink-0 mt-0.5 text-purple-400/60" />
                                              {opt.address}
                                            </div>
                                          )}
                                          {opt.schedule && (
                                            <div className="text-xs text-white/40 flex items-center gap-1.5">
                                              <Icon name="Clock" size={11} className="shrink-0 text-purple-400/50" />
                                              {opt.schedule}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              <Input value={deliveryComment} onChange={e => setDeliveryComment(e.target.value)}
                                placeholder="Комментарий (необязательно)"
                                className="bg-white/5 border-white/10 text-white placeholder-white/30 text-sm" />

                              <Button
                                onClick={handleSaveDelivery}
                                disabled={deliverySaving || !selectedDeliveryOption || deliverySelected.size === 0}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-40">
                                {deliverySaving ? 'Сохранение...' : deliverySelected.size === 0
                                  ? 'Выберите заказы выше'
                                  : `Сохранить для ${deliverySelected.size} заказ${deliverySelected.size > 1 ? 'ов' : 'а'}`}
                              </Button>
                            </div>
                          </>
                        )}


                      </div>
                    )}
                  </div>
                )}

                {/* — Готов к получению — */}
                {orderTab === 'ready' && (
                  <div className="space-y-3">
                    {deliveryOrders.length === 0 ? <Empty text="Нет заказов готовых к получению" /> : (
                      deliveryOrders.map(o => (
                        <OrderCard key={o.id} order={o}>
                          <button onClick={() => handleMarkReceived(o.id)}
                            className="mt-1 w-full flex items-center justify-center gap-2 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 hover:border-green-500/50 text-green-400 text-xs font-medium px-3 py-2 rounded-lg transition-all">
                            <Icon name="PackageCheck" size={14} /> Нажмите, когда заберёте заказ
                          </button>
                        </OrderCard>
                      ))
                    )}
                  </div>
                )}

                {/* — Полученные — */}
                {orderTab === 'received' && (
                  <div className="space-y-3">
                    {receivedOrders.length === 0 ? <Empty text="Нет полученных заказов" icon="CheckCircle" /> : (
                      receivedOrders.map(o => (
                        <OrderCard key={o.id} order={o} />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ ВКЛАДКА ДОЛГИ ══════════ */}
            {mainTab === 'debts' && (
              <div className="space-y-4">
                {activeDebts.length === 0 && resolvedDebts.length === 0 ? (
                  <Empty text="Долгов нет" icon="CheckCircle" />
                ) : (
                  <>
                    {clientOwesTotal > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm">
                        <span className="text-red-300 font-medium">Ваш долг: {clientOwesTotal.toFixed(0)} ₽</span>
                      </div>
                    )}
                    {weOweTotal > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm">
                        <span className="text-blue-300 font-medium">Вам должны: {weOweTotal.toFixed(0)} ₽</span>
                      </div>
                    )}
                    {activeDebts.map(d => (
                      <div key={d.id} className="bg-white/3 border border-white/8 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.type === 'we_owe' ? 'bg-blue-500/15 text-blue-300' : 'bg-red-500/15 text-red-300'}`}>
                              {d.type === 'we_owe' ? 'Вам должны' : 'Ваш долг'}
                            </span>
                          </div>
                          <span className="text-white font-semibold text-sm">{d.amount.toFixed(0)} ₽</span>
                        </div>
                        <div className="text-white/60 text-xs mb-2">{d.reason}</div>
                        {d.type === 'we_owe' && !d.client_request && (
                          debtRequestId === d.id ? (
                            <div className="space-y-2 pt-2 border-t border-white/8">
                              <div className="flex gap-2">
                                <button onClick={() => setDebtRequestType('credit')}
                                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${debtRequestType === 'credit' ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' : 'border-white/10 text-white/40'}`}>
                                  Зачесть в счёт заказов
                                </button>
                                <button onClick={() => setDebtRequestType('refund')}
                                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${debtRequestType === 'refund' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-white/10 text-white/40'}`}>
                                  Вернуть на карту
                                </button>
                              </div>
                              {debtRequestType === 'refund' && (
                                <Input value={debtCard} onChange={e => setDebtCard(e.target.value)}
                                  placeholder="Номер карты или реквизиты"
                                  className="bg-white/5 border-white/10 text-white placeholder-white/30 text-xs" />
                              )}
                              <div className="flex gap-2">
                                <Button onClick={handleDebtRequest} disabled={debtSaving} size="sm"
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                  {debtSaving ? '...' : 'Отправить'}
                                </Button>
                                <Button onClick={() => setDebtRequestId(null)} variant="ghost" size="sm"
                                  className="text-white/40 text-xs">Отмена</Button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setDebtRequestId(d.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1">
                              Запросить возврат / зачёт →
                            </button>
                          )
                        )}
                        {d.client_request && !d.resolved && (
                          <div className="text-xs text-white/40 mt-1">
                            Запрос отправлен: {d.client_request === 'refund' ? 'возврат на карту' : 'зачёт'}
                          </div>
                        )}
                        {d.resolved && d.resolve_note && (
                          <div className="text-xs text-green-400/70 mt-1">✓ {d.resolve_note}</div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ══════════ ВКЛАДКА СООБЩЕНИЯ ══════════ */}
            {mainTab === 'messages' && (
              <MessagesChat onUnreadChange={setUnreadCount} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order: o, children }: { order: Order; children?: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 hover:border-white/15 rounded-xl p-4 transition-all">
      <div className="flex items-start gap-3">
        {o.image_url ? (
          <img src={o.image_url} alt={o.product_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-lg">🌸</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{o.brand} — {o.product_name}</div>
              <div className="text-white/50 text-xs mt-0.5">{o.volume_ml} мл · {o.atomizer_name}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold text-sm">{o.total_price.toFixed(0)} ₽</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || 'bg-white/10 text-white/50'}`}>
                {STATUS_LABEL[o.status] || o.status}
              </span>
              {o.status === 'delivery' && o.pickup_batch && (
                <div className="text-gold-400 text-xs font-semibold mt-1">Выкуп №{o.pickup_batch}</div>
              )}
            </div>
          </div>
          {o.delivery_option_name && (
            <div className="mt-1.5 text-xs text-white/40 flex items-center gap-1">
              <Icon name="MapPin" size={11} />
              {o.delivery_option_name}
              {o.delivery_comment && <span className="ml-1 text-white/30">· {o.delivery_comment}</span>}
            </div>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </div>
  )
}

function Empty({ text, icon = 'Package' }: { text: string; icon?: string }) {
  return (
    <div className="text-center py-12 text-white/30">
      <Icon name={icon} size={32} className="mx-auto mb-3 opacity-40" />
      <div className="text-sm">{text}</div>
    </div>
  )
}