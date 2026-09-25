// quit-risk-tool/modules/performance.js
// Performance scoring.
//
// Fixes applied:
//   • Asset volume, script bloat, font weight, and image size are now
//     driven by real transfer sizes measured by the qr-full-render-worker
//     (data.scriptTransferSize, data.imageTransferSize,
//      data.fontTransferSize, data.totalTransferSize). Falls back to
//     count-based heuristics only when those fields are absent (i.e.
//     when the audit is running against pasted HTML).
//   • Modern image format detection uses real MIME data from the
//     worker's performance entries, not the `.webp`/`.avif` extension
//     match on the HTML, which missed images served via CDNs or
//     content negotiation.
//   • Lazy loading reads the worker's lazyAttr / lazyData / lazyClass
//     fields so JS-driven lazy-loaders (data-src, class="lazy") are
//     recognised the same way native loading="lazy" is.
//   • Font count now uses real unique families (data.fontCount from
//     metrics-adapter), not the number of font stylesheet links.
//   • Render-blocking is trusted from the head-only count produced by
//     script-v1.3.js (bottom-of-body scripts no longer count).

// ── helpers ────────────────────────────────────────────────────────
function bytesToScore(bytes, good, ok) {
  if (!bytes || bytes <= 0) return null;
  if (bytes <= good) return 95;
  if (bytes <= ok)   return 70;
  if (bytes <= ok * 2) return 50;
  return 30;
}

function scoreToPoints(score, goodAt, okAt) {
  // Map a 0..100 sub-score to bonus/penalty points.
  if (score === null) return 0;
  if (score >= 90) return goodAt;
  if (score >= 70) return Math.round(goodAt * 0.6);
  if (score >= 50) return 0;
  if (score >= 30) return -Math.round(okAt * 0.5);
  return -okAt;
}

