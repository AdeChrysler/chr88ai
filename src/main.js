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

// ---------- COUNTDOWN TIMER ----------
function initCountdown() {
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!hoursEl || !minutesEl || !secondsEl) return;

  // Set countdown to midnight (next day)
  function getTimeUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow - now;
  }

  function updateCountdown() {
    const timeLeft = getTimeUntilMidnight();

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // Update immediately and then every second
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ---------- FAQ ACCORDION ----------
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-item__question');

    question.addEventListener('click', () => {
      // Close other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });

      // Toggle current item
      item.classList.toggle('active');
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

// ---------- VIDEO AUTOPLAY ON SCROLL ----------
function initVideoAutoplay() {
  const videoContainer = document.getElementById('video-container');
  const videoIframe = document.getElementById('intro-video');

  if (!videoContainer || !videoIframe) return;

  let hasPlayed = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasPlayed) {
        // Autoplay the video by updating src with autoplay parameter
        const currentSrc = videoIframe.src;
        if (!currentSrc.includes('autoplay=1')) {
          videoIframe.src = currentSrc + '&autoplay=1&mute=1';
          hasPlayed = true;
        }
      }
    });
  }, {
    threshold: 0.5 // Trigger when 50% visible
  });

  observer.observe(videoContainer);
}

// ---------- INITIALIZE ----------
document.addEventListener('DOMContentLoaded', () => {
  updateSlotDisplay();
  initCountdown();
  initFAQ();
  initSmoothScroll();
  initCTAButtons();
  initScrollAnimations();
  initVideoAutoplay();

  console.log('AI Arbitrage Blueprint initialized');
});
