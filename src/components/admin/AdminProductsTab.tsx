import { useRef } from 'react'
import * as XLSX from 'xlsx'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'

type AdminProduct = { id: number; name: string; brand: string; price_per_ml: number; bottle_ml: number; booked_ml: number; is_active: boolean; image_url: string | null; description: string | null; active_booked: number; concentration: string; category: string; supplier_id: string }

interface AdminProductsTabProps {
  products: AdminProduct[]
  productsLoading: boolean
  prodFilterName: string
  setProdFilterName: (v: string) => void
  prodFilterBrand: string
  setProdFilterBrand: (v: string) => void
  prodFilterMinBooked: string
  setProdFilterMinBooked: (v: string) => void
  prodFilterCategory: string
  setProdFilterCategory: (v: string) => void
  prodSort: string
  prodSortDir: 'asc' | 'desc'
  editingCell: { id: number; field: string } | null
  setEditingCell: (v: { id: number; field: string } | null) => void
  editValue: string
  setEditValue: (v: string) => void
  savingCell: boolean
  importing: boolean
  setImporting: (v: boolean) => void
  setProducts: React.Dispatch<React.SetStateAction<AdminProduct[]>>
  onLoadProducts: () => void
  onToggleProdSort: (col: string) => void
  onSaveCell: (id: number, field: string) => void
  onStartEdit: (id: number, field: string, value: string) => void
}

