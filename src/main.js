import './style.css';

// ==========================================
// AI ARBITRAGE BLUEPRINT - MAIN SCRIPT
// ==========================================

// ---------- CONFIG ----------
const CONFIG = {
  totalSlots: 20,
  soldSlots: 13, // Update this to change slot count
  price: 96000,
  productName: 'AI Arbitrage Blueprint - Batch 8 Presale 2',
  checkoutUrl: '/checkout.html',
};

// ---------- SLOT COUNTER ----------
function updateSlotDisplay() {
  const remaining = CONFIG.totalSlots - CONFIG.soldSlots;

  // Update all slot displays
  const slotSold = document.getElementById('slot-sold');
  const slotRemaining = document.getElementById('slot-remaining');
  const slotRemainingHero = document.getElementById('slot-remaining-hero');
  const slotMobile = document.getElementById('slot-mobile');

  if (slotSold) slotSold.textContent = CONFIG.soldSlots;
  if (slotRemaining) slotRemaining.textContent = remaining;
  if (slotRemainingHero) slotRemainingHero.textContent = remaining;
  if (slotMobile) slotMobile.textContent = remaining;
}

// ---------- COUNTDOWN TIMER (Cookie-Based Persistent) ----------
function initCountdown() {
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');
  const timerEl = document.getElementById('countdown-timer');
  const expiredEl = document.getElementById('countdown-expired');

  if (!hoursEl || !minutesEl || !secondsEl) return;

  const STORAGE_KEY = 'aab_countdown_deadline';
  const COOKIE_TTL_DAYS = 3;

  function getDeadline() {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = getCookie(STORAGE_KEY);
    }

    if (stored) {
      const deadline = parseInt(stored, 10);
      if (!isNaN(deadline) && deadline > 0) {
        return deadline;
      }
    }

    // First visit: set deadline to now + 24 hours
    const deadline = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, String(deadline));
    setCookie(STORAGE_KEY, String(deadline), COOKIE_TTL_DAYS);
    return deadline;
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  const deadline = getDeadline();
  let intervalId = null;

  function showExpired() {
    if (timerEl) timerEl.style.display = 'none';
    const labelEl = document.querySelector('.countdown-label');
    if (labelEl) labelEl.style.display = 'none';
    if (expiredEl) expiredEl.style.display = 'block';

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function updateCountdown() {
    const timeLeft = deadline - Date.now();

    if (timeLeft <= 0) {
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      showExpired();
      return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // Update immediately and then every second
  updateCountdown();
  intervalId = setInterval(updateCountdown, 1000);
}

// ---------- FAQ ACCORDION ----------
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-item__question');

    question.addEventListener('click', () => {
      // Close other items and update their aria-expanded
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherQuestion = otherItem.querySelector('.faq-item__question');
          if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      item.classList.toggle('active');
      const isActive = item.classList.contains('active');
      question.setAttribute('aria-expanded', String(isActive));
    });
  });
}

// ---------- SMOOTH SCROLL ----------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ---------- CTA BUTTON HANDLERS ----------
function initCTAButtons() {
  const ctaButtons = document.querySelectorAll('[id^="cta-"]');

  ctaButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Redirect to checkout page
      window.location.href = CONFIG.checkoutUrl;
    });
  });
}

// ---------- SCROLL ANIMATIONS ----------
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target); // Stop observing once visible
      }
    });
  }, observerOptions);

  // Only animate sections that are NOT the hero or credibility bar
  document.querySelectorAll('.section:not(.hero):not(.credibility-bar):not(.zenith-usp), .card, .testimonial-card, .deliverable-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ---------- VIDEO TRACKING + COMPLETION CTA ----------
function initVideoTracking() {
  const video = document.querySelector('.hero-video video');
  const ctaPrompt = document.getElementById('video-cta-prompt');

  if (!video) return;

  const firedMilestones = new Set();
  let ctaShown = false;

  function trackPixel(eventName, data) {
    if (typeof fbq !== 'undefined') {
      fbq('trackCustom', eventName, data);
    }
  }

  function showVideoCTA() {
    if (ctaShown || !ctaPrompt) return;
    ctaShown = true;
    ctaPrompt.setAttribute('aria-hidden', 'false');
    ctaPrompt.classList.add('visible');
  }

  video.addEventListener('play', () => {
    trackPixel('VideoPlay', { action: 'play' });
  });

  video.addEventListener('pause', () => {
    if (!video.ended) {
      trackPixel('VideoPause', { action: 'pause' });
    }
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration || video.duration === 0) return;

    const percent = (video.currentTime / video.duration) * 100;

    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (percent >= milestone && !firedMilestones.has(milestone)) {
        firedMilestones.add(milestone);
        trackPixel('VideoProgress', { percent: milestone });
      }
    }

    if (percent >= 80) {
      showVideoCTA();
    }
  });

  video.addEventListener('ended', () => {
    if (!firedMilestones.has(100)) {
      firedMilestones.add(100);
      trackPixel('VideoProgress', { percent: 100 });
    }
    showVideoCTA();
  });
}

