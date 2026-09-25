// quit-risk-tool/metrics-adapter.js
// Merges the qr-full-render-worker `metrics` payload into the `uxData`
// shape that the existing scoring modules already expect.

export function mergeMetricsIntoUX(uxData, metrics) {
  if (!metrics) return uxData;
  const m = { ...uxData };

  // ── Touch targets ─────────────────────────────────────────────
  if (metrics.touch && typeof metrics.touch.total === 'number') {
    const { total, small } = metrics.touch;
    m.hasTouchFriendly = total === 0 ? true : (small / total) < 0.2;
    m.touchTotal = total;
    m.touchSmall = small;
    m.touchSamples = metrics.touch.samples || [];
  }

  // ── Lazy loading ──────────────────────────────────────────────
  if (metrics.lazyImages && typeof metrics.lazyImages.total === 'number') {
    const li = metrics.lazyImages;
    const lazyCount = Math.max(li.lazyAttr || 0, li.lazyData || 0, li.lazyClass || 0);
    const ratio = li.total > 0 ? lazyCount / li.total : 0;
    m.hasLazyLoading = li.total > 0 && lazyCount >= 2 && ratio >= 0.4;
    m.lazyDetails = li;
  }

  // ── Resources (real transfer sizes & counts) ──────────────────
  if (metrics.resources) {
    m.externalScripts = metrics.resources.scripts ?? m.externalScripts;
    m.scriptTransferSize = metrics.resources.scriptTransferSize ?? 0;
    m.imageTransferSize = metrics.resources.imageTransferSize ?? 0;
    m.fontTransferSize = metrics.resources.fontTransferSize ?? 0;
    m.totalTransferSize = metrics.resources.totalTransferSize ?? 0;
    if (typeof metrics.resources.images === 'number' && metrics.resources.images > 0) {
      m.renderedImageCount = metrics.resources.images;
    }
  }

  // ── Modern image formats (WebP/AVIF by MIME, not extension) ───
  if (metrics.imageFormat) {
    m.hasWebpOrAvif = metrics.imageFormat.modern > 0;
    m.modernImageCount = metrics.imageFormat.modern || 0;
    m.totalRenderedImages = metrics.imageFormat.total || 0;
  }

  // ── Fonts (real unique families used at render time) ──────────
  if (metrics.fonts && typeof metrics.fonts.uniqueFamilies === 'number') {
    m.fontCount = metrics.fonts.uniqueFamilies;
    m.fontFamilies = metrics.fonts.families || [];
  }

  // ── Word count (visible text only, no duplication) ────────────
  if (typeof metrics.wordCount === 'number' && metrics.wordCount > 0) {
    m.renderedWordCount = metrics.wordCount;
  }

  // ── Contrast (real WCAG ratios from computed styles) ──────────
  if (metrics.contrast && typeof metrics.contrast.coverage === 'number') {
    m.contrastCoverage = metrics.contrast.coverage;
    m.contrastTotal = metrics.contrast.total;
    m.contrastPassing = metrics.contrast.passingAA;
    m.contrastSamples = metrics.contrast.samples || [];
  }

  // ── Viewport (real, at render time) ───────────────────────────
  if (metrics.viewport) {
    m.renderedViewport = metrics.viewport;
  }
  
  // ── HTTPS ─────────────────────────────────────────────────────
  // Override the client-side check, which reads the audit tool's
  // own window.location instead of the audited page.
  if (metrics.url) {
    try {
      m.isHttps = new URL(metrics.url).protocol === 'https:';
    } catch {}
  }

  // ── NEW: alt-missing images, blocking resources, complex sentences ──
  if (Array.isArray(metrics.altMissingList)) {
    m.altMissingList = metrics.altMissingList;
  }
  if (Array.isArray(metrics.blockingResources)) {
    m.blockingResources = metrics.blockingResources;
    // The worker used Chrome's real renderBlockingStatus to measure
    // this, so it's authoritative. It correctly identifies async CSS
    // (preload→stylesheet) as non-blocking, which the client-side
    // static analyzer cannot do.
    m.hasRenderBlocking = metrics.blockingResources.length;
  }
  if (Array.isArray(metrics.complexSentences)) {
    m.complexSentences = metrics.complexSentences;
  }

  return m;
}