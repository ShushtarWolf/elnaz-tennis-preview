/* Elnaz admin & finance panel (Phase 2). Vanilla JS SPA, hash routes.
   Persian-first (RTL, Shamsi dates, Toman with Persian digits) with English. */
(() => {
  const J = window.Jalali;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let LANG = localStorage.getItem('adminLang') || 'fa';
  let CSRF = null, PROGRAMS = [];

  // ---------------- i18n ----------------
  const T = {
    fa: {
      title: 'پنل مدیریت', sub: 'الناز خان‌بیگی', dashboard: 'داشبورد', students: 'شاگردان', packages: 'بسته‌ها', finance: 'مالی', schedule: 'برنامه زمانی',
      logout: 'خروج', login: 'ورود', password: 'رمز مدیریت', wrongPw: 'رمز اشتباه است', tooMany: 'تلاش‌های زیاد. ۱۵ دقیقه بعد دوباره امتحان کنید.',
      toman: 'تومان', monthIncome: 'درآمد این ماه', monthExpenses: 'هزینه این ماه', monthProfit: 'سود این ماه', outstanding: 'بدهی معوق شاگردان', debtorsN: (n) => `${n} بدهکار`,
      activeStudents: 'شاگردان فعال', pendingWeb: 'رزرو آنلاین در انتظار تأیید', todaySessions: 'جلسات امروز', upcoming: 'جلسات ۷ روز آینده', expiring: 'بسته‌های رو به اتمام',
      topDebtors: 'بیشترین بدهی', none: 'موردی نیست', name: 'نام', phone: 'تلفن', type: 'نوع', kid: 'کودک', adult: 'بزرگسال', parent: 'نام ولی (برای کودک)',
      program: 'کلاس', notes: 'یادداشت', balance: 'مانده', credits: 'اعتبار جلسه', lastSession: 'آخرین جلسه', search: 'جستجوی نام یا تلفن…', addStudent: 'افزودن شاگرد',
      save: 'ذخیره', saved: 'ذخیره شد', add: 'افزودن', date: 'تاریخ', time: 'ساعت', status: 'وضعیت', amount: 'مبلغ (تومان)', method: 'روش', note: 'توضیح',
      charged: 'کل بدهکاری', paid: 'کل پرداختی', debt: 'بدهکار', creditBal: 'بستانکار', settled: 'تسویه',
      sessions: 'جلسات', addSession: 'افزودن جلسه', price: 'مبلغ جلسه (تومان)', priceOpt: 'مبلغ جلسه (اختیاری)', payments: 'پرداخت‌ها', recordPayment: 'ثبت پرداخت',
      charges: 'بدهکاری‌ها', addCharge: 'بدهکاری دیگر', sellPackage: 'فروش بسته', packageType: 'نوع بسته', start: 'شروع', expires: 'انقضا', remaining: 'باقی‌مانده',
      st: { pending: 'در انتظار', confirmed: 'تأییدشده', completed: 'حاضر', no_show: 'غایب', cancelled: 'لغو' },
      pk: { active: 'فعال', expired: 'منقضی', used_up: 'تمام‌شده' },
      m: { cash: 'نقدی', card: 'کارت‌به‌کارت', transfer: 'انتقال بانکی' },
      cat: { court_rent: 'اجاره زمین', balls: 'توپ', equipment: 'تجهیزات', other: 'سایر' },
      kind: { package: 'بسته', session: 'جلسه', other: 'سایر' },
      viaCredit: 'از اعتبار بسته', charge: 'هزینه', web: 'سایت', admin: 'دستی',
      pkgTypes: 'انواع بسته', newPkg: 'تعریف بسته جدید', pkgName: 'نام بسته', pkgNameEn: 'نام انگلیسی (اختیاری)', nSessions: 'تعداد جلسات', validity: 'اعتبار (روز)', anyProgram: 'همه کلاس‌ها',
      sold: 'فروخته‌شده', active: 'فعال', inactive: 'غیرفعال', deactivate: 'غیرفعال‌کردن', activate: 'فعال‌کردن',
      pricesNote: 'قیمت‌ها هنوز مشخص نیست: الناز باید مبلغ بسته‌ها و جلسات تکی را خودش وارد کند.', sessionPrices: 'قیمت پیش‌فرض جلسه تکی', noShowRule: 'جلسه غایب از اعتبار/هزینه کم شود',
      noShowPh: 'قانون غیبت را الناز تعیین کند', report: 'گزارش ماهانه', expenses: 'هزینه‌ها', allPayments: 'همه پرداخت‌ها', debtors: 'بدهکاران', year: 'سال',
      income: 'درآمد', profit: 'سود', month: 'ماه', total: 'جمع', csv: 'خروجی CSV', category: 'دسته', addExpense: 'ثبت هزینه', student: 'شاگرد', choose: 'انتخاب کنید…',
      del: 'حذف', confirmDel: 'حذف شود؟', priceNeeded: 'این شاگرد بسته فعال ندارد. مبلغ جلسه را وارد کنید (تومان):', slotTaken: 'این زمان قبلاً رزرو شده است',
      phoneExists: 'این شماره قبلاً ثبت شده است', invalid: 'لطفاً ورودی‌ها را بررسی کنید', err: 'خطا', open: 'باز کردن', back: '→ شاگردان',
      slots: 'زمان‌های خالی پیش رو', webBookings: 'رزروهای سایت', addSlot: 'افزودن زمان خالی', clearEx: 'حذف زمان‌های نمونه', example: 'نمونه', free: 'خالی', booked: 'رزرو',
      startTime: 'ساعت شروع', duration: 'مدت (دقیقه)', location: 'محل (اختیاری)', recurring: 'برنامه تکراری', from: 'از', to: 'تا', times: 'ساعت‌ها (با کاما)', create: 'ساخت',
      dateHint: 'مثلاً ۱۴۰۵/۰۷/۲۵', profile: 'مشخصات', noPackage: 'بسته‌ای ثبت نشده', payNow: 'پرداخت همزمان (اختیاری)',
    },
    en: {
      title: 'Admin panel', sub: 'Elnaz Khanbeygi', dashboard: 'Dashboard', students: 'Students', packages: 'Packages', finance: 'Finance', schedule: 'Schedule',
      logout: 'Log out', login: 'Log in', password: 'Admin password', wrongPw: 'Wrong password', tooMany: 'Too many attempts. Try again in 15 minutes.',
      toman: 'Toman', monthIncome: 'Income this month', monthExpenses: 'Expenses this month', monthProfit: 'Profit this month', outstanding: 'Outstanding student debt', debtorsN: (n) => `${n} debtor${n === 1 ? '' : 's'}`,
      activeStudents: 'Active students', pendingWeb: 'Web bookings awaiting confirmation', todaySessions: "Today's sessions", upcoming: 'Next 7 days', expiring: 'Packages running out',
      topDebtors: 'Top debts', none: 'Nothing here', name: 'Name', phone: 'Phone', type: 'Type', kid: 'Kid', adult: 'Adult', parent: 'Parent name (kids)',
      program: 'Program', notes: 'Notes', balance: 'Balance', credits: 'Credits', lastSession: 'Last session', search: 'Search name or phone…', addStudent: 'Add student',
      save: 'Save', saved: 'Saved', add: 'Add', date: 'Date', time: 'Time', status: 'Status', amount: 'Amount (Toman)', method: 'Method', note: 'Note',
      charged: 'Total charged', paid: 'Total paid', debt: 'Owes', creditBal: 'In credit', settled: 'Settled',
      sessions: 'Sessions', addSession: 'Add session', price: 'Session price (Toman)', priceOpt: 'Session price (optional)', payments: 'Payments', recordPayment: 'Record payment',
      charges: 'Charges', addCharge: 'Other charge', sellPackage: 'Sell package', packageType: 'Package', start: 'Start', expires: 'Expires', remaining: 'Remaining',
      st: { pending: 'Pending', confirmed: 'Confirmed', completed: 'Attended', no_show: 'No-show', cancelled: 'Cancelled' },
      pk: { active: 'Active', expired: 'Expired', used_up: 'Used up' },
      m: { cash: 'Cash', card: 'Card-to-card', transfer: 'Bank transfer' },
      cat: { court_rent: 'Court rent', balls: 'Balls', equipment: 'Equipment', other: 'Other' },
      kind: { package: 'Package', session: 'Session', other: 'Other' },
      viaCredit: 'From package credit', charge: 'Charge', web: 'Web', admin: 'Manual',
      pkgTypes: 'Package types', newPkg: 'New package type', pkgName: 'Name (Persian)', pkgNameEn: 'Name (English, optional)', nSessions: 'Sessions', validity: 'Valid for (days)', anyProgram: 'Any program',
      sold: 'Sold', active: 'Active', inactive: 'Inactive', deactivate: 'Deactivate', activate: 'Activate',
      pricesNote: 'Prices are not known yet: Elnaz enters package and single-session prices herself.', sessionPrices: 'Default single-session price', noShowRule: 'No-shows use a credit / are charged',
      noShowPh: 'No-show policy: Elnaz to decide', report: 'Monthly report', expenses: 'Expenses', allPayments: 'All payments', debtors: 'Debtors', year: 'Year',
      income: 'Income', profit: 'Profit', month: 'Month', total: 'Total', csv: 'Export CSV', category: 'Category', addExpense: 'Add expense', student: 'Student', choose: 'Choose…',
      del: 'Delete', confirmDel: 'Delete this?', priceNeeded: 'This student has no active package. Enter the session price (Toman):', slotTaken: 'That time is already booked',
      phoneExists: 'This phone number already exists', invalid: 'Please check the fields', err: 'Error', open: 'Open', back: '← Students',
      slots: 'Upcoming free slots', webBookings: 'Website bookings', addSlot: 'Add a free slot', clearEx: 'Remove example slots', example: 'example', free: 'Free', booked: 'Booked',
      startTime: 'Start time', duration: 'Duration (min)', location: 'Location (optional)', recurring: 'Recurring schedule', from: 'From', to: 'To', times: 'Times (comma separated)', create: 'Create',
      dateHint: '', profile: 'Profile', noPackage: 'No packages yet', payNow: 'Paid now (optional)',
    },
  };
  const t = (k) => T[LANG][k] ?? k;
  const fa = () => LANG === 'fa';
  const digits = (s) => (fa() ? String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(s));
  const nf = () => new Intl.NumberFormat(fa() ? 'fa-IR' : 'en-US');
  const money = (n, unit = true) => `${nf().format(n || 0)}${unit ? ' ' + t('toman') : ''}`;
  const big = (n) => `${nf().format(n || 0)}<small>${t('toman')}</small>`;
  const dateFmt = (iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => iso ? new Intl.DateTimeFormat(fa() ? 'fa-IR-u-ca-persian' : 'en-GB', { timeZone: 'UTC', ...opts }).format(new Date(iso + 'T00:00:00Z')) : '';
  const dateShort = (iso) => dateFmt(iso, { weekday: 'short', day: 'numeric', month: 'short' });
  const progName = (code) => { const p = PROGRAMS.find((x) => x.code === code); return p ? (fa() ? p.name_fa : p.name_en) : (code || '—'); };
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());

  // date field: Jalali text in fa, native date in en. Value always read back as ISO.
  const dateField = (name, iso = today(), label = t('date')) => fa()
    ? `<label class="l">${label}<input name="${name}" data-jdate value="${digits(J.format(iso))}" placeholder="${t('dateHint')}" inputmode="numeric" dir="ltr" required></label>`
    : `<label class="l">${label}<input name="${name}" type="date" value="${iso}" required></label>`;
  const amountField = (name, label = t('amount'), req = true, val = '') => `<label class="l">${label}<input name="${name}" data-amount inputmode="numeric" dir="ltr" ${req ? 'required' : ''} value="${val}" autocomplete="off"></label>`;
  const programOptions = (sel, any) => (any ? `<option value="">${any}</option>` : '') + PROGRAMS.map((p) => `<option value="${p.code}" ${p.code === sel ? 'selected' : ''}>${esc(fa() ? p.name_fa : p.name_en)}</option>`).join('');
  function readForm(form) {
    const o = {};
    for (const el of form.elements) {
      if (!el.name || el.type === 'submit') continue;
      if (el.type === 'checkbox') { o[el.name] = el.checked; continue; }
      if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; continue; }
      if (el.hasAttribute('data-jdate')) { const iso = J.parse(el.value); el.setAttribute('aria-invalid', iso ? 'false' : 'true'); o[el.name] = iso || '__bad'; continue; }
      o[el.name] = el.value;
    }
    return o;
  }
  // live thousand separators in amount inputs
  document.addEventListener('input', (e) => {
    const el = e.target; if (!el.hasAttribute || !el.hasAttribute('data-amount')) return;
    const raw = el.value.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g, '');
    el.value = raw ? digits(Number(raw).toLocaleString('en-US')) : '';
  });

  // ---------------- API ----------------
  async function api(path, opts = {}) {
    const r = await fetch('/api/admin' + path, { method: opts.method || 'GET', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(CSRF ? { 'x-csrf-token': CSRF } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
    if (r.status === 401 && path !== '/login') { CSRF = null; renderLogin(); throw new Error('unauthorized'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'error'); e.status = r.status; e.fields = j.fields; throw e; }
    return j;
  }
  const post = (p, body) => api(p, { method: 'POST', body });
  const patch = (p, body) => api(p, { method: 'PATCH', body });
  const del = (p) => api(p, { method: 'DELETE' });
  function toast(msg, err) { const el = $('#toast'); el.textContent = msg; el.className = 'toast on' + (err ? ' err' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => el.className = 'toast', 3200); }
  function showErr(e, form) {
    if (e.message === 'unauthorized') return;
    const map = { slot_taken: t('slotTaken'), phone_exists: t('phoneExists'), validation: t('invalid'), price_required: t('priceNeeded') };
    if (form && e.fields) Object.keys(e.fields).forEach((k) => { const el = form.elements[k]; if (el) el.setAttribute('aria-invalid', 'true'); });
    toast(map[e.message] || `${t('err')}: ${e.message}`, true);
  }
  function bindForm(form, fn) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault(); $$('[aria-invalid=true]', form).forEach((x) => x.setAttribute('aria-invalid', 'false'));
      const data = readForm(form);
      if (Object.values(data).includes('__bad')) return toast(t('invalid'), true);
      const btn = $('button[type=submit],button:not([type])', form); if (btn) btn.disabled = true;
      try { await fn(data, form); } catch (e) { showErr(e, form); }
      if (btn) btn.disabled = false;
    });
  }

  // ---------------- shell ----------------
  function setLang(l) { LANG = l; localStorage.setItem('adminLang', l); document.documentElement.lang = l; document.documentElement.dir = l === 'fa' ? 'rtl' : 'ltr'; document.title = `${t('title')} | ${t('sub')}`; }
  function renderLogin(msg = '') {
    $('#root').innerHTML = `<div class="login"><form class="card f" id="loginF" style="grid-template-columns:1fr">
      <div class="brand" style="color:var(--navy)"><i></i><div>${t('title')}<small>${t('sub')}</small></div></div>
      <label class="l">${t('password')}<input type="password" name="password" required autocomplete="current-password" autofocus></label>
      <button class="btn ball" type="submit">${t('login')}</button>
      <p class="muted small" id="loginMsg">${esc(msg)}</p>
      <button type="button" class="btn line sm" id="lt">${fa() ? 'English' : 'فارسی'}</button></form></div>`;
    $('#lt').onclick = () => { setLang(fa() ? 'en' : 'fa'); renderLogin(); };
    $('#loginF').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { const r = await post('/login', { password: e.target.password.value }); CSRF = r.csrf; await boot(); }
      catch (err) { $('#loginMsg').textContent = err.status === 429 ? t('tooMany') : t('wrongPw'); }
    });
  }
  const NAV = [['dashboard', '◉'], ['students', '👥'], ['packages', '🎟'], ['finance', '₸'], ['schedule', '📅']];
  function shell(active, html) {
    $('#root').innerHTML = `<div class="layout"><aside class="side">
      <div class="brand"><i></i><div>${t('title')}<small>${t('sub')}</small></div></div>
      ${NAV.map(([k, ic]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}"><span aria-hidden="true">${ic}</span>${t(k)}</a>`).join('')}
      <div class="grow"></div>
      <div class="tools"><button id="langB">${fa() ? 'EN' : 'فا'}</button><button id="outB">${t('logout')}</button></div>
    </aside><main id="main">${html}</main></div>`;
    $('#langB').onclick = () => { setLang(fa() ? 'en' : 'fa'); route(); };
    $('#outB').onclick = async () => { try { await post('/logout'); } catch (e) {} CSRF = null; renderLogin(); };
  }
  const statusPill = (s) => `<span class="pill ${{ completed: 'green', no_show: 'red', cancelled: 'gray', pending: 'yellow', confirmed: 'blue' }[s]}">${t('st')[s]}</span>`;
  const balPill = (b) => b > 0 ? `<span class="pill red num">${t('debt')} ${money(b)}</span>` : b < 0 ? `<span class="pill green num">${t('creditBal')} ${money(-b)}</span>` : `<span class="pill gray">${t('settled')}</span>`;
  const attButtons = (b) => `<span class="att" data-bid="${b.id}">${['completed', 'no_show', 'cancelled'].map((s) => `<button type="button" data-st="${s}" class="${s}${b.status === s ? ' on' : ''}">${t('st')[s]}</button>`).join('')}</span>`;
  async function onAttendance(e, refresh) {
    const btn = e.target.closest('.att button'); if (!btn) return;
    const id = btn.closest('.att').dataset.bid; let status = btn.dataset.st;
    if (btn.classList.contains('on')) status = 'confirmed'; // click again to undo
    try { await patch(`/bookings/${id}`, { status }); }
    catch (err) {
      if (err.message !== 'price_required') return showErr(err);
      const v = prompt(t('priceNeeded')); if (v === null) return;
      try { await patch(`/bookings/${id}`, { status, price: v }); } catch (e2) { return showErr(e2); }
    }
    toast(t('saved')); refresh();
  }

  // ---------------- views ----------------
  async function viewDashboard() {
    const d = await api('/dashboard');
    const profit = d.month.income - d.month.expenses;
    const sessRow = (s, showDate) => `<tr><td class="num">${showDate ? dateShort(s.date) + ' · ' : ''}${digits(s.start_time)}</td>
      <td><a href="#/student/${s.student_id}">${esc(s.full_name)}</a></td><td>${progName(s.program_code)}</td><td>${statusPill(s.status)}</td><td>${attButtons(s)}</td></tr>`;
    shell('dashboard', `
      <div class="head"><h1>${t('dashboard')}</h1><span class="muted">${dateFmt(d.today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      <div class="stats">
        <div class="stat hl"><span>${t('monthIncome')}</span><b class="num">${big(d.month.income)}</b></div>
        <div class="stat"><span>${t('monthExpenses')}</span><b class="num">${big(d.month.expenses)}</b></div>
        <div class="stat ${profit >= 0 ? 'pos' : 'neg'}"><span>${t('monthProfit')}</span><b class="num">${big(profit)}</b></div>
        <div class="stat neg"><span>${t('outstanding')}</span><b class="num">${big(d.outstanding)}</b><span>${digits(t('debtorsN')(d.debtors_count))}</span></div>
        <div class="stat"><span>${t('activeStudents')}</span><b>${digits(d.students_count)}</b></div>
        <div class="stat"><span>${t('pendingWeb')}</span><b>${digits(d.pending_web_bookings)}</b></div>
      </div>
      <div class="grid g2">
        <section class="card"><h2>${t('todaySessions')}</h2><div class="tw"><table><tbody>${d.today_sessions.map((s) => sessRow(s)).join('') || `<tr><td class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>
        <section class="card"><h2>${t('topDebtors')} <a href="#/finance/debtors" class="small">${t('debtors')}</a></h2><div class="list">${d.top_debtors.map((s) => `<a class="item" href="#/student/${s.id}" style="text-decoration:none;color:inherit"><b>${esc(s.full_name)}</b>${balPill(s.balance)}</a>`).join('') || `<p class="empty">${t('none')}</p>`}</div></section>
        <section class="card"><h2>${t('upcoming')}</h2><div class="tw"><table><tbody>${d.upcoming_sessions.slice(0, 25).map((s) => sessRow(s, true)).join('') || `<tr><td class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>
        <section class="card"><h2>${t('expiring')}</h2><div class="list">${d.expiring_packages.map((p) => `<a class="item" href="#/student/${p.student_id}" style="text-decoration:none;color:inherit"><span><b>${esc(p.full_name)}</b> <span class="muted small">${esc(fa() ? p.name_fa : (p.name_en || p.name_fa))}</span></span><span class="small">${digits(p.remaining)} ${t('remaining')} · ${dateShort(p.expires_at)}</span></a>`).join('') || `<p class="empty">${t('none')}</p>`}</div></section>
      </div>`);
    $('#main').addEventListener('click', (e) => onAttendance(e, viewDashboard));
  }

  async function viewStudents() {
    const q = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';
    const list = await api('/students' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    shell('students', `
      <div class="head"><h1>${t('students')}</h1><input id="q" placeholder="${t('search')}" value="${esc(q)}" style="max-width:320px"></div>
      <section class="card" style="margin-bottom:1rem"><h2>${t('addStudent')}</h2>
        <form class="f" id="addS">
          <label class="l">${t('name')}<input name="full_name" required></label>
          <label class="l">${t('phone')}<input name="phone" required dir="ltr" inputmode="tel" placeholder="09xx xxx xxxx"></label>
          <label class="l">${t('type')}<select name="student_type"><option value="adult">${t('adult')}</option><option value="kid">${t('kid')}</option></select></label>
          <label class="l">${t('parent')}<input name="parent_name"></label>
          <label class="l">${t('program')}<select name="program_code">${programOptions('', '—')}</select></label>
          <label class="l">${t('notes')}<input name="notes"></label>
          <button class="btn ball" type="submit">${t('add')}</button>
        </form></section>
      <section class="card"><div class="tw"><table>
        <thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('type')}</th><th>${t('program')}</th><th>${t('credits')}</th><th>${t('lastSession')}</th><th>${t('balance')}</th></tr></thead>
        <tbody>${list.map((s) => `<tr><td><a href="#/student/${s.id}"><b>${esc(s.full_name)}</b></a>${s.parent_name ? `<div class="muted small">${t('parent').split(' (')[0]}: ${esc(s.parent_name)}</div>` : ''}</td>
          <td><span class="ltr num">${digits(esc(s.phone))}</span></td><td>${s.student_type === 'kid' ? t('kid') : t('adult')}</td><td>${progName(s.program_code)}</td>
          <td>${s.credits ? `<span class="pill green">${digits(s.credits)}</span>` : '—'}</td><td class="num">${s.last_session ? dateShort(s.last_session) : '—'}</td><td>${balPill(s.balance)}</td></tr>`).join('') || `<tr><td colspan="7" class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>`);
    let tm; $('#q').addEventListener('input', (e) => { clearTimeout(tm); tm = setTimeout(() => { location.hash = '#/students' + (e.target.value ? `?q=${encodeURIComponent(e.target.value)}` : ''); }, 350); });
    if (q) { const el = $('#q'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    bindForm($('#addS'), async (d) => { const r = await post('/students', d); toast(t('saved')); location.hash = `#/student/${r.id}`; });
  }

  async function viewStudent(id) {
    const [d, types] = await Promise.all([api(`/students/${id}`), api('/package-types')]);
    const s = d.student;
    const activeTypes = types.filter((x) => x.active);
    shell('students', `
      <div class="head"><div class="prof"><div class="avatar">${esc(s.full_name.trim()[0] || '?')}</div><div><a href="#/students" class="small">${t('back')}</a><h1>${esc(s.full_name)}</h1></div></div>
        <div>${balPill(d.balance)}</div></div>
      <div class="stats">
        <div class="stat"><span>${t('charged')}</span><b class="num">${big(d.charged)}</b></div>
        <div class="stat pos"><span>${t('paid')}</span><b class="num">${big(d.paid)}</b></div>
        <div class="stat ${d.balance > 0 ? 'neg' : 'pos'}"><span>${t('balance')}</span><b class="num">${big(Math.abs(d.balance))}</b><span>${d.balance > 0 ? t('debt') : d.balance < 0 ? t('creditBal') : t('settled')}</span></div>
        <div class="stat hl"><span>${t('credits')}</span><b>${digits(d.packages.filter((p) => p.state === 'active').reduce((a, p) => a + p.remaining, 0))}</b></div>
      </div>
      <div class="grid g2">
        <section class="card"><h2>${t('profile')}</h2>
          <form class="f" id="prof">
            <label class="l">${t('name')}<input name="full_name" value="${esc(s.full_name)}" required></label>
            <label class="l">${t('phone')}<input name="phone" value="${esc(s.phone)}" dir="ltr" required></label>
            <label class="l">${t('type')}<select name="student_type"><option value="adult" ${s.student_type === 'adult' ? 'selected' : ''}>${t('adult')}</option><option value="kid" ${s.student_type === 'kid' ? 'selected' : ''}>${t('kid')}</option></select></label>
            <label class="l">${t('parent')}<input name="parent_name" value="${esc(s.parent_name || '')}"></label>
            <label class="l">${t('program')}<select name="program_code">${programOptions(s.program_code, '—')}</select></label>
            <label class="l full">${t('notes')}<textarea name="notes" rows="2">${esc(s.notes || '')}</textarea></label>
            <button class="btn" type="submit">${t('save')}</button>
          </form></section>
        <section class="card"><h2>${t('packages')}</h2>
          <div class="list" style="margin-bottom:1rem">${d.packages.map((p) => `<div class="item"><span><b><bdi>${esc(fa() ? p.name_fa : (p.name_en || p.name_fa))}</bdi></b> <span class="pill ${{ active: 'green', expired: 'gray', used_up: 'yellow' }[p.state]}">${t('pk')[p.state]}</span>
              <div class="small muted">${t('start')} ${dateShort(p.start_date)} · ${t('expires')} ${dateShort(p.expires_at)} · ${money(p.price)}</div></span>
              <span style="text-align:center"><b>${digits(p.remaining)}</b><span class="muted">/${digits(p.sessions_total)}</span><div class="bar"><i style="width:${(p.remaining / p.sessions_total) * 100}%"></i></div></span></div>`).join('') || `<p class="muted">${t('noPackage')}</p>`}</div>
          ${activeTypes.length ? `<form class="f" id="sell">
            <label class="l">${t('packageType')}<select name="package_type_id" required>${activeTypes.map((x) => `<option value="${x.id}">${esc(fa() ? x.name_fa : (x.name_en || x.name_fa))} · ${digits(x.sessions)} · ${money(x.price)}</option>`).join('')}</select></label>
            ${dateField('start_date', today(), t('start'))}
            ${amountField('pay_amount', t('payNow'), false)}
            <label class="l">${t('method')}<select name="pay_method">${Object.entries(t('m')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
            <button class="btn ball" type="submit">${t('sellPackage')}</button></form>` : `<a href="#/packages" class="btn line sm">${t('newPkg')}</a>`}
        </section>
      </div>
      <section class="card" style="margin-top:1rem"><h2>${t('sessions')}</h2>
        <form class="f" id="addSess" style="margin-bottom:1rem">
          ${dateField('date')}
          <label class="l">${t('time')}<input type="time" name="start_time" value="16:00" required></label>
          <label class="l">${t('program')}<select name="program_code">${programOptions(s.program_code)}</select></label>
          ${amountField('price', t('priceOpt'), false)}
          <button class="btn" type="submit">${t('addSession')}</button></form>
        <div class="tw"><table><thead><tr><th>${t('date')}</th><th>${t('time')}</th><th>${t('program')}</th><th>${t('status')}</th><th></th><th>${t('charge')}</th></tr></thead>
        <tbody>${d.sessions.map((b) => `<tr><td class="num">${dateShort(b.date)}</td><td class="num">${digits(b.start_time)}</td><td>${progName(b.program_code)} <span class="pill gray">${t(b.source)}</span></td>
          <td>${statusPill(b.status)}</td><td>${attButtons(b)}</td>
          <td class="small">${b.package_id ? `<span class="pill green">${t('viaCredit')}</span>` : b.charge ? `<span class="num">${money(b.charge)}</span>` : '—'}</td></tr>`).join('') || `<tr><td colspan="6" class="empty">${t('none')}</td></tr>`}</tbody></table></div>
      </section>
      <div class="grid g2" style="margin-top:1rem">
        <section class="card"><h2>${t('payments')}</h2>
          <form class="f" id="pay" style="margin-bottom:1rem">${amountField('amount')}
            <label class="l">${t('method')}<select name="method">${Object.entries(t('m')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
            ${dateField('date')}<label class="l">${t('note')}<input name="note"></label>
            <button class="btn ball" type="submit">${t('recordPayment')}</button></form>
          <div class="tw"><table><tbody>${d.payments.map((p) => `<tr><td class="num">${dateShort(p.date)}</td><td class="num"><b>${money(p.amount)}</b></td><td>${t('m')[p.method]}</td><td class="small muted">${esc(p.note || '')}</td>
            <td><button class="btn danger sm" data-delpay="${p.id}">${t('del')}</button></td></tr>`).join('') || `<tr><td class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>
        <section class="card"><h2>${t('charges')}</h2>
          <form class="f" id="chg" style="margin-bottom:1rem">${amountField('amount')}<label class="l">${t('note')}<input name="description"></label>${dateField('date')}
            <button class="btn line" type="submit">${t('addCharge')}</button></form>
          <div class="tw"><table><tbody>${d.charges.map((c) => `<tr><td class="num">${dateShort(c.date)}</td><td class="num">${money(c.amount)}</td><td><span class="pill">${t('kind')[c.kind]}</span></td><td class="small muted">${esc(c.description || '')}</td>
            <td>${c.kind === 'other' ? `<button class="btn danger sm" data-delchg="${c.id}">${t('del')}</button>` : ''}</td></tr>`).join('') || `<tr><td class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>
      </div>`);
    const again = () => viewStudent(id);
    $('#main').addEventListener('click', async (e) => {
      if (e.target.closest('.att')) return onAttendance(e, again);
      const dp = e.target.dataset.delpay, dc = e.target.dataset.delchg;
      if ((dp || dc) && confirm(t('confirmDel'))) { try { await del(dp ? `/payments/${dp}` : `/charges/${dc}`); toast(t('saved')); again(); } catch (err) { showErr(err); } }
    });
    bindForm($('#prof'), async (v) => { await patch(`/students/${id}`, v); toast(t('saved')); again(); });
    if ($('#sell')) bindForm($('#sell'), async (v) => {
      await post(`/students/${id}/packages`, { package_type_id: Number(v.package_type_id), start_date: v.start_date, payment: v.pay_amount ? { amount: v.pay_amount, method: v.pay_method } : null });
      toast(t('saved')); again();
    });
    bindForm($('#addSess'), async (v) => { await post(`/students/${id}/sessions`, v); toast(t('saved')); again(); });
    bindForm($('#pay'), async (v) => { await post('/payments', { ...v, student_id: id }); toast(t('saved')); again(); });
    bindForm($('#chg'), async (v) => { await post(`/students/${id}/charges`, v); toast(t('saved')); again(); });
  }

  async function viewPackages() {
    const [types, settings] = await Promise.all([api('/package-types'), api('/settings')]);
    PROGRAMS = await api('/programs');
    shell('packages', `
      <div class="head"><h1>${t('packages')}</h1></div>
      <div class="note">⚠️ ${t('pricesNote')}</div>
      <div class="grid g2">
        <section class="card"><h2>${t('newPkg')}</h2>
          <form class="f" id="newPkg">
            <label class="l">${t('pkgName')}<input name="name_fa" required placeholder="${fa() ? 'مثلاً بسته ۸ جلسه' : 'e.g. بسته ۸ جلسه'}"></label>
            <label class="l">${t('pkgNameEn')}<input name="name_en" dir="ltr"></label>
            <label class="l">${t('nSessions')}<input name="sessions" inputmode="numeric" required dir="ltr"></label>
            ${amountField('price', t('amount'))}
            <label class="l">${t('validity')}<input name="validity_days" inputmode="numeric" required dir="ltr" value="${digits(45)}"></label>
            <label class="l">${t('program')}<select name="program_code">${programOptions('', t('anyProgram'))}</select></label>
            <button class="btn ball" type="submit">${t('add')}</button></form></section>
        <section class="card"><h2>${t('sessionPrices')}</h2>
          <form class="f" id="prices" style="grid-template-columns:1fr 1fr">${PROGRAMS.map((p) => amountField(`p_${p.code}`, esc(fa() ? p.name_fa : p.name_en), false, p.price_amount != null ? digits(Number(p.price_amount).toLocaleString('en-US')) : '')).join('')}
            <button class="btn" type="submit">${t('save')}</button></form>
          <hr style="border:0;border-top:1px solid var(--line);margin:1rem 0">
          <label class="l" style="flex-direction:row;align-items:center;gap:.6rem"><input type="checkbox" id="ns" style="width:auto" ${settings.no_show_charges === '1' ? 'checked' : ''}> ${t('noShowRule')}</label>
          <p><span class="ph">${t('noShowPh')}</span></p></section>
      </div>
      <section class="card" style="margin-top:1rem"><h2>${t('pkgTypes')}</h2><div class="tw"><table>
        <thead><tr><th>${t('pkgName')}</th><th>${t('nSessions')}</th><th>${t('amount')}</th><th>${t('validity')}</th><th>${t('program')}</th><th>${t('sold')}</th><th>${t('status')}</th><th></th></tr></thead>
        <tbody>${types.map((x) => `<tr><td><b>${esc(x.name_fa)}</b>${x.name_en ? `<div class="muted small" dir="auto">${esc(x.name_en)}</div>` : ''}</td><td>${digits(x.sessions)}</td><td class="num">${money(x.price)}</td><td>${digits(x.validity_days)}</td>
          <td>${x.program_code ? progName(x.program_code) : t('anyProgram')}</td><td>${digits(x.sold)}</td><td>${x.active ? `<span class="pill green">${t('active')}</span>` : `<span class="pill gray">${t('inactive')}</span>`}</td>
          <td><button class="btn line sm" data-tog="${x.id}" data-act="${x.active ? 0 : 1}">${x.active ? t('deactivate') : t('activate')}</button></td></tr>`).join('') || `<tr><td colspan="8" class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>`);
    bindForm($('#newPkg'), async (v) => { await post('/package-types', v); toast(t('saved')); viewPackages(); });
    bindForm($('#prices'), async (v) => { for (const p of PROGRAMS) await patch(`/programs/${p.code}`, { price_amount: v[`p_${p.code}`] }); toast(t('saved')); viewPackages(); });
    $('#ns').onchange = async (e) => { try { await patch('/settings', { no_show_charges: e.target.checked }); toast(t('saved')); } catch (err) { showErr(err); } };
    $('#main').addEventListener('click', async (e) => { const b = e.target.dataset.tog; if (b) { await patch(`/package-types/${b}`, { active: e.target.dataset.act === '1' }); viewPackages(); } });
  }

  function chart(months) {
    const W = 760, H = 260, P = { l: 70, r: 12, t: 14, b: 34 }, n = 12;
    const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expenses)));
    const minP = Math.min(0, ...months.map((m) => m.profit));
    const top = max, bottom = minP, span = top - bottom || 1;
    const y = (v) => P.t + (top - v) * (H - P.t - P.b) / span;
    const cw = (W - P.l - P.r) / n, bw = cw * 0.32;
    const names = fa() ? J.MONTHS_FA : J.MONTHS_EN;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => bottom + f * span);
    const short = (v) => { const a = Math.abs(v); const s = a >= 1e6 ? (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + (fa() ? ' م' : 'M') : a >= 1e3 ? Math.round(v / 1e3) + (fa() ? ' ه' : 'k') : Math.round(v); return digits(s); };
    // draw in LTR coordinate space; in RTL mirror months so Farvardin sits on the right
    const xi = (i) => fa() ? P.l + (n - 1 - i) * cw : P.l + i * cw;
    let g = ticks.map((v) => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e1e6f4"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#5b6585">${short(v)}</text>`).join('');
    g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(0)}" y2="${y(0)}" stroke="#9aa3c0"/>`;
    months.forEach((m, i) => {
      const x = xi(i);
      g += `<rect x="${x + cw / 2 - bw - 1}" y="${y(m.income)}" width="${bw}" height="${Math.max(0, y(0) - y(m.income))}" rx="3" fill="#2447ff"><title>${names[i]}: ${money(m.income)}</title></rect>`;
      g += `<rect x="${x + cw / 2 + 1}" y="${y(m.expenses)}" width="${bw}" height="${Math.max(0, y(0) - y(m.expenses))}" rx="3" fill="#ff5b2e"><title>${names[i]}: ${money(m.expenses)}</title></rect>`;
      g += `<text x="${x + cw / 2}" y="${H - 12}" text-anchor="middle" font-size="11" fill="#5b6585">${names[i]}</text>`;
    });
    const pts = months.map((m, i) => `${xi(i) + cw / 2},${y(m.profit)}`).join(' ');
    g += `<polyline points="${pts}" fill="none" stroke="#12a36a" stroke-width="2.5"/>` + months.map((m, i) => `<circle cx="${xi(i) + cw / 2}" cy="${y(m.profit)}" r="3.5" fill="#12a36a"><title>${money(m.profit)}</title></circle>`).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('report')}" font-family="Vazirmatn">${g}</svg>
      <div class="legend"><span><i style="background:#2447ff"></i>${t('income')}</span><span><i style="background:#ff5b2e"></i>${t('expenses')}</span><span><i style="background:#12a36a"></i>${t('profit')}</span></div></div>`;
  }

  async function viewFinance(tab = 'report') {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const curJy = J.toJalali(today()).jy, jy = Number(params.get('jy')) || curJy;
    const tabs = ['report', 'expenses', 'allPayments', 'debtors'];
    const tabsHtml = `<div class="tabs">${tabs.map((k) => `<a href="#/finance/${k}" class="${tab === k ? 'on' : ''}">${t(k)}</a>`).join('')}</div>`;
    const names = fa() ? J.MONTHS_FA : J.MONTHS_EN;
    const yr = { from: J.toGregorian(jy, 1, 1), to: J.toGregorian(jy + 1, 1, 1) };
    if (tab === 'report') {
      const r = await api(`/reports/monthly?jy=${jy}`);
      shell('finance', `<div class="head"><h1>${t('finance')}</h1>
          <label class="l" style="flex-direction:row;align-items:center;gap:.5rem">${t('year')} <select id="jy">${[curJy - 2, curJy - 1, curJy, curJy + 1].map((y) => `<option value="${y}" ${y === jy ? 'selected' : ''}>${digits(y)}</option>`).join('')}</select></label></div>
        ${tabsHtml}
        <div class="stats">
          <div class="stat hl"><span>${t('income')} ${digits(jy)}</span><b class="num">${big(r.totals.income)}</b></div>
          <div class="stat neg"><span>${t('expenses')}</span><b class="num">${big(r.totals.expenses)}</b></div>
          <div class="stat ${r.totals.profit >= 0 ? 'pos' : 'neg'}"><span>${t('profit')}</span><b class="num">${big(r.totals.profit)}</b></div>
        </div>
        <section class="card" style="margin-bottom:1rem"><h2>${t('report')} ${digits(jy)}
          <span><a class="btn sm" href="/api/admin/reports/monthly.csv?jy=${jy}&lang=fa">${t('csv')} (فارسی)</a> <a class="btn line sm" href="/api/admin/reports/monthly.csv?jy=${jy}&lang=en">${t('csv')} (EN)</a></span></h2>${chart(r.months)}</section>
        <section class="card"><div class="tw"><table>
          <thead><tr><th>${t('month')}</th><th>${t('income')}</th><th>${t('expenses')}</th><th>${t('profit')}</th>${Object.values(t('m')).map((v) => `<th>${v}</th>`).join('')}${Object.values(t('cat')).map((v) => `<th>${v}</th>`).join('')}</tr></thead>
          <tbody>${r.months.map((m) => `<tr><td><b>${names[m.month - 1]}</b></td><td class="num">${money(m.income, false)}</td><td class="num">${money(m.expenses, false)}</td><td class="num" style="color:${m.profit < 0 ? 'var(--clay)' : 'inherit'}"><b>${money(m.profit, false)}</b></td>
            ${Object.keys(t('m')).map((k) => `<td class="num muted">${money(m.by_method[k], false)}</td>`).join('')}${Object.keys(t('cat')).map((k) => `<td class="num muted">${money(m.by_category[k], false)}</td>`).join('')}</tr>`).join('')}
          <tr style="background:#f4f6ff"><td><b>${t('total')}</b></td><td class="num"><b>${money(r.totals.income, false)}</b></td><td class="num"><b>${money(r.totals.expenses, false)}</b></td><td class="num"><b>${money(r.totals.profit, false)}</b></td>
            ${Object.keys(t('m')).map((k) => `<td class="num">${money(r.totals.by_method[k], false)}</td>`).join('')}${Object.keys(t('cat')).map((k) => `<td class="num">${money(r.totals.by_category[k], false)}</td>`).join('')}</tr></tbody></table></div>
          <p class="muted small">${t('amount').replace(/\s*\(.*/, '')}: ${t('toman')}</p></section>`);
      $('#jy').onchange = (e) => { location.hash = `#/finance/report?jy=${e.target.value}`; };
    } else if (tab === 'expenses') {
      const list = await api(`/expenses?from=${yr.from}&to=${yr.to}`);
      shell('finance', `<div class="head"><h1>${t('finance')}</h1></div>${tabsHtml}
        <section class="card" style="margin-bottom:1rem"><h2>${t('addExpense')}</h2><form class="f" id="exp">${dateField('date')}
          <label class="l">${t('category')}<select name="category">${Object.entries(t('cat')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
          ${amountField('amount')}<label class="l">${t('note')}<input name="note"></label><button class="btn ball" type="submit">${t('add')}</button></form></section>
        <section class="card"><div class="tw"><table><thead><tr><th>${t('date')}</th><th>${t('category')}</th><th>${t('amount')}</th><th>${t('note')}</th><th></th></tr></thead>
          <tbody>${list.map((x) => `<tr><td class="num">${dateShort(x.date)}</td><td><span class="pill">${t('cat')[x.category]}</span></td><td class="num"><b>${money(x.amount)}</b></td><td class="muted small">${esc(x.note || '')}</td><td><button class="btn danger sm" data-delexp="${x.id}">${t('del')}</button></td></tr>`).join('') || `<tr><td colspan="5" class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>`);
      bindForm($('#exp'), async (v) => { await post('/expenses', v); toast(t('saved')); viewFinance('expenses'); });
      $('#main').addEventListener('click', async (e) => { const id = e.target.dataset.delexp; if (id && confirm(t('confirmDel'))) { await del(`/expenses/${id}`); viewFinance('expenses'); } });
    } else if (tab === 'allPayments') {
      const [list, studs] = await Promise.all([api(`/payments?from=${yr.from}&to=${yr.to}`), api('/students')]);
      shell('finance', `<div class="head"><h1>${t('finance')}</h1></div>${tabsHtml}
        <section class="card" style="margin-bottom:1rem"><h2>${t('recordPayment')}</h2><form class="f" id="pay">
          <label class="l">${t('student')}<select name="student_id" required><option value="">${t('choose')}</option>${studs.map((s) => `<option value="${s.id}">${esc(s.full_name)}${s.balance > 0 ? ' · ' + money(s.balance) : ''}</option>`).join('')}</select></label>
          ${amountField('amount')}<label class="l">${t('method')}<select name="method">${Object.entries(t('m')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
          ${dateField('date')}<label class="l">${t('note')}<input name="note"></label><button class="btn ball" type="submit">${t('add')}</button></form></section>
        <section class="card"><div class="tw"><table><thead><tr><th>${t('date')}</th><th>${t('student')}</th><th>${t('amount')}</th><th>${t('method')}</th><th>${t('note')}</th><th></th></tr></thead>
          <tbody>${list.map((p) => `<tr><td class="num">${dateShort(p.date)}</td><td><a href="#/student/${p.student_id}">${esc(p.full_name)}</a></td><td class="num"><b>${money(p.amount)}</b></td><td>${t('m')[p.method]}</td><td class="muted small">${esc(p.note || '')}</td><td><button class="btn danger sm" data-delpay="${p.id}">${t('del')}</button></td></tr>`).join('') || `<tr><td colspan="6" class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>`);
      bindForm($('#pay'), async (v) => { await post('/payments', v); toast(t('saved')); viewFinance('allPayments'); });
      $('#main').addEventListener('click', async (e) => { const id = e.target.dataset.delpay; if (id && confirm(t('confirmDel'))) { await del(`/payments/${id}`); viewFinance('allPayments'); } });
    } else {
      const list = await api('/debtors');
      const total = list.reduce((a, s) => a + s.balance, 0);
      shell('finance', `<div class="head"><h1>${t('finance')}</h1></div>${tabsHtml}
        <div class="stats"><div class="stat neg"><span>${t('outstanding')}</span><b class="num">${big(total)}</b><span>${digits(t('debtorsN')(list.length))}</span></div></div>
        <section class="card"><div class="tw"><table><thead><tr><th>${t('student')}</th><th>${t('phone')}</th><th>${t('charged')}</th><th>${t('paid')}</th><th>${t('balance')}</th><th></th></tr></thead>
          <tbody>${list.map((s) => `<tr><td><a href="#/student/${s.id}"><b>${esc(s.full_name)}</b></a></td><td><span class="ltr num">${digits(esc(s.phone))}</span></td><td class="num">${money(s.charged)}</td><td class="num">${money(s.paid)}</td><td>${balPill(s.balance)}</td>
            <td><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${s.phone.replace(/^0/, '98').replace(/\D/g, '')}">WhatsApp</a></td></tr>`).join('') || `<tr><td colspan="6" class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>`);
    }
  }

  async function viewSchedule() {
    const [slots, bookings] = await Promise.all([api('/slots'), api('/bookings')]);
    const names = { 6: fa() ? 'شنبه' : 'Sat', 0: fa() ? 'یکشنبه' : 'Sun', 1: fa() ? 'دوشنبه' : 'Mon', 2: fa() ? 'سه‌شنبه' : 'Tue', 3: fa() ? 'چهارشنبه' : 'Wed', 4: fa() ? 'پنجشنبه' : 'Thu', 5: fa() ? 'جمعه' : 'Fri' };
    const web = bookings.filter((b) => b.source === 'web').slice(0, 60);
    shell('schedule', `<div class="head"><h1>${t('schedule')}</h1></div>
      <div class="grid g2">
        <section class="card"><h2>${t('addSlot')}</h2><form class="f" id="one">${dateField('date')}
          <label class="l">${t('startTime')}<input type="time" name="start_time" value="16:00" required></label>
          <label class="l">${t('duration')}<input name="duration_min" value="60" inputmode="numeric" dir="ltr"></label>
          <label class="l">${t('location')}<input name="location"></label><button class="btn ball" type="submit">${t('add')}</button></form>
          <h2 style="margin-top:1.2rem">${t('recurring')}</h2><form class="f" id="rec">${dateField('from', today(), t('from'))}${dateField('to', today(), t('to'))}
          <label class="l">${t('times')}<input name="times" value="16:00,17:00,18:00" dir="ltr"></label>
          <label class="l">${t('duration')}<input name="duration_min" value="60" inputmode="numeric" dir="ltr"></label>
          <div class="full att">${[6, 0, 1, 2, 3, 4, 5].map((d) => `<label class="pill"><input type="checkbox" name="wd${d}" ${d !== 5 ? 'checked' : ''} style="width:auto"> ${names[d]}</label>`).join(' ')}</div>
          <button class="btn ball" type="submit">${t('create')}</button> <button type="button" class="btn danger" id="clearEx">${t('clearEx')}</button></form></section>
        <section class="card"><h2>${t('webBookings')}</h2><div class="tw"><table><tbody>${web.map((b) => `<tr><td class="num">${dateShort(b.date)} ${digits(b.start_time)}</td><td><a href="#/student/${b.student_id}">${esc(b.full_name)}</a></td><td>${progName(b.program_code)}</td><td>${statusPill(b.status)}</td>
          <td>${b.status === 'pending' ? `<button class="btn sm" data-confirm="${b.id}">${t('st').confirmed}</button>` : ''}</td></tr>`).join('') || `<tr><td class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>
      </div>
      <section class="card" style="margin-top:1rem"><h2>${t('slots')}</h2><div class="tw"><table><tbody>${slots.map((x) => `<tr><td class="num">${dateFmt(x.date, { weekday: 'short', day: 'numeric', month: 'long' })}</td><td class="num">${digits(x.start_time)}–${digits(x.end_time)}</td><td class="muted small">${esc(x.location || '')}</td>
        <td>${x.booked_ref ? `<span class="pill blue">${t('booked')} ${esc(x.booked_ref)}</span>` : `<span class="pill green">${t('free')}</span>`} ${x.is_example ? `<span class="ph">${t('example')}</span>` : ''}</td>
        <td>${x.booked_ref ? '' : `<button class="btn danger sm" data-delslot="${x.id}">${t('del')}</button>`}</td></tr>`).join('') || `<tr><td class="empty">${t('none')}</td></tr>`}</tbody></table></div></section>`);
    bindForm($('#one'), async (v) => { const r = await post('/slots', v); toast(`${t('saved')} (${digits(r.created)})`); viewSchedule(); });
    bindForm($('#rec'), async (v) => {
      const weekdays = [0, 1, 2, 3, 4, 5, 6].filter((d) => v[`wd${d}`]);
      const r = await post('/slots', { from: v.from, to: v.to, weekdays, times: v.times.split(',').map((s) => s.trim()).filter(Boolean), duration_min: Number(v.duration_min) || 60 });
      toast(`${t('saved')} (${digits(r.created)})`); viewSchedule();
    });
    $('#clearEx').onclick = async () => { if (confirm(t('confirmDel'))) { await post('/slots/clear-examples'); viewSchedule(); } };
    $('#main').addEventListener('click', async (e) => {
      const ds = e.target.dataset.delslot, cf = e.target.dataset.confirm;
      try { if (ds) { await del(`/slots/${ds}`); viewSchedule(); } if (cf) { await patch(`/bookings/${cf}`, { status: 'confirmed' }); viewSchedule(); } } catch (err) { showErr(err); }
    });
  }

  // ---------------- router ----------------
  async function route() {
    if (!CSRF) return renderLogin();
    const [path] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?');
    const [view, arg] = path.split('/');
    try {
      if (view === 'student' && arg) await viewStudent(Number(arg));
      else if (view === 'students') await viewStudents();
      else if (view === 'packages') await viewPackages();
      else if (view === 'finance') await viewFinance(arg || 'report');
      else if (view === 'schedule') await viewSchedule();
      else await viewDashboard();
    } catch (e) { showErr(e); }
  }
  async function boot() {
    PROGRAMS = await api('/programs');
    if (!boot.done) { window.addEventListener('hashchange', route); boot.done = true; }
    route();
  }
  setLang(LANG);
  fetch('/api/admin/session', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : null).then((s) => { if (s) { CSRF = s.csrf; boot(); } else renderLogin(); }).catch(() => renderLogin());
})();
