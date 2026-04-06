export function analyzeAuthoritativeness(doc, cleanedText) {
  // === Awards / Endorsements ===
  const hasAwards = !!cleanedText.match(/\b(award|winner|awarded|featured in|as seen on|recognized by|endorsed by|endorsement|best|top|honored|accolade|prize|nominee|finalist|ranked|trusted by|partnered with|collaborated with|official|certified by|accredited by|recommended by|highly rated|testimonials?|client success|case study success|media mention|press coverage)\b/gi);

  // === About / Team Links ===
  const aboutLinkElements = doc.querySelectorAll('a[href*="/about" i], a[href*="/team" i]');
  const hasAboutLinks = aboutLinkElements.length > 0 ||
    Array.from(doc.querySelectorAll('nav a')).some(a => a.textContent.toLowerCase().includes('about'));

  const metrics = {
    awards: hasAwards ? 100 : 20,
    aboutLinks: hasAboutLinks ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 2);

  const failed = [];
  if (!hasAwards) failed.push("Mention any awards, endorsements, or media features");
  if (!hasAboutLinks) failed.push("Add links to an About or Team page");

  // For radar chart - now only 2 signals
  const normalized = 100;

  return {
    score,
    metrics,
    failed,
    normalized,
    hasAboutLinks
  };
}