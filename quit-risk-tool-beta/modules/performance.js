export function calculatePerformance(data) {
  let score = 70;
  if (data.imageCount > 60) score -= 28;
  else if (data.imageCount > 35) score -= 16;
  else if (data.imageCount <= 10) score += 12;
  if (data.externalScripts > 15) score -= 25;
  else if (data.externalScripts > 8) score -= 14;
  else if (data.externalScripts <= 3) score += 10;
  let blockingPenalty = 0;
  if (data.hasRenderBlocking >= 8) {
    blockingPenalty = 28;
  } else if (data.hasRenderBlocking >= 5) {
    blockingPenalty = 14;
  } else if (data.hasRenderBlocking >= 3) {
    blockingPenalty = 6;
  }
  score -= blockingPenalty;
  if (data.hasLazyLoading) score += 8;
  if (data.hasFontDisplaySwap) score += 6;
  if (data.hasWebpOrAvif) score += 5;
  if (data.fontCount > 4) score -= 16;
  else if (data.fontCount > 2) score -= 7;
  if (data.hasFontDisplaySwap) score += 12;
  if (data.hasLazyLoading && data.imageCount > 10) score += 18;
  else if (data.imageCount > 15) score -= 20;
  if (data.hasWebpOrAvif) score += 15;
  else if (data.imageCount > 20) score -= 12;
  if (data.externalLinkCount > 30) score -= 14;
  score = Math.max(30, Math.min(98, Math.round(score)));
  const details = {
    assetVolume: data.imageCount <= 10 ? 95 : data.imageCount <= 35 ? 70 : data.imageCount <= 60 ? 45 : 20,
    scriptBloat: data.externalScripts <= 3 ? 90 : data.externalScripts <= 8 ? 70 : data.externalScripts <= 15 ? 45 : 25,
    fontOptimization: data.fontCount <= 2 ? 90 : data.fontCount <= 4 ? 65 : data.hasFontDisplaySwap ? 55 : 30,
    lazyLoading: (() => {
      if (data.hasLazyLoading) return 88;
      if (data.imageCount <= 6) return 78;
      if (data.imageCount <= 12) return 65;
      return 45;
    })(),
    imageFormat: data.hasWebpOrAvif ? 90 : data.imageCount > 20 ? 40 : 70,
    renderBlocking: data.hasRenderBlocking <= 2 ? 90 : data.hasRenderBlocking <= 5 ? 65 : 35
  };
  return { score, details };
}