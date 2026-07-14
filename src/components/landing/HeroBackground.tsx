export default function HeroBackground() {
  return (
    <div className="absolute inset-0 bg-white pointer-events-none overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-50 blur-3xl opacity-70" />
      <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-neutral-50 blur-3xl opacity-80" />
    </div>
  )
}