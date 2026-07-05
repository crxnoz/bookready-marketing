/* ─── Google Analytics 4 (every page) ───
   Loaded here instead of pasted into each .html so adding a new page
   to the marketing site is one less thing to remember. dataLayer +
   first config call run synchronously so they're queued before the
   async gtag.js script finishes loading — that's the standard pattern.
   Property: G-4PJSQ6MR9F (bkrdy.com). */
(function () {
  if (window.dataLayer) return; // guard against double-injection on hot reloads
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-4PJSQ6MR9F';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  /* Cross-domain linking: ads land here (bkrdy.com) but visitors sign up on
     app.bkrdy.me. Those are two different registrable domains, so a gclid
     captured here is stored in a bkrdy.com-scoped cookie the app can't read,
     and signup conversions never attribute. The linker passes the GA client_id
     + Ads gclid across via the _gl URL param — gtag auto-decorates outbound
     links to these domains. Keep this list identical to web GAScript.tsx. */
  var brkLinker = { domains: ['bkrdy.com', 'bkrdy.me'] };
  gtag('config', 'G-4PJSQ6MR9F', { linker: brkLinker });
  /* Google Ads conversion tag (same gtag.js instance). Captures the gclid on
     this landing domain so the linker has a click id to pass to the app. */
  gtag('config', 'AW-18258006802', { linker: brkLinker });
})();

/* ─── Named event firings (analytics event depth) ───
   The GA4 config above emits automatic page_views. On top of that we fire
   named funnel events the app-side registry (web/lib/analytics/events.ts)
   defines as "fired from the bookready-marketing repo":

     - pricing_viewed   — on /pricing/ page loads
     - template_viewed  — on /templates/{slug}/ page loads
     - cta_clicked      — on primary-CTA link clicks (any anchor whose href
                          points to app.bkrdy.me/register, plus anything
                          explicitly tagged with data-br-cta)

   Payload rule (matches events.ts PII policy): only page-derived slugs
   and button text. No visitor identifiers.

   Runs after the analytics IIFE above so window.gtag is always defined
   by the time these fire. Wrapped in try/catch — analytics can never
   break the marketing site. */
(function () {
  if (typeof window === 'undefined' || !window.gtag) return;

  function safeSend(name, params) {
    try { window.gtag('event', name, params || {}); } catch (e) { /* swallow */ }
  }

  /* Pricing page view — fires on load and on any client-side path change
     (in case a future SPA-ish nav is added). */
  function firePageEvents() {
    var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    // Pricing → pricing_viewed.
    if (path === '/pricing' || path.indexOf('/pricing/') === 0) {
      safeSend('pricing_viewed', {});
    }
    // Templates detail → template_viewed with the marketing slug.
    var tm = path.match(/^\/templates\/([a-z0-9-]+)/);
    if (tm) {
      safeSend('template_viewed', { template_name: tm[1] });
    }
  }
  firePageEvents();
  // No SPA today, but hook popstate so back/forward still emits. Cheap.
  window.addEventListener('popstate', firePageEvents);

  /* CTA click delegation — one document-level handler covers every CTA
     on every page without markup changes. Triggers on:
       (a) any anchor whose href points to a registration/trial-start URL
           on the app (…/register, …/checkout/plan, …/checkout/trial)
       (b) any element (or ancestor) with a data-br-cta attribute
     The data-br-cta value is used verbatim as the "location" param when
     present; otherwise we fall back to the current page path so you can
     still segment "which page did the CTA fire from" in GA4. */
  document.addEventListener('click', function (ev) {
    var el = ev.target;
    // Walk up to a matching anchor or [data-br-cta]. Cap the walk at 6
    // hops so a stray click deep in an SVG never scans the whole document.
    var hops = 0;
    while (el && hops < 6) {
      if (el.getAttribute) {
        var cta = el.getAttribute('data-br-cta');
        if (cta) {
          var textFromDom = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
          safeSend('cta_clicked', {
            location: cta,
            button_text: textFromDom || cta,
          });
          return;
        }
        if (el.tagName === 'A') {
          var href = el.getAttribute('href') || '';
          // App CTAs — any link that starts the funnel on the app.
          var isAppRegister =
            href.indexOf('app.bkrdy.me/register')      !== -1 ||
            href.indexOf('app.bkrdy.me/checkout/plan') !== -1 ||
            href.indexOf('app.bkrdy.me/checkout/trial')!== -1;
          if (isAppRegister) {
            var linkText = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
            safeSend('cta_clicked', {
              location: location.pathname || '/',
              button_text: linkText || 'Register',
            });
            return;
          }
        }
      }
      el = el.parentNode;
      hops++;
    }
  }, true);
})();

/* ─── Nav behavior (vanilla JS, no deps) ───
   Drives the sticky nav: mega-panel open/close (click + desktop hover),
   the mobile hamburger drawer, outside-click and Escape to close.
   Shared across every page — the markup must include [data-br-nav]. */

