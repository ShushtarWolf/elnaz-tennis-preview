(() => {
  const C = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPh = (v) => !v || /PLACEHOLDER/i.test(v);

  // ---------- language ----------
  const faText = new Map(), faAttr = new Map();
  $$('[data-i18n]').forEach((el) => faText.set(el, el.innerHTML));
  $$('[data-i18n-attr]').forEach((el) => {
    const m = {};
    el.dataset.i18nAttr.split(';').forEach((pair) => { const [a] = pair.split(':'); m[a] = el.getAttribute(a); });
    faAttr.set(el, m);
  });
  const faTitle = document.title;
  const enTitle = 'Elnaz Khanbeygi | Tennis & Padel Coach in Tehran';

  const App = window.App = {
    lang: 'fa',
    ui: () => window.I18N.ui[App.lang],
    digits(s) { return App.lang === 'fa' ? String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(s); },
    listeners: [],
    onLang(fn) { App.listeners.push(fn); },
    setLang(lang, push = true) {
      App.lang = lang === 'en' ? 'en' : 'fa';
      const en = window.I18N.en;
      document.documentElement.lang = App.lang;
      document.documentElement.dir = App.lang === 'fa' ? 'rtl' : 'ltr';
      document.title = App.lang === 'fa' ? faTitle : enTitle;
      faText.forEach((fa, el) => { const k = el.dataset.i18n; el.innerHTML = App.lang === 'en' && en[k] != null ? en[k] : fa; });
      faAttr.forEach((m, el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [a, k] = pair.split(':');
          el.setAttribute(a, App.lang === 'en' && en[k] != null ? en[k] : m[a]);
        });
      });
      try { localStorage.setItem('lang', App.lang); } catch (e) {}
      if (push) { const u = new URL(location); u.searchParams.set('lang', App.lang); history.replaceState(null, '', u); }
      $('#year').textContent = App.digits(new Date().getFullYear());
      wireContact(); renderTicker(); renderCounters(true);
      App.listeners.forEach((fn) => fn(App.lang));
    },
    toast(msg) {
      const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
      clearTimeout(App._tt); App._tt = setTimeout(() => t.classList.remove('is-on'), 4200);
    },
    waLink(text) {
      const n = (C.WHATSAPP || C.PHONE).replace(/[^\d]/g, '');
      return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
    },
  };

  // ---------- contact wiring (config driven) ----------
  const igUrl = `https://www.instagram.com/${C.INSTAGRAM_USER || 'tenniscoach.elnaz.khanbeygi'}/`;
  const igDm = `https://ig.me/m/${C.INSTAGRAM_USER || 'tenniscoach.elnaz.khanbeygi'}`;
  function wireContact() {
    const ui = App.ui();
    $$('.js-ig').forEach((a) => { a.href = a.classList.contains('ct') ? igDm : igUrl; a.target = '_blank'; a.rel = 'noopener'; });
    $$('.js-wa:not(.js-wa-booking)').forEach((a) => { a.href = App.waLink(ui.waText); a.target = '_blank'; a.rel = 'noopener'; });
    $$('.js-tel').forEach((a) => { a.href = `tel:${C.PHONE}`; });
    $$('.js-phone-label').forEach((s) => { s.textContent = App.digits(C.PHONE_DISPLAY || C.PHONE); });
    const loc = App.lang === 'fa' ? C.LOCATION_FA : C.LOCATION_EN;
    $$('.js-location').forEach((s) => {
      s.innerHTML = isPh(loc) ? `${ui.locationPh} <span class="ph">${App.lang === 'fa' ? 'آدرس باشگاه را الناز اعلام کند' : 'Club address: Elnaz to provide'}</span>` : loc;
    });
  }
  // ---------- ticker ----------
  const tickerItems = {
    fa: ['ITF Level 1', 'مربی پدل', 'سرمربی تیم ملی سافت تنیس', 'سرمربی تیم تهران', '۲ قهرمانی کشور', 'داور درجه ۳', 'ITF Coaches Conference', 'تنیس کودکان'],
    en: ['ITF Level 1', 'Padel coach', 'National soft tennis head coach', 'Team Tehran head coach', '2× national champion', 'Grade-3 referee', 'ITF Coaches Conference', "Kids' tennis"],
  };
  function renderTicker() {
    const items = tickerItems[App.lang].map((t) => `<span>${t}</span><i aria-hidden="true"></i>`).join('');
    $('#ticker').innerHTML = items + items;
  }

  // ---------- counters ----------
  let countersDone = false;
  function renderCounters(instant) {
    $$('[data-count]').forEach((el) => {
      const target = +el.dataset.count, suf = el.dataset.suffix || '';
      if (instant && countersDone) { el.textContent = App.digits(target) + suf; return; }
      if (instant) return;
      if (reduce) { el.textContent = App.digits(target) + suf; return; }
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = App.digits(v) + (p === 1 ? suf : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (!instant) countersDone = true;
  }

  // ---------- gallery + photo fallbacks ----------
  const GALLERY = ['g1', 'g2', 'g3', 'g4', 'g6'];
  $('#gallery').innerHTML = GALLERY.map((g, i) => `
    <a class="g reveal${i === 0 ? ' g--big' : ''}" href="${igUrl}" target="_blank" rel="noopener">
      <div class="photo-frame"><img data-photo src="img/${g}.webp" alt="" loading="lazy" width="600" height="600"><span class="ph-label">IG</span></div>
    </a>`).join('');
  const markEmpty = (img) => img.closest('.photo-frame').classList.add('is-empty');
  $$('img[data-photo]').forEach((img) => {
    if (img.complete) img.naturalWidth ? img.closest('.photo-frame').classList.add('is-loaded') : markEmpty(img);
    img.addEventListener('error', () => markEmpty(img));
    img.addEventListener('load', () => img.closest('.photo-frame').classList.add('is-loaded'));
  });

  // ---------- draft notes ----------
  if (!C.SHOW_DRAFT_NOTES) document.documentElement.classList.add('no-draft');

  // ---------- reveal on scroll ----------
  if (reduce || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
  } else {
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    App.observe = (els) => els.forEach((el, i) => { el.style.setProperty('--d', `${(i % 4) * 70}ms`); io.observe(el); });
    App.observe($$('.reveal'));
  }
  const statsIo = 'IntersectionObserver' in window && new IntersectionObserver((ents) => {
    if (ents.some((e) => e.isIntersecting)) { renderCounters(false); statsIo.disconnect(); }
  }, { threshold: 0.4 });
  statsIo ? statsIo.observe($('.stats')) : renderCounters(false);

  // ---------- nav shadow + active ----------
  const nav = $('.nav');
  addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 10), { passive: true });

  // ---------- init ----------
  $('#year').textContent = new Date().getFullYear();
  $('#langToggle').addEventListener('click', () => App.setLang(App.lang === 'fa' ? 'en' : 'fa'));
  let initial = new URLSearchParams(location.search).get('lang');
  if (!initial) { try { initial = localStorage.getItem('lang'); } catch (e) {} }
  App.setLang(initial || 'fa', !!initial);
  document.documentElement.classList.add('is-ready');
})();
