// quit-risk-tool/modules/accessibility.js
// Accessibility scoring.
//
// Tuning applied:
//   • In HTML mode we have no computed styles, so contrast is
//     unmeasurable. Return neutral (no warning, no penalty).
//   • Live mode still uses the worker's real WCAG coverage when
//     available and the fallback otherwise.

function estimateColorContrastScore() {
  const body = document.body;
  if (!body) return 72;
  const hasCustomColors = body.style.color || body.style.backgroundColor;
  return hasCustomColors ? 78 : 72;
}

export function calculateAccessibility(data) {
  let score = 60;
  const isHtmlMode = data.auditMode === 'html';

  // ── Alt text coverage ─────────────────────────────────────────────
  let altCoverage = 100;
  if (data.altData) {
    const { missingCount, meaningfulCount, totalImages } = data.altData;
    if (totalImages === 0) {
      altCoverage = 100;
      score += 15;
    } else {
      altCoverage = meaningfulCount > 0
        ? Math.round(((meaningfulCount - missingCount) / meaningfulCount) * 100)
        : (totalImages > 0 ? 30 : 100);

      if (altCoverage >= 98)      score += 22;
      else if (altCoverage >= 90) score += 14;
      else if (altCoverage >= 70) score += 6;
      else if (altCoverage < 50)  score -= 30;
      else                        score -= 18;
    }
  }

  // ── Semantics ─────────────────────────────────────────────────────
  if (data.hasMain) score += 14;
  if (data.hasArticleOrSection) score += 12;
  if (data.headingCount >= 3) score += 10;
  if (data.headingCount === 0 && data.wordCount > 300) score -= 18;
  if (data.hasLandmarks) score += 10;
  if (data.hasAriaLabels) score += 8;

  // ── Contrast ──────────────────────────────────────────────────────
  let contrastProxy;
  let contrastSource;
  let contrastUnknown = false;

  if (typeof data.contrastCoverage === 'number' && data.contrastTotal >= 3) {
    // Real rendered WCAG coverage from the worker.
    contrastProxy = Math.round(data.contrastCoverage * 100);
    contrastSource = 'rendered';
  } else if (isHtmlMode) {
    // No computed styles — cannot verify. Neutral, no warning.
    contrastProxy = 70;
    contrastSource = 'unmeasured';
    contrastUnknown = true;
  } else {
    // Live but the worker didn't return contrast samples — use proxy.
    contrastProxy = estimateColorContrastScore();
    contrastSource = 'estimated';
  }

  if (!contrastUnknown) {
    score += (contrastProxy - 70) * 0.8;
  }

  // ── Semantic strength ─────────────────────────────────────────────
  let semanticStrength = 0;
  if (data.hasMain) semanticStrength += 30;
  if (data.hasArticleOrSection) semanticStrength += 22;
  if (data.hasLandmarks) semanticStrength += 18;
  if (data.headingCount >= 3) semanticStrength += 15;
  if (data.headingCount >= 6) semanticStrength += 5;
  if (data.hasAriaLabels) semanticStrength += 10;
  semanticStrength = Math.min(100, semanticStrength);

  score = Math.max(30, Math.min(98, Math.round(score)));

  const notMeasured = contrastUnknown ? ['contrastProxy'] : [];

  const details = {
    altCoverage,
    contrastProxy,
    contrastSource,
    contrastTotalSamples: data.contrastTotal || 0,
    contrastPassingSamples: data.contrastPassing || 0,
    semanticStrength,
    notMeasured,
  };

  return { score, details };
}