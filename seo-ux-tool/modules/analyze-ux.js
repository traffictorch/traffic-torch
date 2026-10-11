export function analyzeUXDesign(html, doc) {
    let score = 100;
    const issues = [];
    const interactive = doc.querySelectorAll('a, button, input[type="submit"], [role="button"]');

    // Enhanced breadcrumb detection
    function hasBreadcrumb() {
      // Standard selectors
      if (doc.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, nav[aria-label*="breadcrumb" i]')) {
        return true;
      }
      // Fallback: look for a ul that contains a link to home as first item
      const uls = doc.querySelectorAll('ul');
      for (const ul of uls) {
        const firstLi = ul.querySelector('li');
        if (firstLi) {
          const firstLink = firstLi.querySelector('a');
          if (firstLink) {
            const href = firstLink.getAttribute('href') || '';
            const text = firstLink.textContent.trim().toLowerCase();
            if (href === '/' || href === '/home' || href === '' || text === 'home') {
              // Also check there is at least one more li (a second level)
              if (ul.querySelectorAll('li').length >= 2) {
                return true;
              }
            }
          }
        }
      }
      return false;
    }

    const breadcrumbExists = hasBreadcrumb();

    if (interactive.length > 80) {
      score -= 25;
      issues.push({
        issue: 'Too many calls-to-action / links',
        fix: 'Overwhelming users with too many options can lead to decision paralysis and higher bounce rates. Focus on 1-3 primary actions with clear, prominent buttons and move secondary links to menus or footers. This guides users toward your main goals more effectively.'
      });
    }
    if (!breadcrumbExists && doc.body.textContent.length > 2000) {
      score -= 10;
      issues.push({
        issue: 'Missing breadcrumb navigation',
        fix: 'On longer or deeper pages, breadcrumbs show users their location within the site structure. Add a simple breadcrumb trail linking back to higher-level pages. This reduces disorientation and makes navigation more intuitive. Not required on homepage.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
}