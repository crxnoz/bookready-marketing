/* ─── Sticky "Use this template" CTA ───
   Appears on /templates/{slug}/ pages after the visitor scrolls past
   the hero. Slides in from the bottom, stays visible while they
   browse, dismissible per session via sessionStorage.

   Mounts when:
   - <a class="br-sticky-tpl" data-template="{slug}"> exists on the page
   - The visitor hasn't dismissed it this session (key: br_tpl_sticky_dismissed)
   - The visitor has scrolled past the hero (200px is enough)

   Pattern mirrors the app's DemoCtaBar in spirit but simpler (no
   scroll-direction tracking, single show-on-pass + dismiss model). */

(function () {
  var bar = document.querySelector('.br-sticky-tpl');
  if (!bar) return;

  // Per-session dismiss memory. sessionStorage so a refresh re-tries
  // (someone who dismissed and came back later still gets the CTA),
  // but a single browse session stays clean.
  try {
    if (sessionStorage.getItem('br_tpl_sticky_dismissed') === '1') return;
  } catch (_) { /* sessionStorage blocked; show the bar anyway */ }

  var dismiss = bar.querySelector('.br-sticky-tpl__dismiss');
  if (dismiss) {
    dismiss.addEventListener('click', function (e) {
      e.preventDefault();
      bar.classList.remove('is-visible');
      try { sessionStorage.setItem('br_tpl_sticky_dismissed', '1'); } catch (_) {}
    });
  }

  // Reveal on first scroll past 200px. Use IntersectionObserver against
  // a sentinel if one is supplied (#br-sticky-trigger), otherwise plain
  // scroll math. Stays visible once revealed until dismissed.
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    bar.classList.add('is-visible');
  }
  function onScroll() {
    if ((window.scrollY || 0) > 200) reveal();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // In case the visitor lands already-scrolled (back-button, deep anchor):
  onScroll();
})();
