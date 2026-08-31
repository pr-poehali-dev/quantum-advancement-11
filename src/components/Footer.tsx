import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gold-500/10 mt-16 py-6 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
        <span>© 2025 ИП Шиванова В.А., ОГРНИП 326580000037753</span>
        <div className="flex gap-4">
          <Link to="/offer" className="hover:text-gold-400 transition-colors">Договор оферты</Link>
          <Link to="/privacy" className="hover:text-gold-400 transition-colors">Политика конфиденциальности</Link>
          <Link to="/consent" className="hover:text-gold-400 transition-colors">Согласие на обработку данных</Link>
          <Link to="/rules" className="hover:text-gold-400 transition-colors">Правила участия</Link>
        </div>
      </div>
    </footer>
  )
}