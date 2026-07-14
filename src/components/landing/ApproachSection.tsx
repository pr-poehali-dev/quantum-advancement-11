import Icon from "@/components/ui/icon"

const points = [
  {
    num: "01",
    icon: "Droplets" as const,
    title: "Индивидуальный объём",
    text: "Заказывайте от 1 мл — пробуйте новинки и меняйте ароматы, не переплачивая за целый флакон.",
  },
  {
    num: "02",
    icon: "ShieldCheck" as const,
    title: "Только оригинал",
    text: "Работаем напрямую с проверенными поставщиками — никаких подделок и разбавленных составов.",
  },
  {
    num: "03",
    icon: "Users" as const,
    title: "Честная цена клуба",
    text: "Совместные закупки позволяют получить оптовую цену за миллилитр без переплат за посредников.",
  },
]

export default function ApproachSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto rounded-[2rem] overflow-hidden border border-gold-500/15 bg-choco-900 relative p-8 sm:p-12 lg:p-16">
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: 'url(/images/noise-texture.png)',
            backgroundSize: '256px 256px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(212,185,110,0.05) 0px, rgba(212,185,110,0.05) 1px, transparent 1px, transparent 14px)',
          }}
        />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex items-center justify-end mb-10 sm:mb-14">
          <span className="text-choco-100/40 text-xs tracking-[0.25em] uppercase">Наш подход</span>
        </div>

        <h2 className="relative font-serif text-choco-50 text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide mb-12 sm:mb-16">
          Оригинал <span className="text-gold-400">·</span> Объём <span className="text-gold-400">·</span> Цена
        </h2>

        <div className="relative grid sm:grid-cols-3 gap-10 sm:gap-8">
          {points.map((p) => (
            <div key={p.num} className="group">
              <div className="w-20 h-20 rounded-full border border-gold-500/30 flex items-center justify-center mb-6 transition-all duration-300 group-hover:border-gold-400/60 group-hover:scale-110 group-hover:-translate-y-1">
                <Icon name={p.icon} size={34} className="text-gold-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              </div>
              <div className="font-serif text-gold-400/70 text-3xl mb-3">{p.num}</div>
              <div className="text-choco-50 text-xs uppercase tracking-[0.2em] mb-3">{p.title}</div>
              <p className="text-choco-100/50 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}