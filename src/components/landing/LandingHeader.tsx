import { Menu } from "lucide-react"
import { ShimmerButton } from "@/components/shimmer-button"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12 border-b border-white/10">
        <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
          <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl tracking-wide">Распивошная</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link to="/catalog" className="text-white/80 hover:text-white transition-colors text-sm lg:text-base">
            Каталог
          </Link>
          <Link to="/how-it-works" className="text-white/80 hover:text-white transition-colors text-sm lg:text-base">
            Как это работает
          </Link>
          <Link to="/forum" className="text-white/80 hover:text-white transition-colors text-sm lg:text-base">
            Форум
          </Link>
        </nav>

        <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>

        {user ? (
          <Link to="/cabinet">
            <ShimmerButton className="hidden md:flex px-4 lg:px-6 py-2 text-sm lg:text-base font-medium text-white">
              Личный кабинет
            </ShimmerButton>
          </Link>
        ) : (
          <Link to="/login">
            <ShimmerButton className="hidden md:flex px-4 lg:px-6 py-2 text-sm lg:text-base font-medium text-white">
              Войти
            </ShimmerButton>
          </Link>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="relative z-50 md:hidden bg-black/95 backdrop-blur-sm border-b border-white/10">
          <nav className="flex flex-col space-y-4 px-6 py-6">
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
              Каталог
            </Link>
            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
              Как это работает
            </Link>
            <Link to="/forum" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
              Форум
            </Link>
            {user ? (
              <Link to="/cabinet" onClick={() => setMobileMenuOpen(false)}>
                <ShimmerButton className="text-white px-6 py-2.5 text-sm font-medium w-fit">
                  Личный кабинет
                </ShimmerButton>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <ShimmerButton className="text-white px-6 py-2.5 text-sm font-medium w-fit">
                  Войти
                </ShimmerButton>
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
