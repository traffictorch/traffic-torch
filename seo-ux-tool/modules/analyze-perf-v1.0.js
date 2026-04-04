export function analyzePerf(html, doc) {
  let score = 100;
  const issues = [];
  const sizeKB = Math.round(html.length / 1024);
  // More realistic request count: only external resources that actually block or add latency
  const cssLinks = doc.querySelectorAll('link[rel="stylesheet"][href^="http"]');
  const jsScripts = doc.querySelectorAll('script[src^="http"]:not([async]):not([defer])');
  const blockingCss = cssLinks.length;
  const blockingJs = jsScripts.length;
  const renderBlockingCount = blockingCss + blockingJs;
  // Font count – keep external only (most common cause of delay)
  const fonts = doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="font"][rel="stylesheet"]').length;

  // Page weight check
  if (sizeKB > 120) {
    const severity = sizeKB > 250 ? 18 : sizeKB > 180 ? 12 : 7;
    score -= severity;
    issues.push({
      issue: `HTML payload: ${sizeKB} KB ${sizeKB > 250 ? '(Heavy)' : '(Somewhat large)'}`,
      fix: 'Even minified HTML can grow large with inline styles/scripts or unoptimized markup. Minify HTML, remove unused inline CSS/JS, lazy-load below-fold content, and compress images to WebP/AVIF. Tools like Autoptimize or WP Rocket often reduce HTML size 20–40% when combined with other techniques.'
    });
  }

  // Render-blocking resources
  if (renderBlockingCount > 6) {
    score -= renderBlockingCount > 12 ? 15 : 10;
    issues.push({
      issue: `${renderBlockingCount} render-blocking resource${renderBlockingCount === 1 ? '' : 's'} (external CSS + sync JS)`,
      fix: 'Render-blocking files delay First Contentful Paint. Best fixes: inline critical (above-fold) CSS and defer/async non-critical CSS/JS. Plugins like Autoptimize Pro can auto-generate critical CSS and delay non-essential JS until user interaction. For manual fix: move non-critical <script> to end of body or add defer/async attributes.'
    });
  }

  // Fonts
  if (fonts > 3) {
    score -= (fonts - 2) * 3;
    issues.push({
      issue: `${fonts} external font requests (likely Google Fonts or similar)`,
      fix: 'Multiple font requests delay text rendering (FOIT/FOUT). Best practice: limit to 1–2 families, use system fonts where possible, apply font-display: swap, and preload key font files. Autoptimize + critical CSS can help by inlining font-related styles when needed.'
    });
  }

  score = Math.max(35, score); // improved floor so 2-4 failing metrics never collapse to 0 or very low
  return { score: Math.max(0, Math.round(score)), issues };
}