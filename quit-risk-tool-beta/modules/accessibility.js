function estimateColorContrastScore() {
  const body = document.body;
  const hasCustomColors = body.style.color || body.style.backgroundColor;
  return hasCustomColors ? 78 : 72;
}

export function calculateAccessibility(data) {
  let score = 60;
  if (data.altData) {
    const { missingCount, meaningfulCount, totalImages } = data.altData;
    if (totalImages === 0) {
      score += 15;
    } else {
      const altCoverage = meaningfulCount > 0 ? (meaningfulCount - missingCount) / meaningfulCount : 1;
      if (altCoverage >= 0.98) score += 22;
      else if (altCoverage >= 0.90) score += 14;
      else if (altCoverage >= 0.70) score += 6;
      else if (altCoverage < 0.50) score -= 30;
      else score -= 18;
    }
  }
  if (data.hasMain) score += 14;
  if (data.hasArticleOrSection) score += 12;
  if (data.headingCount >= 3) score += 10;
  if (data.headingCount === 0 && data.wordCount > 300) score -= 18;
  if (data.hasLandmarks) score += 10;
  if (data.hasAriaLabels) score += 8;
  const contrastProxy = estimateColorContrastScore();
  score += (contrastProxy - 70) * 0.8;
  score = Math.max(30, Math.min(98, Math.round(score)));
  const details = {
    altCoverage: data.altData && data.altData.meaningfulCount > 0 ? Math.round(((data.altData.meaningfulCount - data.altData.missingCount) / data.altData.meaningfulCount) * 100) : (data.imageCount === 0 ? 100 : 30),
    contrastProxy,
    semanticStrength: (data.hasMain ? 25 : 0) + (data.hasArticleOrSection ? 20 : 0) + (data.headingCount >= 3 ? 25 : 0) + (data.hasLandmarks ? 20 : 0) + (data.hasAriaLabels ? 10 : 0)
  };
  return { score, details };
}