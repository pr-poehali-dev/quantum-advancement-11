import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import Icon from "@/components/ui/icon"
import { LineShadowText } from "@/components/line-shadow-text"

export default function HeroContent() {
  return (
    <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-teal-600 text-sm uppercase tracking-wider font-medium mb-4">
            Клуб совместных закупок
          </p>

          <h1 className="text-neutral-800 text-4xl sm:text-5xl lg:text-6xl font-light leading-tight mb-6">
            Нишевый парфюм
            <br />
            <LineShadowText className="text-teal-500" shadowColor="#14b8a6">по честной цене</LineShadowText>
          </h1>

          <p className="text-neutral-600 text-lg leading-relaxed max-w-md mb-8">
            Пробуйте оригинальные ароматы без покупки целого флакона. Заказывайте от 1&nbsp;мл — только то, что нужно именно вам.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link to="/register">
              <Button className="group bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 h-auto rounded-full w-full sm:w-auto">
                ВСТУПИТЬ В КЛУБ
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" className="bg-white hover:bg-teal-50 text-neutral-800 px-8 py-4 h-auto rounded-full border border-teal-200 hover:border-teal-300 w-full sm:w-auto">
                СМОТРЕТЬ КАТАЛОГ
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="Star" size={16} className="fill-teal-400 text-teal-400" />
              ))}
            </div>
            <p className="text-sm text-neutral-600">Оригинальный парфюм от 1 мл</p>
          </div>
        </div>

        <div className="relative group">
          <div className="aspect-square overflow-hidden rounded-3xl shadow-2xl shadow-teal-200/50">
            <img
              src="https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/37b6293d-056c-470b-a808-492f0e130524.jpg"
              alt="Нишевый парфюм"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-teal-500/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg shadow-teal-200/50">
            <Icon name="Sparkles" size={22} className="text-teal-500" />
          </div>
        </div>
      </div>
    </main>
  )
}