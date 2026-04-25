import { Link } from 'react-router-dom'
import Icon from '@/components/ui/icon'
import { useAuth } from '@/lib/auth-context'

const STEPS = [
  { num: 1, status: 'принят', color: 'bg-white/15 text-white' },
  { num: 2, status: 'зафиксирован', color: 'bg-blue-500/20 text-blue-300' },
  { num: 3, status: 'ожидает оплаты', color: 'bg-orange-500/20 text-orange-300' },
  { num: 4, status: 'ожидается', color: 'bg-purple-500/20 text-purple-300' },
  { num: 5, status: 'раздача', color: 'bg-green-500/20 text-green-300' },
]

export default function HowItWorks() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <Link to="/" className="text-white font-bold text-xl tracking-wide hover:text-orange-400 transition-colors">
          Распивошная
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors">Каталог</Link>
          {user ? (
            <Link to="/cabinet" className="text-white/70 hover:text-white text-sm border border-white/20 px-4 py-1.5 rounded-lg transition-colors hover:bg-white/10">
              Личный кабинет
            </Link>
          ) : (
            <Link to="/login" className="text-white/70 hover:text-white text-sm border border-white/20 px-4 py-1.5 rounded-lg transition-colors hover:bg-white/10">
              Войти
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-14">

        {/* Заголовок */}
        <div>
          <div className="text-orange-400 text-sm font-medium uppercase tracking-widest mb-3">Руководство</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Как устроен процесс</h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Пошагово: что сделать на сайте, как читать статусы и уведомления, когда можно менять или отменить заявку.
          </p>
        </div>

        {/* Почему выгодно */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Почему это выгодно и удобно</h2>
          <p className="text-white/60 leading-relaxed mb-6">
            Вы получаете строго оригинальный аромат в том объёме, который нужен именно вам: можно тестировать новинки и менять парфюм чаще, не переплачивая за большие флаконы.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-orange-400 font-semibold mb-2">Распив</div>
              <p className="text-white/60 text-sm leading-relaxed">
                Флакон дорогого аромата делим между участниками. Заказывайте любое количество миллилитров — от пробника до нескольких десятков мл.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-orange-400 font-semibold mb-2">Совместные закупки</div>
              <p className="text-white/60 text-sm leading-relaxed">
                Несколько человек собирают заказы, чтобы выкупить парфюм по оптовой цене. Чем спокойнее планирование, тем приятнее цена за миллилитр.
              </p>
            </div>
          </div>
        </section>

        {/* Оформление заказа */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center justify-center font-bold">1</span>
            Оформление заказа
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-white/70 leading-relaxed">
            <p>
              Чтобы оформить заказ, вам необходимо пройти{' '}
              <Link to="/register" className="text-orange-400 hover:underline">регистрацию</Link>{' '}
              на главной странице. После чего можно перейти в{' '}
              <Link to="/catalog" className="text-orange-400 hover:underline">каталог</Link>,
              выбрать нужный парфюм и на странице аромата указать желаемый объём в мл. Каждый парфюм будет оформлен отдельным заказом по умолчанию. Все ваши заказы хранятся в личном кабинете.
            </p>
            <p className="flex gap-2">
              <Icon name="Info" size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <span>
                Если вы хотите заказать целый флакон, для запроса цены и наличия можно написать сообщение модератору в личном кабинете.
              </span>
            </p>
          </div>
        </section>

        {/* Статусы */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center justify-center font-bold">2</span>
            Статусы и уведомления
          </h2>
          <p className="text-white/60 mb-6 leading-relaxed">
            После оформления заказа статусы будут меняться в личном кабинете — следите за ними.
          </p>

          {/* Шкала статусов */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${s.color} border border-white/10`}>
                    {s.num}
                  </div>
                  <div className="text-white/40 text-[10px] text-center leading-tight max-w-[72px]">{s.status}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 h-px bg-white/15 mb-4 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Описание каждого статуса */}
          <div className="space-y-3">
            {[
              { status: 'Принят', color: 'text-white/80', bg: 'bg-white/5 border-white/10', text: 'Заявка зарегистрирована. Меняйте или удаляйте заказ в любое время.' },
              { status: 'Зафиксирован', color: 'text-blue-300', bg: 'bg-blue-500/5 border-blue-500/20', text: 'Флакон гарантированно идёт на выкуп (объём забронирован). Оплата через 2 дня — подготовьтесь! Отмены возможны, но не желательны.' },
              { status: 'Ожидает оплаты', color: 'text-orange-300', bg: 'bg-orange-500/5 border-orange-500/20', text: 'Внесите платёж в течение 2 дней. В кабинете (Заказы → К оплате): укажите сумму, дату/время и нажмите «Я оплатил(а) — отправить». Организатор проверит.' },
              { status: 'Ожидается', color: 'text-purple-300', bg: 'bg-purple-500/5 border-purple-500/20', text: 'Парфюм в пути или в процессе распива. Уточните пункт выдачи во вкладке «Ожидаются» (галочки + комментарий).' },
              { status: 'Раздача', color: 'text-green-300', bg: 'bg-green-500/5 border-green-500/20', text: 'Отливант готов к получению!' },
            ].map(item => (
              <div key={item.status} className={`border rounded-xl px-5 py-4 ${item.bg}`}>
                <div className={`font-semibold text-sm mb-1 ${item.color}`}>{item.status}</div>
                <div className="text-white/55 text-sm leading-relaxed">{item.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4 flex gap-3">
            <Icon name="AlertTriangle" size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-white/60 text-sm leading-relaxed">
              <span className="text-red-400 font-semibold">ВАЖНО!</span> После изменения статуса заказа на «Ожидает оплату» изменения невозможны.
            </p>
          </div>
        </section>

        {/* Сроки */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center justify-center font-bold">3</span>
            Сроки выкупа и когда придёт заказ
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/70 leading-relaxed space-y-3">
            <p>
              Готовых отливантов на складе у нас нет: каждый аромат выкупаем под совместный заказ. Сбор заявок и формирование выкупа идёт примерно раз в 2–3 недели — за это время набирается нужный объём по выбранным флаконам.
            </p>
            <p>
              Когда нужное количество по ароматам собрано и мы оплачиваем поставку, парфюм едет к нам в город; дальше мы наливаем отливанты. На доставку флаконов и сборку отливантов обычно уходит около недели (точный срок зависит от поставщика и логистики).
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="text-white font-semibold text-lg mb-1">Готовы попробовать?</div>
            <div className="text-white/40 text-sm">Оформите первый заказ прямо сейчас</div>
          </div>
          <Link to="/catalog"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm">
            Перейти в каталог
          </Link>
        </div>

      </div>
    </div>
  )
}