/* ─── #156: Marketing → signup intent passthrough ───
   When a visitor lands on a template detail page (/templates/{slug}/)
   stash the slug in sessionStorage so later pages (pricing, homepage)
   can append &template=… to the Start CTA. Marketing slugs are mapped
   to the backend canonical form here (the only normalization layer):

      fade-room       -> thefaderoom
      lush-studio     -> lushstudio
      velvet-theory   -> velvettheory
      blackline       -> blackline
      opaline         -> opaline

   Also rewrites every link with href starting with app.bkrdy.me/register
   on the current page to include the intent — covers the mega-nav
   "Start free" CTA + footer + any other static CTAs without each page
   needing per-link hardcoding.
*/
(function () {
  // Map any marketing-slug form to the backend canonical that the
  // /register validator accepts. Returns null when the URL isn't a
  // template detail page.
  function templateFromPath() {
    var m = (location.pathname || '').match(/^\/templates\/([a-z0-9-]+)\//);
    if (!m) return null;
    var slug = m[1];
    var map = {
      'fade-room':     'thefaderoom',
      'lush-studio':   'lushstudio',
      'velvet-theory': 'velvettheory',
    };
    return map[slug] || slug;
  }
  try {
    var found = templateFromPath();
    if (found) sessionStorage.setItem('br_last_template', found);
  } catch (_) { /* sessionStorage disabled, no-op */ }

  // Rewrite static /register links on the page to include the
  // last-known template (if any). Doesn't touch links that already
  // carry &template=… (e.g. the template-detail page's own CTAs).
  try {
    var lastTpl = sessionStorage.getItem('br_last_template');
    if (lastTpl) {
      document.querySelectorAll('a[href*="app.bkrdy.me/register"]').forEach(function (a) {
        var h = a.getAttribute('href');
        if (!h || /[?&]template=/.test(h)) return;
        a.setAttribute('href', h + (h.indexOf('?') === -1 ? '?' : '&') + 'template=' + encodeURIComponent(lastTpl));
      });
    }
  } catch (_) { /* sessionStorage / DOM unavailable, no-op */ }
})();

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

/* ─── GA4 marketing-funnel events ───
   page_view is already auto-tracked by the gtag config at the top of this
   file. These add the conversion signals the funnel actually needs:

     cta_clicked     — any click on a "Get started / Start free" CTA
                       (any link whose href targets /register). Params:
                       { location: <page path>, button_text }. Lets you see
                       landing→click per page (e.g. /for-barbers vs /pricing).
     template_viewed — fires on load of a /templates/{slug}/ detail page.
                       Params: { template_name }. One report ranks which
                       templates get looked at, instead of reading paths.
     pricing_viewed  — fires on load of /pricing/.

   These match the shared AnalyticsEvents registry in the app repo
   (web/lib/analytics/events.ts) so both properties speak the same vocab.
   gtag() is defined synchronously by the config block above, so events
   queue in dataLayer even before gtag.js finishes loading. Never throws. */
(function () {
  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (_) {}
  }

  var path = (location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';

  // Page-load signals.
  var tpl = path.match(/^\/templates\/([a-z0-9-]+)$/);
  if (tpl) track('template_viewed', { template_name: tpl[1] });
  if (path === '/pricing') track('pricing_viewed', {});

  // Delegated CTA click — capture-phase so it still fires before the
  // navigation unloads the page. Matches any register-bound link.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/\/register(\b|\?|$)/.test(href)) return;
    var text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Get started';
    track('cta_clicked', { location: path, button_text: text });
  }, true);
})();

/* BKRDY Growth affiliate attribution (every page, rides nav.js like GA).
   bkrdy.com and app.bkrdy.me are different domains, so a cookie cannot
   cross; instead the ref code is stored here and carried into every
   app.bkrdy.me link as ?ref=, where the app's own capture takes over.
   Last click wins, 90-day shelf life, silent on any failure. */
(function () {
  var KEY = 'bkrdy_ref';
  var TTL_MS = 90 * 24 * 60 * 60 * 1000;
  var CODE_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;

  function saved() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || !v.code || !CODE_RE.test(v.code)) return null;
      if (!v.at || Date.now() - v.at > TTL_MS) { localStorage.removeItem(KEY); return null; }
      return v.code;
    } catch (e) { return null; }
  }

  try {
    var ref = new URLSearchParams(location.search).get('ref');
    if (ref && CODE_RE.test(ref)) {
      localStorage.setItem(KEY, JSON.stringify({ code: ref, at: Date.now() }));
    }
  } catch (e) { /* private mode etc. */ }

  function decorate(a) {
    var code = saved();
    if (!code) return;
    try {
      var u = new URL(a.href, location.href);
      if (u.hostname !== 'app.bkrdy.me') return;
      if (u.searchParams.get('ref')) return;
      u.searchParams.set('ref', code);
      a.href = u.toString();
    } catch (e) { /* leave the link alone */ }
  }

  function decorateAll() {
    if (!saved()) return;
    var links = document.querySelectorAll('a[href*="app.bkrdy.me"]');
    for (var i = 0; i < links.length; i++) decorate(links[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateAll);
  } else {
    decorateAll();
  }

  // Capture-phase fixup at click time catches links added after load.
  // (Middle/cmd-click new-tab opens are covered by the decorated href.)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a) decorate(a);
  }, true);
})();
