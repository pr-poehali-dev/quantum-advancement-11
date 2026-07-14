import { Link } from "react-router-dom"

const collections = [
  {
    title: "Выбор куратора",
    subtitle: "Кураторская подборка",
    image: "https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/7e83235b-6704-4c7e-aa3b-3b685d7d60d1.jpg",
    to: "/catalog",
  },
  {
    title: "Новые поступления",
    subtitle: "Свежий распив",
    image: "https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/df785943-8ff1-4221-876e-bf19299f1584.jpg",
    to: "/catalog?sort=",
  },
  {
    title: "Ограниченная коллекция",
    subtitle: "Редкие ароматы",
    image: "https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/files/42cee0bd-9ac1-4829-88c4-929908f72e18.jpg",
    to: "/catalog?category=bottle",
  },
]

export default function CollectionsSection() {
  return (
    <section className="bg-choco-950 py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-xs uppercase tracking-[0.3em] mb-3">Выбирайте по стилю</p>
          <h2 className="font-serif text-choco-50 text-3xl sm:text-4xl uppercase tracking-wide">Каталог по разделам</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {collections.map((c) => (
            <Link key={c.title} to={c.to} className="group relative block aspect-[3/4] overflow-hidden">
              <img
                src={c.image}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-choco-950/90 via-choco-950/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                <div className="text-gold-400 text-[11px] uppercase tracking-widest mb-1">{c.subtitle}</div>
                <div className="text-choco-50 font-serif text-lg uppercase tracking-wide">{c.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
