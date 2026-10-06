// quit-risk-tool/modules/navigation.js
// Navigation scoring.
//
// Tuning applied:
//   • Menu-clarity warning is suppressed in HTML mode when the primary
//     nav is JS-injected (topLevelItems = 0) — we cannot see the menu,
//     so we return null instead of a false fail.
//   • Link-density penalty is skipped in HTML mode because static
//     markup undercounts links on JS-rendered pages.

export function calculateNavigation(data) {
  let score = 70;
  const isHtmlMode = data.auditMode === 'html';

  // ── Primary nav presence ──────────────────────────────────────────
  if (data.mainNav) score += 10;
  if (data.hasDropdowns) score += 5;

  // ── Menu structure clarity ────────────────────────────────────────
  const top = Number(data.topLevelItems) || 0;
  let menuClarity;
  let menuClarityUnknown = false;

  if (top === 0 && isHtmlMode) {
    // Nav is JS-injected in HTML mode — return null, no warning.
    menuClarity = null;
    menuClarityUnknown = true;
  } else if (top === 0)        menuClarity = 40;
  else if (top <= 1)           menuClarity = 55;
  else if (top <= 3)           menuClarity = 80;
  else if (top <= 5)           menuClarity = 95;
  else if (top <= 7)           menuClarity = 85;
  else if (top <= 9)           menuClarity = 65;
  else                         menuClarity = 40;

  if (!menuClarityUnknown) {
    if (top >= 10)              score -= 18;
    else if (top >= 8)          score -= 8;
    else if (top >= 2 && top <= 7) score += 8;
  }

  // ── Breadcrumb ────────────────────────────────────────────────────
  if (data.hasBreadcrumb && data.wordCount > 400) score += 6;

  // ── Link density (links per 100 words) ────────────────────────────
  const words = Math.max(50, data.wordCount || 100);
  const linkDensity = (data.linkCount / words) * 100;

  let linkDensityScore;
  if (linkDensity < 1)        linkDensityScore = 45;
  else if (linkDensity <= 4)  linkDensityScore = 95;
  else if (linkDensity <= 8)  linkDensityScore = 80;
  else if (linkDensity <= 12) linkDensityScore = 60;
  else if (linkDensity <= 18) linkDensityScore = 40;
  else                        linkDensityScore = 20;

  // In HTML mode, link count is a static undercount — skip penalties.
  if (isHtmlMode) {
    if (linkDensity >= 1 && linkDensity <= 8) score += 8;
  } else {
    if (linkDensity > 18)      score -= 22;
    else if (linkDensity > 12) score -= 12;
    else if (linkDensity < 1 && data.wordCount > 300) score -= 10;
    else if (linkDensity >= 1 && linkDensity <= 8) score += 8;
  }

  // ── External link ratio ───────────────────────────────────────────
  const totalLinks = Math.max(1, data.linkCount);
  const externalRatio = (data.externalLinkCount || 0) / totalLinks;

  if (externalRatio > 0.45)       score -= 18;
  else if (externalRatio > 0.30)  score -= 8;
  else if (externalRatio <= 0.15) score += 5;

  // ── Internal linking balance ──────────────────────────────────────
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
  const ctas = Number(data.potentialCTAs) || 0;
  let ctaStrength;
  if (ctas >= 4)       { ctaStrength = 95; score += 12; }
  else if (ctas >= 2)  { ctaStrength = 75; score += 6;  }
  else if (ctas === 1) { ctaStrength = 55; score += 2;  }
  else {
    ctaStrength = 30;
    if (data.wordCount > 500) score -= 12;
  }

  score = Math.max(35, Math.min(98, Math.round(score)));

  const notMeasured = menuClarityUnknown ? ['menuClarity'] : [];

  const details = {
    linkDensity: Math.round(linkDensity * 10) / 10,
    menuClarity,
    internalBalance,
    ctaStrength,
    totalLinks,
    externalLinks: data.externalLinkCount || 0,
    externalRatio: Math.round(externalRatio * 100) / 100,
    topLevelItems: top,
    contextualLinkEstimate,
    notMeasured,
  };

  return { score, details };
}