(() => {
  const modal = document.querySelector('#spinnerShowcase');
  const dialog = modal?.querySelector('.spinner-modal__dialog');
  const track = modal?.querySelector('#spinnerShowcaseTrack');
  const slides = [...(modal?.querySelectorAll('.spinner-slide') || [])];
  const openers = [...document.querySelectorAll('.spinner-showcase-open')];
  const closeButton = modal?.querySelector('#spinnerShowcaseClose');
  const closeTargets = [...(modal?.querySelectorAll('[data-spinner-close]') || [])];
  const previous = modal?.querySelector('#spinnerShowcasePrevious');
  const next = modal?.querySelector('#spinnerShowcaseNext');
  const progress = modal?.querySelector('#spinnerShowcaseProgress');

  if (!modal || !dialog || !track || !slides.length || !openers.length || !previous || !next || !progress) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndex = 0;
  let lastFocused = null;
  let scrollFrame = 0;
  let lockedScrollY = 0;
  let previousBodyStyles = null;

  const formatStep = (value) => String(value).padStart(2, '0');

  const updateControls = (index) => {
    activeIndex = Math.max(0, Math.min(slides.length - 1, index));
    progress.textContent = `${formatStep(activeIndex + 1)} / ${formatStep(slides.length)}`;
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === slides.length - 1;
  };

  const moveTo = (index, behavior = reducedMotion.matches ? 'auto' : 'smooth') => {
    const targetIndex = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: slides[targetIndex].offsetLeft, behavior });
    updateControls(targetIndex);
  };

  const nearestIndex = () => {
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const candidate = Math.abs(track.scrollLeft - slide.offsetLeft);
      if (candidate < distance) {
        distance = candidate;
        nearest = index;
      }
    });
    return nearest;
  };

  const openModal = (opener) => {
    lastFocused = opener;
    lockedScrollY = window.scrollY;
    previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    modal.hidden = false;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    moveTo(0, 'auto');
    requestAnimationFrame(() => closeButton?.focus());
  };

  const closeModal = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    if (previousBodyStyles) {
      Object.assign(document.body.style, previousBodyStyles);
    }
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, lockedScrollY);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  };

  openers.forEach((opener) => opener.addEventListener('click', () => openModal(opener)));
  closeTargets.forEach((target) => target.addEventListener('click', closeModal));
  previous.addEventListener('click', () => moveTo(activeIndex - 1));
  next.addEventListener('click', () => moveTo(activeIndex + 1));

  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => updateControls(nearestIndex()));
  }, { passive: true });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveTo(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveTo(activeIndex + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveTo(slides.length - 1);
    }

    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  updateControls(0);
})();
