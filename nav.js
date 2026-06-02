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
