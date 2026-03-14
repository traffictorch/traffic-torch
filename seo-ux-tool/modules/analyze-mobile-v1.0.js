export function analyzeMobile(html, doc) {
    let score = 100;
    const issues = [];
    const viewport = doc.querySelector('meta[name="viewport"]')?.content || '';
    const has192 = doc.querySelector('link[sizes*="192"], link[rel="apple-touch-icon"]');
    // Reliable HTML-based detection: look for service worker registration code in scripts
    const scripts = doc.querySelectorAll('script');
    const hasServiceWorker = Array.from(scripts).some(script => {
      const content = script.textContent || script.src || '';
      return /serviceWorker/.test(content) && /register/.test(content);
    });

    if (!viewport.includes('width=device-width')) {
      score -= 35;
      issues.push({
        issue: 'Viewport missing or incorrect',
        fix: 'The viewport meta tag controls how the page scales on different device sizes. Ensure it includes width=device-width and initial-scale=1 to enable responsive design. This is essential for mobile users to view content without manual zooming.'
      });
    }
    if (!doc.querySelector('link[rel="manifest"]')) {
      score -= 25;
      issues.push({
        issue: 'Missing web app manifest',
        fix: 'A web app manifest provides metadata for installing the site as a PWA on user devices. Create a manifest.json file with name, icons, and colors, then link it in the head. This enables add-to-home-screen prompts and a native-like experience.'
      });
    }
    if (!has192) {
      score -= 15;
      issues.push({
        issue: 'Missing large homescreen icon',
        fix: 'Homescreen icons appear when users save the site to their device. Provide high-resolution PNG/WebP icons in sizes like 192x192 and 512x512. This ensures crisp, professional branding on user home screens.'
      });
    }
if (!hasServiceWorker) {
  issues.push({
    issue: 'No service worker detected',
    fix: 'Service workers power offline support, background sync, push notifications, and faster repeat visits. Register one (e.g. via <code>navigator.serviceWorker.register(\'/sw.js\')</code>) to cache assets and improve perceived performance. Not needed for every site — tool detection can miss dynamic or minified registrations.'
  });
}
    return { score: Math.max(0, Math.round(score)), issues };
  }