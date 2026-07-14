import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function HeroContent() {
  return (
    <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center flex flex-col items-center">
      <p className="text-gold-400 text-xs sm:text-sm uppercase tracking-[0.3em] mb-5">
        Клуб совместных закупок · с 2025
      </p>

      <h1 className="font-serif text-choco-50 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-wide uppercase mb-6">
        Нишевый парфюм
        <br />
        по честной цене
      </h1>

      <p className="text-choco-100/70 text-base sm:text-lg leading-relaxed max-w-lg mb-10">
        Пробуйте оригинальные ароматы без покупки целого флакона.
        Заказывайте от 1&nbsp;мл — только то, что нужно именно вам.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/register">
          <Button className="bg-transparent border border-gold-400/70 text-gold-300 hover:bg-gold-500 hover:text-choco-950 hover:border-gold-500 px-10 py-4 h-auto rounded-none text-xs tracking-[0.25em] uppercase w-full sm:w-auto">
            Вступить в клуб
          </Button>
        </Link>
        <Link to="/catalog">
          <Button variant="outline" className="bg-transparent border border-choco-100/20 text-choco-100/80 hover:bg-choco-100/10 hover:border-choco-100/40 px-10 py-4 h-auto rounded-none text-xs tracking-[0.25em] uppercase w-full sm:w-auto">
            Смотреть каталог
          </Button>
        </Link>
      </div>
    </main>
  )
}
