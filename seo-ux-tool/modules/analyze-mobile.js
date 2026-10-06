export function analyzeMobile(html, doc) {
    let score = 100;
    const issues = [];
    const viewport = doc.querySelector('meta[name="viewport"]')?.content || '';

    // Fallback for manifest: check raw HTML if DOM selector fails
    let hasManifest = !!doc.querySelector('link[rel="manifest"]');
    if (!hasManifest && html) {
      hasManifest = /<link[^>]+rel=["']manifest["']/i.test(html);
    }

    // Fallback for homescreen icon: check raw HTML
    let has192 = !!doc.querySelector('link[sizes*="192"], link[rel="apple-touch-icon"]');
    if (!has192 && html) {
      has192 = /<link[^>]+sizes=["'][^"']*192[^"']*["']/i.test(html) ||
               /<link[^>]+rel=["']apple-touch-icon["']/i.test(html);
    }

    if (!viewport.includes('width=device-width')) {
      score -= 35;
      issues.push({
        issue: 'Viewport missing or incorrect',
        fix: 'The viewport meta tag controls how the page scales on different device sizes. Ensure it includes width=device-width and initial-scale=1 to enable responsive design. This is essential for mobile users to view content without manual zooming.'
      });
    }
    if (!hasManifest) {
      score -= 25;
      issues.push({
        issue: 'Missing web app manifest',
        fix: 'A web app manifest provides metadata for installing the site as a PWA on user devices. Create a manifest.json file with name, icons, and colors, then link it in the head. This enables add-to-home-screen prompts and a native-like experience.'
      });
    }
    if (!has192 && !hasManifest) {
      score -= 15;
      issues.push({
        issue: 'Missing large homescreen icon',
        fix: 'Homescreen icons appear when users save the site to their device. Provide high-resolution PNG/WebP icons in sizes like 192x192 and 512x512. This ensures crisp, professional branding on user home screens.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
}