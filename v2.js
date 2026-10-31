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

/* Templates index: filter the gallery by mood. Each card lists its
   moods in data-moods; "all" shows every card. */
(function () {
  var buttons = document.querySelectorAll('[data-v-filter]');
  if (!buttons.length) return;
  var cards = document.querySelectorAll('[data-moods]');

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var pick = b.getAttribute('data-v-filter');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var moods = ' ' + c.getAttribute('data-moods') + ' ';
        if (pick === 'all' || moods.indexOf(' ' + pick + ' ') !== -1) c.removeAttribute('hidden');
        else c.setAttribute('hidden', '');
      });
    });
  });
})();

// Email capture (newsletter, community, tutorials, contact, roadmap): posts
// to the same /leads endpoint the old forms used, tagged with data-source.
(function () {
  var forms = document.querySelectorAll('[data-v-lead]');
  if (!forms.length) return;
  forms.forEach(function (form) {
    var box = form.closest('[data-v-lead-box]');
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button');
    var label = btn.textContent;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.removeAttribute('aria-invalid');
      btn.disabled = true; btn.textContent = 'Sending';
      fetch('https://api.bkrdy.me/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, source: form.getAttribute('data-source') || 'site' })
      }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function () {
          form.hidden = true;
          var ok = box && box.querySelector('[data-v-lead-ok]');
          if (ok) ok.removeAttribute('hidden');
        })
        .catch(function () { btn.disabled = false; btn.textContent = label; input.setAttribute('aria-invalid', 'true'); input.focus(); });
    });
  });
})();
