import { Link } from "react-router-dom"
import LandingHeader from "@/components/landing/LandingHeader"
import HeroBackground from "@/components/landing/HeroBackground"
import HeroContent from "@/components/landing/HeroContent"

export default function Index() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />

      <div className="relative flex-1 overflow-hidden">
        <HeroBackground />
        <HeroContent />
      </div>

      <footer className="relative z-10 border-t border-black/5 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>© 2025 ИП Шиванова В.А., ОГРНИП 326580000037753</span>
          <div className="flex gap-4">
            <Link to="/offer" className="hover:text-teal-600 transition-colors">Договор оферты</Link>
            <Link to="/privacy" className="hover:text-teal-600 transition-colors">Политика конфиденциальности</Link>
            <Link to="/rules" className="hover:text-teal-600 transition-colors">Правила участия</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}