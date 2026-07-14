import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'

export interface ForumProduct { id: number; name: string; brand: string; image_url: string | null; price_per_ml: number }

export function ForumProductPicker({ selected, onChange }: { selected: ForumProduct[]; onChange: (p: ForumProduct[]) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ForumProduct[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await api.admin.adminProducts({ name: query.trim() })
      setSearching(false)
      const list = Array.isArray(res) ? res : (res?.products ?? [])
      setResults(list.filter((p: ForumProduct) => !selected.find(s => s.id === p.id)).slice(0, 8))
    }, 300)
    return () => clearTimeout(t)
  }, [query, selected])

  const add = (p: ForumProduct) => { onChange([...selected, p]); setQuery(''); setResults([]) }
  const remove = (id: number) => onChange(selected.filter(p => p.id !== id))

  return (
    <div className="space-y-2">
      <label className="text-white/40 text-xs block">Товары в теме (до 10 штук)</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg px-2 py-1">
              {p.image_url && <img src={p.image_url} className="w-6 h-6 rounded object-cover" />}
              <span className="text-white/80 text-xs">{p.brand} {p.name}</span>
              <button onClick={() => remove(p.id)} className="text-white/30 hover:text-red-400 ml-0.5"><Icon name="X" size={12} /></button>
            </div>
          ))}
        </div>
      )}
      {selected.length < 10 && (
        <div className="relative">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск товара по названию..."
            className="bg-white/5 border-white/15 text-white placeholder:text-white/25 h-9 text-sm"
          />
          {(results.length > 0 || searching) && (
            <div className="absolute z-20 top-10 left-0 right-0 bg-zinc-900 border border-white/15 rounded-xl overflow-hidden shadow-xl">
              {searching && <div className="px-3 py-2 text-white/30 text-xs">Ищем...</div>}
              {results.map(p => (
                <button key={p.id} onClick={() => add(p)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/8 transition-colors text-left">
                  {p.image_url && <img src={p.image_url} className="w-8 h-8 rounded object-cover shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{p.brand} · {p.name}</div>
                    <div className="text-white/30 text-xs">{p.price_per_ml} ₽/мл</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}