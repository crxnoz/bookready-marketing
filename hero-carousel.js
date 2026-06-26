(function () {
  'use strict';

  var ROTATE_MS = 4500;
  var SWIPE_THRESHOLD = 40;

  var root = document.querySelector('[data-carousel]');
  if (!root) return;

  var deck = root.querySelector('[data-deck]');
  var slides = Array.prototype.slice.call(root.querySelectorAll('.br-hero-carousel__slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.br-hero-carousel__dot'));
  var caption = root.querySelector('[data-caption]');
  var prevBtn = root.querySelector('[data-prev]');
  var nextBtn = root.querySelector('[data-next]');

  if (!slides.length) return;

  var current = 0;
  var timer = null;
  var paused = false;
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(index) {
    var next = (index + slides.length) % slides.length;
    if (next === current) return;
    slides[current].classList.remove('is-active');
    slides[next].classList.add('is-active');
    if (dots[current]) {
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
    }
    if (dots[next]) {
      dots[next].classList.add('is-active');
      dots[next].setAttribute('aria-selected', 'true');
    }
    if (caption) {
      var label = slides[next].getAttribute('aria-label') || '';
      caption.textContent = label;
    }
    current = next;
    var img = slides[next].querySelector('img');
    if (img && img.getAttribute('loading') === 'lazy') {
      img.setAttribute('loading', 'eager');
    }
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

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      go(i);
      start();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      prev();
      start();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      next();
      start();
    });
  }

  root.addEventListener('mouseenter', function () { paused = true; stop(); });
  root.addEventListener('mouseleave', function () { paused = false; start(); });
  root.addEventListener('focusin', function () { paused = true; stop(); });
  root.addEventListener('focusout', function () {
    if (!root.contains(document.activeElement)) {
      paused = false;
      start();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { prev(); start(); }
    else if (e.key === 'ArrowRight') { next(); start(); }
  });

  var touchStartX = null;
  if (deck) {
    deck.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var endX = (e.changedTouches && e.changedTouches[0].clientX) || touchStartX;
      var dx = endX - touchStartX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx > 0) prev(); else next();
        start();
      }
      touchStartX = null;
    }, { passive: true });
  }

  start();
})();
