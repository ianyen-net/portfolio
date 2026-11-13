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
  'assets/avatar_var_1_blue_blink.gif?v=29',
  'assets/avatar_var_4_navy_hoodie.gif?v=29',
  'assets/avatar_var_5_green_laptop.gif?v=29',
  'assets/avatar_var_3_navy_victory.gif?v=29',
  'assets/avatar_var_2_orange_funny.gif?v=29',
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
  const fullClockEls = document.querySelectorAll('[data-nyc-time-full]');
  const updateClock = () => {
    const now = new Date();
    if (clockEl) {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        clockEl.textContent = formatter.format(now);
      } catch (e) {
        clockEl.textContent = now.toTimeString().slice(0, 5);
      }
    }
    if (fullClockEls.length) {
      try {
        const fullFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        const formatted = fullFormatter.format(now);
        fullClockEls.forEach((el) => {
          el.textContent = formatted;
        });
      } catch (e) {
        fullClockEls.forEach((el) => {
          el.textContent = now.toLocaleTimeString();
        });
      }
    }
  };
  updateClock();
  setInterval(updateClock, 1000);

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

  let triggerAvatarExplosionLook = () => {};
  const avatarStage = document.querySelector('.avatar-stage');
  if (avatarStage) {
    const tiltCard = avatarStage.querySelector('.avatar-tilt-card');
    const avatarImg = avatarStage.querySelector('.avatar-img-circle img');
    const explosionLookSrc = 'assets/avatar_lookup_amazed.gif?v=29';
    let explosionLookTimer = null;

    // Default avatar starts on the smiling variant; each hover advances to the next variant and stays changed
    const avatarVariants = [
      'assets/avatar_var_1_blue_blink.gif?v=29',
      'assets/avatar_var_4_navy_hoodie.gif?v=29',
      'assets/avatar_var_5_green_laptop.gif?v=29',
      'assets/avatar_var_3_navy_victory.gif?v=29',
      'assets/avatar_var_2_orange_funny.gif?v=29',
    ];
    // Preload all variants (including explosion look-up) so switching is instant with zero flicker
    [...avatarVariants, explosionLookSrc].forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });
    let avatarVariantIdx = 0;

    triggerAvatarExplosionLook = () => {
      if (!avatarImg) return;
      if (explosionLookTimer) {
        clearTimeout(explosionLookTimer);
        explosionLookTimer = null;
      }
      avatarImg.src = explosionLookSrc;
      avatarStage.classList.add('is-looking-at-explosion');
      if (tiltCard) {
        tiltCard.style.transform = '';
        tiltCard.animate(
          [
            { transform: 'scale(0.95) rotate(-2deg)' },
            { transform: 'scale(1.04) rotate(1.5deg)' },
            { transform: 'scale(1) rotate(0deg)' },
          ],
          { duration: 210, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      }
      explosionLookTimer = setTimeout(() => {
        avatarStage.classList.remove('is-looking-at-explosion');
        avatarImg.src = avatarVariants[avatarVariantIdx];
        explosionLookTimer = null;
      }, 4600);
    };

    const advanceAvatarVariant = () => {
      if (!avatarImg) return;
      if (explosionLookTimer) {
        clearTimeout(explosionLookTimer);
        explosionLookTimer = null;
      }
      avatarStage.classList.remove('is-looking-at-explosion');
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

    avatarStage.addEventListener('mouseenter', () => {
      advanceAvatarVariant();
    });

    avatarStage.addEventListener('click', () => {
      advanceAvatarVariant();
    });

    avatarStage.addEventListener('mousemove', (e) => {
      if (!tiltCard) return;
      const rect = avatarStage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = nx * 14;
      const rotX = -ny * 14;
      tiltCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
    });

    avatarStage.addEventListener('mouseleave', resetAvatarTilt);
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
  let activeRocketTrackRaf = null;

  // True only while the user is still in the hero section (the 1/4-height top torch explosion stays inside the hero section and never bleeds into the work section below)
  const isUserInHeroSection = () => {
    const heroSection = document.querySelector('.hero-viewport-wrap');
    if (!heroSection) return false;
    const heroRect = heroSection.getBoundingClientRect();
    const minHeroRemaining = Math.max(200, window.innerHeight * 0.27);
    return heroRect.bottom > minHeroRemaining;
  };

  const syncHeroTorchBounds = () => {
    if (!heroTorchFlash) return;
    if (!isUserInHeroSection()) {
      heroTorchFlash.classList.remove('is-flashing');
      heroTorchFlash.classList.add('is-outside-hero');
    } else {
      heroTorchFlash.classList.remove('is-outside-hero');
    }
  };
  window.addEventListener('scroll', syncHeroTorchBounds, { passive: true });
  window.addEventListener('resize', syncHeroTorchBounds, { passive: true });
  syncHeroTorchBounds();

  const rocketRelaunchBtns = document.querySelectorAll('[data-rocket-relaunch]');
  let rocketIdleBtnTimer = null;

  // Prepare breakable text pieces in the hero headline & subtitle so they part around the ascending rocket
  const breakableHeroPieces = [];
  document.querySelectorAll('.hero-fraunces-title .hero-hover-word').forEach((wordEl) => {
    const rawText = wordEl.textContent || '';
    if (!rawText) return;
    wordEl.textContent = '';
    Array.from(rawText).forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'rocket-breakable-piece is-char';
      span.textContent = ch;
      wordEl.appendChild(span);
      breakableHeroPieces.push(span);
    });
  });

  const subtitleEl = document.querySelector('.hero-subtitle-line');
  if (subtitleEl) {
    const tokens = (subtitleEl.textContent || '').trim().split(/\s+/);
    if (tokens.length > 0) {
      subtitleEl.textContent = '';
      tokens.forEach((tok, idx) => {
        const span = document.createElement('span');
        span.className = 'rocket-breakable-piece is-subword';
        span.textContent = tok;
        subtitleEl.appendChild(span);
        if (idx < tokens.length - 1) {
          subtitleEl.appendChild(document.createTextNode(' '));
        }
        breakableHeroPieces.push(span);
      });
    }
  }

  const resetBreakableHeroPieces = () => {
    breakableHeroPieces.forEach((p) => {
      if (p.classList.contains('is-parting')) {
        p.classList.remove('is-parting');
        p.style.transform = '';
      }
    });
  };

  const setRocketActionState = (inAction) => {
    if (rocketIdleBtnTimer) {
      clearTimeout(rocketIdleBtnTimer);
      rocketIdleBtnTimer = null;
    }
    rocketRelaunchBtns.forEach((btn) => {
      btn.classList.toggle('is-hidden', inAction);
    });
    if (inAction) {
      // Show the rocket launch button next to "Launch" as soon as the 4.5s rocket launch sequence finishes
      rocketIdleBtnTimer = setTimeout(() => {
        rocketRelaunchBtns.forEach((btn) => {
          btn.classList.remove('is-hidden');
        });
        rocketIdleBtnTimer = null;
      }, 4520);
    }
  };

  const startRocketTorchTracker = (processSectionEl) => {
    if (!heroTorchFlash || !processSectionEl) return;
    if (activeRocketTrackRaf) {
      cancelAnimationFrame(activeRocketTrackRaf);
      activeRocketTrackRaf = null;
    }
    resetBreakableHeroPieces();
    setRocketActionState(true);
    heroTorchFlash.classList.remove('is-flashing');
    syncHeroTorchBounds();

    const rocketEl = processSectionEl.querySelector('.ship-rocket-launch');
    let torchFired = false;
    let pieceCenters = null;

    const triggerHeroTorch = () => {
      if (torchFired) return;
      torchFired = true;
      resetBreakableHeroPieces();
      // Only show the explosion effect if the user has NOT scrolled past the hero section
      if (isUserInHeroSection()) {
        heroTorchFlash.classList.remove('is-outside-hero');
        heroTorchFlash.classList.remove('is-flashing');
        void heroTorchFlash.offsetWidth;
        heroTorchFlash.classList.add('is-flashing');
        triggerAvatarExplosionLook();
      } else {
        heroTorchFlash.classList.remove('is-flashing');
        heroTorchFlash.classList.add('is-outside-hero');
      }
    };

    const startTrack = performance.now();
    const trackRocketArrival = () => {
      if (torchFired) return;
      if (!isUserInHeroSection()) {
        torchFired = true;
        resetBreakableHeroPieces();
        heroTorchFlash.classList.remove('is-flashing');
        return;
      }
      const elapsed = performance.now() - startTrack;
      if (rocketEl) {
        const rRect = rocketEl.getBoundingClientRect();

        // While the rocket is ascending (after 2.45s), break/part any hero text pieces in its flight path
        if (elapsed >= 2450 && breakableHeroPieces.length > 0) {
          if (!pieceCenters) {
            pieceCenters = breakableHeroPieces.map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                el,
                cx: rect.left + rect.width * 0.5,
                cy: rect.top + rect.height * 0.5,
              };
            });
          }
          const rx = rRect.left + rRect.width * 0.5;
          const rMidY = rRect.top + rRect.height * 0.42;
          const halfSpanY = 88;
          const maxSpanX = 175;

          for (let i = 0; i < pieceCenters.length; i++) {
            const item = pieceCenters[i];
            const dy = item.cy - rMidY;
            const dx = item.cx - rx;
            if (Math.abs(dy) < halfSpanY && Math.abs(dx) < maxSpanX) {
              const fy = Math.sin((1 - Math.abs(dy) / halfSpanY) * (Math.PI * 0.5));
              const fx = Math.pow(1 - Math.abs(dx) / maxSpanX, 1.3);
              const dir = dx < 0 ? -1 : 1;
              const pushX = dir * (52 * fx + 22) * fy;
              const pushY = -10 * fx * fy;
              const rot = dir * 15 * fx * fy;
              item.el.classList.add('is-parting');
              item.el.style.transform = `translate3d(${pushX.toFixed(1)}px, ${pushY.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`;
            } else if (item.el.classList.contains('is-parting')) {
              item.el.classList.remove('is-parting');
              item.el.style.transform = '';
            }
          }
        }

        const heroCardEl = document.querySelector('.hero-card-inner');
        const heroTopEdge = heroCardEl ? heroCardEl.getBoundingClientRect().top : 0;
        if (rRect.top <= heroTopEdge + 40 && elapsed > 2550) {
          triggerHeroTorch();
          return;
        }
      }
      if (elapsed < 4650) {
        activeRocketTrackRaf = requestAnimationFrame(trackRocketArrival);
      } else {
        triggerHeroTorch();
      }
    };
    activeRocketTrackRaf = requestAnimationFrame(trackRocketArrival);
  };

  // Relaunch the Ship rocket & left-to-right torch sequence every time the user switches the theme or clicks the rocket icon button
  const relaunchProcessRocket = () => {
    const processSection = document.getElementById('process');
    if (!processSection) return;
    rocketTorchScheduled = true;
    processSection.classList.remove('is-rocket-launched');

    const animatedSelectors = [
      '.leo-process-title',
      '.process-hand-arrow',
      '.ship-launch-smoke',
      '.ship-rocket-launch',
      '.rocket-side-booster-left',
      '.rocket-side-booster-right',
    ];
    const animatedEls = processSection.querySelectorAll(animatedSelectors.join(','));
    animatedEls.forEach((el) => {
      el.style.animation = 'none';
    });
    // Force reflow so the browser cleanly restarts all CSS keyframe animations (including ::before and ::after torch sweeps)
    void processSection.offsetWidth;
    animatedEls.forEach((el) => {
      el.style.animation = '';
    });
    processSection.classList.add('is-visible', 'is-rocket-launched');

    startRocketTorchTracker(processSection);
  };

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      relaunchProcessRocket();
    });
  });

  rocketRelaunchBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      relaunchProcessRocket();
    });
  });

  // Immediately hide the top torch explosion if the user scrolls past the hero section
  window.addEventListener(
    'scroll',
    () => {
      if (heroTorchFlash && !isUserInHeroSection()) {
        heroTorchFlash.classList.remove('is-flashing');
      }
    },
    { passive: true }
  );

  // Start the rocket in position as soon as the user sees the three words (and lifts off 2.7s after the words are seen)
  const processSectionEl = document.getElementById('process');
  const processTrayEl = document.querySelector('.leo-process-tray');

  const checkAndLaunchProcessRocket = () => {
    if (rocketTorchScheduled || !processSectionEl || !processTrayEl) return;
    const trayRect = processTrayEl.getBoundingClientRect();
    if (trayRect.top < window.innerHeight - 20 && trayRect.bottom > 60) {
      rocketTorchScheduled = true;
      processSectionEl.classList.add('is-visible', 'is-rocket-launched');
      startRocketTorchTracker(processSectionEl);
    }
  };

  setTimeout(() => {
    checkAndLaunchProcessRocket();
  }, 850);

  window.addEventListener('scroll', checkAndLaunchProcessRocket, { passive: true });
  window.addEventListener('resize', checkAndLaunchProcessRocket, { passive: true });

  const revealElements = document.querySelectorAll('.framer-reveal');
  if (revealElements.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (entry.target.id === 'process') {
              checkAndLaunchProcessRocket();
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
     10. CASE STUDY PASSWORD PROTECTION (SHA-256 HASHED)
     ========================================================================== */
  const CASE_PASSWORD_HASH = '208984112481814036c6a8fb96017106d2c7ba8bf1b64c2ae5b44a5d7b283cec';
  const AUTH_STORAGE_KEY = 'ian-case-auth';
  const sha256Hex = async (str) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="case-password-kicker">Protected Case Study</div>
          <h2 class="case-password-title" id="case-gate-title">Enter Password</h2>
          <p class="case-password-desc">Enter the password to continue</p>
          <form class="case-password-form" id="case-password-form" autocomplete="off">
            <div class="case-password-input-wrap">
              <input
                type="password"
                id="case-password-input"
                class="case-password-input"
                placeholder="Password"
                aria-label="Case study password"
                required
              />
              <button type="button" class="case-password-toggle" id="case-password-toggle" aria-label="Show password">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <p class="case-password-help">Don’t have the password? <a href="mailto:ianyenyh@gmail.com?subject=Portfolio%20Access%20Request&amp;body=Hi%20Ian%2C%0A%0AI%27d%20love%20to%20request%20the%20password%20to%20view%20your%20portfolio%20case%20studies%20and%20prototypes.%0A%0AThanks!">Email Ian</a> to ask for it</p>
            <button type="submit" class="case-password-submit">
              <span>Continue</span>
              <span aria-hidden="true">→</span>
            </button>
            <div class="case-password-error" id="case-password-error" role="alert">Incorrect password. Please try again.</div>
          </form>
          <a href="index.html" class="case-password-back">← Back to Home</a>
        </div>
      `;
      document.body.appendChild(gate);
    }

    const isUnlocked = sessionStorage.getItem(AUTH_STORAGE_KEY) === CASE_PASSWORD_HASH;

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
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const val = input.value.trim();
          const inputHash = await sha256Hex(val);
          if (inputHash === CASE_PASSWORD_HASH) {
            sessionStorage.setItem(AUTH_STORAGE_KEY, CASE_PASSWORD_HASH);
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
