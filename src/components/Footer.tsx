import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/8 mt-16 py-6 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
        <span>© 2025 ИП Шиванова В.А., ОГРНИП 326580000037753</span>
        <div className="flex gap-4">
          <Link to="/offer" className="hover:text-white/50 transition-colors">Договор оферты</Link>
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Политика конфиденциальности</Link>
          <Link to="/rules" className="hover:text-white/50 transition-colors">Правила участия</Link>
        </div>
      </div>
    </footer>
  )
}
