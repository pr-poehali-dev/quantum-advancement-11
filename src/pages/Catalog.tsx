import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
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
}

export default function Catalog() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('')

  useEffect(() => {
    setLoading(true)
    api.catalog.list(sort).then(data => {
      setProducts(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [sort])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-white/50 text-sm hidden sm:block">@{user.nickname}</span>
              {user.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-xs">
                    Админ
                  </Button>
                </Link>
              )}
              <Link to="/cabinet">
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10 text-xs">
                  Кабинет
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white text-xs">
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10 text-xs">
                  Войти
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                  Регистрация
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Title + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Каталог ароматов</h1>
            <p className="text-white/50 text-sm mt-1">Оригинальный парфюм — от 1 мл</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">Сортировка:</span>
            <button
              onClick={() => setSort('')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${sort === '' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            >
              Новые
            </button>
            <button
              onClick={() => setSort('filling')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${sort === 'filling' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            >
              По заполнению
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🌸</div>
            <h2 className="text-white text-xl font-semibold mb-2">Каталог пока пуст</h2>
            <p className="text-white/40 text-sm max-w-xs">Скоро здесь появятся ароматы. Следите за обновлениями в мессенджерах!</p>
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

function ProductCard({ product }: { product: Product }) {
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
            <div className="text-5xl">🌸</div>
          )}
          {isAlmostFull && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Скоро выкуп
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">{product.brand}</div>
          <h3 className="text-white font-semibold text-sm leading-tight mb-3 group-hover:text-orange-300 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Fill bar */}
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
        </div>
      </div>
    </Link>
  )
}
