export default function HeroBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 pointer-events-none overflow-hidden">
      <div className="absolute top-20 left-10 w-32 h-32 bg-teal-300/30 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-cyan-300/30 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl" />
    </div>
  )
}
