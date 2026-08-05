(() => {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  const themeToggle = document.querySelector('.theme-toggle');
  const themeLabel = themeToggle?.querySelector('.theme-label');
  const themeStylesheet = document.getElementById('theme-stylesheet');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let automaticTheme = Boolean(window.__NOVABIT_THEME_AUTO__);

  const themeFromTime = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'light' : 'dark';
  };

  const applyTheme = (theme, { persist = false } = {}) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    if (themeStylesheet) themeStylesheet.href = `styles-${nextTheme}.css`;
    if (themeColor) themeColor.content = nextTheme === 'light' ? '#F7F9FC' : '#040b19';

    const targetLabel = nextTheme === 'dark' ? 'حالت روز' : 'حالت شب';
    if (themeLabel) themeLabel.textContent = targetLabel;
    themeToggle?.setAttribute('aria-label', `تغییر به ${targetLabel}`);
    themeToggle?.setAttribute('title', `تغییر به ${targetLabel}`);
    themeToggle?.setAttribute('aria-pressed', String(nextTheme === 'dark'));

    if (persist) {
      automaticTheme = false;
      try { localStorage.setItem('novabit-theme', nextTheme); } catch (_) {}
    }
  };

  applyTheme(root.dataset.theme || window.__NOVABIT_THEME__ || themeFromTime());
  themeToggle?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', { persist: true });
  });

  window.setInterval(() => {
    if (automaticTheme) applyTheme(themeFromTime());
  }, 60_000);

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const backTop = document.querySelector('.back-top');
  const desktopLinks = [...document.querySelectorAll('.desktop-nav a')];
  const allNavLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a')];

  const setMenu = (open) => {
    mobileNav?.classList.toggle('open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    body.classList.toggle('menu-open', open);
  };

  menuButton?.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
  allNavLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 20);
    backTop?.classList.toggle('show', y > 550);

    const sections = ['top', 'courses', 'fields', 'roadmap', 'skills', 'articles', 'contact'];
    let current = 'top';
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element && element.getBoundingClientRect().top <= 150) current = id;
    });
    desktopLinks.forEach((link) => {
      const href = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('active', href === current);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  // Persian calendar dates, shown with Latin digits and limited to office days.
  const dateSelect = document.getElementById('jalali-date');
  const timeSelect = document.getElementById('consult-time');
  const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const latinDigits = (value) => String(value)
    .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit));

  const formatJalali = (date) => {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, latinDigits(part.value)]));
    return `${dayNames[date.getDay()]} ${values.year}/${values.month}/${values.day}`;
  };

  const isoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  if (dateSelect) {
    dateSelect.innerHTML = '<option value="">انتخاب تاریخ</option>';
    const today = new Date();
    let added = 0;
    for (let offset = 1; offset <= 75 && added < 36; offset += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12);
      const day = date.getDay();
      const isOfficeDay = day === 6 || day === 0 || day === 1 || day === 2 || day === 3;
      if (!isOfficeDay) continue;
      const option = document.createElement('option');
      option.value = isoDate(date);
      option.textContent = formatJalali(date);
      dateSelect.append(option);
      added += 1;
    }
  }

  if (timeSelect) {
    for (let hour = 9; hour <= 20; hour += 1) {
      const times = hour === 20 ? [`${hour}:00`] : [`${String(hour).padStart(2, '0')}:00`, `${String(hour).padStart(2, '0')}:30`];
      times.forEach((time) => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        timeSelect.append(option);
      });
    }
  }

  const form = document.getElementById('consult-form');
  const message = document.querySelector('.form-message');
  const setMessage = (text, type) => {
    if (!message) return;
    message.textContent = text;
    message.className = `form-message ${type}`;
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const fullName = String(data.get('fullName') || '').trim();
    const phone = latinDigits(String(data.get('phone') || '').replace(/\s/g, ''));
    const topic = String(data.get('topic') || '');
    const currentStatus = String(data.get('currentStatus') || '');
    const description = String(data.get('description') || '').trim();
    const date = String(data.get('date') || '');
    const time = String(data.get('time') || '');

    if (fullName.length < 3) {
      setMessage('لطفاً نام و نام خانوادگی را کامل وارد کنید.', 'error');
      return;
    }
    if (!/^09\d{9}$/.test(phone)) {
      setMessage('شماره تماس باید با 09 شروع شود و 11 رقم داشته باشد.', 'error');
      return;
    }
    if (!topic || !currentStatus || !date || !time) {
      setMessage('حوزه، وضعیت فعلی، تاریخ و ساعت مشاوره را انتخاب کنید.', 'error');
      return;
    }

    const selectedLabel = dateSelect?.selectedOptions[0]?.textContent || date;
    const reference = `NVB-${Date.now().toString().slice(-6)}`;
    const request = { fullName, phone, topic, currentStatus, description, date, dateLabel: selectedLabel, time, reference, createdAt: new Date().toISOString() };
    const saved = JSON.parse(localStorage.getItem('novabitConsultations') || '[]');
    saved.push(request);
    localStorage.setItem('novabitConsultations', JSON.stringify(saved.slice(-20)));

    setMessage('درخواست مشاوره با موفقیت ثبت شد.', 'success');
    form.reset();
    if (dateSelect) dateSelect.value = '';
    if (timeSelect) timeSelect.value = '';
  });

  const articleData = {
    software: {
      tag: 'مهندسی نرم‌افزار',
      title: 'چرا کدی که اجرا می‌شود، هنوز می‌تواند نرم‌افزار بدی باشد؟',
      body: `
        <p class="article-lead">اجرای بدون خطای یک برنامه فقط نشان می‌دهد که نرم‌افزار در یک شرایط مشخص کار کرده است؛ نه اینکه قابل‌اعتماد، امن، سریع، قابل‌توسعه یا قابل‌نگهداری باشد. مهندسی نرم‌افزار دقیقاً از همین فاصله میان «کدِ اجراشونده» و «سامانه قابل‌اعتماد» آغاز می‌شود.</p>
        <div class="article-highlight"><strong>نکته کلیدی:</strong> کیفیت نرم‌افزار یک ویژگی واحد نیست؛ مجموعه‌ای از قابلیت اطمینان، امنیت، کارایی، نگهداشت‌پذیری، آزمون‌پذیری و قابلیت تغییر است.</div>
        <h3>۱. کیفیت از معماری شروع می‌شود</h3>
        <p>پیش از نوشتن جزئیات کد، باید مسئولیت اجزا، مسیر حرکت داده و مرز میان بخش‌های سیستم مشخص شود. یک معماری مناسب اجازه می‌دهد تغییرات محلی بمانند، خطاها راحت‌تر پیدا شوند و بخش‌های حساس مستقل‌تر آزمایش شوند. در عمل، معماری همیشه با مصالحه همراه است؛ برای مثال افزایش کارایی ممکن است پیچیدگی یا هزینه نگهداری را بالا ببرد.</p>
        <h3>۲. آزمون فقط پیدا کردن باگ نیست</h3>
        <p>آزمون واحد رفتار کوچک‌ترین اجزا را بررسی می‌کند، آزمون یکپارچه‌سازی ارتباط میان اجزا را می‌سنجد و آزمون سامانه رفتار محصول را در شرایط نزدیک به واقعیت ارزیابی می‌کند. مهم‌تر از تعداد آزمون‌ها، انتخاب سناریوهای معنادار، مرزهای ورودی و شرایط شکست است.</p>
        <h3>۳. امنیت باید بخشی از چرخه توسعه باشد</h3>
        <p>چارچوب توسعه امن نرم‌افزار NIST توصیه می‌کند امنیت از مرحله طراحی و مدیریت نیازمندی‌ها وارد چرخه توسعه شود؛ نه اینکه تنها پیش از انتشار چند ابزار امنیتی اجرا شود. مدیریت وابستگی‌ها، بازبینی کد، ثبت تصمیم‌های امنیتی و اصلاح علت ریشه‌ای آسیب‌پذیری‌ها از اجزای این رویکرد هستند.</p>
        <h3>۴. کد حرفه‌ای چه نشانه‌هایی دارد؟</h3>
        <ul>
          <li>نام‌ها و ساختارها هدف کد را روشن می‌کنند و نیاز به حدس‌زدن را کاهش می‌دهند.</li>
          <li>هر بخش مسئولیت مشخصی دارد و تغییر یک قابلیت، بخش‌های نامرتبط را خراب نمی‌کند.</li>
          <li>خطاها مدیریت می‌شوند و سامانه در شرایط غیرعادی رفتار قابل‌پیش‌بینی دارد.</li>
          <li>کد با Git، بازبینی هم‌تیمی و آزمون خودکار قابل ردگیری است.</li>
          <li>تصمیم‌های مهم معماری و روش اجرای پروژه مستند شده‌اند.</li>
        </ul>
        <p>یک مهندس نرم‌افزار خوب تنها از خود نمی‌پرسد «آیا این کد کار می‌کند؟»؛ بلکه می‌پرسد «آیا شش ماه بعد هم می‌توان آن را فهمید، تغییر داد، آزمایش کرد و با اطمینان منتشر کرد؟»</p>
        <div class="article-references"><h3>منابع علمی و استانداردها</h3><a href="https://csrc.nist.gov/pubs/sp/800/218/final" target="_blank" rel="noreferrer">NIST SP 800-218 — Secure Software Development Framework</a><a href="https://www.sei.cmu.edu/library/quality-attributes/" target="_blank" rel="noreferrer">CMU/SEI — Software Quality Attributes</a><a href="https://csed.acm.org/software-development-fundamentals/" target="_blank" rel="noreferrer">ACM/IEEE-CS/AAAI CS2023 — Software Development Fundamentals</a></div>`
    },
    ai: {
      tag: 'هوش مصنوعی',
      title: 'هوش مصنوعی چگونه یاد می‌گیرد و چرا گاهی با اطمینان اشتباه می‌کند؟',
      body: `
        <p class="article-lead">مدل هوش مصنوعی «دانش» را مانند انسان حفظ نمی‌کند؛ با مشاهده داده، پارامترهای عددی خود را طوری تنظیم می‌کند که الگوهای آماری را بهتر بازنمایی کند. همین سازوکار می‌تواند نتایج بسیار قدرتمند بسازد و در عین حال، پاسخ‌هایی کاملاً متقاعدکننده اما نادرست تولید کند.</p>
        <div class="article-highlight"><strong>تصویر ساده:</strong> یادگیری ماشین یعنی یافتن پارامترهایی که خطای پیش‌بینی روی داده‌های آموزشی را کاهش دهند، بدون اینکه مدل فقط همان نمونه‌ها را حفظ کند.</div>
        <h3>۱. داده، مدل و تابع خطا</h3>
        <p>داده شامل نمونه‌هایی است که مدل از آن‌ها الگو می‌گیرد. مدل یک ساختار ریاضی با پارامترهای قابل‌تنظیم است و تابع خطا فاصله میان خروجی مدل و پاسخ مطلوب را اندازه می‌گیرد. الگوریتم آموزش بارها پارامترها را تغییر می‌دهد تا این خطا کمتر شود.</p>
        <h3>۲. چرا داده آموزش و آزمون جدا می‌شوند؟</h3>
        <p>مدلی که فقط داده‌های آموزشی را به‌خوبی حفظ کند ممکن است روی نمونه‌های جدید شکست بخورد؛ این پدیده بیش‌برازش نام دارد. به همین دلیل داده معمولاً به مجموعه آموزش، اعتبارسنجی و آزمون تقسیم می‌شود. معیارهایی مانند دقت، Precision، Recall یا خطای میانگین نیز باید متناسب با مسئله انتخاب شوند.</p>
        <h3>۳. مدل مولد چرا «توهم» دارد؟</h3>
        <p>مدل‌های زبانی توالی واژه‌ها یا توکن‌های محتمل را بر اساس الگوهای آماری تولید می‌کنند. طبق پروفایل هوش مصنوعی مولد NIST، این فرایند می‌تواند به «Confabulation» منجر شود؛ یعنی مدل محتوای نادرست را با اطمینان و ظاهر معتبر ارائه کند. روان‌بودن متن، مدرک صحت آن نیست.</p>
        <h3>۴. یک سامانه هوش مصنوعی معتبر چگونه ارزیابی می‌شود؟</h3>
        <ul>
          <li>کیفیت و نمایندگی داده‌ها بررسی می‌شود تا سوگیری پنهان کاهش یابد.</li>
          <li>مدل روی داده‌های ندیده و سناریوهای مرزی آزمایش می‌شود.</li>
          <li>عدم‌قطعیت، محدودیت‌ها و شرایط نامناسب استفاده مستند می‌شوند.</li>
          <li>امنیت، حریم خصوصی، پایداری و امکان نظارت انسانی سنجیده می‌شوند.</li>
          <li>عملکرد پس از استقرار نیز پایش می‌شود؛ زیرا داده‌های دنیای واقعی تغییر می‌کنند.</li>
        </ul>
        <p>در هوش مصنوعی حرفه‌ای، ساخت مدل پایان کار نیست. مسئله واقعی این است که بدانیم مدل کجا قابل اعتماد است، کجا شکست می‌خورد و چگونه خروجی آن باید توسط انسان و شواهد مستقل بررسی شود.</p>
        <div class="article-references"><h3>منابع علمی و استانداردها</h3><a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noreferrer">NIST AI Risk Management Framework 1.0</a><a href="https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence" target="_blank" rel="noreferrer">NIST AI 600-1 — Generative AI Profile</a><a href="https://airc.nist.gov/" target="_blank" rel="noreferrer">NIST AI Resource Center — Testing and Evaluation Resources</a></div>`
    },
    security: {
      tag: 'امنیت سایبری',
      title: 'فایروال کافی نیست؛ Zero Trust چگونه امنیت مدرن را تغییر داد؟',
      body: `
        <p class="article-lead">مدل سنتی امنیت فرض می‌کرد داخل شبکه سازمان قابل‌اعتماد و بیرون آن خطرناک است. رایانش ابری، دورکاری، تلفن همراه و سرویس‌های توزیع‌شده این مرز را از بین برده‌اند؛ به همین دلیل امنیت مدرن باید هر درخواست دسترسی را بر اساس هویت، دستگاه، زمینه و سطح خطر ارزیابی کند.</p>
        <div class="article-highlight"><strong>اصل Zero Trust:</strong> هیچ کاربر، دستگاه یا سرویس فقط به‌دلیل حضور در شبکه داخلی قابل‌اعتماد نیست؛ اعتماد باید برای هر دسترسی ارزیابی شود.</div>
        <h3>۱. کمترین سطح دسترسی</h3>
        <p>هر کاربر یا سرویس باید فقط به منابع و عملیات ضروری دسترسی داشته باشد. این اصل دامنه خسارت را محدود می‌کند؛ زیرا حتی در صورت سرقت یک حساب، مهاجم نباید بتواند آزادانه در کل سامانه حرکت کند.</p>
        <h3>۲. اعتبارسنجی پیوسته و تصمیم مبتنی بر زمینه</h3>
        <p>ورود موفق در ابتدای روز به معنای اعتماد دائمی نیست. نوع دستگاه، وضعیت امنیتی آن، موقعیت، رفتار غیرعادی، حساسیت منبع و زمان درخواست می‌توانند در تصمیم دسترسی نقش داشته باشند. احراز هویت چندمرحله‌ای تنها یکی از اجزای این معماری است.</p>
        <h3>۳. امنیت شبکه بدون امنیت برنامه ناقص است</h3>
        <p>بخش بزرگی از حملات از منطق برنامه، کنترل دسترسی ضعیف، پیکربندی اشتباه، تزریق و وابستگی‌های آسیب‌پذیر آغاز می‌شوند. OWASP Top 10 یک نمای عملی از مهم‌ترین ریسک‌های برنامه‌های وب ارائه می‌کند. بنابراین فایروال شبکه نمی‌تواند خطای برنامه‌نویسی یا مجوزدهی نادرست را جبران کند.</p>
        <h3>۴. دفاع چندلایه در عمل</h3>
        <ul>
          <li>مدیریت هویت، MFA و سیاست‌های دقیق مجوزدهی</li>
          <li>تفکیک سرویس‌ها و محدودکردن حرکت جانبی</li>
          <li>رمزنگاری داده در انتقال و در حالت ذخیره</li>
          <li>ثبت رخداد، پایش رفتار و پاسخ سریع به حادثه</li>
          <li>توسعه امن نرم‌افزار، اصلاح آسیب‌پذیری و مدیریت وابستگی‌ها</li>
          <li>نسخه پشتیبان آزموده‌شده و برنامه بازیابی</li>
        </ul>
        <p>امنیت یک محصول یا ابزار نیست؛ مجموعه‌ای از تصمیم‌های معماری، فرایندهای انسانی و کنترل‌های فنی است که باید با تغییر سامانه دائماً بازبینی شوند.</p>
        <div class="article-references"><h3>منابع علمی و استانداردها</h3><a href="https://csrc.nist.gov/pubs/sp/800/207/final" target="_blank" rel="noreferrer">NIST SP 800-207 — Zero Trust Architecture</a><a href="https://owasp.org/Top10/2021/" target="_blank" rel="noreferrer">OWASP Top 10:2021 — Web Application Security Risks</a><a href="https://csrc.nist.gov/pubs/sp/800/218/final" target="_blank" rel="noreferrer">NIST SSDF — Secure Software Development</a></div>`
    },
    engineering: {
      tag: 'معماری کامپیوتر',
      title: 'از ترانزیستور تا هوش مصنوعی؛ مهندسی کامپیوتر دقیقاً چه چیزی می‌سازد؟',
      body: `
        <p class="article-lead">مهندسی کامپیوتر در نقطه اتصال برق، سخت‌افزار و نرم‌افزار قرار دارد. یک مهندس کامپیوتر بررسی می‌کند چگونه مدارهای دیجیتال، پردازنده، حافظه، سیستم‌عامل، شبکه و نرم‌افزار با یکدیگر همکاری کنند تا یک سامانه واقعی ساخته شود.</p>
        <div class="article-highlight"><strong>دید سیستمی:</strong> هیچ برنامه‌ای در خلأ اجرا نمی‌شود؛ هر خط کد در نهایت به دستورهای پردازنده، دسترسی حافظه، ورودی‌وخروجی و ارتباط با سیستم‌عامل تبدیل می‌شود.</div>
        <h3>۱. از بیت تا مدار منطقی</h3>
        <p>ترانزیستورها نقش کلیدهای بسیار سریع را دارند. ترکیب آن‌ها گیت‌های منطقی را می‌سازد و گیت‌ها نیز جمع‌کننده، ثبات، واحد کنترل و حافظه را شکل می‌دهند. مدار منطقی نشان می‌دهد چگونه صفر و یک به عملیات واقعی تبدیل می‌شوند.</p>
        <h3>۲. معماری کامپیوتر؛ محل اجرای دستور</h3>
        <p>پردازنده دستور را از حافظه دریافت، رمزگشایی و اجرا می‌کند. کش، خط لوله، چند‌هسته‌ای‌بودن و پیش‌بینی انشعاب برای کاهش زمان انتظار و افزایش کارایی طراحی می‌شوند. مهندس باید میان سرعت، مصرف انرژی، هزینه و پیچیدگی تعادل ایجاد کند.</p>
        <h3>۳. سیستم‌عامل و نرم‌افزار چه نقشی دارند؟</h3>
        <p>سیستم‌عامل پردازنده، حافظه، فایل‌ها و دستگاه‌های ورودی‌وخروجی را مدیریت می‌کند و محیطی امن‌تر برای اجرای برنامه‌ها می‌سازد. کامپایلر نیز کد سطح بالا را به دستورهایی تبدیل می‌کند که معماری پردازنده می‌فهمد. اینجا مرز سخت‌افزار و نرم‌افزار عملاً محو می‌شود.</p>
        <h3>۴. مهندسی کامپیوتر در دنیای واقعی</h3>
        <ul>
          <li>سامانه‌های نهفته در خودرو، تجهیزات پزشکی و لوازم هوشمند</li>
          <li>پردازنده‌ها و شتاب‌دهنده‌های مخصوص هوش مصنوعی</li>
          <li>ربات‌ها، حسگرها و اینترنت اشیا</li>
          <li>شبکه‌ها، مراکز داده و زیرساخت ابری</li>
          <li>سیستم‌های بلادرنگ که باید در زمان مشخص پاسخ دهند</li>
        </ul>
        <p>گزارش درسی مشترک ACM و IEEE Computer Society نشان می‌دهد این رشته ترکیبی از برنامه‌نویسی، الگوریتم، مدار دیجیتال، معماری، سیستم‌های نهفته، شبکه، امنیت، ریاضی و طراحی مهندسی است. ارزش اصلی مهندس کامپیوتر در توانایی دیدن کل سامانه و انتخاب مصالحه مناسب میان اجزای آن است.</p>
        <div class="article-references"><h3>منابع علمی و دانشگاهی</h3><a href="https://www.acm.org/binaries/content/assets/education/ce2016-final-report.pdf" target="_blank" rel="noreferrer">ACM/IEEE-CS — Computer Engineering Curricula 2016</a><a href="https://csed.acm.org/" target="_blank" rel="noreferrer">ACM/IEEE-CS/AAAI — Computer Science Curricula 2023</a><a href="https://ccecc.acm.org/guidance/computer-engineering" target="_blank" rel="noreferrer">ACM CCECC — Computer Engineering Guidance</a></div>`
    }
  };

  const modal = document.querySelector('.article-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalTag = document.querySelector('.modal-tag');
  const modalBody = document.querySelector('.modal-body');

  const openArticle = (key) => {
    const article = articleData[key];
    if (!article || !modal) return;
    modalTitle.textContent = article.title;
    modalTag.textContent = article.tag;
    modalBody.innerHTML = article.body;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    modal.querySelector('.modal-close')?.focus();
  };

  const closeArticle = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  };

  document.querySelectorAll('[data-article]').forEach((card) => {
    const key = card.dataset.article;
    card.addEventListener('click', (event) => {
      if (event.target.closest('button') || event.currentTarget === card) openArticle(key);
    });
    card.querySelector('button')?.addEventListener('click', (event) => {
      event.stopPropagation();
      openArticle(key);
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeArticle));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeArticle();
  });

  document.querySelector('[data-show-all]')?.addEventListener('click', () => {
    document.querySelector('.article-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
