/* DEMO MODE for the static preview: emulates /api/programs, /api/slots and /api/bookings
   in the browser. Example slots only; bookings are stored in localStorage and never leave the device. */
(() => {
  const PROGRAMS = [
    { code: 'kids', name_fa: 'تنیس کودکان', name_en: "Kids' tennis" },
    { code: 'adult_private', name_fa: 'کلاس خصوصی بزرگسالان', name_en: 'Adult private lesson' },
    { code: 'women', name_fa: 'تنیس بانوان', name_en: "Women's tennis" },
    { code: 'padel', name_fa: 'پدل', name_en: 'Padel' },
    { code: 'soft_tennis', name_fa: 'سافت تنیس', name_en: 'Soft tennis' },
  ];
  const pad = (n) => String(n).padStart(2, '0');
  const tehranToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
  const pattern = { 6: ['16:00', '17:00', '18:00', '19:00'], 0: ['16:00', '17:00', '18:00'], 1: ['15:00', '16:00', '17:00', '18:00'], 2: ['16:00', '17:00', '18:00'], 3: ['16:00', '17:00', '19:00'], 4: ['09:00', '10:00', '11:00'], 5: [] };
  const KEY = 'ek_demo_bookings';
  const booked = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  function slots() {
    const today = tehranToday(), base = Date.parse(today + 'T00:00:00Z'), taken = new Set(booked().map((b) => b.slot_id)), out = [];
    for (let d = 1; d <= 14; d++) {
      const dt = new Date(base + d * 864e5), date = dt.toISOString().slice(0, 10);
      for (const t of pattern[dt.getUTCDay()]) {
        const id = Number(date.replace(/-/g, '') + t.replace(':', ''));
        if (!taken.has(id)) out.push({ id, date, start_time: t, end_time: `${pad(+t.slice(0, 2) + 1)}:${t.slice(3)}`, is_example: 1 });
      }
    }
    return { today, slots: out };
  }
  const res = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => {
    const u = new URL(url, location.href).pathname;
    if (u.endsWith('/api/programs')) return res(200, PROGRAMS);
    if (u.endsWith('/api/slots')) return res(200, slots());
    if (u.endsWith('/api/bookings') && (opts.method || 'GET') === 'POST') {
      await new Promise((r) => setTimeout(r, 450));
      const b = JSON.parse(opts.body || '{}');
      const phone = String(b.phone || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d+]/g, '');
      if (String(b.name || '').trim().length < 2 || phone.length < 10) return res(400, { error: 'validation', fields: { phone: 'invalid' } });
      const s = slots().slots.find((x) => x.id === Number(b.slot_id));
      if (!s) return res(409, { error: 'slot_taken' });
      const ref = 'DEMO-' + Math.random().toString(16).slice(2, 6).toUpperCase();
      localStorage.setItem(KEY, JSON.stringify([...booked(), { slot_id: s.id, ref }]));
      return res(201, { ok: true, ref, slot: s });
    }
    return realFetch(url, opts);
  };
  // visible demo note
  const TXT = {
    fa: 'پیش‌نمایش آزمایشی: زمان‌ها نمونه هستند و رزروها هنوز ثبت نمی‌شوند (فقط در مرورگر شما می‌ماند).',
    en: "Demo preview: times are examples and bookings aren't saved yet (they stay in your browser only).",
  };
  const style = document.createElement('style');
  style.textContent = '.demo-note{display:flex;gap:.5rem;align-items:center;background:#fff3a6;color:#4a3d00;border:1px dashed #c9a800;border-radius:12px;padding:.6rem .9rem;font-weight:700;font-size:.88rem;margin-bottom:1rem}.demo-ribbon{position:fixed;inset-inline-start:.75rem;bottom:.75rem;z-index:45;background:#fff3a6;color:#4a3d00;border:1px dashed #c9a800;border-radius:999px;padding:.3rem .8rem;font:700 .75rem Vazirmatn,system-ui,sans-serif}';
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded', () => {
    const note = document.createElement('p'); note.className = 'demo-note'; note.setAttribute('role', 'note');
    const ribbon = document.createElement('div'); ribbon.className = 'demo-ribbon';
    const bk = document.getElementById('bk'); if (bk) bk.prepend(note);
    document.body.appendChild(ribbon);
    const upd = () => { const l = document.documentElement.lang === 'en' ? 'en' : 'fa'; note.textContent = '🧪 ' + TXT[l]; ribbon.textContent = l === 'en' ? 'Demo preview' : 'نسخه پیش‌نمایش'; };
    upd(); new MutationObserver(upd).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})();
