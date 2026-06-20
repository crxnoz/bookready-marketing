/* ─── Pricing: billing toggle + Salon waitlist ───
   Scoped to #pricing. Shared by the homepage pricing section and the
   standalone /pricing page — both use identical markup.

   Prices are static HTML. Monthly vs annual visibility is pure CSS, driven by
   the data-billing attribute on #pricing (see styles.css). This script only
   flips that attribute on toggle, keeps the CTA hrefs in sync, and runs the
   Salon waitlist. SMS pricing/quotas were removed while SMS texting is not
   live (it ships free at launch), so there is no per-plan price math here. */
(function () {
  var section = document.getElementById('pricing');
  if (!section) return;

  // ── Keep each plan CTA's register link in sync with the billing choice ──
  // #156 — template comes from sessionStorage.br_last_template (set by nav.js
  // when the visitor browsed a /templates/{slug}/ page). If unset, omit — the
  // app's /checkout/trial defaults to thefaderoom. Salon has no CTA (waitlist).
  // The persona pages add data-ref="<persona>" so the toggle preserves
  // their attribution across monthly/annual flips. Homepage + /pricing
  // omit the attr and stay clean.
  var pricingRef = section.getAttribute('data-ref');

  function syncCtas() {
    var billing = section.getAttribute('data-billing');
    section.querySelectorAll('.br-plan').forEach(function (plan) {
      var cta = plan.querySelector('a.br-plan__button');
      if (!cta) return;
      var params = ['plan=' + plan.getAttribute('data-plan')];
      if (billing === 'annual') params.push('billing=annual');
      try {
        var lastTpl = sessionStorage.getItem('br_last_template');
        if (lastTpl) params.push('template=' + encodeURIComponent(lastTpl));
      } catch (_) { /* sessionStorage disabled, no-op */ }
      if (pricingRef) params.push('ref=' + encodeURIComponent(pricingRef));
      cta.href = 'https://app.bkrdy.me/register?' + params.join('&');
    });
  }

  // ── Billing toggle (monthly/annual) ──────────────────────────────
  var billingBtns = section.querySelectorAll('[data-billing-btn]');
  billingBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var billing = btn.getAttribute('data-billing-btn');
      section.setAttribute('data-billing', billing);
      billingBtns.forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-billing-btn') === billing);
      });
      syncCtas();
    });
  });
  syncCtas();

  // ── Salon waitlist ───────────────────────────────────────────────
  var waitlist = section.querySelector('[data-salon-waitlist]');
  if (waitlist) {
    var input   = waitlist.querySelector('[data-waitlist-email]');
    var submit  = waitlist.querySelector('[data-waitlist-submit]');
    var form    = waitlist.querySelector('[data-waitlist-form]');
    var success = waitlist.querySelector('[data-waitlist-success]');

    if (input) input.addEventListener('input', function () { input.style.borderColor = ''; });
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit.click(); });

    submit && submit.addEventListener('click', function () {
      var email = input ? input.value.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (input) { input.style.borderColor = '#C0392B'; input.focus(); }
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Adding you…';
      fetch('https://api.bkrdy.me/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, source: 'salon-waitlist' })
      })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () {
        if (form)    form.hidden    = true;
        if (success) success.removeAttribute('hidden');
      })
      .catch(function () {
        submit.disabled = false;
        submit.textContent = 'Join the waitlist';
        if (input) { input.style.borderColor = '#C0392B'; input.focus(); }
      });
    });
  }
})();
