import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { LineShadowText } from "@/components/line-shadow-text"
import { Link } from "react-router-dom"

export default function HeroContent() {
  return (
    <main className="relative z-10 flex flex-col items-start justify-start sm:justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-12 max-w-6xl pt-4 sm:-mt-12 lg:-mt-24 pl-6 sm:pl-12 lg:pl-20">
      {/* Badge */}
      <div className="mb-4 sm:mb-8">
        <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-2 gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block"></span>
          <span className="text-white text-xs md:text-xs">Распив · Совместные закупки · от 1 мл</span>
        </div>
      </div>

      <h1 className="text-white text-4xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-8xl font-bold leading-tight mb-4 sm:mb-6 text-balance">
        Нишевый парфюм
        <br />
        по честной{" "}
        <LineShadowText className="italic font-light" shadowColor="white">
          цене
        </LineShadowText>
      </h1>

      <p className="text-white/70 text-sm sm:text-base md:text-sm lg:text-2xl mb-6 sm:mb-8 max-w-2xl text-pretty">
        Пробуйте оригинальные ароматы без покупки целого флакона.
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        Заказывайте от 1 мл — только то, что нужно именно вам.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Link to="/register">
          <Button className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base md:text-xs lg:text-lg font-semibold flex items-center gap-2 backdrop-blur-sm border border-orange-400/30 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
            Зарегистрироваться
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </Link>
        <Link to="/catalog">
          <Button variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/10 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base md:text-xs lg:text-lg font-semibold transition-all duration-300">
            Перейти в каталог
          </Button>
        </Link>
      </div>

      <div className="mt-8 sm:mt-12 flex items-center gap-6 sm:gap-10">
        <div>
          <div className="text-white font-bold text-xl sm:text-2xl">от 1 мл</div>
          <div className="text-white/50 text-xs sm:text-sm">минимальный заказ</div>
        </div>
        <div className="w-px h-8 bg-white/20"></div>
        <div>
          <div className="text-white font-bold text-xl sm:text-2xl">100%</div>
          <div className="text-white/50 text-xs sm:text-sm">оригинальный аромат</div>
        </div>
        <div className="w-px h-8 bg-white/20"></div>
        <div>
          <div className="text-white font-bold text-xl sm:text-2xl">оптовая</div>
          <div className="text-white/50 text-xs sm:text-sm">цена за мл</div>
        </div>
      </div>
    </main>
  )
}