// ---------- STICKY CTA BAR & WHATSAPP BUTTON (show/hide) ----------
function initFloatingElements() {
  const heroSection = document.querySelector('.hero');
  const stickyCta = document.getElementById('sticky-cta-bar');
  const waBtn = document.getElementById('wa-float-btn');

  if (!heroSection || (!stickyCta && !waBtn)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // When hero IS visible -> hide floating elements
        // When hero is NOT visible -> show floating elements
        const heroVisible = entry.isIntersecting;

        if (stickyCta) {
          if (heroVisible) {
            stickyCta.classList.remove('sticky-cta--visible');
          } else {
            stickyCta.classList.add('sticky-cta--visible');
          }
        }

        if (waBtn) {
          if (heroVisible) {
            waBtn.classList.remove('wa-float--visible');
          } else {
            waBtn.classList.add('wa-float--visible');
          }
        }
      });
    },
    {
      root: null,
      threshold: 0.15, // Hide when at least 15% of hero is visible
    }
  );

  observer.observe(heroSection);
}

// ---------- SOCIAL PROOF TOAST NOTIFICATIONS ----------
function initSocialProofToast() {
  const toastEl = document.getElementById('social-proof-toast');
  const toastAvatar = document.getElementById('toast-avatar');
  const toastText = document.getElementById('toast-text');
  const toastClose = document.getElementById('toast-close');

  if (!toastEl || !toastAvatar || !toastText) return;

  const TOAST_DATA = [
    { name: 'Rizki', city: 'Surabaya', time: '3 jam lalu' },
    { name: 'Andi', city: 'Jakarta', time: '5 jam lalu' },
    { name: 'Sari', city: 'Bandung', time: '1 jam lalu' },
    { name: 'Budi', city: 'Medan', time: '30 menit lalu' },
    { name: 'Dewi', city: 'Semarang', time: '2 jam lalu' },
    { name: 'Fahri', city: 'Makassar', time: '45 menit lalu' },
    { name: 'Putri', city: 'Yogyakarta', time: '1 jam lalu' },
    { name: 'Agus', city: 'Bali', time: '4 jam lalu' },
  ];

  const AVATAR_COLORS = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
  ];

  let currentIndex = 0;
  let toastTimer = null;
  let isToastDismissed = false;

  function isUserFillingForm() {
    const activeEl = document.activeElement;
    if (!activeEl) return false;
    const tag = activeEl.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function isCheckoutPage() {
    return window.location.pathname.includes('checkout');
  }

  function showToast() {
    if (isToastDismissed || isUserFillingForm() || isCheckoutPage()) {
      scheduleNextToast();
      return;
    }

    const data = TOAST_DATA[currentIndex];
    const color = AVATAR_COLORS[currentIndex % AVATAR_COLORS.length];

    toastAvatar.textContent = data.name.charAt(0);
    toastAvatar.style.backgroundColor = color;
    toastText.textContent = data.name + ' dari ' + data.city + ' baru join ' + data.time;

    toastEl.classList.add('social-toast--visible');

    // Auto-hide after 4 seconds
    toastTimer = setTimeout(() => {
      hideToast();
    }, 4000);

    currentIndex = (currentIndex + 1) % TOAST_DATA.length;
  }

  function hideToast() {
    toastEl.classList.remove('social-toast--visible');
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    scheduleNextToast();
  }

  function scheduleNextToast() {
    if (isToastDismissed) return;
    // Random delay between 8-15 seconds
    const delay = Math.floor(Math.random() * 7000) + 8000;
    setTimeout(showToast, delay);
  }

  // Dismiss button
  if (toastClose) {
    toastClose.addEventListener('click', () => {
      isToastDismissed = true;
      hideToast();
    });
  }

  // Don't start on checkout pages
  if (isCheckoutPage()) return;

  // Start showing after 10 seconds
  setTimeout(showToast, 10000);
}

