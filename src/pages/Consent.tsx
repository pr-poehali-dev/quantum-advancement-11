import { Link } from 'react-router-dom'
import Footer from '@/components/Footer'

export default function Consent() {
  return (
    <div className="min-h-screen bg-choco-950 text-white">
      <header className="border-b border-gold-500/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-choco-950/90 backdrop-blur-sm z-10">
        <Link to="/" className="font-serif text-gold-400 font-semibold text-xl tracking-wide hover:text-gold-300 transition-colors">
          Распивошная
        </Link>
        <Link to="/catalog" className="text-white/50 hover:text-white text-sm transition-colors">
          Каталог
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-8">
        <div>
          <div className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-3">Документы</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Согласие на обработку персональных данных</h1>
          <p className="text-white/50 text-sm">Согласие субъекта персональных данных на обработку его персональных данных</p>
          <p className="text-white/30 text-xs mt-2">Редакция документа: 01.09.2026</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/70 leading-relaxed text-sm">
          Я, субъект персональных данных, свободно, своей волей и в своём интересе даю согласие индивидуальному предпринимателю Шивановой Валентине Александровне, ОГРНИП 326580000037753 (далее — «Оператор») на обработку моих персональных данных при заполнении формы обратной связи на сайте raspivoshnaya.ru.
        </div>

        <div className="space-y-6 text-white/70 leading-relaxed">

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">1. Обрабатываемые персональные данные</h2>
            <ul className="space-y-1.5 pl-4">
              <li>фамилия, имя, отчество (ФИО);</li>
              <li>номер телефона;</li>
              <li>адрес электронной почты (email).</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">2. Цели обработки</h2>
            <ul className="space-y-1.5 pl-4">
              <li>обработка и исполнение запросов через форму обратной связи;</li>
              <li>предоставление запрашиваемой информации и консультаций;</li>
              <li>связь со мной по вопросам, связанным с моим обращением.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">3. Способы и условия обработки</h2>
            <p>Обработка производится автоматизированным и неавтоматизированным способами, включая сбор, запись, систематизацию, хранение, уточнение, использование, передачу (в пределах уполномоченных сотрудников и подрядчиков Оператора, обеспечивающих техническую работу сайта и CRM), блокирование и удаление. Передача третьим лицам допускается только:</p>
            <ul className="space-y-1.5 pl-4">
              <li>для обеспечения технической работы сайта, CRM и почтовых сервисов — на основании договоров с подрядчиками, предусматривающих обязанность соблюдения конфиденциальности;</li>
              <li>по требованию уполномоченных государственных органов — в случаях, предусмотренных законодательством РФ.</li>
            </ul>
            <p>Передача данных за пределы Российской Федерации не осуществляется. Хранение данных производится на серверах, расположенных на территории РФ.</p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">4. Срок действия согласия</h2>
            <p>Согласие действует с момента предоставления до достижения целей обработки либо до моего отзыва, а также в течение сроков, установленных законодательством для хранения документов (в том числе для целей бухгалтерского и налогового учёта).</p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">5. Порядок отзыва согласия</h2>
            <p>
              Я вправе отозвать согласие в любое время, направив письменный запрос на электронную почту Оператора:{' '}
              <a href="mailto:dontoffice@gmail.com" className="text-gold-400 hover:text-gold-300 transition-colors">dontoffice@gmail.com</a>
              {' '}с пометкой «Отзыв согласия на обработку персональных данных». После получения запроса Оператор прекращает обработку и удаляет/блокирует данные в сроки, установленные законодательством, за исключением случаев, когда хранение требуется по закону.
            </p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">6. Права субъекта персональных данных</h2>
            <p>Мне известно, что я вправе:</p>
            <ul className="space-y-1.5 pl-4">
              <li>запросить у Оператора информацию о наличии и составе моих персональных данных и ознакомиться с ними;</li>
              <li>требовать уточнения, блокирования или уничтожения данных, если они неточны, незаконно получены или не нужны для заявленных целей;</li>
              <li>обжаловать действия или бездействие Оператора в Роскомнадзор или в судебном порядке.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <p>
              Настоящее согласие предоставляется на основании ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и является отдельным документом. Я подтверждаю, что ознакомлен с{' '}
              <Link to="/privacy" className="text-gold-400 hover:text-gold-300 transition-colors underline underline-offset-2">Политикой обработки персональных данных</Link>
              {' '}Оператора и понимаю последствия предоставления согласия.
            </p>
          </section>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-wrap gap-4">
          <Link to="/privacy" className="text-gold-400 hover:text-gold-300 text-sm transition-colors">
            Политика конфиденциальности →
          </Link>
          <Link to="/offer" className="text-white/40 hover:text-white text-sm transition-colors">
            Договор оферты →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
