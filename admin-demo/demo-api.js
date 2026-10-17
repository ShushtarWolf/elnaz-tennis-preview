/* STATIC ADMIN DEMO: an in-memory fake of /api/admin/* so the real admin UI can be
   clicked through on GitHub Pages. All data is fictional; everything resets on reload.
   Nothing is sent anywhere. */
(() => {
  const J = window.Jalali;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
  const add = (iso, d) => new Date(Date.parse(iso + 'T00:00:00Z') + d * 864e5).toISOString().slice(0, 10);
  const pad = (n) => String(n).padStart(2, '0');
  const toLatin = (s) => String(s ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const amt = (v) => { if (typeof v === 'number') return v; const s = toLatin(v).replace(/[,\s٬]/g, ''); return /^\d+$/.test(s) ? Number(s) : NaN; };
  let seq = 100; const nid = () => ++seq;
  const D = {
    programs: [
      { code: 'kids', name_fa: 'تنیس کودکان', name_en: "Kids' tennis", price_amount: 500000 },
      { code: 'adult_private', name_fa: 'کلاس خصوصی بزرگسالان', name_en: 'Adult private lesson', price_amount: 700000 },
      { code: 'women', name_fa: 'تنیس بانوان', name_en: "Women's tennis", price_amount: 600000 },
      { code: 'padel', name_fa: 'پدل', name_en: 'Padel', price_amount: 600000 },
      { code: 'soft_tennis', name_fa: 'سافت تنیس', name_en: 'Soft tennis', price_amount: null },
    ],
    students: [], package_types: [], packs: [], slots: [], bookings: [], charges: [], payments: [], expenses: [], settings: { no_show_charges: '0' },
  };
  class E extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }

  // ---------- core logic (mirrors lib/finance.js) ----------
  const bal = (id) => { const c = D.charges.filter((x) => x.student_id === id).reduce((a, x) => a + x.amount, 0), p = D.payments.filter((x) => x.student_id === id).reduce((a, x) => a + x.amount, 0); return { charged: c, paid: p, balance: c - p }; };
  const slotOf = (b) => D.slots.find((s) => s.id === b.slot_id);
  const stName = (id) => (D.students.find((s) => s.id === id) || {}).full_name;
  function createStudent(b) {
    if (!b.full_name || String(b.full_name).trim().length < 2 || toLatin(b.phone).replace(/\D/g, '').length < 10) throw new E(400, 'validation');
    const id = nid(); D.students.push({ id, full_name: String(b.full_name).trim(), phone: toLatin(b.phone).replace(/[^\d+]/g, ''), student_type: b.student_type || 'adult', parent_name: b.parent_name || null, program_code: b.program_code || null, notes: b.notes || null, active: 1 }); return id;
  }
  function addPackType(b) {
    const v = { id: nid(), name_fa: b.name_fa, name_en: b.name_en || null, sessions: Number(toLatin(b.sessions)), price: amt(b.price), validity_days: Number(toLatin(b.validity_days)), program_code: b.program_code || null, active: 1 };
    if (!v.name_fa || !(v.sessions > 0) || !(v.price >= 0) || !(v.validity_days > 0)) throw new E(400, 'validation');
    D.package_types.push(v); return v.id;
  }
  function sell(sid, b) {
    const pt = D.package_types.find((x) => x.id === Number(b.package_type_id)); if (!pt) throw new E(400, 'validation');
    const start = b.start_date || today, id = nid();
    D.packs.push({ id, student_id: sid, package_type_id: pt.id, sessions_total: pt.sessions, sessions_used: 0, price: pt.price, program_code: pt.program_code, start_date: start, expires_at: add(start, pt.validity_days - 1) });
    if (pt.price > 0) D.charges.push({ id: nid(), student_id: sid, amount: pt.price, kind: 'package', student_package_id: id, date: start, description: pt.name_fa });
    if (b.payment && b.payment.amount) pay({ student_id: sid, amount: b.payment.amount, method: b.payment.method, date: start });
    return id;
  }
  function pay(b) {
    const v = { id: nid(), student_id: Number(b.student_id), amount: amt(b.amount), method: b.method, date: b.date || today, note: b.note || null };
    if (!(v.amount > 0) || !['cash', 'card', 'transfer'].includes(v.method) || !D.students.some((s) => s.id === v.student_id)) throw new E(400, 'validation');
    D.payments.push(v); return v.id;
  }
  function addSession(sid, b) {
    const st = D.students.find((s) => s.id === sid);
    const prog = b.program_code || st.program_code || 'adult_private';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || !/^\d\d:\d\d$/.test(b.start_time || '')) throw new E(400, 'validation');
    let slot = D.slots.find((s) => s.date === b.date && s.start_time === b.start_time);
    if (slot && D.bookings.some((x) => x.slot_id === slot.id && x.status !== 'cancelled')) throw new E(409, 'slot_taken');
    if (!slot) { slot = { id: nid(), date: b.date, start_time: b.start_time, end_time: `${pad(+b.start_time.slice(0, 2) + 1)}:${b.start_time.slice(3)}`, active: 1, is_example: 0 }; D.slots.push(slot); }
    const id = nid(), price = b.price ? amt(b.price) : null;
    D.bookings.push({ id, ref: 'EK-' + id, slot_id: slot.id, student_id: sid, program_code: prog, status: 'confirmed', source: b.source || 'admin', price_amount: price, package_id: null, payment_status: 'unpaid' });
    return id;
  }
  function attend(id, status, price) {
    const b = D.bookings.find((x) => x.id === id); if (!b) throw new E(404, 'not_found');
    const date = slotOf(b).date;
    if (b.package_id) { const p = D.packs.find((x) => x.id === b.package_id); if (p && p.sessions_used > 0) p.sessions_used--; }
    D.charges = D.charges.filter((c) => !(c.booking_id === b.id && c.kind === 'session'));
    let pkg = null, p = price != null && price !== '' ? amt(price) : b.price_amount;
    const billable = status === 'completed' || (status === 'no_show' && D.settings.no_show_charges === '1');
    if (billable) {
      pkg = D.packs.filter((x) => x.student_id === b.student_id && x.sessions_used < x.sessions_total && x.start_date <= date && x.expires_at >= date && (!x.program_code || x.program_code === b.program_code))
        .sort((a, c) => a.expires_at.localeCompare(c.expires_at))[0] || null;
      if (pkg) pkg.sessions_used++;
      else {
        if (p == null) { const pr = D.programs.find((x) => x.code === b.program_code); p = pr ? pr.price_amount : null; }
        if (p == null) throw new E(400, 'price_required');
        if (p > 0) D.charges.push({ id: nid(), student_id: b.student_id, amount: p, kind: 'session', booking_id: b.id, date, description: b.ref });
      }
    }
    Object.assign(b, { status, package_id: pkg ? pkg.id : null, payment_status: pkg ? 'credit' : 'unpaid', price_amount: p ?? null });
    return { status };
  }
  function listStudents(q) {
    const s = q ? toLatin(q).trim() : '';
    return D.students.filter((x) => !s || x.full_name.includes(s) || x.phone.includes(s) || (x.parent_name || '').includes(s)).map((x) => {
      const dates = D.bookings.filter((b) => b.student_id === x.id && b.status !== 'cancelled').map((b) => slotOf(b).date).sort();
      return { ...x, ...bal(x.id), credits: D.packs.filter((p) => p.student_id === x.id && p.expires_at >= today).reduce((a, p) => a + p.sessions_total - p.sessions_used, 0), last_session: dates.pop() || null };
    }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'fa'));
  }
  const debtors = () => listStudents().filter((s) => s.balance > 0).sort((a, b) => b.balance - a.balance);
  function detail(id) {
    const student = D.students.find((s) => s.id === id); if (!student) throw new E(404, 'not_found');
    return { student, ...bal(id),
      sessions: D.bookings.filter((b) => b.student_id === id).map((b) => { const s = slotOf(b), c = D.charges.find((x) => x.booking_id === b.id && x.kind === 'session'); return { ...b, date: s.date, start_time: s.start_time, end_time: s.end_time, charge: c ? c.amount : null }; })
        .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time)),
      packages: D.packs.filter((p) => p.student_id === id).map((p) => { const pt = D.package_types.find((x) => x.id === p.package_type_id); return { ...p, name_fa: pt.name_fa, name_en: pt.name_en, remaining: p.sessions_total - p.sessions_used, state: p.expires_at < today ? 'expired' : p.sessions_used >= p.sessions_total ? 'used_up' : 'active' }; }),
      payments: D.payments.filter((p) => p.student_id === id).sort((a, b) => b.date.localeCompare(a.date)),
      charges: D.charges.filter((c) => c.student_id === id).sort((a, b) => b.date.localeCompare(a.date)) };
  }
  function report(jy) {
    jy = Number(jy) || J.toJalali(today).jy;
    const from = J.toGregorian(jy, 1, 1), to = J.toGregorian(jy + 1, 1, 1);
    const mk = () => ({ income: 0, expenses: 0, profit: 0, by_method: { cash: 0, card: 0, transfer: 0 }, by_category: { court_rent: 0, balls: 0, equipment: 0, other: 0 } });
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ...mk() })), totals = mk();
    D.payments.filter((p) => p.date >= from && p.date < to).forEach((p) => { const m = months[J.toJalali(p.date).jm - 1]; m.income += p.amount; m.by_method[p.method] += p.amount; });
    D.expenses.filter((e) => e.date >= from && e.date < to).forEach((e) => { const m = months[J.toJalali(e.date).jm - 1]; m.expenses += e.amount; m.by_category[e.category] += e.amount; });
    months.forEach((m) => { m.profit = m.income - m.expenses; totals.income += m.income; totals.expenses += m.expenses; for (const k in m.by_method) totals.by_method[k] += m.by_method[k]; for (const k in m.by_category) totals.by_category[k] += m.by_category[k]; });
    totals.profit = totals.income - totals.expenses;
    return { jy, from, to, months, totals };
  }
  function dashboard() {
    const week = add(today, 7), j = J.toJalali(today);
    const mFrom = J.toGregorian(j.jy, j.jm, 1), mTo = j.jm === 12 ? J.toGregorian(j.jy + 1, 1, 1) : J.toGregorian(j.jy, j.jm + 1, 1);
    const sess = D.bookings.filter((b) => b.status !== 'cancelled').map((b) => { const s = slotOf(b); return { ...b, date: s.date, start_time: s.start_time, full_name: stName(b.student_id) }; })
      .filter((b) => b.date >= today && b.date <= week).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
    const d = debtors();
    return { today, jalali: j, today_sessions: sess.filter((s) => s.date === today), upcoming_sessions: sess.filter((s) => s.date > today),
      month: { income: D.payments.filter((p) => p.date >= mFrom && p.date < mTo).reduce((a, p) => a + p.amount, 0), expenses: D.expenses.filter((p) => p.date >= mFrom && p.date < mTo).reduce((a, p) => a + p.amount, 0) },
      outstanding: d.reduce((a, s) => a + s.balance, 0), debtors_count: d.length, top_debtors: d.slice(0, 5),
      pending_web_bookings: D.bookings.filter((b) => b.status === 'pending').length, students_count: D.students.length,
      expiring_packages: D.packs.filter((p) => p.expires_at >= today && p.sessions_used < p.sessions_total && (p.expires_at <= add(today, 14) || p.sessions_total - p.sessions_used <= 1))
        .map((p) => { const pt = D.package_types.find((x) => x.id === p.package_type_id); return { ...p, full_name: stName(p.student_id), name_fa: pt.name_fa, name_en: pt.name_en, remaining: p.sessions_total - p.sessions_used }; }) };
  }

  // ---------- fictional seed data ----------
  const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const S = [];
  for (let i = 1; i <= 8; i++) S.push(createStudent({ full_name: `هنرجوی نمونه ${fa(i)}`, phone: `0900000000${i}`, student_type: i <= 3 ? 'kid' : 'adult',
    parent_name: i <= 3 ? `ولی نمونه ${fa(i)}` : null, program_code: ['kids', 'kids', 'kids', 'women', 'adult_private', 'padel', 'women', 'soft_tennis'][i - 1], notes: 'داده نمونه / demo data' }));
  const p8 = addPackType({ name_fa: 'بسته ۸ جلسه (نمونه)', name_en: '8 sessions (demo)', sessions: 8, price: 4000000, validity_days: 45 });
  const pk = addPackType({ name_fa: 'بسته ۱۲ جلسه کودکان (نمونه)', name_en: '12 kids sessions (demo)', sessions: 12, price: 5000000, validity_days: 60, program_code: 'kids' });
  const pp = addPackType({ name_fa: 'بسته ۴ جلسه پدل (نمونه)', name_en: '4 padel sessions (demo)', sessions: 4, price: 2000000, validity_days: 30, program_code: 'padel' });
  sell(S[0], { package_type_id: pk, start_date: add(today, -25), payment: { amount: 5000000, method: 'card' } });
  sell(S[1], { package_type_id: pk, start_date: add(today, -40), payment: { amount: 3000000, method: 'cash' } });
  sell(S[3], { package_type_id: p8, start_date: add(today, -15), payment: { amount: 2000000, method: 'transfer' } });
  sell(S[5], { package_type_id: pp, start_date: add(today, -12) });
  let h = 8;
  const sess = (sid, date, st) => { const b = addSession(sid, { date, start_time: `${pad(8 + (h++ % 13))}:00` }); if (st) attend(b, st); return b; };
  for (let i = 0; i < 7; i++) sess(S[0], add(today, -24 + i * 3), 'completed');
  for (let i = 0; i < 9; i++) sess(S[1], add(today, -38 + i * 4), i === 4 ? 'no_show' : 'completed');
  for (let i = 0; i < 3; i++) sess(S[3], add(today, -14 + i * 4), 'completed');
  sess(S[5], add(today, -9), 'completed'); sess(S[5], add(today, -5), 'completed');
  sess(S[4], add(today, -6), 'completed'); sess(S[4], add(today, -3), 'completed'); sess(S[6], add(today, -2), 'completed'); sess(S[2], add(today, -4), 'cancelled');
  pay({ student_id: S[4], amount: 700000, method: 'cash', date: add(today, -6) });
  h = 16; sess(S[0], today); sess(S[4], today); sess(S[6], today);
  sess(S[1], add(today, 1)); sess(S[5], add(today, 2)); sess(S[3], add(today, 3)); sess(S[7], add(today, 4));
  const w = addSession(S[2], { date: add(today, 2), start_time: '10:00', source: 'web' }); D.bookings.find((b) => b.id === w).status = 'pending';
  const jt = J.toJalali(today), old = createStudent({ full_name: 'هنرجوی نمونه ۹', phone: '09000000009', student_type: 'adult', notes: 'داده نمونه / demo data' });
  for (let k = 1; k <= 6 && jt.jm - k >= 1; k++) {
    const g = (d) => J.toGregorian(jt.jy, jt.jm - k, d), inc = [9000000, 8000000, 7000000, 6000000, 5000000, 4000000][k - 1], exp = [3000000, 3000000, 3500000, 2500000, 2500000, 2000000][k - 1];
    D.charges.push({ id: nid(), student_id: old, amount: inc, kind: 'other', date: g(5), description: 'demo' });
    pay({ student_id: old, amount: inc / 2, method: 'cash', date: g(6) }); pay({ student_id: old, amount: inc / 2, method: 'card', date: g(20) });
    D.expenses.push({ id: nid(), date: g(3), category: 'court_rent', amount: exp * 0.7, note: 'نمونه' }, { id: nid(), date: g(11), category: 'balls', amount: exp * 0.2, note: 'نمونه' }, { id: nid(), date: g(17), category: 'equipment', amount: exp * 0.1, note: 'نمونه' });
  }
  D.expenses.push({ id: nid(), date: add(today, -8), category: 'court_rent', amount: 2000000, note: 'نمونه' }, { id: nid(), date: add(today, -4), category: 'balls', amount: 500000, note: 'نمونه' });
  const pattern = { 6: ['17:00', '18:00'], 0: ['17:00', '18:00'], 1: ['17:00'], 2: ['17:00', '18:00'], 3: ['17:00'], 4: ['10:00'], 5: [] };
  for (let d = 1; d <= 10; d++) { const dt = new Date(Date.parse(today + 'T00:00:00Z') + d * 864e5), date = dt.toISOString().slice(0, 10); for (const t of pattern[dt.getUTCDay()]) if (!D.slots.some((s) => s.date === date && s.start_time === t)) D.slots.push({ id: nid(), date, start_time: t, end_time: `${pad(+t.slice(0, 2) + 1)}:00`, active: 1, is_example: 1 }); }

  // ---------- router ----------
  const routes = [
    ['GET', /^\/session$/, () => ({ ok: true, csrf: 'demo' })], ['POST', /^\/login$/, () => ({ ok: true, csrf: 'demo' })], ['POST', /^\/logout$/, () => { location.reload(); return { ok: true }; }],
    ['GET', /^\/dashboard$/, () => dashboard()], ['GET', /^\/programs$/, () => D.programs], ['GET', /^\/settings$/, () => D.settings],
    ['PATCH', /^\/settings$/, (m, b) => { D.settings.no_show_charges = b.no_show_charges ? '1' : '0'; return { ok: true }; }],
    ['PATCH', /^\/programs\/(\w+)$/, (m, b) => { const p = D.programs.find((x) => x.code === m[1]); p.price_amount = b.price_amount === '' || b.price_amount == null ? null : amt(b.price_amount); return { ok: true }; }],
    ['GET', /^\/students$/, (m, b, q) => listStudents(q.get('q'))], ['POST', /^\/students$/, (m, b) => ({ id: createStudent(b) })],
    ['GET', /^\/students\/(\d+)$/, (m) => detail(+m[1])], ['PATCH', /^\/students\/(\d+)$/, (m, b) => { Object.assign(D.students.find((s) => s.id === +m[1]), b); return { ok: true }; }],
    ['POST', /^\/students\/(\d+)\/sessions$/, (m, b) => ({ id: addSession(+m[1], b) })], ['POST', /^\/students\/(\d+)\/packages$/, (m, b) => ({ id: sell(+m[1], b) })],
    ['POST', /^\/students\/(\d+)\/charges$/, (m, b) => { const a = amt(b.amount); if (!(a > 0)) throw new E(400, 'validation'); D.charges.push({ id: nid(), student_id: +m[1], amount: a, kind: 'other', date: b.date || today, description: b.description }); return { ok: true }; }],
    ['DELETE', /^\/charges\/(\d+)$/, (m) => { D.charges = D.charges.filter((c) => !(c.id === +m[1] && c.kind === 'other')); return { ok: true }; }],
    ['GET', /^\/debtors$/, () => debtors()], ['PATCH', /^\/bookings\/(\d+)$/, (m, b) => attend(+m[1], b.status, b.price)],
    ['GET', /^\/package-types$/, () => D.package_types.map((x) => ({ ...x, sold: D.packs.filter((p) => p.package_type_id === x.id).length }))],
    ['POST', /^\/package-types$/, (m, b) => ({ id: addPackType(b) })], ['PATCH', /^\/package-types\/(\d+)$/, (m, b) => { D.package_types.find((x) => x.id === +m[1]).active = b.active ? 1 : 0; return { ok: true }; }],
    ['GET', /^\/payments$/, (m, b, q) => D.payments.filter((p) => (!q.get('from') || p.date >= q.get('from')) && (!q.get('to') || p.date < q.get('to'))).map((p) => ({ ...p, full_name: stName(p.student_id) })).sort((a, c) => c.date.localeCompare(a.date))],
    ['POST', /^\/payments$/, (m, b) => ({ id: pay(b) })], ['DELETE', /^\/payments\/(\d+)$/, (m) => { D.payments = D.payments.filter((p) => p.id !== +m[1]); return { ok: true }; }],
    ['GET', /^\/expenses$/, (m, b, q) => D.expenses.filter((p) => (!q.get('from') || p.date >= q.get('from')) && (!q.get('to') || p.date < q.get('to'))).sort((a, c) => c.date.localeCompare(a.date))],
    ['POST', /^\/expenses$/, (m, b) => { const a = amt(b.amount); if (!(a > 0)) throw new E(400, 'validation'); D.expenses.push({ id: nid(), date: b.date || today, category: b.category, amount: a, note: b.note }); return { ok: true }; }],
    ['DELETE', /^\/expenses\/(\d+)$/, (m) => { D.expenses = D.expenses.filter((p) => p.id !== +m[1]); return { ok: true }; }],
    ['GET', /^\/reports\/monthly$/, (m, b, q) => report(q.get('jy'))],
    ['GET', /^\/bookings$/, () => D.bookings.map((b) => { const s = slotOf(b); return { ...b, date: s.date, start_time: s.start_time, full_name: stName(b.student_id) }; }).sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time))],
    ['GET', /^\/slots$/, () => D.slots.filter((s) => s.active && s.date >= today).map((s) => ({ ...s, booked_ref: (D.bookings.find((b) => b.slot_id === s.id && b.status !== 'cancelled') || {}).ref })).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))],
    ['POST', /^\/slots$/, (m, b) => { let n = 0; const mk = (date, t) => { if (!D.slots.some((s) => s.date === date && s.start_time === t)) { D.slots.push({ id: nid(), date, start_time: t, end_time: `${pad(+t.slice(0, 2) + 1)}:${t.slice(3)}`, active: 1, is_example: 0, location: b.location }); n++; } };
      if (b.date) mk(b.date, b.start_time); else for (let d = b.from; d <= b.to; d = add(d, 1)) if (b.weekdays.includes(new Date(d + 'T00:00:00Z').getUTCDay())) b.times.forEach((t) => mk(d, t)); return { ok: true, created: n }; }],
    ['DELETE', /^\/slots\/(\d+)$/, (m) => { D.slots = D.slots.filter((s) => s.id !== +m[1]); return { ok: true }; }],
    ['POST', /^\/slots\/clear-examples$/, () => { D.slots = D.slots.filter((s) => !s.is_example || D.bookings.some((b) => b.slot_id === s.id)); return { ok: true }; }],
  ];
  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => {
    const u = new URL(url, location.href), i = u.pathname.indexOf('/api/admin');
    if (i < 0) return realFetch(url, opts);
    const path = u.pathname.slice(i + 10), method = (opts.method || 'GET').toUpperCase(), body = opts.body ? JSON.parse(opts.body) : {};
    await new Promise((r) => setTimeout(r, 60));
    for (const [m, re, fn] of routes) {
      const mm = method === m && path.match(re);
      if (mm) {
        try { const out = fn(mm, body, u.searchParams); return new Response(JSON.stringify(out), { status: method === 'POST' && /students$|payments$|package-types$|sessions$|packages$/.test(path) ? 201 : 200, headers: { 'Content-Type': 'application/json' } }); }
        catch (e) { return new Response(JSON.stringify({ error: e.code || 'error' }), { status: e.status || 500, headers: { 'Content-Type': 'application/json' } }); }
      }
    }
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  };
  // CSV export links -> generate the file in the browser
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="monthly.csv"]'); if (!a) return;
    e.preventDefault();
    const q = new URL(a.href, location.href).searchParams, r = report(q.get('jy')), en = q.get('lang') === 'en', names = en ? J.MONTHS_EN : J.MONTHS_FA;
    const head = en ? 'Month,Income,Expenses,Profit' : 'ماه,درآمد (تومان),هزینه (تومان),سود (تومان)';
    const rows = r.months.map((m) => `${names[m.month - 1]} ${r.jy},${m.income},${m.expenses},${m.profit}`).concat(`${en ? 'Total' : 'جمع'},${r.totals.income},${r.totals.expenses},${r.totals.profit}`);
    const blob = new Blob(['\uFEFF' + [head, ...rows].join('\r\n')], { type: 'text/csv' });
    const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = `demo-report-${r.jy}.csv`; l.click();
  });
  // demo banner
  const st = document.createElement('style');
  st.textContent = '.demo-banner{position:sticky;top:0;z-index:60;background:#fff3a6;color:#4a3d00;border-bottom:1px dashed #c9a800;text-align:center;font:800 .88rem Vazirmatn,system-ui,sans-serif;padding:.45rem 1rem}';
  document.head.appendChild(st);
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div'); b.className = 'demo-banner'; b.setAttribute('role', 'note');
    document.body.prepend(b);
    const upd = () => { b.textContent = document.documentElement.lang === 'en' ? 'DEMO VERSION: not real data. Nothing is saved; everything resets on reload. (demo data)' : 'نسخه نمایشی — اطلاعات واقعی نیست. چیزی ذخیره نمی‌شود و با بارگذاری دوباره صفحه همه‌چیز به حالت اول برمی‌گردد. (داده نمونه)'; };
    upd(); new MutationObserver(upd).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})();