// ---------- EXIT-INTENT POPUP (DESKTOP ONLY) ----------
function initExitIntent() {
  const overlay = document.getElementById('exit-intent-overlay');
  const closeBtn = document.getElementById('exit-close');
  const dismissBtn = document.getElementById('exit-dismiss');

  if (!overlay) return;

  // Only run on desktop (no hover/mouse on touch devices)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) return;

  // Only trigger once per session
  if (sessionStorage.getItem('exitIntentShown')) return;

  // Exit-intent countdown timer
  const exitHoursEl = document.getElementById('exit-countdown-hours');
  const exitMinutesEl = document.getElementById('exit-countdown-minutes');
  const exitSecondsEl = document.getElementById('exit-countdown-seconds');
  let exitCountdownInterval = null;

  function getTimeUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow - now;
  }

  function updateExitCountdown() {
    const timeLeft = getTimeUntilMidnight();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (exitHoursEl) exitHoursEl.textContent = String(hours).padStart(2, '0');
    if (exitMinutesEl) exitMinutesEl.textContent = String(minutes).padStart(2, '0');
    if (exitSecondsEl) exitSecondsEl.textContent = String(seconds).padStart(2, '0');
  }

  function showExitPopup() {
    sessionStorage.setItem('exitIntentShown', 'true');
    overlay.classList.add('exit-overlay--visible');
    document.body.style.overflow = 'hidden';

    // Start countdown
    updateExitCountdown();
    exitCountdownInterval = setInterval(updateExitCountdown, 1000);

    // Remove the mouseleave listener so it only fires once
    document.removeEventListener('mouseleave', handleMouseLeave);
  }

  function closeExitPopup() {
    overlay.classList.remove('exit-overlay--visible');
    document.body.style.overflow = '';
    if (exitCountdownInterval) {
      clearInterval(exitCountdownInterval);
      exitCountdownInterval = null;
    }
  }

  function handleMouseLeave(e) {
    // Only trigger when mouse moves toward the top of the viewport
    if (e.clientY <= 5) {
      showExitPopup();
    }
  }

  // Listen for mouse leaving the document toward the top
  document.addEventListener('mouseleave', handleMouseLeave);

  // Close on X button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeExitPopup);
  }

  // Close on dismiss link
  if (dismissBtn) {
    dismissBtn.addEventListener('click', closeExitPopup);
  }

  // Close on overlay click (but not on modal click)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeExitPopup();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('exit-overlay--visible')) {
      closeExitPopup();
    }
  });
}

// ---------- ANIMATED NUMBER COUNTERS ----------
function initAnimatedCounters() {
  const counterElements = document.querySelectorAll('[data-count-to]');
  if (!counterElements.length) return;

  // easeOutExpo: fast start, slow end
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count-to'));
    const prefix = el.getAttribute('data-count-prefix') || '';
    const suffix = el.getAttribute('data-count-suffix') || '';
    const duration = 2000; // 2 seconds
    const isInteger = Number.isInteger(target);
    const startTime = performance.now();

    // Set initial value to 0
    el.textContent = prefix + '0' + suffix;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = easedProgress * target;

      if (isInteger) {
        el.textContent = prefix + Math.round(currentValue) + suffix;
      } else {
        el.textContent = prefix + currentValue.toFixed(1) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Ensure final value is exact
        el.textContent = prefix + target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
  });

  counterElements.forEach(el => observer.observe(el));
}

// ---------- MOBILE CAROUSEL (scroll-snap + dots + auto-advance) ----------
function initCarousels() {
  const MOBILE_BREAKPOINT = 768;
  const AUTO_ADVANCE_MS = 5000;

  // Only activate on mobile
  if (window.innerWidth >= MOBILE_BREAKPOINT) return;

  const carousels = document.querySelectorAll('[data-carousel]');

  carousels.forEach(carousel => {
    const track = carousel.querySelector('.carousel__track');
    const dotsContainer = carousel.querySelector('.carousel__dots');
    const slides = track.querySelectorAll('.carousel__slide');

    if (!track || !dotsContainer || slides.length === 0) return;

    // --- Create dot indicators ---
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel__dot');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      if (i === 0) dot.classList.add('carousel__dot--active');

      // Tap dot to scroll to that slide
      dot.addEventListener('click', () => {
        slides[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });

      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carousel__dot');

    // --- Sync dots on scroll using IntersectionObserver ---
    let currentIndex = 0;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(slides).indexOf(entry.target);
          if (idx !== -1 && idx !== currentIndex) {
            currentIndex = idx;
            dots.forEach((d, di) => {
              d.classList.toggle('carousel__dot--active', di === idx);
            });
          }
        }
      });
    }, {
      root: track,
      threshold: 0.6 // Slide is considered active when 60% visible
    });

    slides.forEach(slide => observer.observe(slide));

    // --- Auto-advance ---
    let autoTimer = null;
    let isTouching = false;

    function startAutoAdvance() {
      stopAutoAdvance();
      autoTimer = setInterval(() => {
        if (isTouching) return;
        const nextIndex = (currentIndex + 1) % slides.length;
        slides[nextIndex].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }, AUTO_ADVANCE_MS);
    }

    function stopAutoAdvance() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    // Pause on touch
    track.addEventListener('touchstart', () => {
      isTouching = true;
      stopAutoAdvance();
    }, { passive: true });

    track.addEventListener('touchend', () => {
      isTouching = false;
      // Restart auto-advance after user stops touching
      startAutoAdvance();
    }, { passive: true });

    // Start auto-advancing
    startAutoAdvance();

    // Pause auto-advance when carousel is not visible (save resources)
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startAutoAdvance();
        } else {
          stopAutoAdvance();
        }
      });
    }, { threshold: 0.1 });

    visibilityObserver.observe(carousel);
  });
}

// ---------- INITIALIZE ----------
document.addEventListener('DOMContentLoaded', () => {
  updateSlotDisplay();
  initCountdown();
  initFAQ();
  initSmoothScroll();
  initCTAButtons();
  initScrollAnimations();
  initVideoTracking();
  initFloatingElements();
  initSocialProofToast();
  initExitIntent();
  initAnimatedCounters();
  initCarousels();

  console.log('AI Arbitrage Blueprint initialized');
});
