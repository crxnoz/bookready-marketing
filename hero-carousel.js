(function () {
  'use strict';

  var ROTATE_MS = 4500;
  var PROGRAMMATIC_LOCKOUT_MS = 900;

  var root = document.querySelector('[data-carousel]');
  if (!root) return;

  var strip = root.querySelector('[data-strip]');
  var slides = Array.prototype.slice.call(root.querySelectorAll('.br-hero-carousel__slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.br-hero-carousel__dot'));
  var caption = root.querySelector('[data-caption]');
  var prevBtn = root.querySelector('[data-prev]');
  var nextBtn = root.querySelector('[data-next]');

  if (!strip || !slides.length) return;

  var current = 0;
  var timer = null;
  var paused = false;
  var programmatic = false;
  var programmaticTimer = null;
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setActive(idx) {
    if (idx === current || idx < 0 || idx >= slides.length) return;
    slides[current].classList.remove('is-active');
    slides[idx].classList.add('is-active');
    if (dots[current]) {
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
    }
    if (dots[idx]) {
      dots[idx].classList.add('is-active');
      dots[idx].setAttribute('aria-selected', 'true');
    }
    if (caption) {
      caption.textContent = slides[idx].getAttribute('aria-label') || '';
    }
    current = idx;
    var img = slides[idx].querySelector('img');
    if (img && img.getAttribute('loading') === 'lazy') {
      img.setAttribute('loading', 'eager');
    }
    var nextIdx = (idx + 1) % slides.length;
    var nextImg = slides[nextIdx].querySelector('img');
    if (nextImg && nextImg.getAttribute('loading') === 'lazy') {
      nextImg.setAttribute('loading', 'eager');
    }
  }

  var animFrame = null;
  function smoothScrollTo(targetLeft, duration) {
    if (animFrame) cancelAnimationFrame(animFrame);
    var start = strip.scrollLeft;
    var distance = targetLeft - start;
    if (Math.abs(distance) < 1) { strip.scrollLeft = targetLeft; return; }
    var startTime = (window.performance && performance.now) ? performance.now() : Date.now();
    function step(now) {
      var t = Math.min(1, (now - startTime) / duration);
      var ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      strip.scrollLeft = start + distance * ease;
      if (t < 1) animFrame = requestAnimationFrame(step);
      else animFrame = null;
    }
    animFrame = requestAnimationFrame(step);
  }

  function scrollToSlide(idx, instant) {
    var slide = slides[idx];
    if (!slide) return;
    var left = slide.offsetLeft;
    programmatic = true;
    if (programmaticTimer) clearTimeout(programmaticTimer);
    if (instant || prefersReducedMotion) {
      strip.scrollLeft = left;
    } else {
      smoothScrollTo(left, 600);
    }
    programmaticTimer = setTimeout(function () { programmatic = false; }, PROGRAMMATIC_LOCKOUT_MS);
  }

  function go(idx) {
    var next = ((idx % slides.length) + slides.length) % slides.length;
    setActive(next);
    scrollToSlide(next);
  }

  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  function start() {
    if (prefersReducedMotion || paused) return;
    stop();
    timer = window.setInterval(next, ROTATE_MS);
  }
  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  // IntersectionObserver — track which slide is most visible after a manual drag
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (programmatic) return;
      var best = null;
      entries.forEach(function (entry) {
        if (!best || entry.intersectionRatio > best.intersectionRatio) {
          best = entry;
        }
      });
      slides.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var stripRect = strip.getBoundingClientRect();
        var visibleLeft = Math.max(r.left, stripRect.left);
        var visibleRight = Math.min(r.right, stripRect.right);
        s.__ratio = Math.max(0, visibleRight - visibleLeft) / r.width;
      });
      var bestIdx = -1;
      var bestRatio = 0;
      slides.forEach(function (s, i) {
        if (s.__ratio > bestRatio) {
          bestRatio = s.__ratio;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0 && bestIdx !== current) setActive(bestIdx);
    }, { root: strip, threshold: [0.3, 0.5, 0.7, 0.9] });
    slides.forEach(function (s) { io.observe(s); });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { go(i); start(); });
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); start(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); start(); });

  root.addEventListener('mouseenter', function () { paused = true; stop(); });
  root.addEventListener('mouseleave', function () { paused = false; start(); });
  root.addEventListener('focusin', function () { paused = true; stop(); });
  root.addEventListener('focusout', function () {
    if (!root.contains(document.activeElement)) {
      paused = false;
      start();
    }
  });

  // Pause autorotate while user is actively dragging/swiping
  strip.addEventListener('pointerdown', function () { paused = true; stop(); });
  strip.addEventListener('pointerup', function () { paused = false; start(); });
  strip.addEventListener('pointercancel', function () { paused = false; start(); });
  strip.addEventListener('touchstart', function () { paused = true; stop(); }, { passive: true });
  strip.addEventListener('touchend', function () { paused = false; start(); }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { prev(); start(); }
    else if (e.key === 'ArrowRight') { next(); start(); }
  });

  // Initial scroll alignment (in case the page was loaded mid-scroll restoration)
  scrollToSlide(0, true);
  setTimeout(function () { programmatic = false; }, 50);

  start();
})();
