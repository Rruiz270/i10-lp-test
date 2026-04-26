/* =====================================================
   INSTITUTO i10 — site behavior
   - Language toggle (PT / EN) via [data-pt] / [data-en]
   - Mobile nav
   - Scroll reveal (IntersectionObserver)
   - Counter animation on numbers with [data-count]
   - Nav background intensifies on scroll
   ===================================================== */

(function () {
  'use strict';

  const LANG_KEY = 'i10.lang';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'pt';
  }

  function setLang(lang) {
    if (lang !== 'pt' && lang !== 'en') return;
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en');
    document.querySelectorAll('[data-pt]').forEach((el) => {
      const pt = el.getAttribute('data-pt');
      const en = el.getAttribute('data-en');
      if (pt == null || en == null) return;
      // Preserve inline HTML by using innerHTML when the string contains tags
      const target = lang === 'pt' ? pt : en;
      // Use innerHTML so we can include <span> accents etc.
      el.innerHTML = target;
    });
    document.querySelectorAll('[data-pt-attr]').forEach((el) => {
      const pairs = el.getAttribute('data-pt-attr').split('|');
      const en = el.getAttribute('data-en-attr').split('|');
      pairs.forEach((p, i) => {
        const [attr, value] = p.split('::');
        const enVal = en[i] ? en[i].split('::')[1] : value;
        el.setAttribute(attr, lang === 'pt' ? value : enVal);
      });
    });
    // Update toggle state
    document.querySelectorAll('.lang-toggle button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });
  }

  function initLang() {
    const lang = getLang();
    applyLang(lang);
    document.querySelectorAll('.lang-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  function initMobileNav() {
    const nav = document.querySelector('.nav');
    const burger = document.querySelector('.nav-burger');
    if (!nav || !burger) return;
    function close() {
      nav.classList.remove('nav-mobile-open');
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', () => {
      nav.classList.toggle('nav-mobile-open');
      const open = nav.classList.contains('nav-mobile-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach((a) => {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('nav-mobile-open')) {
        close();
        burger.focus();
      }
    });
  }

  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (items.length === 0) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((i) => i.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => io.observe(el));
  }

  function animateCount(el, to, suffix) {
    if (prefersReducedMotion) {
      el.textContent = to + (suffix || '');
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const from = 0;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = v + (suffix || '');
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window) || nums.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const to = parseInt(e.target.getAttribute('data-count'), 10);
          const suffix = e.target.getAttribute('data-suffix') || '';
          animateCount(e.target, to, suffix);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
  }

  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let ticking = false;
    function update() {
      nav.style.background = window.scrollY > 40
        ? 'rgba(3, 11, 36, 0.92)'
        : 'rgba(3, 11, 36, 0.65)';
      ticking = false;
    }
    update();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function initBarViz() {
    const bars = document.querySelectorAll('.bar');
    if (bars.length === 0) return;
    if (prefersReducedMotion) {
      bars.forEach((b) => { b.style.height = b.getAttribute('data-h') || '50%'; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const h = e.target.getAttribute('data-h') || '50%';
          e.target.style.height = h;
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach((b) => {
      b.style.height = '0%';
      io.observe(b);
    });
  }

  // Contact form: builds a mailto link + shows thank-you state
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const success = document.getElementById('contact-success');
    const closeBtn = document.getElementById('contact-success-close');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const org = form.querySelector('[name="org"]').value.trim();
      const topic = form.querySelector('[name="topic"]').value;
      const message = form.querySelector('[name="message"]').value.trim();
      const lang = getLang();
      const subj = lang === 'pt'
        ? `[Contato site] ${topic || 'Geral'} — ${name}`
        : `[Site contact] ${topic || 'General'} — ${name}`;
      const body = lang === 'pt'
        ? `Nome: ${name}\nE-mail: ${email}\nOrganização: ${org}\nAssunto: ${topic}\n\nMensagem:\n${message}`
        : `Name: ${name}\nEmail: ${email}\nOrganization: ${org}\nTopic: ${topic}\n\nMessage:\n${message}`;
      const mail = `mailto:contato@institutoi10.org.br?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      window.location.href = mail;

      if (success && form) {
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });

    closeBtn?.addEventListener('click', () => {
      if (!form || !success) return;
      form.reset();
      success.hidden = true;
      form.hidden = false;
    });
  }

  function initHeroVideo() {
    const heroVideo = document.getElementById('hero-video-player');
    const playBtn = document.getElementById('hero-video-play');
    const lightbox = document.getElementById('video-lightbox');
    const lightboxVideo = document.getElementById('video-lightbox-player');
    const lightboxClose = document.getElementById('video-lightbox-close');
    const heroFrame = heroVideo ? heroVideo.closest('.hero-v2-video-frame') : null;
    if (!lightbox || !lightboxVideo) return;

    function openLightbox() {
      // Pause hero loop while lightbox plays
      if (heroVideo) heroVideo.pause();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lightboxVideo.currentTime = 0;
      lightboxVideo.muted = false;
      const p = lightboxVideo.play();
      if (p && p.then) p.catch(() => {});
      lightboxClose?.focus();
    }
    function closeLightbox() {
      lightboxVideo.pause();
      lightbox.hidden = true;
      document.body.style.overflow = '';
      // Resume hero loop muted
      if (heroVideo) {
        heroVideo.muted = true;
        const p = heroVideo.play();
        if (p && p.then) p.catch(() => {});
      }
    }

    // Open: click anywhere on the frame OR on the play button OR double-click on hero video
    if (heroFrame) {
      heroFrame.addEventListener('click', openLightbox);
    }
    if (heroVideo) {
      heroVideo.addEventListener('dblclick', openLightbox);
    }

    // Close: backdrop, button, ESC
    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  function initVideoSoundToggle() {
    document.querySelectorAll('.video-sound-toggle').forEach((btn) => {
      const container = btn.parentElement;
      const video = container && container.querySelector('video');
      if (!video) return;
      btn.setAttribute('data-muted', 'true');
      btn.addEventListener('click', () => {
        video.muted = !video.muted;
        btn.setAttribute('data-muted', video.muted ? 'true' : 'false');
        // Garantir que o vídeo esteja tocando após interação
        if (!video.muted && video.paused) video.play().catch(() => {});
      });
    });
  }

  function initLazyVideoPlay() {
    if (!('IntersectionObserver' in window)) return;
    const videos = document.querySelectorAll('video[autoplay]');
    if (!videos.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach((v) => io.observe(v));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLang();
    initMobileNav();
    initNavScroll();
    initScrollReveal();
    initCounters();
    initBarViz();
    initContactForm();
    initHeroVideo();
    initVideoSoundToggle();
    initLazyVideoPlay();
  });
})();
