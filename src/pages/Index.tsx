import { Link } from "react-router-dom"
import LandingHeader from "@/components/landing/LandingHeader"
import HeroBackground from "@/components/landing/HeroBackground"
import HeroContent from "@/components/landing/HeroContent"
import CollectionsSection from "@/components/landing/CollectionsSection"
import RecentProducts from "@/components/landing/RecentProducts"

export default function Index() {
  return (
    <div className="min-h-screen bg-choco-950 flex flex-col">
      <LandingHeader />

      <div className="relative overflow-hidden">
        <HeroBackground />
        <HeroContent />
      </div>

      <CollectionsSection />
      <RecentProducts />

      <footer className="relative z-10 border-t border-gold-500/10 py-6 px-4 sm:px-8 bg-choco-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-choco-100/30">
          <span>© 2025 ИП Шиванова В.А., ОГРНИП 326580000037753</span>
          <div className="flex gap-4">
            <Link to="/offer" className="hover:text-gold-400 transition-colors">Договор оферты</Link>
            <Link to="/privacy" className="hover:text-gold-400 transition-colors">Политика конфиденциальности</Link>
            <Link to="/rules" className="hover:text-gold-400 transition-colors">Правила участия</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}