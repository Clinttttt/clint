/* =========================================================
   Clint Villanueva — Portfolio interactions (final)
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

  /* ---------- Anonymous unique portfolio views ---------- */
  const portfolioViewCounter = document.getElementById('portfolioViewCounter');
  const portfolioViewCount = document.getElementById('portfolioViewCount');

  // Always the same endpoint. Passing unsupported params (a previous version sent
  // readOnly) makes this service answer from a different bucket, which made the
  // displayed count drop on repeat visits.
  const VIEW_ENDPOINT = 'https://counterapi.com/api/clinttttt.github.io/view/portfolio-home?unique=true';
  const VIEW_CACHE_KEY = 'clint-portfolio-view-count-v4';
  const VIEW_OWNER_KEY = 'clint-portfolio-owner';
  const VIEW_TIMEOUT_MS = 6000;

  // Owner exclusion. Visit ?owner=1 once per browser to stop your own visits from
  // inflating the public count; ?owner=0 undoes it. The flag lives in this browser
  // only, so the counter never sees this device again. IP is deliberately not used
  // for this: a dynamic residential address rotates and would defeat it.
  function syncOwnerFlag() {
    let isOwner = false;
    try { isOwner = window.localStorage.getItem(VIEW_OWNER_KEY) === '1'; } catch (error) { /* Storage may be blocked. */ }

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('owner');
    if (requested !== '1' && requested !== '0') return isOwner;

    isOwner = requested === '1';
    try {
      if (isOwner) window.localStorage.setItem(VIEW_OWNER_KEY, '1');
      else window.localStorage.removeItem(VIEW_OWNER_KEY);
    } catch (error) { /* Without storage the flag cannot persist. */ }

    // Strip the parameter so a copied link never sets this flag for someone else.
    params.delete('owner');
    const query = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
    return isOwner;
  }

  function readCachedViewCount() {
    try {
      const cached = Number(window.localStorage.getItem(VIEW_CACHE_KEY));
      return Number.isFinite(cached) && cached > 0 ? Math.floor(cached) : 0;
    } catch (error) {
      return 0; // Storage can be unavailable (private mode, strict cookie policy).
    }
  }

  function writeCachedViewCount(count) {
    try { window.localStorage.setItem(VIEW_CACHE_KEY, String(count)); } catch (error) { /* Non-fatal. */ }
  }

  function renderViewCount(count) {
    const formatted = count.toLocaleString();
    portfolioViewCount.textContent = formatted;
    portfolioViewCounter.setAttribute('aria-label', `${formatted} unique portfolio ${count === 1 ? 'view' : 'views'}`);
    portfolioViewCounter.dataset.viewState = 'ready';
  }

  async function fetchViewCount() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), VIEW_TIMEOUT_MS);
    try {
      const response = await fetch(VIEW_ENDPOINT, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`View counter responded with ${response.status}.`);
      const result = await response.json();
      const count = Math.floor(Number(result.value));
      if (!Number.isFinite(count) || count < 1) throw new Error('View counter returned an invalid value.');
      return count;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function loadPortfolioViews() {
    const isOwner = syncOwnerFlag();
    if (!portfolioViewCounter || !portfolioViewCount) return;

    // Paint the last known good value at once so repeat visits never flash.
    const cached = readCachedViewCount();
    if (cached > 0) renderViewCount(cached);

    // Keep local development traffic out of the public counter.
    const isLocal = window.location.protocol === 'file:' ||
      ['localhost', '127.0.0.1', '::1', ''].includes(window.location.hostname);

    // Owner and local visits never reach the counter, so they cannot inflate it.
    // The badge still shows the last value this browser saw, if any.
    if (isOwner || isLocal) {
      if (cached === 0) portfolioViewCounter.dataset.viewState = 'unavailable';
      return;
    }

    try {
      const fresh = await fetchViewCount();
      // Views only accumulate, so never render a regression.
      const next = Math.max(fresh, cached);
      renderViewCount(next);
      writeCachedViewCount(next);
    } catch (error) {
      // Blocked, offline or timed out: show nothing instead of a misleading 0.
      if (cached === 0) portfolioViewCounter.dataset.viewState = 'unavailable';
    }
  }

  loadPortfolioViews();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  const menuBackdrop = document.getElementById('navBackdrop');
  let menuCloseTimer = 0;

  function openMenu() {
    if (!menu || !toggle || !menuBackdrop) return;
    window.clearTimeout(menuCloseTimer);
    menu.hidden = false;
    menuBackdrop.hidden = false;
    document.body.classList.add('nav-menu-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => {
      menu.classList.add('is-open');
      menuBackdrop.classList.add('is-open');
      menu.querySelector('a')?.focus({ preventScroll: true });
    });
  }

  function closeMenu({ returnFocus = false } = {}) {
    if (!menu || !toggle) return;
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    menu.classList.remove('is-open');
    menuBackdrop?.classList.remove('is-open');
    document.body.classList.remove('nav-menu-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    window.clearTimeout(menuCloseTimer);
    menuCloseTimer = window.setTimeout(() => {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
      if (menuBackdrop && !menuBackdrop.classList.contains('is-open')) menuBackdrop.hidden = true;
    }, prefersReduced ? 0 : 240);
    if (returnFocus && wasOpen) toggle.focus({ preventScroll: true });
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') closeMenu({ returnFocus: true });
      else openMenu();
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    menuBackdrop?.addEventListener('click', () => closeMenu({ returnFocus: true }));
    window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
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

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById('copyEmail');
  const copyText = document.getElementById('copyEmailText');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          const ta = document.createElement('textarea');
          ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        }
        if (copyText) copyText.textContent = 'Copied!';
        copyBtn.classList.add('is-copied');
      } catch (err) { if (copyText) copyText.textContent = 'Press Ctrl+C'; }
      setTimeout(() => { if (copyText) copyText.textContent = 'Copy email'; copyBtn.classList.remove('is-copied'); }, 2000);
    });
  }

  /* ---------- Back to top ---------- */
  const backTop = document.getElementById('backTop');
  if (backTop) {
    backTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      const brand = document.querySelector('.brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  /* ---------- Certificate lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  let lastFocused = null;

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Certificate, full view';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lightboxImg) lightboxImg.src = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  document.querySelectorAll('.cert__frame').forEach((frame) => {
    frame.addEventListener('click', () => openLightbox(frame.dataset.certSrc, frame.dataset.certAlt));
  });
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeLightbox));

  /* ---------- Staggered reveal within grids ---------- */
  const stagger = (selector, step = 70) => {
    document.querySelectorAll(selector).forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        if (child.classList.contains('reveal')) child.style.setProperty('--rd', `${(i % 6) * step}ms`);
      });
    });
  };
  stagger('#projectGrid');
  stagger('.gallery');
  stagger('.skillmap');

  /* ---------- Selected builds pagination ---------- */
  const projectGrid = document.getElementById('projectGrid');
  const projectCards = projectGrid ? Array.from(projectGrid.querySelectorAll('.project')) : [];
  const projectPrev = document.getElementById('projectPrev');
  const projectNext = document.getElementById('projectNext');
  const projectPageStatus = document.getElementById('projectPageStatus');
  let projectPage = 1;
  let projectPageTimer = 0;

  const renderProjectPage = (page) => {
    projectPage = page;
    projectCards.forEach((card) => {
      const cardPage = Number(card.dataset.projectPage || 1);
      card.hidden = cardPage !== page;
      if (cardPage === page) card.classList.add('is-visible');
    });
    if (projectPageStatus) projectPageStatus.textContent = `0${page} / 02`;
    if (projectPrev) projectPrev.disabled = page === 1;
    if (projectNext) projectNext.disabled = page === 2;
  };

  const changeProjectPage = (page) => {
    if (!projectGrid || page === projectPage || page < 1 || page > 2) return;
    window.clearTimeout(projectPageTimer);
    if (prefersReduced) { renderProjectPage(page); return; }
    projectGrid.classList.add('is-switching');
    projectPageTimer = window.setTimeout(() => {
      renderProjectPage(page);
      window.requestAnimationFrame(() => projectGrid.classList.remove('is-switching'));
    }, 160);
  };

  projectPrev?.addEventListener('click', () => changeProjectPage(projectPage - 1));
  projectNext?.addEventListener('click', () => changeProjectPage(projectPage + 1));
  if (projectCards.length) renderProjectPage(1);

  /* ---------- Count-up stats (About) ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      if (prefersReduced) { el.textContent = target + suffix; return; }
      const dur = 1100; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const co = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach((c) => co.observe(c));
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- Cursor spotlight on project cards ---------- */
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('#projectGrid .project').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Global Escape ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu({ returnFocus: true });
      if (lightbox && !lightbox.hidden) closeLightbox();
    }
  });
})();
