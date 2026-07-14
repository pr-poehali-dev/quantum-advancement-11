import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

export default function HeroContent() {
  return (
    <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
      <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-neutral-100 border border-black/5 rounded-full px-3.5 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span className="text-neutral-500 text-xs">Распив · Совместные закупки · от 1 мл</span>
          </div>

          <h1 className="text-neutral-900 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-5">
            Нишевый парфюм
            <br />
            по честной цене
          </h1>

          <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
            Пробуйте оригинальные ароматы без покупки целого флакона.
            Заказывайте от 1&nbsp;мл — только то, что нужно именно вам.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/register">
              <Button className="group w-full sm:w-auto bg-neutral-900 hover:bg-neutral-700 text-white px-6 py-3 h-auto rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
                Зарегистрироваться
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" className="w-full sm:w-auto border-neutral-200 text-neutral-900 bg-white hover:bg-neutral-50 px-6 py-3 h-auto rounded-full text-sm font-medium transition-colors">
                Перейти в каталог
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <div className="text-neutral-900 font-semibold text-xl sm:text-2xl">от 1 мл</div>
              <div className="text-neutral-400 text-xs sm:text-sm mt-0.5">минимальный заказ</div>
            </div>
            <div>
              <div className="text-neutral-900 font-semibold text-xl sm:text-2xl">100%</div>
              <div className="text-neutral-400 text-xs sm:text-sm mt-0.5">оригинал</div>
            </div>
            <div>
              <div className="text-neutral-900 font-semibold text-xl sm:text-2xl">оптовая</div>
              <div className="text-neutral-400 text-xs sm:text-sm mt-0.5">цена за мл</div>
            </div>
          </div>
        </div>

        <div className="relative order-first md:order-last">
          <div className="aspect-square rounded-3xl bg-neutral-50 border border-black/5 overflow-hidden flex items-center justify-center">
            <img
              src="https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/4b60d3b3-bfc0-477a-8fa1-b244b8e0d6aa.jpg"
              alt="Нишевый парфюм"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