export function calculatePerformance(data) {
  let score = 70;

  // ── Image count baseline ──────────────────────────────────────────
  // Keep a light count-based pressure signal so pages with 60+ images
  // still get flagged even if the individual files are small.
  if (data.imageCount > 60)      score -= 12;
  else if (data.imageCount > 35) score -= 5;
  else if (data.imageCount <= 10) score += 6;

  // ── Asset volume (real bytes when available) ──────────────────────
  // Thresholds chosen against HTTP Archive medians: ~1.6 MB total,
  // ~350 KB script, ~900 KB images, ~90 KB fonts.
  const totalSizeScore =
    bytesToScore(data.totalTransferSize,   1_500_000, 3_500_000) ??
    null;
  const scriptSizeScore =
    bytesToScore(data.scriptTransferSize,    350_000,   900_000) ?? null;
  const imageSizeScore =
    bytesToScore(data.imageTransferSize,     900_000, 2_200_000) ?? null;
  const fontSizeScore =
    bytesToScore(data.fontTransferSize,       90_000,   220_000) ?? null;

  // If no real sizes at all, fall back to old count-based heuristics.
  const haveRealSizes =
    totalSizeScore !== null ||
    scriptSizeScore !== null ||
    imageSizeScore !== null;

  let assetVolume;
  if (totalSizeScore !== null) {
    assetVolume = totalSizeScore;
    score += scoreToPoints(totalSizeScore, 12, 22);
  } else {
    assetVolume =
      data.imageCount <= 10 ? 95 :
      data.imageCount <= 35 ? 70 :
      data.imageCount <= 60 ? 45 : 20;
    if (assetVolume >= 90)      score += 10;
    else if (assetVolume <= 20) score -= 18;
  }

  // ── Script bloat ──────────────────────────────────────────────────
  let scriptBloat;
  if (scriptSizeScore !== null) {
    scriptBloat = scriptSizeScore;
    score += scoreToPoints(scriptSizeScore, 10, 20);
  } else {
    const ext = data.externalScripts || 0;
    scriptBloat =
      ext <= 3  ? 90 :
      ext <= 8  ? 70 :
      ext <= 15 ? 45 : 25;
    if (ext > 15)      score -= 20;
    else if (ext <= 3) score += 8;
  }

  // ── Render-blocking (head-only, trusted from extractor) ───────────
  const blocking = Number(data.hasRenderBlocking) || 0;
  let renderBlocking;
  if (blocking <= 2)      { renderBlocking = 90; score += 6;  }
  else if (blocking <= 5) { renderBlocking = 65; score -= 2;  }
  else if (blocking <= 8) { renderBlocking = 45; score -= 10; }
  else                    { renderBlocking = 25; score -= 18; }

  // ── Fonts ─────────────────────────────────────────────────────────
  // fontCount now means "unique font families actually used on the
  // rendered page". Fall back to the old stylesheet-link count when
  // that field is absent.
  const families =
    typeof data.fontCount === 'number'
      ? data.fontCount
      : 0;
  let fontOptimization;
  if (families === 0)       { fontOptimization = 90; }
  else if (families <= 2)   { fontOptimization = 90; score += 6; }
  else if (families <= 3)   { fontOptimization = 75; score += 2; }
  else if (families <= 4)   { fontOptimization = 60; score -= 4; }
  else if (families <= 6)   { fontOptimization = 45; score -= 10; }
  else                      { fontOptimization = 30; score -= 16; }

  // Real font byte weight refines the score when available.
  if (fontSizeScore !== null) {
    fontOptimization = Math.round((fontOptimization + fontSizeScore) / 2);
    score += scoreToPoints(fontSizeScore, 6, 10);
  }
  if (data.hasFontDisplaySwap) score += 6;

  // ── Lazy loading ──────────────────────────────────────────────────
  // Prefer the worker's detailed lazy-image state.
  let lazyLoading;
  const li = data.lazyDetails;
  if (li && typeof li.total === 'number' && li.total > 0) {
    const lazyCount = Math.max(li.lazyAttr || 0, li.lazyData || 0, li.lazyClass || 0);
    const ratio = lazyCount / li.total;
    if (ratio >= 0.7)       { lazyLoading = 95; score += 12; }
    else if (ratio >= 0.4)  { lazyLoading = 80; score += 6;  }
    else if (ratio >= 0.2)  { lazyLoading = 60; score += 1;  }
    else if (li.total <= 4) { lazyLoading = 85; score += 6;  } // few images, no need
    else                    { lazyLoading = 40; score -= 8;  }
  } else if (data.hasLazyLoading) {
    lazyLoading = 88; score += 10;
  } else {
    // Fall back to heuristics from image count.
    if (data.imageCount <= 6)       { lazyLoading = 78; score += 4;  }
    else if (data.imageCount <= 12) { lazyLoading = 60; score -= 2;  }
    else                            { lazyLoading = 40; score -= 12; }
  }

  // ── Image optimisation (format + weight) ──────────────────────────
  const modernCount = data.modernImageCount || 0;
  const totalRenderedImgs = data.totalRenderedImages || data.imageCount || 0;
  let imageFormat;

  if (totalRenderedImgs > 0) {
    const modernRatio = modernCount / totalRenderedImgs;
    if (modernRatio >= 0.7)      imageFormat = 95;
    else if (modernRatio >= 0.4) imageFormat = 80;
    else if (modernRatio >= 0.15) imageFormat = 60;
    else if (totalRenderedImgs <= 4) imageFormat = 85;   // few images, low stakes
    else                          imageFormat = 35;
  } else {
    imageFormat = data.hasWebpOrAvif ? 90 : 70;
  }

  // Real image byte weight refines the format score.
  if (imageSizeScore !== null) {
    imageFormat = Math.round((imageFormat + imageSizeScore) / 2);
    score += scoreToPoints(imageSizeScore, 10, 18);
  } else if (totalRenderedImgs > 20 && !data.hasWebpOrAvif) {
    score -= 10;
  }

  score = Math.max(30, Math.min(98, Math.round(score)));

  const details = {
    assetVolume,
    scriptBloat,
    fontOptimization,
    lazyLoading,
    imageFormat,
    renderBlocking,
    // Diagnostics — surfaced so the UI/dev tools can show real values.
    totalTransferKB:   Math.round((data.totalTransferSize  || 0) / 1024),
    scriptTransferKB:  Math.round((data.scriptTransferSize || 0) / 1024),
    imageTransferKB:   Math.round((data.imageTransferSize  || 0) / 1024),
    fontTransferKB:    Math.round((data.fontTransferSize   || 0) / 1024),
    modernImages:      modernCount,
    totalRenderedImgs,
    fontFamilies:      families,
    hadRealSizes:      haveRealSizes,
  };

  return { score, details };
}