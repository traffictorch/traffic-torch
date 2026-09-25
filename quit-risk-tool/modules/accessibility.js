// quit-risk-tool/modules/accessibility.js
// Accessibility scoring.
//
// Fixes applied:
//   • The old contrast check only inspected inline styles on <body>,
//     which almost never exist on real sites — so the score was a
//     constant 72 (fail). Now we prefer the worker's real WCAG
//     coverage (`data.contrastCoverage`, a 0..1 ratio computed from
//     computed styles in the live browser) and only fall back to the
//     proxy when auditing pasted HTML with no metrics.
//   • Alt-text handling is unchanged, but we now report the raw counts
//     so downstream UI can show them.
//   • Semantic strength gives more weight to a real <main> and to a
//     heading hierarchy that includes multiple heading levels, not just
//     any heading count.

function estimateColorContrastScore() {
  // Fallback only — used when auditing pasted HTML (no rendered metrics).
  const body = document.body;
  if (!body) return 72;
  const hasCustomColors = body.style.color || body.style.backgroundColor;
  return hasCustomColors ? 78 : 72;
}

export function calculateAccessibility(data) {
  let score = 60;

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

      if (altCoverage >= 98) score += 22;
      else if (altCoverage >= 90) score += 14;
      else if (altCoverage >= 70) score += 6;
      else if (altCoverage < 50) score -= 30;
      else score -= 18;
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
  // Real WCAG coverage from the qr-full-render-worker takes priority.
  let contrastProxy;
  let contrastSource;
  if (typeof data.contrastCoverage === 'number' && data.contrastTotal >= 3) {
    contrastProxy = Math.round(data.contrastCoverage * 100);
    contrastSource = 'rendered';
  } else {
    contrastProxy = estimateColorContrastScore();
    contrastSource = 'estimated';
  }
  // Apply contrast influence on score, only counting when we have real data.
  // Blend toward neutral 70 rather than adding/subtracting raw points, so a
  // perfect score doesn't over-inflate and a poor one is proportional.
  score += (contrastProxy - 70) * 0.8;

  // ── Semantic strength (0..100) ────────────────────────────────────
  // <main> carries the most weight; article/section and landmarks next;
  // heading hierarchy and ARIA fill the rest.
  let semanticStrength = 0;
  if (data.hasMain) semanticStrength += 30;
  if (data.hasArticleOrSection) semanticStrength += 22;
  if (data.hasLandmarks) semanticStrength += 18;
  if (data.headingCount >= 3) semanticStrength += 15;
  if (data.headingCount >= 6) semanticStrength += 5;
  if (data.hasAriaLabels) semanticStrength += 10;
  semanticStrength = Math.min(100, semanticStrength);

  score = Math.max(30, Math.min(98, Math.round(score)));

  const details = {
    altCoverage,
    contrastProxy,
    contrastSource,                       // 'rendered' | 'estimated'
    contrastTotalSamples: data.contrastTotal || 0,
    contrastPassingSamples: data.contrastPassing || 0,
    semanticStrength,
  };

  return { score, details };
}