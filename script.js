/**
 * IAN YEN PORTFOLIO — Interactive Motion & Physics Engine
 * Exact recreation of https://leomarlowe.framer.website/ custom Framer components:
 * 1. Theme Manager (Defaults to Dark Mode `#121110` with Light/Dark Toggle)
 * 2. Top Pill Nav Bar (`U(e)`): Scroll-Progress SVG Ring, Spring Hover Pill, Live NYC Clock
 * 3. Interactive GIF Avatar Stage (`wd`): 3D Cursor Tilt, Cycling Speech Bubble, 360° Spin + GIF Cycle
 * 4. Hero Project Dock (`Kt`): Spring Magnification Physics (`translateY` + `scale`) + Preview Popovers
 * 5. Work Cards (`Ot`): Clip-Path Unveil, Scroll Parallax + Cursor Opposition Pan,
 *    Centered-to-Cursor-Following Glass `"View case ↗"` Badge, Character Slot-Machine Titles
 * 6. Tool Dock (`Yt`): macOS-Style Spring Magnification Physics
 * 7. Magnetic Ripple Buttons (`g(e)`): Cursor Pull + Entry-Point Radial Fill + Slot Text
 */

// Immediately preload and decode all 5 avatar GIF variants before DOMContentLoaded
const AVATAR_GIF_VARIANTS = [
  'assets/avatar_var_1_blue_blink.gif?v=26',
  'assets/avatar_var_4_navy_hoodie.gif?v=26',
  'assets/avatar_var_5_green_laptop.gif?v=26',
  'assets/avatar_var_3_navy_victory.gif?v=26',
  'assets/avatar_var_2_orange_funny.gif?v=26',
];
const preloadedAvatarGifs = AVATAR_GIF_VARIANTS.map((src) => {
  const img = new Image();
  img.decoding = 'sync';
  img.fetchPriority = 'high';
  img.src = src;
  return img;
});

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. THEME MANAGER (Default to Dark Mode as requested) & ON-LOAD REVEAL
     ========================================================================== */
  const savedTheme = localStorage.getItem('ian-leo-theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('is-loaded');

      // Sequential first-load hover-flash wave across the hero headline words ("Designing AI products people trust.")
      // Fires at 1480ms so it flows seamlessly right as the exponential ease-out entrance settles
      const heroWords = document.querySelectorAll('.hero-hover-word');
      if (heroWords.length > 0) {
        const startDelay = 1480;
        const stepDelay = 115;
        const holdDuration = 300;
        heroWords.forEach((word, idx) => {
          setTimeout(() => {
            word.classList.add('is-flash');
            setTimeout(() => {
              word.classList.remove('is-flash');
            }, holdDuration);
          }, startDelay + idx * stepDelay);
        });
      }
    });
  });

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('ian-leo-theme', next);
    });
  });

  /* ==========================================================================
     2. CHARACTER-BY-CHARACTER SLOT MACHINE TEXT (`[data-slot-chars]`)
     ========================================================================== */
  document.querySelectorAll('[data-slot-chars]').forEach((el) => {
    if (el.dataset.slotInitialized) return;
    el.dataset.slotInitialized = 'true';
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = '';

    [...text].forEach((ch, idx) => {
      const slot = document.createElement('span');
      slot.className = 'char-slot';
      slot.setAttribute('aria-hidden', 'true');

      const track = document.createElement('span');
      track.className = 'char-slot-track';
      track.style.setProperty('--char-index', idx);

      const topChar = document.createElement('span');
      topChar.textContent = ch === ' ' ? '\u00A0' : ch;

      const bottomChar = document.createElement('span');
      bottomChar.textContent = ch === ' ' ? '\u00A0' : ch;

      track.appendChild(topChar);
      track.appendChild(bottomChar);
      slot.appendChild(track);
      el.appendChild(slot);
    });
  });

  /* ==========================================================================
     3. TOP PILL NAV BAR (`U(e)`): SCROLL-PROGRESS RING, SPRING HIGHLIGHT & NYC CLOCK
     ========================================================================== */
  const progressCircle = document.querySelector('.ring-progress');
  const circumference = 2 * Math.PI * 15; // r = 15 => 94.2477

  const updateScrollRing = () => {
    if (!progressCircle) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const progress = Math.min(1, Math.max(0, scrollTop / docHeight));
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${offset}`;
  };

  window.addEventListener('scroll', updateScrollRing, { passive: true });
  updateScrollRing();

  // Spring Sliding Nav Highlight Pill
  const nav = document.querySelector('.leo-nav');
  const navHighlight = document.querySelector('.leo-nav-highlight');
  if (nav && navHighlight) {
    let curX = 0;
    let curW = 0;
    let targetX = 0;
    let targetW = 0;
    let velX = 0;
    let velW = 0;
    let isHovered = false;
    let rafId = null;

    const animateNavPill = () => {
      const dt = 0.016;
      const stiffness = 380;
      const damping = 34;

      const forceX = (targetX - curX) * stiffness - velX * damping;
      const forceW = (targetW - curW) * stiffness - velW * damping;
      velX += forceX * dt;
      velW += forceW * dt;
      curX += velX * dt;
      curW += velW * dt;

      navHighlight.style.transform = `translate3d(${curX}px, 0, 0)`;
      navHighlight.style.width = `${Math.max(0, curW)}px`;

      if (
        Math.abs(targetX - curX) > 0.2 ||
        Math.abs(targetW - curW) > 0.2 ||
        Math.abs(velX) > 0.2
      ) {
        rafId = requestAnimationFrame(animateNavPill);
      } else {
        rafId = null;
      }
    };

    const hoverTargets = nav.querySelectorAll('[data-nav-hover]');
    hoverTargets.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const navRect = nav.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        targetX = itemRect.left - navRect.left;
        targetW = itemRect.width;

        if (!isHovered) {
          curX = targetX;
          curW = targetW;
          velX = 0;
          velW = 0;
          isHovered = true;
        }
        navHighlight.style.opacity = '1';
        if (!rafId) rafId = requestAnimationFrame(animateNavPill);
      });
    });

    nav.addEventListener('mouseleave', () => {
      isHovered = false;
      navHighlight.style.opacity = '0';
    });
  }

  // Live NYC Time Clock (`America/New_York`)
  const clockEl = document.querySelector('[data-nyc-time]');
  const updateClock = () => {
    if (!clockEl) return;
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      clockEl.textContent = formatter.format(now);
    } catch (e) {
      const now = new Date();
      clockEl.textContent = now.toTimeString().slice(0, 5);
    }
  };
  updateClock();
  setInterval(updateClock, 15000);

  /* ==========================================================================
     4. ABOUTDEAN HERO AVATAR (`[data-dean-avatar]`) & LEGACY AVATAR STAGE
     ========================================================================== */
  const deanAvatarCard = document.querySelector('[data-dean-avatar]');
  if (deanAvatarCard) {
    const deanAvatarImg = deanAvatarCard.querySelector('.dean-avatar-img');
    const deanAvatars = ['ian-dean-avatar.jpg', 'ian-dean-avatar-alt.jpg'];
    let deanIdx = 0;

    deanAvatarCard.addEventListener('click', () => {
      if (!deanAvatarImg) return;
      deanIdx = (deanIdx + 1) % deanAvatars.length;
      deanAvatarImg.src = deanAvatars[deanIdx];
      deanAvatarCard.animate(
        [
          { transform: 'translateY(-3px) scale(0.92) rotate(-4deg)' },
          { transform: 'translateY(-5px) scale(1.08) rotate(3deg)' },
          { transform: 'translateY(-3px) scale(1.04) rotate(-1.5deg)' },
        ],
        { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    });
  }

  const avatarStage = document.querySelector('.avatar-stage');
  if (avatarStage) {
    const tiltCard = avatarStage.querySelector('.avatar-tilt-card');
    const avatarImg = avatarStage.querySelector('.avatar-img-circle img');

    // Default avatar starts on the smiling variant; each hover advances to the next variant and stays changed
    const avatarVariants = [
      'assets/avatar_var_1_blue_blink.gif?v=26',
      'assets/avatar_var_4_navy_hoodie.gif?v=26',
      'assets/avatar_var_5_green_laptop.gif?v=26',
      'assets/avatar_var_3_navy_victory.gif?v=26',
      'assets/avatar_var_2_orange_funny.gif?v=26',
    ];
    // Preload all variants so hover switching is instant with zero flicker
    avatarVariants.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });
    let avatarVariantIdx = 0;

    // On first load of the homepage, while the avatar is the first element appearing (0ms -> 1000ms),
    // rapidly flash through all 5 GIF variants so the viewer gets a quick preview before the rest of the page settles
    if (avatarImg) {
      const introSequence = [1, 2, 3, 4, 0];
      const introStartMs = 140;
      const introStepMs = 175;
      introSequence.forEach((variantIndex, step) => {
        setTimeout(() => {
          avatarVariantIdx = variantIndex;
          avatarImg.src = avatarVariants[variantIndex];
          if (tiltCard) {
            tiltCard.animate(
              [
                { transform: 'scale(0.95) rotate(-2deg)' },
                { transform: 'scale(1.04) rotate(1.5deg)' },
                { transform: 'scale(1) rotate(0deg)' },
              ],
              { duration: 165, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
            );
          }
        }, introStartMs + step * introStepMs);
      });
    }

    const advanceAvatarVariant = () => {
      if (!avatarImg) return;
      avatarVariantIdx = (avatarVariantIdx + 1) % avatarVariants.length;
      avatarImg.src = avatarVariants[avatarVariantIdx];
      if (tiltCard) {
        tiltCard.animate(
          [
            { transform: 'scale(0.92) rotate(-3deg)' },
            { transform: 'scale(1.06) rotate(2deg)' },
            { transform: 'scale(1.02) rotate(0deg)' },
          ],
          { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }
    };

    const resetAvatarTilt = () => {
      if (tiltCard) {
        tiltCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      }
    };

    avatarStage.addEventListener('mousemove', (e) => {
      if (!tiltCard) return;
      const rect = avatarStage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = nx * 14;
      const rotX = -ny * 14;
      tiltCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
    });

    avatarStage.addEventListener('mouseenter', advanceAvatarVariant);
    avatarStage.addEventListener('mouseleave', resetAvatarTilt);
    avatarStage.addEventListener('click', (e) => {
      e.stopPropagation();
      advanceAvatarVariant();
    });
  }

  /* ==========================================================================
     5. SPRING MAGNIFICATION DOCKS (`Kt` Hero Project Dock & `Yt` Tool Dock)
        Exact physics from `Kt`: `vel += ((target - v) * 260 - vel * 30) * dt`,
        `translateY(-(v - 1) * 26px) scale(v)`
     ========================================================================== */
  const setupSpringDock = (dockSelector, itemSelector, maxScale = 1.22, liftPx = 26) => {
    const dock = document.querySelector(dockSelector);
    if (!dock) return;
    const items = Array.from(dock.querySelectorAll(itemSelector));
    if (!items.length) return;

    const state = items.map(() => ({ v: 1, target: 1, vel: 0 }));
    let raf = null;

    const step = () => {
      let moving = false;
      const dt = 0.016;
      state.forEach((s, i) => {
        const force = (s.target - s.v) * 260 - s.vel * 30;
        s.vel += force * dt;
        s.v += s.vel * dt;
        const lift = -(s.v - 1) * liftPx;
        items[i].style.transform = `translateY(${lift.toFixed(2)}px) scale(${s.v.toFixed(4)})`;
        if (Math.abs(s.target - s.v) + Math.abs(s.vel) > 0.0005) {
          moving = true;
        }
      });
      if (moving) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    };

    dock.addEventListener('mousemove', (e) => {
      items.forEach((item, i) => {
        const rect = item.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(e.clientX - center);
        const radius = rect.width * 2.3;
        const raw = Math.max(0, 1 - dist / radius);
        const smooth = raw * raw * (3 - 2 * raw); // smoothstep exact match to Kt
        state[i].target = 1 + (maxScale - 1) * smooth;
      });
      if (!raf) raf = requestAnimationFrame(step);
    });

    dock.addEventListener('mouseleave', () => {
      state.forEach((s) => {
        s.target = 1;
      });
      if (!raf) raf = requestAnimationFrame(step);
    });
  };

  setupSpringDock('.hero-project-dock', '.dock-tile', 1.2, 26);
  setupSpringDock('.leo-tool-dock', '.tool-dock-item', 1.32, 20);

  /* ==========================================================================
     6. INTERACTIVE WORK CARDS (`Ot` in leomarlowe.framer.website)
        - Scroll-triggered clip-path unveil (`inset(14% 7% 0% 7% round 24px)`)
        - Vertical scroll parallax (`±22px`) + Magnetic cursor opposition image pan
        - Centered-at-rest (`50% / 50%`) to Cursor-following (`lerp 0.14`) Glass Badge
     ========================================================================== */
  const workCards = Array.from(document.querySelectorAll('.leo-work-card'));

  if (workCards.length) {
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = workCards.indexOf(entry.target);
            const delay = idx % 2 === 1 ? 140 : 0;
            setTimeout(() => {
              entry.target.classList.add('is-revealed');
            }, delay);
            cardObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    workCards.forEach((card) => {
      cardObserver.observe(card);

      const cover = card.querySelector('.leo-work-cover');
      const mediaInner = card.querySelector('.leo-work-media-inner');
      const badge = card.querySelector('.leo-work-cursor-badge');
      if (!cover || !mediaInner) return;

      let hovered = false;
      // Normalized badge coordinates (0.5, 0.5 at rest, exact match to Ot)
      let bx = 0.5;
      let by = 0.5;
      let tbx = 0.5;
      let tby = 0.5;
      let cardRaf = null;

      const renderCardMotion = () => {
        bx += (tbx - bx) * 0.14;
        by += (tby - by) * 0.14;

        if (badge) {
          badge.style.left = `${(bx * 100).toFixed(2)}%`;
          badge.style.top = `${(by * 100).toFixed(2)}%`;
          badge.style.transform = `translate(-50%, -50%) scale(${hovered ? 1 : 0.96})`;
        }

        const stillMoving =
          Math.abs(tbx - bx) * 300 + Math.abs(tby - by) * 300 > 0.1;

        if (hovered || stillMoving) {
          cardRaf = requestAnimationFrame(renderCardMotion);
        } else {
          cardRaf = null;
        }
      };

      cover.addEventListener('mouseenter', () => {
        hovered = true;
        if (!cardRaf) cardRaf = requestAnimationFrame(renderCardMotion);
      });

      cover.addEventListener('mousemove', (e) => {
        const rect = cover.getBoundingClientRect();
        tbx = (e.clientX - rect.left) / rect.width;
        tby = (e.clientY - rect.top) / rect.height;
        if (!cardRaf) cardRaf = requestAnimationFrame(renderCardMotion);
      });

      cover.addEventListener('mouseleave', () => {
        hovered = false;
        tbx = 0.5;
        tby = 0.5;
        if (!cardRaf) cardRaf = requestAnimationFrame(renderCardMotion);
      });
    });
  }

  /* ==========================================================================
     7. ACTION & FOOTER BUTTONS (Clean CSS Hover Sheen & Subtle Lift)
     ========================================================================== */
  // Buttons use pure CSS hover transitions (`.leo-magnetic-btn:hover`) for centered, refined motion.

  /* ==========================================================================
     8. INTERACTIVE HOVER-REVEAL PHOTO LENS (About Section)
     ========================================================================== */
  const revealWords = document.querySelectorAll('.hover-reveal-word[data-reveal-img]');
  if (revealWords.length) {
    const lens = document.createElement('div');
    lens.className = 'hover-reveal-lens';
    const lensImg = document.createElement('img');
    lens.appendChild(lensImg);
    document.body.appendChild(lens);

    revealWords.forEach((word) => {
      word.addEventListener('mouseenter', () => {
        const src = word.getAttribute('data-reveal-img');
        if (src) {
          lensImg.src = src;
          lens.classList.add('active');
        }
      });

      word.addEventListener('mousemove', (e) => {
        lens.style.left = `${e.clientX}px`;
        lens.style.top = `${e.clientY - 145}px`;
      });

      word.addEventListener('mouseleave', () => {
        lens.classList.remove('active');
      });
    });
  }

  /* ==========================================================================
     9. SCROLL REVEAL OBSERVER (`.framer-reveal`) & ROCKET TOP-BORDER TORCH FLASH
     ========================================================================== */
  const heroTorchFlash = document.querySelector('.hero-top-torch-flash');
  let rocketTorchScheduled = false;

  const revealElements = document.querySelectorAll('.framer-reveal');
  if (revealElements.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (
              entry.target.id === 'process' &&
              heroTorchFlash &&
              !rocketTorchScheduled
            ) {
              rocketTorchScheduled = true;
              // Rocket lifts off at 1.2s and reaches the top of the hero section at ~2.9s
              setTimeout(() => {
                const heroSection = document.querySelector('.hero-viewport-wrap');
                const processSection = document.getElementById('process');
                const heroRect = heroSection ? heroSection.getBoundingClientRect() : null;
                const procRect = processSection ? processSection.getBoundingClientRect() : null;
                // Show the 1/3-height top torch explosion as long as the user is still viewing the hero/process area
                if (
                  (heroRect && heroRect.bottom > 80) ||
                  (procRect && procRect.bottom > 0)
                ) {
                  heroTorchFlash.classList.add('is-flashing');
                }
              }, 2880);
            }
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealElements.forEach((el) => revealObs.observe(el));
  }

  /* ==========================================================================
     10. CASE STUDY PASSWORD PROTECTION (`uxian12`)
     ========================================================================== */
  const CASE_PASSWORD = 'uxian12';
  const AUTH_STORAGE_KEY = 'ian-case-auth';
  const isCaseStudyPage =
    document.body.classList.contains('case-study-body') ||
    Boolean(document.querySelector('.case-page'));

  if (isCaseStudyPage) {
    document.body.classList.add('case-study-body');
    let gate = document.getElementById('case-password-gate');

    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'case-password-gate';
      gate.className = 'case-password-gate';
      gate.innerHTML = `
        <div class="case-password-card" role="dialog" aria-modal="true" aria-labelledby="case-gate-title">
          <div class="case-password-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="case-password-kicker">Protected Case Study</div>
          <h2 class="case-password-title" id="case-gate-title">Enter Password</h2>
          <p class="case-password-desc">This case study is password-protected. Please enter the password to continue.</p>
          <form class="case-password-form" id="case-password-form" autocomplete="off">
            <div class="case-password-input-wrap">
              <input
                type="password"
                id="case-password-input"
                class="case-password-input"
                placeholder="Enter password"
                aria-label="Case study password"
                required
              />
              <button type="button" class="case-password-toggle" id="case-password-toggle" aria-label="Show password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <button type="submit" class="case-password-submit">
              <span>Unlock Case Study</span>
              <span aria-hidden="true">→</span>
            </button>
            <div class="case-password-error" id="case-password-error" role="alert">Incorrect password. Please try again.</div>
          </form>
          <a href="index.html" class="case-password-back">← Back to Home</a>
        </div>
      `;
      document.body.appendChild(gate);
    }

    const isUnlocked = sessionStorage.getItem(AUTH_STORAGE_KEY) === CASE_PASSWORD;

    if (isUnlocked) {
      document.body.classList.remove('is-locked');
      gate.classList.add('is-hidden');
    } else {
      document.body.classList.add('is-locked');
      gate.classList.remove('is-hidden');

      const form = document.getElementById('case-password-form');
      const input = document.getElementById('case-password-input');
      const toggleBtn = document.getElementById('case-password-toggle');
      const errorEl = document.getElementById('case-password-error');
      const card = gate.querySelector('.case-password-card');

      setTimeout(() => {
        if (input) input.focus();
      }, 80);

      if (toggleBtn && input) {
        toggleBtn.addEventListener('click', () => {
          const isPwd = input.type === 'password';
          input.type = isPwd ? 'text' : 'password';
          toggleBtn.setAttribute('aria-label', isPwd ? 'Hide password' : 'Show password');
          input.focus();
        });
      }

      if (input && errorEl) {
        input.addEventListener('input', () => {
          input.classList.remove('is-error');
          errorEl.classList.remove('is-visible');
        });
      }

      if (form && input) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = input.value.trim();
          if (val === CASE_PASSWORD) {
            sessionStorage.setItem(AUTH_STORAGE_KEY, CASE_PASSWORD);
            document.body.classList.remove('is-locked');
            gate.classList.add('is-hidden');
            input.blur();
          } else {
            input.classList.add('is-error');
            if (errorEl) errorEl.classList.add('is-visible');
            if (card) {
              card.classList.remove('is-shaking');
              void card.offsetWidth;
              card.classList.add('is-shaking');
            }
            input.select();
          }
        });
      }
    }
  }
});
