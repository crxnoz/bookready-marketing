/* ─── Velvet Theory booking demo ───
   Self-contained 5-step booking walkthrough scoped to [data-vt-booking].
   Shared by the homepage demo and the /templates/velvettheory page. */
(function () {
  var root = document.querySelector('[data-vt-booking]');
  if (!root) return;

  var LABELS = ['', 'Service', 'Artist', 'Date & Time', 'Newsletter', 'Confirmed'];
  var state  = { svc: '', staff: 'Maya Chen', date: 'Jun 4', time: '2:00 PM' };

  function progress(n) {
    root.querySelectorAll('[data-vt-node]').forEach(function (node) {
      var num = parseInt(node.getAttribute('data-vt-node'), 10);
      node.classList.toggle('is-active', num === n);
      node.classList.toggle('is-done',   num <  n);
    });
    root.querySelectorAll('[data-vt-line]').forEach(function (line) {
      line.classList.toggle('is-done', parseInt(line.getAttribute('data-vt-line'), 10) < n);
    });
    var cap = root.querySelector('[data-vt-caption]');
    if (cap) cap.textContent = 'Step ' + n + ' of 5 · ' + LABELS[n];
  }

  function show(n) {
    root.querySelectorAll('[data-vt-panel]').forEach(function (p) { p.hidden = true; });
    var panel = root.querySelector('[data-vt-panel="' + n + '"]');
    if (panel) panel.hidden = false;
    progress(n);
    if (n === 5) {
      var sEl  = root.querySelector('[data-vt-confirm-svc]');
      var tEl  = root.querySelector('[data-vt-confirm-time]');
      var stEl = root.querySelector('[data-vt-confirm-staff]');
      if (sEl)  sEl.textContent  = state.svc;
      if (tEl)  tEl.textContent  = state.date + ' · ' + state.time;
      if (stEl) stEl.textContent = state.staff;
    }
  }

  // Step 1 — click anywhere on card advances
  root.querySelectorAll('[data-vt-svc]').forEach(function (card) {
    card.addEventListener('click', function () {
      root.querySelectorAll('[data-vt-svc]').forEach(function (c) { c.classList.remove('is-selected'); });
      card.classList.add('is-selected');
      state.svc = card.getAttribute('data-svc-name');
      show(2);
    });
  });

  // Step 2 — staff
  root.querySelectorAll('[data-vt-staff]').forEach(function (card) {
    card.addEventListener('click', function () {
      root.querySelectorAll('[data-vt-staff]').forEach(function (c) { c.classList.remove('is-selected'); });
      card.classList.add('is-selected');
      state.staff = card.getAttribute('data-vt-staff');
    });
  });

  // Step 3 — calendar date
  root.querySelectorAll('[data-vt-cal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.querySelectorAll('[data-vt-cal]').forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      state.date = btn.getAttribute('data-vt-cal');
    });
  });

  // Step 3 — time slots
  root.querySelectorAll('[data-vt-time]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.querySelectorAll('[data-vt-time]').forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      state.time = btn.getAttribute('data-vt-time');
    });
  });

  // Next / back buttons
  root.querySelectorAll('[data-vt-next]').forEach(function (btn) {
    btn.addEventListener('click', function () { show(parseInt(btn.getAttribute('data-vt-next'), 10)); });
  });
  root.querySelectorAll('[data-vt-back]').forEach(function (btn) {
    btn.addEventListener('click', function () { show(parseInt(btn.getAttribute('data-vt-back'), 10)); });
  });

  // Checkbox
  var checkbox   = root.querySelector('[data-vt-checkbox]');
  var emailInput = root.querySelector('[data-vt-email]');
  var nameInput  = root.querySelector('[data-vt-name]');
  var submitBtn  = root.querySelector('[data-vt-submit]');

  if (checkbox) checkbox.addEventListener('click', function () { checkbox.classList.toggle('is-checked'); });
  if (emailInput) emailInput.addEventListener('input', function () { emailInput.style.borderColor = ''; });

  // Step 4 submit
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var email = emailInput ? emailInput.value.trim() : '';
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (email && !valid) {
        if (emailInput) { emailInput.style.borderColor = '#C9A876'; emailInput.focus(); }
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking…';
      var done = function () { show(5); };
      if (valid) {
        fetch('https://api.bkrdy.me/api/v1/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: email, source: 'booking-demo-vt' })
        }).catch(function () {}).finally(done);
      } else { done(); }
    });
  }

  // Restart
  root.querySelectorAll('[data-vt-restart]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.querySelectorAll('[data-vt-svc]').forEach(function (c) { c.classList.remove('is-selected'); });
      root.querySelectorAll('[data-vt-staff]').forEach(function (c) { c.classList.remove('is-selected'); });
      var first = root.querySelector('[data-vt-staff]');
      if (first) first.classList.add('is-selected');
      state = { svc: '', staff: 'Maya Chen', date: 'Jun 4', time: '2:00 PM' };
      if (emailInput) { emailInput.value = ''; emailInput.style.borderColor = ''; }
      if (nameInput)  nameInput.value = '';
      if (checkbox)   checkbox.classList.remove('is-checked');
      if (submitBtn)  { submitBtn.disabled = false; submitBtn.textContent = 'Get early access →'; }
      // reset calendar + slots to defaults
      root.querySelectorAll('[data-vt-cal]').forEach(function (b) { b.classList.remove('is-selected'); });
      var defaultDay = root.querySelector('[data-vt-cal="Jun 4"]');
      if (defaultDay) defaultDay.classList.add('is-selected');
      root.querySelectorAll('[data-vt-time]').forEach(function (b) { b.classList.remove('is-selected'); });
      var defaultTime = root.querySelector('[data-vt-time="2:00 PM"]');
      if (defaultTime) defaultTime.classList.add('is-selected');
      show(1);
    });
  });
})();
