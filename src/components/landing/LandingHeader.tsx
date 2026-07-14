import { Menu, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <header className="sticky top-0 z-50 bg-choco-950/95 backdrop-blur-sm border-b border-gold-500/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <nav className="hidden md:flex items-center gap-6 flex-1">
            <Link to="/catalog" className="text-choco-100/60 hover:text-gold-400 transition-colors text-xs tracking-widest uppercase">
              Каталог
            </Link>
            <Link to="/how-it-works" className="text-choco-100/60 hover:text-gold-400 transition-colors text-xs tracking-widest uppercase">
              Как это работает
            </Link>
            <Link to="/forum" className="text-choco-100/60 hover:text-gold-400 transition-colors text-xs tracking-widest uppercase">
              Форум
            </Link>
          </nav>

          <Link to="/" className="font-serif text-gold-400 font-semibold text-xl sm:text-2xl tracking-wide text-center flex-1">
            Распивошная
          </Link>

          <div className="hidden md:flex items-center justify-end gap-4 flex-1">
            <Search className="w-4 h-4 text-choco-100/50 hover:text-gold-400 transition-colors cursor-pointer" />
            {user ? (
              <Link to="/cabinet">
                <Button className="bg-transparent border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-choco-950 rounded-none px-5 text-xs tracking-widest uppercase">
                  Кабинет
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="bg-transparent border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-choco-950 rounded-none px-5 text-xs tracking-widest uppercase">
                  Войти
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-gold-400 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="relative z-50 md:hidden bg-choco-950 border-b border-gold-500/20">
          <nav className="flex flex-col gap-4 px-6 py-6">
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="text-choco-100/70 hover:text-gold-400 transition-colors text-sm tracking-widest uppercase">
              Каталог
            </Link>
            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-choco-100/70 hover:text-gold-400 transition-colors text-sm tracking-widest uppercase">
              Как это работает
            </Link>
            <Link to="/forum" onClick={() => setMobileMenuOpen(false)} className="text-choco-100/70 hover:text-gold-400 transition-colors text-sm tracking-widest uppercase">
              Форум
            </Link>
            {user ? (
              <Link to="/cabinet" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-transparent border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-choco-950 rounded-none px-5 w-fit text-xs tracking-widest uppercase">
                  Кабинет
                </Button>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-transparent border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-choco-950 rounded-none px-5 w-fit text-xs tracking-widest uppercase">
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