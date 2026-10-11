// quit-risk-tool/modules/mobile.js
// Mobile & PWA scoring.
//
// Tuning applied:
//   • Touch-target warning only fires when we have real measurements.
//     In HTML mode (pasted markup) there are none, so we return neutral
//     (no warning, no score penalty) instead of guessing.
//   • Live mode with no touch data is treated as neutral rather than
//     rewarded.
//   • Missing viewport meta in HTML mode returns neutral instead of a
//     hard -35 penalty.

export function calculateMobile(data) {
  let score = 50;

  const isHtmlMode = data.auditMode === 'html';
  const hasRealTouch =
    typeof data.touchTotal === 'number' && data.touchTotal > 0;

  // ── Viewport configuration ────────────────────────────────────────
  const vp = (data.viewportContent || '').toLowerCase();
  const hasDeviceWidth = vp.includes('width=device-width');
  const hasInitialScale = vp.includes('initial-scale=1');
  const blocksZoom =
    vp.includes('maximum-scale=1') || vp.includes('user-scalable=no');

  let viewportQuality = 30;
  if (hasDeviceWidth && hasInitialScale) {
    viewportQuality = blocksZoom ? 85 : 95;
    score += blocksZoom ? 30 : 40;
  } else if (hasDeviceWidth) {
    viewportQuality = 65;
    score += 20;
  } else if (data.renderedViewport && data.renderedViewport.width <= 1400) {
    viewportQuality = 50;
    score += 5;
  } else if (isHtmlMode) {
    // Static HTML with no viewport tag — we can't verify rendering.
    // Return neutral so the UI doesn't show a false fail.
    viewportQuality = null;
  } else {
    viewportQuality = 20;
    score -= 35;
  }

  // ── Responsive signals ────────────────────────────────────────────
  let responsiveProxy = 40;
  if (data.hasMediaQueries) {
    responsiveProxy = 75;
    score += 12;
    if (hasDeviceWidth && hasInitialScale) {
      responsiveProxy = 85;
      score += 6;
    }
  }
  if (data.imageCount > 20 && data.imageCount < 60) {
    score += 6;
  }

  // ── Touch targets (real measurements only) ────────────────────────
  let touchFriendly = null;
  let touchRatio = null;

  if (hasRealTouch) {
    const small = typeof data.touchSmall === 'number' ? data.touchSmall : 0;
    touchRatio = small / data.touchTotal;

    if (touchRatio <= 0.05)       { touchFriendly = 95; score += 15; }
    else if (touchRatio <= 0.15)  { touchFriendly = 85; score += 10; }
    else if (touchRatio <= 0.30)  { touchFriendly = 65; score += 2;  }
    else if (touchRatio <= 0.50)  { touchFriendly = 45; score -= 6;  }
    else                          { touchFriendly = 25; score -= 14; }
  }
  // else: no real measurements — leave as null (neutral, no warning).

  // ── PWA readiness (0..100 sub-score) ──────────────────────────────
  let pwaReadiness = 0;
  if (data.hasManifest) pwaReadiness += 25;
  if (data.hasServiceWorkerHint) pwaReadiness += 20;
  if (data.hasAppleTouchIcon) pwaReadiness += 15;
  if (data.isHttps) pwaReadiness += 20;
  if (hasDeviceWidth && hasInitialScale) pwaReadiness += 10;
  if (typeof touchFriendly === 'number' && touchFriendly >= 80) pwaReadiness += 10;
  pwaReadiness = Math.min(100, pwaReadiness);

  score += Math.round(pwaReadiness * 0.25);
  score = Math.max(25, Math.min(98, Math.round(score)));

  const notMeasured = [];
  if (touchFriendly === null) notMeasured.push('touchFriendly');
  if (viewportQuality === null) notMeasured.push('viewportQuality');

  const details = {
    viewportQuality,
    responsiveProxy,
    touchFriendly,
    touchRatio: touchRatio === null ? null : Math.round(touchRatio * 100) / 100,
    touchTotal: data.touchTotal || 0,
    touchSmall: data.touchSmall || 0,
    pwaReadiness,
    notMeasured,
  };

  return { score, details };
}