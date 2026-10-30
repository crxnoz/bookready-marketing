/* BKRDY v2 page behavior (rebrand, 2026-10-30). Vanilla, no deps.
   Analytics, signup intent and referral passthrough stay in nav.js,
   which every page loads; this file only drives the v2 nav menu and
   the pricing cycle switch. */

/* Phone menu */
(function () {
  var nav = document.querySelector('[data-v-nav]');
  if (!nav) return;
  var burger = nav.querySelector('[data-v-burger]');
  if (!burger) return;

  function set(open) {
    if (open) nav.setAttribute('data-open', '');
    else nav.removeAttribute('data-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  burger.addEventListener('click', function () {
    set(!nav.hasAttribute('data-open'));
  });
  // A link in the menu closes it (the anchors scroll within the page).
  nav.querySelectorAll('.v-drawer a').forEach(function (a) {
    a.addEventListener('click', function () { set(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.hasAttribute('data-open')) { set(false); burger.focus(); }
  });
})();

/* Pricing: yearly or monthly. Every element with data-yearly and
   data-monthly swaps its text. */
(function () {
  var buttons = document.querySelectorAll('[data-v-cycle]');
  if (!buttons.length) return;

  function show(cycle) {
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-v-cycle') === cycle ? 'true' : 'false');
    });
    document.querySelectorAll('[data-yearly][data-monthly]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + cycle);
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-v-cycle')); });
  });
})();
