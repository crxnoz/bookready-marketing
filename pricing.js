/* ─── Pricing: billing toggle + per-plan SMS multiplier + Salon waitlist + SMS calculator ───
   Scoped to #pricing. Shared by the homepage pricing section and the
   standalone /pricing page — both use identical markup. */
(function () {
  var section = document.getElementById('pricing');
  if (!section) return;

  // ── SMS uplift rate: $0.01 per additional SMS — a gentle launch price
  // (~17% gross margin at the ~$0.0083 Twilio send cost; still above
  // cost). Scales per plan automatically (Solo 2x = +$4, Studio 2x = +$8,
  // Salon 2x = +$20). MUST stay in lockstep with api/config/plans.php
  // per_sms_uplift_dollars; if you tweak this, re-run
  // `php artisan stripe:create-products` to update the Stripe catalog.
  var PER_SMS_UPLIFT = 0.01;

  function fmt(n) { return n >= 1000 ? n.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,') : String(n); }

  function refreshPlan(plan) {
    var mult     = parseInt(plan.getAttribute('data-sms-mult') || '1', 10);
    var smsBase  = parseInt(plan.getAttribute('data-sms-base'), 10);
    var baseM    = parseInt(plan.getAttribute('data-base-m'), 10);
    var baseA    = parseInt(plan.getAttribute('data-base-a'), 10);
    // Per-plan uplift = added SMS × $0.0075. Annual base + monthly
    // uplift × 12 / 12 = baseA + monthly-uplift (already per-month).
    // All current plan/mult pairings land on integer dollars.
    var extraSms      = (mult - 1) * smsBase;
    var upliftMonthly = Math.round(extraSms * PER_SMS_UPLIFT);

    var smsEl   = plan.querySelector('[data-sms-amount]');
    var priceM  = plan.querySelector('[data-price-m]');
    var priceA  = plan.querySelector('[data-price-a]');
    if (smsEl)  smsEl.textContent  = fmt(smsBase * mult);
    if (priceM) priceM.textContent = (baseM + upliftMonthly);
    if (priceA) priceA.textContent = (baseA + upliftMonthly);

    // Update CTA href params (billing + sms multiplier) — Salon has no CTA, waitlist instead
    var billing = section.getAttribute('data-billing');
    var planKey = plan.getAttribute('data-plan');
    var cta = plan.querySelector('a.br-plan__button');
    if (cta) {
      var params = ['plan=' + planKey];
      if (billing === 'annual') params.push('billing=annual');
      if (mult > 1)             params.push('sms=' + mult + 'x');
      cta.href = 'https://app.bkrdy.me/register?' + params.join('&');
    }
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
      section.querySelectorAll('.br-plan').forEach(refreshPlan);
    });
  });

  // ── Per-plan SMS multiplier toggle ───────────────────────────────
  section.querySelectorAll('.br-plan').forEach(function (plan) {
    plan.setAttribute('data-sms-mult', '1');
    var smsBtns = plan.querySelectorAll('[data-sms-mult]');
    smsBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mult = btn.getAttribute('data-sms-mult');
        plan.setAttribute('data-sms-mult', mult);
        smsBtns.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-sms-mult') === mult);
        });
        refreshPlan(plan);
      });
    });
  });

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

  // ── SMS calculator ───────────────────────────────────────────────
  var calc = section.querySelector('[data-sms-calc]');
  if (calc) {
    var inputs = {
      days:     calc.querySelector('[data-calc-days]'),
      staff:    calc.querySelector('[data-calc-staff]'),
      bookings: calc.querySelector('[data-calc-bookings]'),
      confirm:  calc.querySelector('[data-calc-confirm]'),
      remind:   calc.querySelector('[data-calc-remind]'),
      cancel:   calc.querySelector('[data-calc-cancel]')
    };
    var totalEl = calc.querySelector('[data-calc-total]');
    var recEl   = calc.querySelector('[data-calc-rec]');

    // Cheapest-fit recommendation table (ordered ascending by SMS cap).
    // Studio jumps to 1,400 SMS base because the realistic 5-staff load
    // (~2.2 notifs × 22 days × 5 staff × 6 bookings/day) lands around there.
    var TIERS = [
      [400,  'Solo at 1× covers you'],
      [800,  'Solo at 2× covers you'],
      [1200, 'Solo at 3× covers you'],
      [1400, 'Studio at 1× covers you'],
      [2800, 'Studio at 2× covers you'],
      [4200, 'Studio at 3× covers you']
    ];
    var OVER = 'Above 4,200 SMS. Salon is launching soon. Join the waitlist below.';

    function recompute() {
      var d = Math.max(0, parseInt(inputs.days.value, 10)     || 0);
      var s = Math.max(1, parseInt(inputs.staff.value, 10)    || 1);
      var b = Math.max(0, parseInt(inputs.bookings.value, 10) || 0);
      var perBooking = 0;
      if (inputs.confirm.checked) perBooking += 1;
      if (inputs.remind.checked)  perBooking += 1;
      if (inputs.cancel.checked)  perBooking += 0.2;
      var total = Math.round(d * s * b * perBooking);
      if (totalEl) totalEl.textContent = fmt(total);

      var picked = null;
      for (var i = 0; i < TIERS.length; i++) {
        if (total <= TIERS[i][0]) { picked = TIERS[i][1]; break; }
      }
      if (!picked) picked = OVER;
      if (recEl) recEl.textContent = picked;
    }

    Object.keys(inputs).forEach(function (k) {
      var el = inputs[k];
      if (!el) return;
      el.addEventListener('input',  recompute);
      el.addEventListener('change', recompute);
    });
    recompute();
  }
})();
