/* ==========================================================================
   FOLDFOLIO SCROLL-DRIVEN 3D HINGE & FULLSCREEN ZOOM ENGINE (LOCAL BUILD)
   - Hero runway: Closed phone -> 3D unfold -> Zoom into fullscreen portfolio
   - Footer runway: Zoom out of fullscreen -> 3D close to dark Incoming Call cover
   ========================================================================== */

(function () {
  'use strict';

  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOutCubic = (t) => {
    const x = clamp(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const heroRunway = document.getElementById('fold-hero-runway');
    const footerRunway = document.getElementById('fold-footer-runway');
    if (!heroRunway) return;

    document.body.classList.add('is-fold-mode');
    if (!document.body.getAttribute('data-fold-finish')) {
      document.body.setAttribute('data-fold-finish', 'titanium');
    }
    if (!document.body.getAttribute('data-fold-bg')) {
      document.body.setAttribute('data-fold-bg', 'basic');
    }

    // 1. Live NYC Clock on Lock Screen & Status Bar
    const updateFoldClock = () => {
      try {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now);
        document.querySelectorAll('[data-fold-clock]').forEach((el) => {
          el.textContent = fmt;
        });
      } catch (_) {}
    };
    updateFoldClock();
    setInterval(updateFoldClock, 15000);

    // 2. Interactive Ambient Background Switcher (Basic / Glow / Orbit)
    const bgButtons = document.querySelectorAll('[data-fold-bg-btn]');
    const setFoldBg = (mode) => {
      document.body.setAttribute('data-fold-bg', mode);
      bgButtons.forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-fold-bg-btn') === mode);
      });
    };
    bgButtons.forEach((btn) => {
      btn.addEventListener('click', () => setFoldBg(btn.getAttribute('data-fold-bg-btn')));
    });

    // 3. Interactive Metallic Chassis Finish Switcher (Titanium / Graphite / Coral / Sage)
    const finishBtns = document.querySelectorAll('[data-finish]');
    const setFinish = (finish) => {
      document.body.setAttribute('data-fold-finish', finish);
      finishBtns.forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-finish') === finish);
      });
    };
    finishBtns.forEach((btn) => {
      btn.addEventListener('click', () => setFinish(btn.getAttribute('data-finish')));
    });

    // 4. "Scroll to unfold" button & "See the work" smooth scroll
    const unfoldBtn = document.getElementById('fold-unfold-btn');
    if (unfoldBtn) {
      unfoldBtn.addEventListener('click', () => {
        const workEl = document.getElementById('work');
        if (workEl) {
          workEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // 5. Compute responsive base scale so the 1000x684 unfolded tablet always fits nicely
    let baseScale = 1;
    const computeBaseScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxW = (vw - 64) / 1000;
      const maxH = (vh - 150) / 684;
      baseScale = Math.min(1.06, Math.max(0.32, Math.min(maxW, maxH)));
      document.documentElement.style.setProperty('--ff-scale', baseScale.toFixed(4));
    };
    computeBaseScale();

    // DOM References — Hero
    const heroViewport = heroRunway.querySelector('.fold-device-viewport');
    const heroTrack = heroRunway.querySelector('.fold-device-track');
    const heroLeftHalf = heroRunway.querySelector('.fold-half.is-left');
    const heroRightHalf = heroRunway.querySelector('.fold-half.is-right');
    const heroShadow = heroRunway.querySelector('.fold-floor-shadow');
    const heroWordL = heroRunway.querySelector('.fold-bg-word.is-left');
    const heroWordR = heroRunway.querySelector('.fold-bg-word.is-right');
    const heroChromeTop = heroRunway.querySelector('.fold-chrome-top');
    const heroFinishPill = heroRunway.querySelector('.fold-finish-pill');
    const heroPortal = heroRunway.querySelector('.fold-zoom-portal');

    // DOM References — Footer
    const footViewport = footerRunway ? footerRunway.querySelector('.fold-device-viewport') : null;
    const footTrack = footerRunway ? footerRunway.querySelector('.fold-device-track') : null;
    const footCloseFlap = footerRunway ? footerRunway.querySelector('.fold-half.is-close-flap') : null;
    const footLeftHalf = footerRunway ? footerRunway.querySelector('.fold-half.is-left') : null;
    const footShadow = footerRunway ? footerRunway.querySelector('.fold-floor-shadow') : null;
    const footWordL = footerRunway ? footerRunway.querySelector('.fold-bg-word.is-left') : null;
    const footWordR = footerRunway ? footerRunway.querySelector('.fold-bg-word.is-right') : null;
    const footChromeTop = footerRunway ? footerRunway.querySelector('.fold-chrome-top') : null;
    const footFinishPill = footerRunway ? footerRunway.querySelector('.fold-finish-pill') : null;
    const footPortal = footerRunway ? footerRunway.querySelector('.fold-zoom-portal') : null;

    // DOM References — Edge-Anchoring Viewport Bezel
    const viewportBezel = document.querySelector('.fold-viewport-bezel-frame');

    const getRunwayProgress = (el) => {
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      return clamp(-rect.top / scrollable, 0, 1);
    };

    const setBezelRect = (opacity, padX, padY, outerR, innerR) => {
      if (!viewportBezel) return;
      viewportBezel.style.opacity = opacity.toFixed(3);
      viewportBezel.style.setProperty('--bezel-left', `${padX.toFixed(1)}px`);
      viewportBezel.style.setProperty('--bezel-right', `${padX.toFixed(1)}px`);
      viewportBezel.style.setProperty('--bezel-top', `${padY.toFixed(1)}px`);
      viewportBezel.style.setProperty('--bezel-bottom', `${padY.toFixed(1)}px`);
      viewportBezel.style.setProperty('--bezel-outer-r', `${outerR.toFixed(1)}px`);
      viewportBezel.style.setProperty('--bezel-inner-r', `${innerR.toFixed(1)}px`);
    };

    const renderFrame = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pHero = getRunwayProgress(heroRunway);
      const pFoot = footerRunway ? getRunwayProgress(footerRunway) : 0;

      // Toggle floating portfolio navbar when zoomed inside the opened phone
      const insidePhone = pHero >= 0.86 && pFoot <= 0.14;
      document.body.classList.toggle('is-inside-phone', insidePhone);

      // ======================================================================
      // PHASE A: OPENING HERO (0 -> 0.48 Unfold, 0.48 -> 1.00 Zoom & Anchor Bezel)
      // ======================================================================
      const unfoldT = easeInOutCubic(clamp(pHero / 0.48, 0, 1));
      const zoomInT = easeInOutCubic(clamp((pHero - 0.48) / 0.48, 0, 1));
      const portalInT = easeOutCubic(clamp((pHero - 0.72) / 0.24, 0, 1));

      // Scale needed for the 1000x684 device to touch the furthest browser wall
      const scaleToCover = Math.max(vw / 1000, vh / 684);
      const currentHeroScale = lerp(baseScale, scaleToCover, zoomInT);

      // Translate assembly from centered-right-half (-250px) to centered-tablet (0px)
      const heroShiftX = lerp(-250, 0, unfoldT);
      heroViewport.style.transform = `scale(${currentHeroScale.toFixed(4)})`;
      heroTrack.style.transform = `translate3d(${heroShiftX.toFixed(2)}px, 0, 0)`;

      // 3D Hinge on Left Half: 180deg (closed front cover) -> 0deg (flat open)
      const openAngle = lerp(180, 0, unfoldT);
      heroLeftHalf.style.transform = `rotateY(${openAngle.toFixed(2)}deg)`;
      heroRightHalf.classList.toggle('is-closed-corners', unfoldT < 0.06);

      // Floor shadow widens as phone opens, fades as we zoom in
      const shadowScaleX = lerp(0.5, 1.0, unfoldT);
      heroShadow.style.transform = `translateX(-50%) scaleX(${shadowScaleX.toFixed(3)})`;
      heroShadow.style.opacity = (1 - zoomInT * 2.2).toFixed(3);

      // Backdrop IAN / YEN slide outward as phone unfolds
      const wordOffset = unfoldT * 460;
      const wordOpacity = clamp(1 - unfoldT * 1.45, 0, 1);
      if (heroWordL) {
        heroWordL.style.transform = `translate3d(${(-wordOffset).toFixed(1)}px, 0, 0)`;
        heroWordL.style.opacity = wordOpacity.toFixed(3);
      }
      if (heroWordR) {
        heroWordR.style.transform = `translate3d(${wordOffset.toFixed(1)}px, 0, 0)`;
        heroWordR.style.opacity = wordOpacity.toFixed(3);
      }

      // Chrome fades cleanly during zoom-in
      const heroChromeAlpha = clamp(1 - zoomInT * 2.4, 0, 1);
      if (heroChromeTop) heroChromeTop.style.opacity = heroChromeAlpha.toFixed(3);
      if (heroFinishPill) heroFinishPill.style.opacity = heroChromeAlpha.toFixed(3);

      // Portal smoothly dissolves into the full-screen portfolio background
      if (heroPortal) {
        heroPortal.style.opacity = portalInT.toFixed(3);
      }

      // ======================================================================
      // PHASE B: CLOSING FOOTER (0 -> 1.00 Zoom Out Into Opened Device — Ends on "Let's Build Something Good.")
      // ======================================================================
      let zoomOutT = 0;
      if (footerRunway && footViewport && footTrack) {
        zoomOutT = easeInOutCubic(clamp(pFoot / 0.88, 0, 1));
        const portalOutT = clamp(1 - pFoot / 0.30, 0, 1);

        const currentFootScale = lerp(scaleToCover, baseScale, zoomOutT);
        footViewport.style.transform = `scale(${currentFootScale.toFixed(4)})`;
        footTrack.style.transform = 'translate3d(0px, 0, 0)';

        if (footShadow) {
          footShadow.style.transform = 'translateX(-50%) scaleX(1)';
          footShadow.style.opacity = clamp(zoomOutT * 1.4, 0, 1).toFixed(3);
        }

        const footChromeAlpha = clamp((zoomOutT - 0.35) * 1.8, 0, 1);
        if (footChromeTop) footChromeTop.style.opacity = footChromeAlpha.toFixed(3);

        if (footPortal) {
          footPortal.style.opacity = portalOutT.toFixed(3);
        }
      }

      // ======================================================================
      // EDGE-ANCHORING VIEWPORT BEZEL HANDOFF
      // As soon as the zooming device border touches EITHER browser edge,
      // clamp that edge to 0px so it physically sticks to the browser wall!
      // ======================================================================
      if (insidePhone) {
        setBezelRect(1, 0, 0, 0, 26);
      } else if (pHero > 0.48 && pHero < 0.86) {
        const liveW = 1000 * currentHeroScale;
        const liveH = 684 * currentHeroScale;
        const padX = Math.max(0, (vw - liveW) * 0.5);
        const padY = Math.max(0, (vh - liveH) * 0.5);
        const touched = liveW >= vw - 2 || liveH >= vh - 2;
        if (touched) {
          const outerR = Math.min(padX, padY) > 1 ? 34 : 0;
          setBezelRect(1, padX, padY, outerR, 26);
        } else {
          setBezelRect(0, padX, padY, 42, 34);
        }
      } else if (pFoot > 0.14 && pFoot < 0.90) {
        const liveScale = lerp(scaleToCover, baseScale, zoomOutT);
        const liveW = 1000 * liveScale;
        const liveH = 684 * liveScale;
        const padX = Math.max(0, (vw - liveW) * 0.5);
        const padY = Math.max(0, (vh - liveH) * 0.5);
        const touched = liveW >= vw - 2 || liveH >= vh - 2;
        if (touched) {
          const outerR = Math.min(padX, padY) > 1 ? 34 : 0;
          setBezelRect(1, padX, padY, outerR, 26);
        } else {
          setBezelRect(0, padX, padY, 42, 34);
        }
      } else {
        setBezelRect(0, 0, 0, 0, 26);
      }
    };

    let rafId = null;
    const scheduleRender = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        renderFrame();
      });
    };

    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', () => {
      computeBaseScale();
      scheduleRender();
    }, { passive: true });

    renderFrame();
  });
})();
