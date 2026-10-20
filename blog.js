/* BKRDY blog: reading progress, copy buttons, and the hub's topic filter.
   Everything here is an enhancement. With JavaScript off the article reads
   normally, the copy block still shows its text, and the hub shows every
   article (the filter buttons are simply inert). */
(function () {
  'use strict';

  // Reading progress hairline.
  var art = document.querySelector('[data-bq-article]');
  var bar = document.querySelector('[data-bq-bar]');
  if (art && bar) {
    var tick = function () {
      var box = art.getBoundingClientRect();
      var total = box.height - window.innerHeight;
      var done = total > 0 ? Math.min(1, Math.max(0, -box.top / total)) : 0;
      bar.style.width = (done * 100).toFixed(1) + '%';
    };
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', tick, { passive: true });
    tick();
  }

  // Copy buttons on the copy-this blocks.
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!b) return;
    var box = b.closest('.bq-copy');
    var text = box && box.querySelector('.bq-copy__t');
    if (!text) return;
    var done = function (ok) {
      b.textContent = ok ? 'Copied' : 'Select and copy';
      b.setAttribute('data-done', '');
      setTimeout(function () { b.textContent = 'Copy'; b.removeAttribute('data-done'); }, 2400);
    };
    var value = text.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
    } else {
      // Older browsers: select the text so the reader can copy it themselves.
      try {
        var r = document.createRange();
        r.selectNodeContents(text);
        var s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
        done(document.execCommand('copy'));
      } catch (err) { done(false); }
    }
  });

  // Hub topic filter.
  var chips = document.querySelector('.bq-chips');
  if (chips) {
    var none = document.querySelector('.bq-hub__none');
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      var want = b.getAttribute('data-filter');
      Array.prototype.forEach.call(chips.querySelectorAll('button'), function (x) {
        var on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var shown = 0;
      Array.prototype.forEach.call(document.querySelectorAll('[data-pillar]'), function (card) {
        var hit = want === 'all' || card.getAttribute('data-pillar') === want;
        card.hidden = !hit;
        if (hit) shown++;
      });
      if (none) none.hidden = shown > 0;
    });
  }
})();
