import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import Icon from "@/components/ui/icon"

export default function HeroContent() {
  return (
    <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      <div className="max-w-6xl mx-auto rounded-[2rem] overflow-hidden border border-gold-500/15 bg-choco-900 relative min-h-[480px] lg:min-h-[620px] flex items-end lg:items-center">
        {/* Фоновое изображение, плавно перетекающее в фоновый цвет */}
        <img
          src="/images/hero-perfume-collection.jpg"
          alt="Нишевый парфюм"
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-choco-900 via-choco-900/85 sm:via-choco-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-choco-900 via-transparent to-choco-900/30" />

        {/* Текст */}
        <div className="relative p-8 sm:p-12 lg:p-16 max-w-xl">
          <p className="text-choco-100/50 text-[11px] sm:text-xs uppercase tracking-[0.25em] mb-6 sm:mb-8">
            Клуб совместных закупок
          </p>

          <h1 className="font-serif text-choco-50 text-4xl sm:text-5xl lg:text-6xl uppercase leading-[1.05] mb-8 sm:mb-10">
            Нишевый
            <br />
            парфюм по
            <br />
            честной цене
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10">
            <Link to="/register">
              <Button className="bg-transparent border border-gold-400/70 text-gold-300 hover:bg-gold-500 hover:text-choco-950 hover:border-gold-500 px-8 py-3.5 h-auto rounded-none text-xs tracking-[0.2em] uppercase w-full sm:w-auto">
                Вступить в клуб
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" className="bg-transparent border border-choco-100/20 text-choco-100/80 hover:bg-choco-100/10 hover:border-choco-100/40 px-8 py-3.5 h-auto rounded-none text-xs tracking-[0.2em] uppercase w-full sm:w-auto">
                Смотреть каталог
              </Button>
            </Link>
          </div>

          <div className="h-px bg-gold-500/25 w-full mb-4" />
          <p className="text-choco-100/40 text-[10px] sm:text-xs uppercase tracking-[0.3em]">
            Оригинал · Экономия · Доверие
          </p>
        </div>

        <div className="absolute top-5 right-5 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gold-400/50 bg-choco-950/40 backdrop-blur-sm flex items-center justify-center">
          <Icon name="Sparkles" size={16} className="text-gold-400" />
        </div>
      </div>
    </section>
  )
}