export default function AdminProductsTab({
  products, productsLoading,
  prodFilterName, setProdFilterName,
  prodFilterBrand, setProdFilterBrand,
  prodFilterMinBooked, setProdFilterMinBooked,
  prodFilterCategory, setProdFilterCategory,
  prodSort, prodSortDir,
  editingCell, setEditingCell, editValue, setEditValue, savingCell,
  importing, setImporting, setProducts,
  onLoadProducts, onToggleProdSort, onSaveCell, onStartEdit,
}: AdminProductsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        supplier_id: r['supplier_id'] || r['id_price'] || r['артикул'] || r['Артикул'] || undefined,
        name: r['name'] || r['название'] || r['Название'] || '',
        brand: r['brand'] || r['бренд'] || r['Бренд'] || '',
        price_per_ml: r['price_per_ml'] || r['цена_мл'] || r['цена'] || r['Цена'] || 0,
        bottle_ml: r['bottle_ml'] || r['флакон_мл'] || r['флакон'] || r['Флакон'] || 0,
        description: r['description'] || r['описание'] || r['Описание'] || '',
        image_url: r['image_url'] || r['фото'] || r['Фото'] || null,
        category: r['category'] || r['категория'] || r['Категория'] || r['раздел'] || r['Раздел'] || undefined,
      }))
      const res = await api.admin.importProducts(items)
      setImporting(false)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Создано: ${res.created}, обновлено: ${res.updated}`)
      onLoadProducts()
    } catch {
      setImporting(false)
      toast.error('Ошибка чтения файла')
    }
  }

  return (
    <>
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
        <div className="w-[130px]">
          <label className="text-white/40 text-xs mb-1 block">Раздел</label>
          <select value={prodFilterCategory} onChange={e => setProdFilterCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/15 text-white h-9 text-sm rounded-md px-2 outline-none">
            <option value="">Все</option>
            <option value="decant">Отливанты</option>
            <option value="bottle">Флаконы</option>
          </select>
        </div>
        <Button onClick={onLoadProducts} disabled={productsLoading} className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm px-5">
          {productsLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Найти'}
        </Button>
        <Button variant="ghost" onClick={() => { setProdFilterName(''); setProdFilterBrand(''); setProdFilterMinBooked(''); setProdFilterCategory('') }}
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
        Колонки Excel: <span className="text-white/40">name, brand, price_per_ml, bottle_ml</span> — обязательные. Также: <span className="text-white/40">supplier_id</span> (артикул поставщика — по нему обновляется товар), description, image_url, <span className="text-white/40">category</span> (<span className="text-white/40">decant</span> — отливант, <span className="text-white/40">bottle</span> — флакон).
      </div>

      {/* Таблица товаров */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm min-w-[1060px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              {([
                { key: 'id', label: 'ID', cls: 'text-left w-12' },
                { key: null, label: 'Артикул', cls: 'text-left w-28' },
                { key: 'name', label: 'Название', cls: 'text-left' },
                { key: 'brand', label: 'Бренд', cls: 'text-left w-32' },
                { key: null, label: 'Конц.', cls: 'text-center w-24' },
                { key: null, label: 'Категория', cls: 'text-center w-24' },
                { key: 'price_per_ml', label: '₽/мл', cls: 'text-center w-20' },
                { key: 'bottle_ml', label: 'Флакон', cls: 'text-center w-20' },
                { key: 'booked_ml', label: 'Забронир.', cls: 'text-center w-20' },
                { key: null, label: 'Своб.', cls: 'text-center w-16' },
                { key: null, label: 'Статус', cls: 'text-center w-16' },
              ] as { key: string | null; label: string; cls: string }[]).map(col => (
                <th key={col.label} className={`px-3 py-3 font-medium ${col.cls}`}>
                  {col.key ? (
                    <button onClick={() => onToggleProdSort(col.key!)}
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
              <tr><td colSpan={11} className="py-12 text-center text-white/30">
                <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
              </td></tr>
            )}
            {!productsLoading && products.length === 0 && (
              <tr><td colSpan={11} className="py-12 text-center text-white/20 text-sm">Товары не найдены</td></tr>
            )}
            {!productsLoading && products
              .filter(p => !prodFilterMinBooked || p.booked_ml >= parseInt(prodFilterMinBooked || '0'))
              .filter(p => !prodFilterCategory || p.category === prodFilterCategory)
              .map(p => {
                const free = p.bottle_ml - p.booked_ml
                const fillPct = p.bottle_ml ? Math.round(p.booked_ml / p.bottle_ml * 100) : 0
                const CONC_LABEL: Record<string, string> = { parfum_water: 'Парф. вода', parfum: 'Духи', cologne: 'Одеколон', eau_de_toilette: 'Туал. вода' }
                const CAT_LABEL: Record<string, string> = { decant: 'Отливант', bottle: 'Флакон' }
                return (
                  <tr key={p.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${!p.is_active ? 'opacity-40' : ''}`}>
                    <td className="px-3 py-2.5 text-white/25 text-xs">{p.id}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {editingCell?.id === p.id && editingCell?.field === 'supplier_id' ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onSaveCell(p.id, 'supplier_id'); if (e.key === 'Escape') setEditingCell(null) }}
                            className="w-20 bg-zinc-800 border border-orange-500/50 text-white text-xs rounded px-1 py-0.5 outline-none"
                          />
                          <button onClick={() => onSaveCell(p.id, 'supplier_id')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                            <Icon name="Check" size={13} />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white">
                            <Icon name="X" size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartEdit(p.id, 'supplier_id', p.supplier_id || '')}
                          className="text-white/40 hover:text-orange-300 transition-colors group flex items-center gap-1">
                          <span className={p.supplier_id ? 'text-white/60' : 'text-white/20 italic'}>
                            {p.supplier_id || '—'}
                          </span>
                          <Icon name="Pencil" size={10} className="text-white/15 group-hover:text-orange-400" />
                        </button>
                      )}
                    </td>
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
                        <button onClick={() => onStartEdit(p.id, 'concentration', p.concentration)}
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
                        <button onClick={() => onStartEdit(p.id, 'category', p.category)}
                          className={`text-xs px-2 py-0.5 rounded-full transition-colors group flex items-center gap-1 mx-auto ${p.category === 'bottle' ? 'text-purple-300 hover:text-orange-300' : 'text-blue-300 hover:text-orange-300'}`}>
                          {CAT_LABEL[p.category] || p.category}
                          <Icon name="Pencil" size={10} className="text-white/15 group-hover:text-orange-400" />
                        </button>
                      )}
                    </td>

                    {/* цена */}
                    <td className="px-3 py-2.5 text-center">
                      {editingCell?.id === p.id && editingCell?.field === 'price_per_ml' ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onSaveCell(p.id, 'price_per_ml'); if (e.key === 'Escape') setEditingCell(null) }}
                            className="w-20 bg-white/10 border border-orange-500/50 text-white text-center text-sm rounded px-1.5 py-0.5 outline-none" />
                          <button onClick={() => onSaveCell(p.id, 'price_per_ml')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                            <Icon name="Check" size={13} />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white"><Icon name="X" size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => onStartEdit(p.id, 'price_per_ml', String(p.price_per_ml))}
                          className="text-white/80 hover:text-orange-300 transition-colors group flex items-center gap-1 mx-auto">
                          {p.price_per_ml} ₽
                          <Icon name="Pencil" size={11} className="text-white/20 group-hover:text-orange-400" />
                        </button>
                      )}
                    </td>

                    {/* флакон мл */}
                    <td className="px-3 py-2.5 text-center">
                      {editingCell?.id === p.id && editingCell?.field === 'bottle_ml' ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onSaveCell(p.id, 'bottle_ml'); if (e.key === 'Escape') setEditingCell(null) }}
                            className="w-20 bg-white/10 border border-orange-500/50 text-white text-center text-sm rounded px-1.5 py-0.5 outline-none" />
                          <button onClick={() => onSaveCell(p.id, 'bottle_ml')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                            <Icon name="Check" size={13} />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white"><Icon name="X" size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => onStartEdit(p.id, 'bottle_ml', String(p.bottle_ml))}
                          className="text-white/80 hover:text-orange-300 transition-colors group flex items-center gap-1 mx-auto">
                          {p.bottle_ml}
                          <Icon name="Pencil" size={11} className="text-white/20 group-hover:text-orange-400" />
                        </button>
                      )}
                    </td>

                    {/* забронировано */}
                    <td className="px-3 py-2.5 text-center">
                      {editingCell?.id === p.id && editingCell?.field === 'booked_ml' ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onSaveCell(p.id, 'booked_ml'); if (e.key === 'Escape') setEditingCell(null) }}
                            className="w-20 bg-white/10 border border-orange-500/50 text-white text-center text-sm rounded px-1.5 py-0.5 outline-none" />
                          <button onClick={() => onSaveCell(p.id, 'booked_ml')} disabled={savingCell} className="text-orange-400 hover:text-orange-300">
                            <Icon name="Check" size={13} />
                          </button>
                          <button onClick={() => setEditingCell(null)} className="text-white/30 hover:text-white"><Icon name="X" size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => onStartEdit(p.id, 'booked_ml', String(p.booked_ml))}
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
    </>
  )
}