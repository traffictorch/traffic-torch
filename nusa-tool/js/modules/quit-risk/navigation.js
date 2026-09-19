export function calculateNavigation(data) {
  let score = 85;
  const bodyTextLength = data.wordCount > 0 ? data.wordCount : 100;
  const linkDensity = (data.linkCount / Math.max(1, bodyTextLength)) * 100;
  if (data.mainNav) score += 12;
  if (data.hasDropdowns) score += 8;
  if (data.topLevelItems > 9) score -= 18;
  else if (data.topLevelItems > 7) score -= 8;
  else if (data.topLevelItems <= 5 && data.topLevelItems > 0) score += 10;
  if (data.hasBreadcrumb && data.wordCount > 400) score += 9;
  if (linkDensity > 12) score -= Math.min(45, (linkDensity - 8) * 6);
  else if (linkDensity > 8) score -= (linkDensity - 8) * 4;
  else if (linkDensity < 2 && data.wordCount > 300) score -= 18;
  const externalRatio = data.externalLinkCount / Math.max(1, data.linkCount);
  if (externalRatio > 0.45) score -= 22;
  else if (externalRatio > 0.30) score -= 12;
  const contextualLinkEstimate = data.linkCount - data.topLevelItems * 2;
  if (contextualLinkEstimate < 3 && data.wordCount > 600) score -= 20;
  else if (contextualLinkEstimate > 0) score += Math.min(15, contextualLinkEstimate * 1.8);
  if (data.potentialCTAs >= 4) score += 12;
  else if (data.potentialCTAs >= 2) score += 7;
  else if (data.wordCount > 500 && data.potentialCTAs === 0) score -= 14;
  score = Math.max(35, Math.min(98, Math.round(score)));
  const details = {
    linkDensity: Math.round((data.linkCount / (data.wordCount / 100 || 1)) * 10),
    menuClarity: data.topLevelItems > 0 ? Math.max(0, 100 - (data.topLevelItems - 5) * 8) : 40,
    internalBalance: Math.round((data.linkCount - (data.topLevelItems * 2)) / (data.wordCount / 500 || 1) * 25),
    ctaStrength: data.potentialCTAs >= 4 ? 90 : data.potentialCTAs >= 2 ? 65 : 30
  };
  return { score, details };
}