import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  brand: string
  price_per_ml: number
  stock_ml: number
  booked_ml: number
  available_ml: number
  is_active: boolean
}

interface Movement {
  id: number
  product_id: number
  product_name: string
  brand: string
  type: string
  amount_ml: number
  document_number: string | null
  order_id: number | null
  comment: string | null
  created_at: string
  created_by: string | null
}

const TYPE_LABELS: Record<string, string> = {
  income: 'Приход',
  writeoff: 'Списание',
  order_writeoff: 'Отгрузка',
}
const TYPE_COLORS: Record<string, string> = {
  income: 'bg-green-500/20 text-green-300',
  writeoff: 'bg-red-500/20 text-red-300',
  order_writeoff: 'bg-purple-500/20 text-purple-300',
}

interface DocItem {
  product_id: number
  product_name: string
  brand: string
  amount_ml: string
}

export default function WarehouseTab() {
  const [subTab, setSubTab] = useState<'stocks' | 'movements' | 'income' | 'writeoff'>('stocks')

  // Остатки
  const [products, setProducts] = useState<Product[]>([])
  const [stocksLoading, setStocksLoading] = useState(false)
  const [stockSearch, setStockSearch] = useState('')

  // Движения
  const [movements, setMovements] = useState<Movement[]>([])
  const [movLoading, setMovLoading] = useState(false)
  const [movType, setMovType] = useState('')
  const [movDateFrom, setMovDateFrom] = useState('')
  const [movDateTo, setMovDateTo] = useState('')

  // Приход/Списание форма
  const [docNumber, setDocNumber] = useState('')
  const [docComment, setDocComment] = useState('')
  const [docItems, setDocItems] = useState<DocItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Экспорт
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const loadStocks = useCallback(async () => {
    setStocksLoading(true)
    const res = await api.warehouse.list(stockSearch)
    setStocksLoading(false)
    if (res.error) { toast.error(res.error); return }
    setProducts(res.products || [])
  }, [stockSearch])

  const loadMovements = useCallback(async () => {
    setMovLoading(true)
    const res = await api.warehouse.movements({ type: movType, date_from: movDateFrom, date_to: movDateTo })
    setMovLoading(false)
    if (res.error) { toast.error(res.error); return }
    setMovements(res.movements || [])
  }, [movType, movDateFrom, movDateTo])

  useEffect(() => {
    if (subTab === 'stocks') loadStocks()
    if (subTab === 'movements') loadMovements()
  }, [subTab, loadStocks, loadMovements])

  // поиск товаров для документа
  useEffect(() => {
    if (!productSearch.trim()) { setProductSuggestions([]); return }
    api.warehouse.list(productSearch).then(res => {
      if (!res.error) setProductSuggestions((res.products || []).slice(0, 8))
    })
  }, [productSearch])

  const addProductToDoc = (p: Product) => {
    if (docItems.find(i => i.product_id === p.id)) { toast.error('Товар уже добавлен'); return }
    setDocItems(prev => [...prev, { product_id: p.id, product_name: p.name, brand: p.brand, amount_ml: '' }])
    setProductSearch('')
    setProductSuggestions([])
  }

  const removeDocItem = (id: number) => setDocItems(prev => prev.filter(i => i.product_id !== id))
  const updateDocItemAmount = (id: number, val: string) => setDocItems(prev => prev.map(i => i.product_id === id ? { ...i, amount_ml: val } : i))

  const handleSubmitDoc = async () => {
    if (docItems.length === 0) { toast.error('Добавьте хотя бы один товар'); return }
    const items = docItems.map(i => ({ product_id: i.product_id, amount_ml: parseFloat(i.amount_ml) }))
    if (items.some(i => isNaN(i.amount_ml) || i.amount_ml <= 0)) { toast.error('Укажите корректное количество мл для всех товаров'); return }
    setSubmitting(true)
    const data = { document_number: docNumber, comment: docComment, items }
    const res = subTab === 'income' ? await api.warehouse.income(data) : await api.warehouse.writeoff(data)
    setSubmitting(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(subTab === 'income' ? `Приход оформлен (${items.length} поз.)` : `Списание оформлено (${items.length} поз.)`)
    setDocNumber(''); setDocComment(''); setDocItems([])
    setSubTab('movements')
  }

  const handleExport = async () => {
    setExporting(true)
    const res = await api.warehouse.export(exportFrom || undefined, exportTo || undefined)
    setExporting(false)
    if (res.error) { toast.error(res.error); return }
    const bytes = Uint8Array.from(atob(res.xlsx_base64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = res.filename || 'warehouse.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (s: string) => {
    if (!s) return ''
    const d = new Date(s)
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit flex-wrap">
        {(['stocks', 'movements', 'income', 'writeoff'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${subTab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
            {t === 'stocks' && 'Остатки'}
            {t === 'movements' && 'Движение'}
            {t === 'income' && '+ Приход'}
            {t === 'writeoff' && '− Списание'}
          </button>
        ))}
      </div>

      {/* Остатки */}
      {subTab === 'stocks' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center flex-wrap">
            <input
              value={stockSearch} onChange={e => setStockSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50 w-52"
            />
            <Button size="sm" onClick={loadStocks} disabled={stocksLoading} className="bg-white/10 hover:bg-white/15 text-white border border-white/10">
              {stocksLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="RefreshCw" size={14} />}
            </Button>
          </div>
          {stocksLoading ? (
            <div className="py-12 text-center text-white/30"><Icon name="Loader2" size={24} className="animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs">
                    <th className="text-left pb-2 pr-4">Товар</th>
                    <th className="text-right pb-2 pr-4">На складе</th>
                    <th className="text-right pb-2 pr-4">Забронировано</th>
                    <th className="text-right pb-2">Свободно</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/3">
                      <td className="py-2 pr-4">
                        <div className="font-medium text-white">{p.brand}</div>
                        <div className="text-white/50 text-xs">{p.name}</div>
                      </td>
                      <td className="text-right pr-4">
                        <span className={`font-mono font-medium ${p.stock_ml > 0 ? 'text-green-400' : 'text-white/30'}`}>
                          {p.stock_ml.toFixed(1)} мл
                        </span>
                      </td>
                      <td className="text-right pr-4 text-gold-300 font-mono">{p.booked_ml.toFixed(1)} мл</td>
                      <td className="text-right">
                        <span className={`font-mono font-medium ${p.available_ml > 0 ? 'text-white' : 'text-red-400'}`}>
                          {p.available_ml.toFixed(1)} мл
                        </span>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-white/30 text-sm">Ничего не найдено</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Движение */}
      {subTab === 'movements' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap items-end">
            <div>
              <div className="text-white/40 text-xs mb-1">Тип</div>
              <select value={movType} onChange={e => setMovType(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50">
                <option value="">Все</option>
                <option value="income">Приход</option>
                <option value="writeoff">Списание</option>
                <option value="order_writeoff">Отгрузка</option>
              </select>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">С даты</div>
              <input type="date" value={movDateFrom} onChange={e => setMovDateFrom(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50" />
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">По дату</div>
              <input type="date" value={movDateTo} onChange={e => setMovDateTo(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50" />
            </div>
            <Button size="sm" onClick={loadMovements} disabled={movLoading} className="bg-white/10 hover:bg-white/15 text-white border border-white/10">
              {movLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Обновить'}
            </Button>

            {/* Экспорт */}
            <div className="ml-auto flex gap-2 items-end flex-wrap">
              <div>
                <div className="text-white/40 text-xs mb-1">Экспорт с</div>
                <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">по</div>
                <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gold-500/50" />
              </div>
              <Button size="sm" onClick={handleExport} disabled={exporting}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/20">
                {exporting ? <Icon name="Loader2" size={14} className="animate-spin mr-1" /> : <Icon name="Download" size={14} className="mr-1" />}
                Скачать Excel
              </Button>
            </div>
          </div>

          {movLoading ? (
            <div className="py-12 text-center text-white/30"><Icon name="Loader2" size={24} className="animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs">
                    <th className="text-left pb-2 pr-3">Дата</th>
                    <th className="text-left pb-2 pr-3">Тип</th>
                    <th className="text-left pb-2 pr-3">Товар</th>
                    <th className="text-right pb-2 pr-3">Кол-во</th>
                    <th className="text-left pb-2 pr-3">Документ</th>
                    <th className="text-left pb-2">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/3">
                      <td className="py-2 pr-3 text-white/50 whitespace-nowrap text-xs">{formatDate(m.created_at)}</td>
                      <td className="pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type] || 'bg-white/10 text-white/60'}`}>
                          {TYPE_LABELS[m.type] || m.type}
                        </span>
                      </td>
                      <td className="pr-3">
                        <div className="text-white font-medium text-xs">{m.brand}</div>
                        <div className="text-white/40 text-xs">{m.product_name}</div>
                      </td>
                      <td className="text-right pr-3 font-mono font-medium text-white">{m.amount_ml.toFixed(1)} мл</td>
                      <td className="pr-3 text-white/50 text-xs">
                        {m.document_number || (m.order_id ? `Заказ #${m.order_id}` : '—')}
                      </td>
                      <td className="text-white/40 text-xs">{m.comment || '—'}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-white/30">Движений нет</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Форма Приход / Списание */}
      {(subTab === 'income' || subTab === 'writeoff') && (
        <div className="max-w-2xl space-y-4">
          <div className={`text-sm font-medium px-3 py-1.5 rounded-lg w-fit ${subTab === 'income' ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
            {subTab === 'income' ? '+ Оформление прихода' : '− Списание по акту'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-white/40 text-xs mb-1">{subTab === 'income' ? '№ документа прихода' : '№ акта списания'}</div>
              <input value={docNumber} onChange={e => setDocNumber(e.target.value)}
                placeholder="Например: ПН-2024-001"
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50" />
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Комментарий</div>
              <input value={docComment} onChange={e => setDocComment(e.target.value)}
                placeholder="Необязательно"
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50" />
            </div>
          </div>

          {/* Поиск товара */}
          <div>
            <div className="text-white/40 text-xs mb-1">Добавить товар</div>
            <div className="relative">
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Начните вводить название..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50" />
              {productSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-10">
                  {productSuggestions.map(p => (
                    <button key={p.id} onClick={() => addProductToDoc(p)}
                      className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm border-b border-white/5 last:border-0">
                      <span className="text-white">{p.brand} — {p.name}</span>
                      <span className="text-white/30 text-xs ml-2">склад: {p.stock_ml.toFixed(1)} мл</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Позиции документа */}
          {docItems.length > 0 && (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs">
                    <th className="text-left px-3 py-2">Товар</th>
                    <th className="text-right px-3 py-2 w-32">Количество (мл)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {docItems.map(item => (
                    <tr key={item.product_id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2">
                        <div className="text-white text-xs font-medium">{item.brand}</div>
                        <div className="text-white/40 text-xs">{item.product_name}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="0" step="0.1"
                          value={item.amount_ml}
                          onChange={e => updateDocItemAmount(item.product_id, e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1 text-sm outline-none focus:border-gold-500/50 text-right"
                        />
                      </td>
                      <td className="px-2">
                        <button onClick={() => removeDocItem(item.product_id)}
                          className="text-white/20 hover:text-red-400 transition-colors">
                          <Icon name="X" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button onClick={handleSubmitDoc} disabled={submitting || docItems.length === 0}
            className={`${subTab === 'income' ? 'bg-green-600/80 hover:bg-green-600 text-white' : 'bg-red-600/70 hover:bg-red-600 text-white'}`}>
            {submitting
              ? <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Сохраняю...</>
              : subTab === 'income'
                ? `Оформить приход (${docItems.length} поз.)`
                : `Списать (${docItems.length} поз.)`}
          </Button>
        </div>
      )}
    </div>
  )
}