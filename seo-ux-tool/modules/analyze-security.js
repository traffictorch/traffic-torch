export function analyzeSecurity(html, doc, url) {
    let score = 100;
    const issues = [];
    const lowerUrl = url.toLowerCase();
    const mixedContent = doc.querySelector('img[src^="http://"], script[src^="http://"], link[href^="http://"]');

    if (lowerUrl.startsWith('http://')) {
      score -= 50;
      issues.push({
        issue: 'Not served over HTTPS',
        fix: 'Modern browsers flag HTTP sites as not secure, causing users to leave immediately. Switch to HTTPS by obtaining a valid SSL/TLS certificate from providers like Let’s Encrypt. This is now a standard expectation and a ranking factor.'
      });
    }

    if (mixedContent) {
      score -= 20;
      issues.push({
        issue: 'Mixed content (insecure resources on HTTPS page)',
        fix: 'Mixed content can trigger browser warnings and block resources. Update all links, images, scripts, and styles to use HTTPS or relative URLs. This ensures a fully secure connection and maintains user trust.'
      });
    }

    return { score: Math.max(0, Math.round(score)), issues };
  }