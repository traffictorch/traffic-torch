export function analyzeAccess(html, doc) {
    let score = 100;
    const issues = [];
    const missingAlts = Array.from(doc.querySelectorAll('img')).filter(i => i.alt === null || i.alt === undefined);
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
    let prev = 0, skipped = false;
    headings.forEach(h => {
      const lvl = +h.tagName[1];
      if (lvl > prev + 1) skipped = true;
      prev = lvl;
    });
    const formControls = Array.from(doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="image"]), textarea, select'));
const unlabeled = formControls.filter(el => {
  // Skip buttons/submits without need for label unless they have visible text
  if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit' || el.type === 'reset')) {
    return !el.value.trim() && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby');
  }
  // Require accessible name via one of: label assoc, ARIA, or implicit
  const hasName = 
    el.hasAttribute('aria-label') || 
    el.hasAttribute('aria-labelledby') ||
    (el.id && !!doc.querySelector(`label[for="${el.id}"]`)) ||
    el.closest('label')?.contains(el);
  return !hasName;
});

    if (missingAlts.length) {
      score -= Math.min(35, missingAlts.length * 8);
      issues.push({
        issue: `${missingAlts.length} images missing alt text`,
        fix: 'Alt text is essential for describing images to users with visual impairments and for search engines. Write concise, accurate descriptions that convey the image purpose or content, or use empty alt for purely decorative images. This boosts accessibility and enables image search optimization.'
      });
    }

    if (!doc.documentElement.lang) {
      score -= 12;
      issues.push({
        issue: 'Missing lang attribute on <html>',
        fix: 'The lang attribute specifies the page language for browsers and assistive tools. Add it to the html tag with the appropriate code like en for English. This ensures correct pronunciation and regional targeting.'
      });
    }

    if (!doc.querySelector('main, [role="main"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing main landmark',
        fix: 'Landmarks help users navigate page structure, especially with screen readers. Wrap the primary content in a main tag or add role=main to an existing container. This allows quick jumping to the core content area.'
      });
    }

    if (skipped && headings.length > 2) {
      score -= 12;
      issues.push({
        issue: 'Heading order skipped (e.g. H1 → H3)',
        fix: 'Proper heading hierarchy creates a logical structure for both users and search engines. Use headings sequentially without skipping levels to maintain clear organization. This improves navigation for screen readers and helps search engines understand content relationships.'
      });
    }

    if (unlabeled.length) {
  score -= Math.min(25, unlabeled.length * 5);
  issues.push({
    issue: `${unlabeled.length} form fields lack accessible labels`,
    fix: 'Ensure every visible form control has a programmatic name via <label for="id">, wrapping <label>, aria-label, or aria-labelledby. Placeholder alone is insufficient per WCAG 4.1.2. Hidden/submit fields often don\'t need visible labels if they have value/aria.'
  });
}

    return { score: Math.max(0, Math.round(score)), issues };
  }