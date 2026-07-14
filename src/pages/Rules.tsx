import { Link } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import Footer from '@/components/Footer'

export default function Rules() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-teal-400 transition-colors">
          Распивошная
        </Link>
        <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors">
          Каталог
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-8">
        <div>
          <div className="text-teal-400 text-sm font-medium uppercase tracking-widest mb-3">Документы</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Правила участия</h1>
          <p className="text-white/40 text-sm">Редакция от 25 апреля 2025 г.</p>
        </div>

        <div className="bg-teal-500/8 border border-teal-500/20 rounded-2xl px-6 py-4 flex gap-3">
          <Icon name="Info" size={16} className="text-teal-400 shrink-0 mt-0.5" />
          <p className="text-white/60 text-sm leading-relaxed">
            Правила дополняют <Link to="/offer" className="text-teal-400 hover:underline">Договор публичной оферты</Link>. Участвуя в распивах и совместных закупках, вы соглашаетесь с обоими документами.
          </p>
        </div>

        <div className="space-y-6 text-white/70 leading-relaxed">

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">1. Участие в распивах</h2>
            <p>
              Распив — это разделение одного флакона между несколькими участниками. Каждый заказывает нужное ему количество миллилитров. Флакон выкупается после того, как набирается достаточный суммарный объём заявок.
            </p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Минимальный заказ — 1 мл.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Объём указывается в момент оформления заявки и фиксируется после подтверждения оплаты.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Изменить объём можно до перехода заказа в статус «Зафиксирован».</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Отливанты разливаются в чистые флаконы; допустимое отклонение объёма — ±5%.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">2. Участие в совместных закупках</h2>
            <p>
              Совместная закупка — это коллективный выкуп флакона по оптовой цене. Участники размещают заявки, после набора нужной суммы Организатор закупает парфюм и распределяет его.
            </p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Цена за мл фиксируется на момент оформления заявки.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Если закупка не состоялась (не набран минимальный объём), все оплаченные средства возвращаются участникам.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Сроки сбора объявляются Организатором заранее.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">3. Оплата и долги</h2>
            <p>
              3.1. Оплата производится по реквизитам, указанным в личном кабинете, в течение 2 рабочих дней с момента перехода заказа в статус «Ожидает оплаты».
            </p>
            <p>
              3.2. В случае недоплаты разница фиксируется как долг Участника. Долг необходимо погасить до следующей оплаты заказа.
            </p>
            <p>
              3.3. В случае переплаты разница засчитывается в счёт следующего заказа или возвращается по договорённости с Организатором.
            </p>
            <p>
              3.4. Участники с непогашенными долгами не могут оформлять новые заказы.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">4. Выдача заказов</h2>
            <p>
              4.1. Способ получения (самовывоз, доставка) указывается при оформлении заказа или уточняется дополнительно через личный кабинет.
            </p>
            <p>
              4.2. О переводе заказа в статус «Раздача» Участник получает уведомление. Получить заказ необходимо в указанные сроки.
            </p>
            <p>
              4.3. Невостребованные заказы хранятся не более 30 дней. По истечении срока Организатор вправе распорядиться ими по своему усмотрению без компенсации.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">5. Поведение в сообществе</h2>
            <ul className="space-y-1.5 text-sm">
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Общение в уважительном тоне — как с Организатором, так и с другими участниками.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Запрещено публиковать спам, рекламу сторонних ресурсов без согласования.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Претензии к качеству или объёму следует направлять через личный кабинет (раздел «Сообщения»), а не публично.</li>
              <li className="flex gap-2"><span className="text-teal-400 shrink-0">—</span>Систематическое нарушение правил может повлечь ограничение доступа к сервису.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">6. Претензии и споры</h2>
            <p>
              Все претензии принимаются в течение 7 дней с момента получения заказа через личный кабинет с приложением фотофиксации (при наличии). Организатор рассматривает претензию в течение 5 рабочих дней.
            </p>
          </section>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-wrap gap-4">
          <Link to="/offer" className="text-teal-400 hover:text-teal-300 text-sm transition-colors">
            Договор оферты →
          </Link>
          <Link to="/register" className="text-white/40 hover:text-white text-sm transition-colors">
            Зарегистрироваться
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}