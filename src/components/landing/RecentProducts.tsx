import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import Icon from "@/components/ui/icon"

interface Product {
  id: number
  name: string
  brand: string
  price_per_ml: number
  bottle_ml: number
  fill_percent: number
  image_url: string | null
  category: string
}

export default function RecentProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.catalog.list('', '').then((data) => {
      setProducts(Array.isArray(data) ? data.slice(0, 4) : [])
      setLoading(false)
    })
  }, [])

  if (loading || products.length === 0) return null

  return (
    <section className="bg-choco-900 py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-xs uppercase tracking-[0.3em] mb-3">Свежий распив</p>
          <h2 className="font-serif text-choco-50 text-3xl sm:text-4xl uppercase tracking-wide">Новые поступления</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => {
            const isBottle = p.category === 'bottle'
            const price = isBottle ? Math.round(p.price_per_ml * p.bottle_ml) : p.price_per_ml
            return (
              <Link key={p.id} to={`/catalog/${p.id}`} className="group block">
                <div className="aspect-square bg-choco-800 border border-gold-500/10 overflow-hidden relative mb-4">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
                      <Icon name={isBottle ? 'Package' : 'Droplet'} size={40} className="text-gold-400/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-choco-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="text-center">
                  <div className="text-choco-100/40 text-[10px] uppercase tracking-widest mb-1">{p.brand}</div>
                  <div className="text-choco-50 font-serif text-sm uppercase tracking-wide mb-1 line-clamp-1">{p.name}</div>
                  <div className="text-gold-400 text-sm">
                    {price} ₽{!isBottle && <span className="text-choco-100/40"> / мл</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link to="/catalog" className="inline-block border border-gold-400/50 text-gold-300 hover:bg-gold-500 hover:text-choco-950 hover:border-gold-500 px-10 py-4 text-xs tracking-[0.25em] uppercase transition-colors">
            Весь каталог
          </Link>
        </div>
      </div>
    </section>
  )
}
