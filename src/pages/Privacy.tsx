import { Link } from 'react-router-dom'
import Footer from '@/components/Footer'

export default function Privacy() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Политика конфиденциальности</h1>
          <p className="text-white/50 text-sm">Политика в отношении обработки персональных данных</p>
          <p className="text-white/30 text-xs mt-2">Дата публикации: 25.05.2026</p>
        </div>

        <div className="space-y-6 text-white/70 leading-relaxed">

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">1. Общие положения</h2>
            <p>1.1. Настоящая Политика в отношении обработки персональных данных (далее — «Политика») составлена в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые Индивидуальным предпринимателем Шивановой Валентиной Александровной, ОГРНИП 326580000037753 (далее — «Оператор»).</p>
            <p>1.2. Оператор ставит своей важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну.</p>
            <p>1.3. Настоящая Политика применяется ко всей информации, которую Оператор может получить о посетителях веб-сайта raspivoshnaya.ru (далее — «Сайт»).</p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">2. Термины и определения</h2>
            <p>2.1. <span className="text-white/90">Персональные данные</span> — любая информация, относящаяся к прямо или косвенно определенному или определяемому физическому лицу (субъекту персональных данных / Покупателю).</p>
            <p>2.2. <span className="text-white/90">Обработка персональных данных</span> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (распространение, предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.</p>
            <p>2.3. <span className="text-white/90">Пользователь</span> — любой посетитель Сайта raspivoshnaya.ru.</p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">3. Какие персональные данные обрабатывает Оператор</h2>
            <p>Оператор осуществляет обработку следующих персональных данных Пользователя, которые он самостоятельно вводит в формы на Сайте:</p>
            <ul className="space-y-1.5 pl-4">
              <li>3.1. Фамилия, имя, отчество (ФИО);</li>
              <li>3.2. Номер контактного телефона;</li>
              <li>3.3. Адрес электронной почты (email);</li>
              <li>3.4. Адрес пункта выдачи заказов (офиса) для организации получения товара.</li>
              <li>3.5. Также на сайте происходит сбор и обработка обезличенных данных о посетителях (в т.ч. файлов «cookie») с помощью сервисов интернет-статистики.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">4. Цели обработки персональных данных</h2>
            <p>4.1. Цель обработки персональных данных Пользователя:</p>
            <ul className="space-y-1.5 pl-4 list-disc list-inside marker:text-white/20">
              <li>Оформление, обработка, верификация и подтверждение заказов на Сайте.</li>
              <li>Выполнение обязательств по договору розничной купли-продажи парфюмерной продукции методом отмеривания (дистанционный способ).</li>
              <li>Идентификация Пользователя в пункте выдачи заказов (офисе) для выдачи оплаченного или сформированного заказа.</li>
              <li>Направление уведомлений, касающихся статуса заказа, по электронной почте или посредством СМС/мессенджеров.</li>
              <li>Предоставление Пользователю эффективной клиентской и технической поддержки при возникновении проблем, связанных с использованием Сайта.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">5. Правовые основания обработки персональных данных</h2>
            <p>5.1. Правовыми основаниями обработки персональных данных Оператором являются:</p>
            <ul className="space-y-1.5 pl-4 list-disc list-inside marker:text-white/20">
              <li>Гражданский кодекс Российской Федерации.</li>
              <li>Закон РФ от 07.02.1992 № 2300-1 «О защите прав потребителей».</li>
              <li>Договор купли-продажи (Публичная оферта), заключаемый между Оператором и Пользователем в момент оформления заказа.</li>
              <li>Согласие Пользователя на обработку его персональных данных, выраженное путем проставления галочки (чекбокса) в формах сбора данных на Сайте.</li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">6. Порядок сбора, хранения, передачи и других видов обработки</h2>
            <p>6.1. Безопасность персональных данных, которые обрабатываются Оператором, обеспечивается путем реализации правовых, организационных и технических мер, необходимых для выполнения в полном объеме требований действующего законодательства в области защиты персональных данных.</p>
            <p>6.2. Оператор обеспечивает сохранность персональных данных и принимает все возможные меры, исключающие доступ к персональным данным неуполномоченных лиц.</p>
            <p>6.3. Персональные данные Пользователя никогда, ни при каких условиях не будут переданы третьим лицам, за исключением случаев, связанных с исполнением действующего законодательства РФ, либо в случае передачи данных платформе poehali.dev исключительно в технических целях функционирования базы данных Сайта.</p>
            <p>6.4. Базы данных, в которых хранятся персональные данные граждан РФ, физически расположены на территории Российской Федерации.</p>
            <p>6.5. Срок обработки персональных данных является неограниченным. Пользователь может в любой момент отозвать свое согласие на обработку персональных данных, направив Оператору уведомление посредством электронной почты на адрес <a href="mailto:dontoffice@gmail.com" className="text-teal-400 hover:text-teal-300 transition-colors">dontoffice@gmail.com</a> с пометкой «Отзыв согласия на обработку персональных данных».</p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold text-lg">7. Заключительные положения</h2>
            <p>7.1. Пользователь может получить любые разъяснения по интересующим вопросам, касающимся обработки его персональных данных, обратившись к Оператору с помощью электронной почты <a href="mailto:dontoffice@gmail.com" className="text-teal-400 hover:text-teal-300 transition-colors">dontoffice@gmail.com</a>.</p>
            <p>7.2. Настоящий документ отражает любые изменения политики обработки персональных данных Оператором. Политика действует бессрочно до замены ее новой версией.</p>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">8. Реквизиты Оператора</h2>
            <div className="space-y-1.5 text-sm">
              <p className="text-white font-medium">ИП Шиванова Валентина Александровна</p>
              <p><span className="text-white/40">ИНН:</span> 583509289160</p>
              <p><span className="text-white/40">ОГРНИП:</span> 326580000037753</p>
              <p><span className="text-white/40">Email:</span> <a href="mailto:dontoffice@gmail.com" className="text-teal-400 hover:text-teal-300 transition-colors">dontoffice@gmail.com</a></p>
              <p><span className="text-white/40">Телефон:</span> <a href="tel:+79953063070" className="text-teal-400 hover:text-teal-300 transition-colors">+7 995 306 30 70</a></p>
            </div>
          </section>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-wrap gap-4">
          <Link to="/offer" className="text-teal-400 hover:text-teal-300 text-sm transition-colors">
            Договор оферты →
          </Link>
          <Link to="/rules" className="text-white/40 hover:text-white text-sm transition-colors">
            Правила участия
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}