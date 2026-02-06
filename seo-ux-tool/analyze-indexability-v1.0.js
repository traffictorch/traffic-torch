export function analyzeIndexability(html, doc) {
    let score = 100;
    const issues = [];
    const robotsMeta = doc.querySelector('meta[name="robots"]');

    if (robotsMeta && /noindex/i.test(robotsMeta.content)) {
      score -= 60;
      issues.push({
        issue: 'noindex meta tag present',
        fix: 'A noindex tag tells search engines not to include the page in results, making it invisible to organic traffic. Remove the noindex directive unless the page is intentionally private or under development. Always verify this setting on production pages.'
      });
    }

    if (!doc.querySelector('link[rel="canonical"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing canonical tag',
        fix: 'Without a canonical tag, search engines may treat similar URLs as duplicates and split ranking power. Add a canonical link pointing to the preferred version of the page. This helps consolidate signals and prevent dilution of authority.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }