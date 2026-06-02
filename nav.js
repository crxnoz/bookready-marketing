/* ─── Nav behavior (vanilla JS, no deps) ───
   Drives the sticky nav: mega-panel open/close (click + desktop hover),
   the mobile hamburger drawer, outside-click and Escape to close.
   Shared across every page — the markup must include [data-br-nav]. */
(function () {
  var nav = document.querySelector('[data-br-nav]');
  if (!nav) return;

  var hamburger = nav.querySelector('[data-br-hamburger]');
  var triggers  = nav.querySelectorAll('[data-br-trigger]');
  var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var closeTimer = null;

  function isDesktop() { return window.innerWidth > 960; }
  function panelFor(trigger) {
    return document.getElementById(trigger.getAttribute('aria-controls'));
  }
  function openPanel(trigger) {
    var p = panelFor(trigger);
    if (!p) return;
    trigger.setAttribute('aria-expanded', 'true');
    p.classList.add('is-open');
    p.removeAttribute('hidden');
  }
  function closePanel(trigger) {
    var p = panelFor(trigger);
    if (!p) return;
    trigger.setAttribute('aria-expanded', 'false');
    p.classList.remove('is-open');
  }
  function closeAll(except) {
    triggers.forEach(function (t) { if (t !== except) closePanel(t); });
  }
  function cancelClose() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }
  function scheduleCloseAll(delay) {
    cancelClose();
    closeTimer = setTimeout(function () { closeAll(); }, delay || 180);
  }

  // ── Mobile hamburger ──────────────────────────────────────
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (!open) closeAll();
    });
  }

  // ── Click — works on touch, keyboard, and desktop fallback ──
  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      cancelClose();
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';
      closeAll(trigger);
      if (isOpen) closePanel(trigger);
      else openPanel(trigger);
    });
  });

  // ── Hover (desktop only, hover-capable pointers) ──
  if (hoverable) {
    triggers.forEach(function (trigger) {
      var p = panelFor(trigger);
      if (!p) return;

      trigger.addEventListener('mouseenter', function () {
        if (!isDesktop()) return;
        cancelClose();
        closeAll(trigger);
        openPanel(trigger);
      });
      trigger.addEventListener('mouseleave', function () {
        if (!isDesktop()) return;
        scheduleCloseAll(180);
      });
      p.addEventListener('mouseenter', function () {
        if (!isDesktop()) return;
        cancelClose();
      });
      p.addEventListener('mouseleave', function () {
        if (!isDesktop()) return;
        scheduleCloseAll(180);
      });
    });
  }

  // ── Outside click closes (desktop only — mobile drawer has its own state) ──
  document.addEventListener('click', function (e) {
    if (nav.contains(e.target)) return;
    closeAll();
  });

  // ── Escape closes everything ──
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAll();
    if (nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open menu');
      }
      document.body.style.overflow = '';
    }
  });
})();

/* ─── Sticky-nav elevation on scroll ───
   Adds a soft shadow under the nav once the page is scrolled, so it
   reads as layered above the content instead of painted on. Only
   toggles a class — never hides anything. */
(function () {
  var nav = document.querySelector('[data-br-nav]');
  if (!nav) return;
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ─── Scroll-reveal: gentle fade-up for sections entering view ───
   Only elements *below* the initial viewport get the reveal class, so
   above-the-fold content never flashes opacity 0. Skips entirely when
   IntersectionObserver isn't available or reduced-motion is on. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  var els = document.querySelectorAll('.br-section, .br-pagehero, .br-tpl-hero, .br-final-cta');
  if (!els.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) {
    var r = el.getBoundingClientRect();
    // Already in (or above) the viewport at load — leave it visible.
    if (r.top < window.innerHeight - 40) return;
    el.classList.add('br-reveal');
    io.observe(el);
  });
})();
