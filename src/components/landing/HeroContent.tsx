import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import Icon from "@/components/ui/icon"

export default function HeroContent() {
  return (
    <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      <div className="max-w-6xl mx-auto rounded-[2rem] overflow-hidden border border-gold-500/15 bg-choco-900 relative">
        {/* фоновая сетка-текстура как на референсе */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(212,185,110,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,185,110,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative grid lg:grid-cols-2 items-stretch">
          {/* Левая часть — текст */}
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[420px] lg:min-h-[560px]">
            <div>
              <div className="font-serif text-gold-400 text-xl sm:text-2xl tracking-wide mb-1">Распивошная</div>
              <p className="text-choco-100/50 text-[11px] sm:text-xs uppercase tracking-[0.25em] mb-8 sm:mb-10">
                Клуб совместных закупок · с 2025
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
            </div>

            <div>
              <div className="h-px bg-gold-500/25 w-full mb-4" />
              <p className="text-choco-100/40 text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-6">
                Оригинал · Экономия · Доверие
              </p>

              <div className="flex items-center gap-3 text-choco-100/50">
                <span className="w-7 h-7 rounded-full border border-gold-500/40 flex items-center justify-center text-gold-400 text-sm">
                  +
                </span>
                <span className="h-px w-10 bg-gold-500/30" />
                <span className="text-xs tracking-[0.2em]">2026</span>
              </div>
            </div>
          </div>

          {/* Правая часть — изображение */}
          <div className="relative min-h-[320px] lg:min-h-full">
            <img
              src="https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/8ffd2a0c-6020-40f1-b8f2-ae79aa442a2a.jpg"
              alt="Нишевый парфюм"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-choco-900 via-choco-900/10 to-transparent lg:bg-gradient-to-r lg:from-choco-900 lg:via-transparent lg:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-choco-950/60 via-transparent to-transparent" />

            <div className="absolute top-5 right-5 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gold-400/50 bg-choco-950/40 backdrop-blur-sm flex items-center justify-center">
              <Icon name="Sparkles" size={16} className="text-gold-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
