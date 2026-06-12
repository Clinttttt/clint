/* =========================================================
   DeployFlow — landing page interactions
   Vanilla JS, progressive enhancement, accessible.
   ========================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky nav shadow ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    menu.hidden = true;
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menu.hidden = !open;
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });
  }

  /* ---------- Scroll reveal (with light stagger) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    // stagger items that share a grid/list parent
    document.querySelectorAll('.grid, .steps, .trust__list, .faq').forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        if (child.classList.contains('reveal')) child.style.setProperty('--rd', `${(i % 6) * 70}ms`);
      });
    });
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Scroll-spy ---------- */
  const spyLinks = Array.from(document.querySelectorAll('.nav__links a[data-spy]'));
  const spyTargets = spyLinks.map((a) => document.getElementById(a.dataset.spy)).filter(Boolean);
  if (spyTargets.length && 'IntersectionObserver' in window) {
    const setCurrent = (id) => spyLinks.forEach((a) => a.classList.toggle('is-current', a.dataset.spy === id));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setCurrent(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* ---------- FAQ accordion ---------- */
  const faqBtns = document.querySelectorAll('.faq__q');
  faqBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      // close others (single-open accordion)
      faqBtns.forEach((other) => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const op = document.getElementById(other.getAttribute('aria-controls'));
          if (op) op.hidden = true;
        }
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  /* ---------- Pricing billing toggle ---------- */
  const billMonthly = document.getElementById('billMonthly');
  const billAnnual = document.getElementById('billAnnual');
  const amounts = document.querySelectorAll('.plan__amount');
  function setBilling(mode) {
    const monthly = mode === 'monthly';
    if (billMonthly) { billMonthly.classList.toggle('is-active', monthly); billMonthly.setAttribute('aria-pressed', String(monthly)); }
    if (billAnnual) { billAnnual.classList.toggle('is-active', !monthly); billAnnual.setAttribute('aria-pressed', String(!monthly)); }
    amounts.forEach((el) => {
      const val = monthly ? el.dataset.monthly : el.dataset.annual;
      if (val) el.textContent = val;
    });
  }
  if (billMonthly) billMonthly.addEventListener('click', () => setBilling('monthly'));
  if (billAnnual) billAnnual.addEventListener('click', () => setBilling('annual'));

  /* ---------- Global Escape ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();
