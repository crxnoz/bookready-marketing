/* ─── Mobile sticky bottom CTA: show/hide on scroll ───
   Mirrors the behaviour of the app's DemoCtaBar (web/components/public),
   reimplemented in vanilla JS for the static marketing site.

   Behaviour:
   - Stays hidden until the visitor scrolls past the hero (~240px) so it
     never competes with the primary above-the-fold CTA.
   - Hides on scroll-DOWN (gets out of the way of reading).
   - Reappears on scroll-UP (intent to navigate / act).
   - Adds .has-mobile-cta on <body> so pages.css can reserve footer space.
   - Falls back to a permanently-visible bar without IntersectionObserver
     when reduced-motion is preferred. */

(function () {
  var bar = document.querySelector('.br-mobile-cta');
  if (!bar) return;

  document.body.classList.add('has-mobile-cta');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    bar.classList.remove('is-hidden');
    return;
  }

  var lastY = window.scrollY || 0;
  var ticking = false;

  // Start hidden until the visitor moves down the page.
  bar.classList.add('is-hidden');

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      var dy = y - lastY;
      var nearTop = y < 240;

      if (nearTop) {
        bar.classList.add('is-hidden');
      } else if (dy > 4) {
        // scrolling down — get out of the way
        bar.classList.add('is-hidden');
      } else if (dy < -4) {
        // scrolling up — intent to act
        bar.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();
