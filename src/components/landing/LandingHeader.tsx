import { Menu, X } from "lucide-react"
import { ShimmerLink } from "@/components/shimmer-button"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-50">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-teal-400 transition-colors">
          Распивошная
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link to="/catalog" className="text-white/50 hover:text-white transition-colors">Каталог</Link>
          <Link to="/how-it-works" className="text-white/50 hover:text-white transition-colors">Как это работает</Link>
          <Link to="/forum" className="text-white/50 hover:text-white transition-colors">Форум</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <ShimmerLink to="/cabinet" borderRadius="8px" className="px-4 py-2 text-xs font-medium text-white">
              Личный кабинет
            </ShimmerLink>
          ) : (
            <ShimmerLink to="/login" borderRadius="8px" className="px-4 py-2 text-xs font-medium text-white">
              Войти
            </ShimmerLink>
          )}
        </div>

        <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="relative z-50 md:hidden bg-black/95 backdrop-blur-sm border-b border-white/10">
          <nav className="flex flex-col gap-4 px-6 py-6">
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">
              Каталог
            </Link>
            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">
              Как это работает
            </Link>
            <Link to="/forum" onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white transition-colors">
              Форум
            </Link>
            {user ? (
              <Link to="/cabinet" onClick={() => setMobileMenuOpen(false)} className="text-teal-400 font-medium">
                Личный кабинет
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-teal-400 font-medium">
                Войти
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
