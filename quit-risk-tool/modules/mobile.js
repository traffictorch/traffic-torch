export function calculateMobile(data) {
  let score = 50;
  const vp = (data.viewportContent || '').toLowerCase();
  if (vp.includes('width=device-width') && vp.includes('initial-scale=1')) {
    score += 35;
    if (!vp.includes('maximum-scale') && !vp.includes('user-scalable=no')) {
      score += 10;
    }
  } else if (vp.includes('width=device-width')) {
    score += 18;
  } else {
    score -= 35;
  }
  if (data.hasMediaQueries) score += 18;
  if (data.imageCount > 20 && data.imageCount < 60) score += 8;
  if (data.hasTouchFriendly) score += 15;
  else if (data.imageCount > 10) score -= 12;
  let pwaScore = 0;
  if (data.hasManifest) pwaScore += 20;
  if (data.hasServiceWorkerHint) pwaScore += 15;
  if (data.hasAppleTouchIcon) pwaScore += 10;
  if (data.isHttps) pwaScore += 15;
  score += Math.round(pwaScore * 0.6);
  score = Math.max(25, Math.min(98, Math.round(score)));
  const details = {
    viewportQuality: data.viewportContent.toLowerCase().includes('width=device-width') && data.viewportContent.toLowerCase().includes('initial-scale=1') ? 95 : 30,
    responsiveProxy: data.hasMediaQueries ? 85 : 40,
    touchFriendly: data.hasTouchFriendly ? 80 : 35,
    pwaReadiness: (data.hasManifest ? 25 : 0) + (data.hasServiceWorkerHint ? 20 : 0) + (data.hasAppleTouchIcon ? 15 : 0) + (data.isHttps ? 20 : 0)
  };
  return { score, details };
}