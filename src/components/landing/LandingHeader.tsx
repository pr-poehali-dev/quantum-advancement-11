import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <header className="relative z-50 bg-white/90 backdrop-blur-sm border-b border-black/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-neutral-900 font-semibold text-lg sm:text-xl tracking-tight">
            Распивошная
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/catalog" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
              Каталог
            </Link>
            <Link to="/how-it-works" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
              Как это работает
            </Link>
            <Link to="/forum" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
              Форум
            </Link>
          </nav>

          <div className="hidden md:block">
            {user ? (
              <Link to="/cabinet">
                <Button className="bg-neutral-900 hover:bg-neutral-700 text-white rounded-full px-5">
                  Личный кабинет
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="bg-neutral-900 hover:bg-neutral-700 text-white rounded-full px-5">
                  Войти
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-neutral-900 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="relative z-50 md:hidden bg-white border-b border-black/5">
          <nav className="flex flex-col gap-4 px-6 py-6">
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Каталог
            </Link>
            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Как это работает
            </Link>
            <Link to="/forum" onClick={() => setMobileMenuOpen(false)} className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Форум
            </Link>
            {user ? (
              <Link to="/cabinet" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-neutral-900 hover:bg-neutral-700 text-white rounded-full px-5 w-fit">
                  Личный кабинет
                </Button>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-neutral-900 hover:bg-neutral-700 text-white rounded-full px-5 w-fit">
                  Войти
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
