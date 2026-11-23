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

    // 4. "Scroll to unfold" opens Team History spread; "Scroll to see projects" scrolls to #work
    const unfoldBtn = document.getElementById('fold-unfold-btn');
    if (unfoldBtn) {
      unfoldBtn.addEventListener('click', () => {
        const heroTop = heroRunway.getBoundingClientRect().top + window.scrollY;
        const scrollable = Math.max(1, heroRunway.offsetHeight - window.innerHeight);
        const unfoldTargetY = heroTop + scrollable * 0.48;
        window.scrollTo({ top: unfoldTargetY, behavior: 'smooth' });
      });
    }

    const projectsBtn = document.getElementById('fold-projects-btn');
    if (projectsBtn) {
      projectsBtn.addEventListener('click', () => {
        const workEl = document.getElementById('work');
        if (workEl) {
          workEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // 5. Compute responsive scales (desktop keeps 1:1; mobile gives closed phone full legibility and smoothly fits unfolded tablet)
    let openScale = 1;
    let closedScale = 1;
    let lastVw = 0;
    let lastVh = 0;
    const computeBaseScale = (force = false) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Ignore small vertical resizes from mobile browser URL bar show/hide while scrolling
      if (!force && vw === lastVw && Math.abs(vh - lastVh) < 120) return;
      lastVw = vw;
      lastVh = vh;

      const isMobile = vw < 768;
      if (isMobile) {
        const maxOpenW = (vw - 24) / 1000;
        const maxOpenH = (vh - 130) / 684;
        openScale = Math.max(0.28, Math.min(maxOpenW, maxOpenH));

        const maxClosedW = (vw - 44) / 500;
        const maxClosedH = (vh - 160) / 684;
        closedScale = Math.min(0.86, Math.max(openScale, Math.min(maxClosedW, maxClosedH)));
      } else {
        const maxW = (vw - 56) / 1000;
        const maxH = (vh - 136) / 684;
        openScale = Math.min(1.10, Math.max(0.42, Math.min(maxW, maxH) * 1.06));
        closedScale = openScale;
      }
      document.documentElement.style.setProperty('--ff-scale', closedScale.toFixed(4));
    };
    computeBaseScale(true);

    // DOM References — Hero
    const heroStage = heroRunway.querySelector('.fold-sticky-stage');
    const heroFloatDevice = heroRunway.querySelector('.fold-float-device');
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
    const footStage = footerRunway ? footerRunway.querySelector('.fold-sticky-stage') : null;
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

    const getRunwayProgress = (el, stageEl) => {
      const rect = el.getBoundingClientRect();
      const stageH = stageEl ? stageEl.offsetHeight : window.innerHeight;
      const scrollable = Math.max(1, el.offsetHeight - stageH);
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
      const vh = heroStage ? heroStage.offsetHeight : window.innerHeight;
      const pHero = getRunwayProgress(heroRunway, heroStage);
      const pFoot = footerRunway ? getRunwayProgress(footerRunway, footStage) : 0;

      // Toggle floating portfolio navbar when zoomed inside the opened phone
      const insidePhone = pHero >= 0.86 && pFoot <= 0.08;
      document.body.classList.toggle('is-inside-phone', insidePhone);

      // Pause idle float once user starts scrolling so 3D fold & bezel alignment are rock-steady
      if (heroFloatDevice) {
        heroFloatDevice.classList.toggle('is-settled', pHero > 0.012);
      }

      // ======================================================================
      // PHASE A: OPENING HERO (0 -> 0.48 Unfold, 0.48 -> 1.00 Zoom & Anchor Bezel)
      // ======================================================================
      const unfoldT = easeInOutCubic(clamp(pHero / 0.48, 0, 1));
      const zoomInT = easeInOutCubic(clamp((pHero - 0.48) / 0.48, 0, 1));
      const portalInT = easeOutCubic(clamp((pHero - 0.72) / 0.24, 0, 1));

      // Scale smoothly from closedScale -> openScale during unfold, then openScale -> scaleToCover on zoom-in
      const scaleToCover = Math.max(vw / 948, vh / 632) * 1.06;
      const unfoldScale = lerp(closedScale, openScale, unfoldT);
      const currentHeroScale = lerp(unfoldScale, scaleToCover, zoomInT);

      // Translate assembly from centered-right-half (-250px) to centered-tablet (0px)
      const heroShiftX = lerp(-250, 0, unfoldT);
      heroViewport.style.transform = `scale(${currentHeroScale.toFixed(4)})`;
      heroTrack.style.transform = `translate3d(${heroShiftX.toFixed(2)}px, 0, 0)`;

      // 3D Hinge on Left Half: 180deg (closed front cover) -> 0deg (flat open)
      const openAngle = lerp(180, 0, unfoldT);
      heroLeftHalf.style.transform = `rotateY(${openAngle.toFixed(2)}deg)`;
      const isHeroClosed = unfoldT < 0.02;
      heroRightHalf.classList.toggle('is-closed-corners', isHeroClosed);
      heroLeftHalf.classList.toggle('is-closed-corners', isHeroClosed);
      heroRightHalf.style.visibility = unfoldT < 0.01 ? 'hidden' : 'visible';
      heroTrack.classList.toggle('is-unfolding', unfoldT >= 0.02 && zoomInT < 0.2);

      // Floor shadow widens as phone opens, fades as we zoom in
      const shadowScaleX = lerp(0.5, 1.0, unfoldT);
      heroShadow.style.transform = `translateX(-50%) scaleX(${shadowScaleX.toFixed(3)})`;
      heroShadow.style.opacity = clamp(1 - zoomInT * 2.2, 0, 1).toFixed(3);

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

      // "Scroll to see projects" pill fades in once unfolded and fades out on zoom-in
      if (projectsBtn) {
        const projectsAlpha = clamp((unfoldT - 0.78) / 0.22, 0, 1) * clamp(1 - zoomInT * 2.8, 0, 1);
        projectsBtn.style.opacity = projectsAlpha.toFixed(3);
        projectsBtn.style.pointerEvents = projectsAlpha > 0.2 ? 'auto' : 'none';
      }

      // Portal smoothly dissolves into the full-screen portfolio background
      if (heroPortal) {
        heroPortal.style.opacity = portalInT.toFixed(3);
      }

      // ======================================================================
      // PHASE B: CLOSING FOOTER (Sticky Browser Bezel Shrinks Down -> Seamless Handoff to 3D Fold Shut)
      // ======================================================================
      let zoomOutT = 0;
      // Always start larger than openScale so zoom-out smoothly shrinks on both desktop & mobile
      const fitStartScale = Math.min((vw - 48) / 1000, (vh - 100) / 684);
      const footStartScale = Math.max(openScale * 1.14, fitStartScale);
      let currentFootScale = footStartScale;
      let isFooterFolding = false;
      if (footerRunway && footViewport && footTrack && footCloseFlap) {
        zoomOutT = easeInOutCubic(clamp((pFoot - 0.08) / 0.42, 0, 1));
        const foldCloseT = easeInOutCubic(clamp((pFoot - 0.52) / 0.46, 0, 1));
        isFooterFolding = pFoot >= 0.50;
        footerRunway.classList.toggle('is-folding-shut', isFooterFolding);

        const baseFootScale = lerp(footStartScale, openScale, zoomOutT);
        currentFootScale = lerp(baseFootScale, closedScale, foldCloseT);
        const footShiftX = lerp(0, 250, foldCloseT);

        footViewport.style.transform = `scale(${currentFootScale.toFixed(4)})`;
        footTrack.style.transform = `translate3d(${footShiftX.toFixed(2)}px, 0, 0)`;

        const closeAngle = lerp(0, -180, foldCloseT);
        footCloseFlap.style.transform = `rotateY(${closeAngle.toFixed(2)}deg)`;
        const isFootClosed = foldCloseT > 0.97;
        footCloseFlap.classList.toggle('is-closed-corners', isFootClosed);
        footTrack.classList.toggle('is-unfolding', foldCloseT > 0.02 && !isFootClosed);
        if (footLeftHalf) {
          footLeftHalf.style.opacity = isFootClosed ? '0' : '1';
          footLeftHalf.style.visibility = isFootClosed ? 'hidden' : 'visible';
        }

        const fShadowScaleX = lerp(1.0, 0.5, foldCloseT);
        if (footShadow) {
          footShadow.style.transform = `translateX(-50%) scaleX(${fShadowScaleX.toFixed(3)})`;
          footShadow.style.opacity = clamp((zoomOutT - 0.35) * 1.6, 0, 1).toFixed(3);
        }

        const fWordOffset = (1 - foldCloseT) * 460;
        const fWordOpacity = clamp((foldCloseT - 0.15) * 1.4, 0, 1);
        if (footWordL) {
          footWordL.style.transform = `translate3d(${(-fWordOffset).toFixed(1)}px, 0, 0)`;
          footWordL.style.opacity = fWordOpacity.toFixed(3);
        }
        if (footWordR) {
          footWordR.style.transform = `translate3d(${fWordOffset.toFixed(1)}px, 0, 0)`;
          footWordR.style.opacity = fWordOpacity.toFixed(3);
        }

        const footChromeAlpha = clamp((zoomOutT - 0.45) * 2.0, 0, 1);
        if (footChromeTop) footChromeTop.style.opacity = footChromeAlpha.toFixed(3);

        if (footPortal) {
          footPortal.style.opacity = '0';
        }
      }

      // ======================================================================
      // EDGE-ANCHORING VIEWPORT BEZEL HANDOFF
      // Uses the SAME sticky bezel wrapped around the browser to shrink smoothly
      // from (0,0) all the way down to the exact opened device frame before 3D fold!
      // ======================================================================
      const isMobile = vw < 768;
      const baseInnerR = isMobile ? 16 : 26;
      if (insidePhone) {
        setBezelRect(1, 0, 0, 0, baseInnerR);
      } else if (pHero > 0.48 && pHero < 0.86) {
        const liveW = 1000 * currentHeroScale;
        const liveH = 684 * currentHeroScale;
        const padX = Math.max(0, (vw - liveW) * 0.5);
        const padY = Math.max(0, (vh - liveH) * 0.5);
        const fillRatio = Math.max(liveW / vw, liveH / vh);
        const bezelAlpha = clamp((fillRatio - 0.94) / 0.06, 0, 1);
        const outerR = Math.min(padX, padY) > 1 ? 34 * openScale : 0;
        setBezelRect(bezelAlpha, padX, padY, outerR, baseInnerR);
      } else if (pFoot > 0.08 && pFoot < 0.53) {
        // Interpolate bezel smoothly from browser walls (0, 0) to exact 1000x684 * openScale device bounds
        const targetPadX = Math.max(0, (vw - 1000 * openScale) * 0.5);
        const targetPadY = Math.max(0, (vh - 684 * openScale) * 0.5);
        const padX = lerp(0, targetPadX, zoomOutT);
        const padY = lerp(0, targetPadY, zoomOutT);
        const outerR = lerp(0, 44 * openScale, zoomOutT);
        const innerR = lerp(baseInnerR, 34 * openScale, zoomOutT);
        const handoffFade = pFoot >= 0.50 ? clamp(1 - (pFoot - 0.50) / 0.03, 0, 1) : 1;
        setBezelRect(handoffFade, padX, padY, outerR, innerR);
      } else {
        setBezelRect(0, 0, 0, 0, baseInnerR);
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
      computeBaseScale(false);
      scheduleRender();
    }, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        computeBaseScale(true);
        scheduleRender();
      }, 150);
    });

    renderFrame();
  });
})();
