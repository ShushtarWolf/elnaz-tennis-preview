/* Booking calendar: free slots -> pick day -> pick time -> form -> confirmation.
   Persian mode shows Jalali (Shamsi) dates via Intl's persian calendar;
   English mode shows Gregorian. Slot times are Tehran local time. */
(() => {
  const App = window.App;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const st = { slots: [], programs: [], today: null, day: null, slot: null, preset: null, loaded: false, error: false };

  const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const iso = (dt) => dt.toISOString().slice(0, 10);
  const fmt = (dt, opts) => new Intl.DateTimeFormat(App.lang === 'fa' ? 'fa-IR-u-ca-persian-nu-arabext' : 'en-GB', { timeZone: 'UTC', ...opts }).format(dt);
  const longDate = (isoStr) => fmt(toDate(isoStr), { weekday: 'long', day: 'numeric', month: 'long' });
  const time = (t) => App.digits(t);

  async function load() {
    try {
      const [p, s] = await Promise.all([fetch('/api/programs').then((r) => r.json()), fetch('/api/slots', { cache: 'no-store' }).then((r) => r.json())]);
      st.programs = p; st.slots = s.slots; st.today = s.today; st.loaded = true; st.error = false;
    } catch (e) { st.error = true; }
    render();
  }

  function byDay() {
    const m = new Map();
    st.slots.forEach((s) => { if (!m.has(s.date)) m.set(s.date, []); m.get(s.date).push(s); });
    return m;
  }

  function setStep(n) { $$('.bk__steps li').forEach((li) => li.classList.toggle('is-on', +li.dataset.step <= n)); }

  function render() {
    const ui = App.ui();
    $('#bkDow').innerHTML = ui.dow.map((d) => `<span>${d}</span>`).join('');
    if (st.error) { $('#bkDays').innerHTML = `<p class="bk__empty">${ui.loadErr}</p>`; return; }
    if (!st.loaded) return;
    const days = byDay();
    $('.js-example-note').hidden = !st.slots.some((s) => s.is_example);

    // grid: from the Saturday on/before today, at least 2 weeks, up to the last slot's week (max 6 weeks)
    const today = toDate(st.today);
    const start = new Date(today.getTime() - ((today.getUTCDay() + 1) % 7) * 864e5); // Saturday-first
    const last = st.slots.length ? toDate(st.slots[st.slots.length - 1].date) : today;
    const weeks = Math.min(6, Math.max(2, Math.ceil(((last - start) / 864e5 + 1) / 7)));
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const dt = new Date(start.getTime() + i * 864e5), k = iso(dt), list = days.get(k) || [];
      const past = dt < today, has = list.length > 0;
      cells.push(`<button type="button" role="option" class="day${has ? ' has' : ''}${past ? ' past' : ''}${k === st.day ? ' is-sel' : ''}${k === st.today ? ' is-today' : ''}"
        data-day="${k}" ${has ? '' : 'disabled'} aria-selected="${k === st.day}" aria-label="${longDate(k)}${has ? ', ' + ui.slotsCount(list.length) : ''}">
        <b>${fmt(dt, { day: 'numeric' })}</b><small>${has ? App.digits(list.length) : ''}</small></button>`);
    }
    $('#bkDays').innerHTML = cells.join('');
    const end = new Date(start.getTime() + (weeks * 7 - 1) * 864e5);
    const m1 = fmt(start, { month: 'long' }), m2 = fmt(end, { month: 'long' }), yr = fmt(end, { year: 'numeric' }).replace(/[^\d۰-۹]/g, '');
    $('#bkMonth').textContent = m1 === m2 ? `${m2} ${yr}` : `${m1} – ${m2} ${yr}`;

    if (!st.slots.length) { $('#bkDayLabel').textContent = ui.noSlotsAll; $('#bkSlots').innerHTML = ''; return; }
    if (!st.day || !days.has(st.day)) { st.day = null; $('#bkDayLabel').textContent = window.I18N && App.lang === 'en' ? window.I18N.en['bk.pickDay'] : 'ابتدا یک روز را انتخاب کنید'; $('#bkSlots').innerHTML = ''; return; }
    $('#bkDayLabel').textContent = ui.timeOf(longDate(st.day));
    $('#bkSlots').innerHTML = days.get(st.day).map((s) => `
      <button type="button" role="option" class="slot${st.slot && st.slot.id === s.id ? ' is-sel' : ''}" data-slot="${s.id}">
        <b>${time(s.start_time)}</b><small>${ui.from} ${time(s.end_time)}</small></button>`).join('');
  }

  function renderPrograms() {
    const sel = $('#f-program'), cur = sel.value || (st.preset && st.preset.program) || '';
    sel.innerHTML = st.programs.map((p) => `<option value="${p.code}">${App.lang === 'fa' ? p.name_fa : p.name_en}</option>`).join('');
    if (cur) sel.value = cur;
  }

  function openForm() {
    const ui = App.ui();
    $('#bkChosen').innerHTML = `<svg class="ic"><use href="#i-cal"/></svg><span>${ui.chosen(longDate(st.slot.date), time(st.slot.start_time))}</span>`;
    renderPrograms();
    if (st.preset) {
      $('#f-program').value = st.preset.program;
      const r = $(`input[name=student_type][value=${st.preset.type}]`); if (r) r.checked = true;
    }
    $('#bkForm').hidden = false; setStep(3);
    $('#bkForm').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), reduce ? 0 : 450);
  }

  // ---------- events ----------
  $('#bkDays').addEventListener('click', (e) => {
    const b = e.target.closest('.day.has'); if (!b) return;
    st.day = b.dataset.day; st.slot = null; $('#bkForm').hidden = true; setStep(2); render();
    if (innerWidth < 860) $('.bk__times').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  $('#bkSlots').addEventListener('click', (e) => {
    const b = e.target.closest('.slot'); if (!b) return;
    st.slot = st.slots.find((s) => s.id === +b.dataset.slot); render(); openForm();
  });
  $('#bkBack').addEventListener('click', () => { $('#bkForm').hidden = true; st.slot = null; setStep(2); render(); $('.bk__panel').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
  $('#bkAgain').addEventListener('click', () => { $('#bkDone').hidden = true; $('.bk__panel').hidden = false; st.day = null; st.slot = null; setStep(1); load(); });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.js-book'); if (!b) return;
    st.preset = { program: b.dataset.program, type: b.dataset.type };
    $('#booking').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  const showErr = (name, msg) => { const el = $(`.err[data-for=${name}]`); if (el) el.textContent = msg || ''; const i = $(`[name=${name}]`); if (i) i.setAttribute('aria-invalid', msg ? 'true' : 'false'); };

  $('#bkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ui = App.ui(), f = e.target, btn = $('#bkSubmit');
    const data = Object.fromEntries(new FormData(f));
    ['name', 'phone', 'program'].forEach((n) => showErr(n, ''));
    let bad = false;
    if ((data.name || '').trim().length < 2) { showErr('name', ui.required); bad = true; }
    const ph = (data.phone || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d+]/g, '');
    if (ph.length < 10) { showErr('phone', ui.badPhone); bad = true; }
    if (bad) { $('[aria-invalid=true]', f).focus(); return; }
    btn.disabled = true; const label = btn.textContent; btn.textContent = ui.sending; $('#bkMsg').textContent = '';
    try {
      const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, slot_id: st.slot.id, lang: App.lang }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 201) {
        const d = longDate(j.slot.date), t = time(j.slot.start_time);
        $('#bkDoneText').textContent = ui.doneText(d, t);
        $('#bkRef').textContent = j.ref;
        const waBtn = $('.js-wa-booking');
        waBtn.href = App.waLink(ui.waBooking(j.ref, d, t)); waBtn.target = '_blank'; waBtn.rel = 'noopener';
        f.reset(); f.hidden = true; $('.bk__panel').hidden = true; $('#bkDone').hidden = false; $('#bkDone').focus({ preventScroll: true });
        st.slots = st.slots.filter((s) => s.id !== st.slot.id); st.slot = null;
        $('#bk').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      } else if (r.status === 409) {
        App.toast(ui.taken); f.hidden = true; st.slot = null; setStep(2); await load();
      } else if (r.status === 429) { $('#bkMsg').textContent = ui.tooMany; }
      else if (j.fields) {
        Object.entries(j.fields).forEach(([k]) => showErr(k, k === 'phone' ? ui.badPhone : ui.required));
      } else { $('#bkMsg').textContent = ui.serverErr; }
    } catch (err) { $('#bkMsg').textContent = ui.serverErr; }
    btn.disabled = false; btn.textContent = label;
  });

  App.onLang(() => { render(); if (st.programs.length) renderPrograms(); if (st.slot && !$('#bkForm').hidden) openFormLabelsOnly(); });
  function openFormLabelsOnly() { $('#bkChosen span').textContent = App.ui().chosen(longDate(st.slot.date), time(st.slot.start_time)); }
  render(); load();
})();
