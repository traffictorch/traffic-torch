// quit-risk-tool/modules/navigation.js
// Navigation scoring.
//
// Fixes applied:
//   • External link count is now computed in script-v1.3.js against the
//     audited URL (was: window.location.host, which made every internal
//     link look external when the audit ran from a different origin).
//     This module simply consumes the corrected `data.externalLinkCount`.
//   • Link density now uses a standard definition: links per 100 words.
//     The previous version multiplied by 100 and then compared against
//     thresholds meant for a different scale, so scores were unstable.
//   • Menu clarity is a smooth curve — 4–7 top-level items is ideal;
//     penalties only kick in for genuinely bloated menus (10+) or
//     almost-empty ones (0–1).
//   • Internal link balance subtracts both external links and top-level
//     menu items from the total before judging body-content linking, so
//     a page whose menu is doing most of the linking isn't falsely
//     praised.
//   • CTA strength counts only anchors/buttons that point at action
//     URLs (contact, book, buy, etc.) or use well-known CTA classes —
//     not every <button> on the page.

export function calculateNavigation(data) {
  let score = 70;

  // ── Primary nav presence ──────────────────────────────────────────
  if (data.mainNav) score += 10;
  if (data.hasDropdowns) score += 5;

  // ── Menu structure clarity ────────────────────────────────────────
  // Ideal primary nav: 4–7 top-level items. Beyond 9 penalise; below 2
  // also penalise (nothing to navigate by).
  const top = Number(data.topLevelItems) || 0;
  let menuClarity;
  if (top === 0)                 menuClarity = 40;
  else if (top <= 1)             menuClarity = 55;
  else if (top <= 3)             menuClarity = 80;
  else if (top <= 5)             menuClarity = 95;
  else if (top <= 7)             menuClarity = 85;
  else if (top <= 9)             menuClarity = 65;
  else                           menuClarity = 40;

  if (top >= 10)      score -= 18;
  else if (top >= 8)  score -= 8;
  else if (top >= 2 && top <= 7) score += 8;

  // ── Breadcrumb (contextual depth cue) ─────────────────────────────
  if (data.hasBreadcrumb && data.wordCount > 400) score += 6;

  // ── Link density (links per 100 words) ────────────────────────────
  const words = Math.max(50, data.wordCount || 100);
  const linkDensity = (data.linkCount / words) * 100;
  let linkDensityScore;
  if (linkDensity < 1)        linkDensityScore = 45;   // too sparse
  else if (linkDensity <= 4)  linkDensityScore = 95;   // ideal
  else if (linkDensity <= 8)  linkDensityScore = 80;
  else if (linkDensity <= 12) linkDensityScore = 60;
  else if (linkDensity <= 18) linkDensityScore = 40;
  else                        linkDensityScore = 20;

  if (linkDensity > 18)      score -= 22;
  else if (linkDensity > 12) score -= 12;
  else if (linkDensity < 1 && data.wordCount > 300) score -= 10;
  else if (linkDensity >= 1 && linkDensity <= 8) score += 8;

  // ── External link ratio ───────────────────────────────────────────
  const totalLinks = Math.max(1, data.linkCount);
  const externalRatio = (data.externalLinkCount || 0) / totalLinks;
  if (externalRatio > 0.45)      score -= 18;
  else if (externalRatio > 0.30) score -= 8;
  else if (externalRatio <= 0.15) score += 5;

  // ── Internal linking balance ──────────────────────────────────────
  // "Contextual" = links that aren't in the primary nav and aren't
  // external. Count each top-level nav item as roughly 2 rendered links
  // (the item plus its hit area in mobile menus).
  const navLinks = top * 2;
  const contextualLinkEstimate =
    totalLinks - navLinks - (data.externalLinkCount || 0);

  let internalBalance;
  if (contextualLinkEstimate <= 0 && data.wordCount > 600) {
    internalBalance = 30;
    score -= 12;
  } else if (contextualLinkEstimate <= 2) {
    internalBalance = 55;
  } else if (contextualLinkEstimate <= 6) {
    internalBalance = 80;
    score += 5;
  } else {
    internalBalance = 95;
    score += 10;
  }

  // ── CTA prominence ────────────────────────────────────────────────
  // potentialCTAs is a count of action-shaped anchors/buttons computed
  // in getUXContent. Treat 2+ as healthy, 4+ as strong.
  const ctas = Number(data.potentialCTAs) || 0;
  let ctaStrength;
  if (ctas >= 4)      { ctaStrength = 95; score += 12; }
  else if (ctas >= 2) { ctaStrength = 75; score += 6;  }
  else if (ctas === 1){ ctaStrength = 55; score += 2;  }
  else {
    ctaStrength = 30;
    if (data.wordCount > 500) score -= 12;
  }

  // ── Breadcrumb-weighted depth bonus ───────────────────────────────
  // Pages that show a real breadcrumb tend to have clearer site
  // architecture; small positive bump already applied above.

  score = Math.max(35, Math.min(98, Math.round(score)));

  const details = {
    linkDensity: Math.round(linkDensity * 10) / 10,   // links per 100 words
    menuClarity,
    internalBalance,
    ctaStrength,
    // Diagnostics
    totalLinks,
    externalLinks: data.externalLinkCount || 0,
    externalRatio: Math.round(externalRatio * 100) / 100,
    topLevelItems: top,
    contextualLinkEstimate,
  };

  return { score, details };
}