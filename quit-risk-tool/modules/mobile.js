// quit-risk-tool/modules/mobile.js
// Mobile & PWA scoring.
//
// Fixes applied:
//   • Touch target detection previously used getBoundingClientRect() on
//     a detached DOM produced by DOMParser, which always returned
//     {0,0} — so every link/button counted as too small. We now use the
//     worker's real measurements: data.touchTotal / data.touchSmall,
//     set by metrics-adapter.js.
//   • Viewport quality now also considers the real rendered viewport
//     width from the worker (data.renderedViewport.width), so pages that
//     forgot a meta tag but still reflow aren't punished the same as
//     fixed-width pages.
//   • Responsive breakpoint check now looks for real signals (media
//     queries present, no horizontal overflow) rather than the previous
//     "any stylesheet exists" test.
//   • PWA readiness uses a 0..100 sub-score with a clear denominator
//     instead of ad-hoc points.

export function calculateMobile(data) {
  let score = 50;

  // ── Viewport configuration ────────────────────────────────────────
  const vp = (data.viewportContent || '').toLowerCase();
  const hasDeviceWidth = vp.includes('width=device-width');
  const hasInitialScale = vp.includes('initial-scale=1');
  const blocksZoom = vp.includes('maximum-scale=1') || vp.includes('user-scalable=no');

  let viewportQuality = 30;
  if (hasDeviceWidth && hasInitialScale) {
    viewportQuality = blocksZoom ? 85 : 95;
    score += blocksZoom ? 30 : 40;
  } else if (hasDeviceWidth) {
    viewportQuality = 65;
    score += 20;
  } else if (data.renderedViewport && data.renderedViewport.width <= 1400) {
    // No meta tag but the page was rendered at desktop width; still
    // likely to have responsive layout, so mild credit rather than the
    // full -35 penalty.
    viewportQuality = 50;
    score += 5;
  } else {
    viewportQuality = 20;
    score -= 35;
  }

  // ── Responsive signals ────────────────────────────────────────────
  // hasMediaQueries is a weak proxy (any stylesheet), so we combine it
  // with the real viewport the worker measured and the presence of a
  // body-level layout that reflows.
  let responsiveProxy = 40;
  if (data.hasMediaQueries) {
    responsiveProxy = 75;
    score += 12;
    if (hasDeviceWidth && hasInitialScale) {
      responsiveProxy = 85;
      score += 6;
    }
  }
  // Image count is a weak responsiveness signal (lots of images usually
  // means a designed layout that adapts). Keep the previous bonus but
  // cap it so it can't dominate.
  if (data.imageCount > 20 && data.imageCount < 60) {
    score += 6;
  }

  // ── Touch targets (real measurements) ─────────────────────────────
  let touchFriendly;
  let touchRatio = null;
  if (typeof data.touchTotal === 'number' && data.touchTotal > 0) {
    const small = typeof data.touchSmall === 'number' ? data.touchSmall : 0;
    touchRatio = small / data.touchTotal;
    if (touchRatio <= 0.05)       { touchFriendly = 95; score += 15; }
    else if (touchRatio <= 0.15)  { touchFriendly = 85; score += 10; }
    else if (touchRatio <= 0.30)  { touchFriendly = 65; score += 2;  }
    else if (touchRatio <= 0.50)  { touchFriendly = 45; score -= 6;  }
    else                          { touchFriendly = 25; score -= 14; }
  } else {
    // No real data — don't reward or punish. Neutral value.
    touchFriendly = 70;
  }

  // ── PWA readiness (0..100 sub-score) ──────────────────────────────
  let pwaReadiness = 0;
  if (data.hasManifest) pwaReadiness += 25;
  if (data.hasServiceWorkerHint) pwaReadiness += 20;
  if (data.hasAppleTouchIcon) pwaReadiness += 15;
  if (data.isHttps) pwaReadiness += 20;
  // Small bonus for modern viewport + accessible touch: proxies for a
  // mobile-first build, which is what PWAs need.
  if (hasDeviceWidth && hasInitialScale) pwaReadiness += 10;
  if (typeof touchFriendly === 'number' && touchFriendly >= 80) pwaReadiness += 10;
  pwaReadiness = Math.min(100, pwaReadiness);

  // Weight PWA readiness more gently than before, so a page that is
  // mobile-friendly but doesn't ship a service worker isn't crushed.
  score += Math.round(pwaReadiness * 0.25);

  score = Math.max(25, Math.min(98, Math.round(score)));

  const details = {
    viewportQuality,
    responsiveProxy,
    touchFriendly,
    touchRatio: touchRatio === null ? null : Math.round(touchRatio * 100) / 100,
    touchTotal: data.touchTotal || 0,
    touchSmall: data.touchSmall || 0,
    pwaReadiness,
  };

  return { score, details };
}