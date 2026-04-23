import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { ShimmerLink } from '@/components/shimmer-button'
import Icon from '@/components/ui/icon'

interface Product {
  id: number
  name: string
  brand: string
  description: string
  price_per_ml: number
  bottle_ml: number
  booked_ml: number
  available_ml: number
  fill_percent: number
  image_url: string | null
  concentration: string
  category: string
}

const CONC_LABEL: Record<string, string> = {
  parfum_water: 'Парфюмерная вода',
  parfum: 'Духи',
  cologne: 'Одеколон',
  eau_de_toilette: 'Туалетная вода',
}

export default function Catalog() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('')
  const [category, setCategory] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')
  const brandDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setBrandFilter('')
    api.catalog.list(sort, category).then(data => {
      setAllProducts(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [sort, category])

  // Уникальные бренды из загруженных товаров
  const brands = useMemo(() => {
    const set = new Set(allProducts.map(p => p.brand))
    return Array.from(set).sort()
  }, [allProducts])

  // Клиентская фильтрация по бренду
  const products = useMemo(() => {
    if (!brandFilter) return allProducts
    return allProducts.filter(p => p.brand === brandFilter)
  }, [allProducts, brandFilter])

  // Закрываем dropdown по клику вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false)
        setBrandSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredBrands = useMemo(() =>
    brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())),
    [brands, brandSearch]
  )

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const sortOptions = category === 'bottle'
    ? [
        { val: '', label: 'Новые' },
        { val: 'price_asc', label: 'Цена ↑' },
        { val: 'price_desc', label: 'Цена ↓' },
      ]
    : [
        { val: '', label: 'Новые' },
        { val: 'filling', label: 'По заполнению' },
        { val: 'price_asc', label: 'Цена ↑' },
        { val: 'price_desc', label: 'Цена ↓' },
      ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link to="/forum" className="text-white/50 hover:text-white transition-colors">Форум</Link>
          <Link to="/how-it-works" className="text-white/50 hover:text-white transition-colors">Как это работает</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <ShimmerLink to="/admin" shimmerColor="#f97316" shimmerDuration="2.5s" borderRadius="8px"
                  className="px-4 py-2 text-xs font-medium text-orange-300 border-orange-500/40">
                  Админ
                </ShimmerLink>
              )}
              <ShimmerLink to="/cabinet" borderRadius="8px" className="px-4 py-2 text-xs font-medium text-white">
                Личный кабинет
              </ShimmerLink>
              <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs px-2 py-2 transition-colors">
                Выйти
              </button>
            </>
          ) : (
            <>
              <ShimmerLink to="/login" borderRadius="8px" className="px-4 py-2 text-xs font-medium text-white">
                Войти
              </ShimmerLink>
              <ShimmerLink to="/register" shimmerColor="#f97316" shimmerDuration="2s" borderRadius="8px"
                className="px-4 py-2 text-xs font-medium text-orange-300 border-orange-500/40">
                Регистрация
              </ShimmerLink>
            </>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Каталог ароматов</h1>
          <p className="text-white/50 text-sm mt-1">Оригинальный парфюм — от 1 мл</p>
        </div>

        {/* Фильтры — два ряда */}
        <div className="mb-8 space-y-3">
          {/* Ряд 1: категория */}
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs uppercase tracking-wider w-20 shrink-0">Раздел</span>
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {[
                { val: '', label: 'Все' },
                { val: 'decant', label: 'Отливанты' },
                { val: 'bottle', label: 'Флаконы' },
              ].map(opt => (
                <button key={opt.val} onClick={() => setCategory(opt.val)}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                    category === opt.val
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/8'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ряд 2: сортировка + фильтр по бренду */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Сортировка */}
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs uppercase tracking-wider w-20 shrink-0">Сортировка</span>
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                {sortOptions.map(opt => (
                  <button key={opt.val} onClick={() => setSort(opt.val)}
                    className={`text-sm px-4 py-2 rounded-lg transition-all ${
                      sort === opt.val
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-white/40 hover:text-white hover:bg-white/8'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Фильтр по бренду — dropdown */}
            {brands.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs uppercase tracking-wider w-20 shrink-0">Бренд</span>
                <div className="relative" ref={brandDropdownRef}>
                  <button
                    onClick={() => { setBrandDropdownOpen(v => !v); setBrandSearch('') }}
                    className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
                      brandFilter
                        ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                        : 'border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <Icon name="Tag" size={14} />
                    <span>{brandFilter || 'Все бренды'}</span>
                    {brandFilter && (
                      <span
                        onClick={e => { e.stopPropagation(); setBrandFilter(''); setBrandDropdownOpen(false) }}
                        className="ml-1 text-orange-400/60 hover:text-orange-300 cursor-pointer"
                      >
                        <Icon name="X" size={12} />
                      </span>
                    )}
                    <Icon name={brandDropdownOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
                  </button>

                  {brandDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden">
                      <div className="p-2 border-b border-white/10">
                        <input
                          autoFocus
                          value={brandSearch}
                          onChange={e => setBrandSearch(e.target.value)}
                          placeholder="Поиск бренда..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button
                          onClick={() => { setBrandFilter(''); setBrandDropdownOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            !brandFilter ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          Все бренды
                        </button>
                        {filteredBrands.length === 0 ? (
                          <div className="px-4 py-3 text-white/30 text-sm">Ничего не найдено</div>
                        ) : filteredBrands.map(brand => (
                          <button
                            key={brand}
                            onClick={() => { setBrandFilter(brand); setBrandDropdownOpen(false); setBrandSearch('') }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              brandFilter === brand
                                ? 'text-orange-300 bg-orange-500/10'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Результат + счётчик */}
        {!loading && products.length > 0 && (
          <div className="mb-4 text-white/30 text-sm">
            {brandFilter
              ? `${products.length} ${num(products.length, 'товар', 'товара', 'товаров')} · бренд ${brandFilter}`
              : `${products.length} ${num(products.length, 'товар', 'товара', 'товаров')}`}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🌸</div>
            <h2 className="text-white text-xl font-semibold mb-2">
              {brandFilter ? `Нет товаров бренда ${brandFilter}` : category === 'bottle' ? 'Флаконы ещё не добавлены' : 'Каталог пока пуст'}
            </h2>
            {brandFilter && (
              <button onClick={() => setBrandFilter('')} className="mt-3 text-orange-400 text-sm hover:underline">
                Показать все бренды
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function num(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

function ProductCard({ product }: { product: Product }) {
  const isBottle = product.category === 'bottle'
  const fillPercent = Math.min(product.fill_percent, 100)
  const isAlmostFull = fillPercent >= 80

  return (
    <Link to={`/catalog/${product.id}`} className="group block">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/40 hover:bg-white/8 transition-all duration-300">
        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-orange-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-5xl">{isBottle ? '🫙' : '🌸'}</div>
          )}
          {isAlmostFull && !isBottle && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Скоро выкуп
            </div>
          )}
          {isBottle && (
            <div className="absolute top-3 left-3 bg-purple-500/80 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Флакон
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">{product.brand}</div>
          <h3 className="text-white font-semibold text-sm leading-tight mb-2 group-hover:text-orange-300 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="text-white/30 text-xs mb-3">{CONC_LABEL[product.concentration] || product.concentration}</div>

          {isBottle ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-orange-400 font-bold text-lg">{Math.round(product.price_per_ml * product.bottle_ml)} ₽</span>
              </div>
              <div className="flex items-center gap-1 text-white/30 text-xs">
                <Icon name="Package" size={12} />
                <span>{product.bottle_ml} мл</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>Забронировано</span>
                  <span>{product.booked_ml} / {product.bottle_ml} мл</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isAlmostFull ? 'bg-orange-500' : 'bg-orange-400/60'}`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-orange-400 font-bold text-lg">{product.price_per_ml} ₽</span>
                  <span className="text-white/40 text-xs"> / мл</span>
                </div>
                <div className="flex items-center gap-1 text-white/30 text-xs">
                  <Icon name="Droplets" size={12} />
                  <span>от 1 мл</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}