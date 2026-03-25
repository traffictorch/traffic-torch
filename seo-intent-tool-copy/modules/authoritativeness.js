export function analyzeAuthoritativeness(doc, cleanedText) {
  // === Schema Types ===
  const schemaTypes = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      const json = JSON.parse(s.textContent);
      const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
      schemaTypes.push(...types.filter(Boolean));
    } catch {}
  });

  // === Awards / Endorsements ===
  const hasAwards = !!cleanedText.match(/\b(award|winner|awarded|featured in|as seen on|recognized by|endorsed by|endorsement|best|top|honored|accolade|prize|nominee|finalist|ranked|trusted by|partnered with|collaborated with|official|certified by|accredited by|recommended by|highly rated|testimonials?|client success|case study success|media mention|press coverage)\b/gi);

  // === About / Team Links ===
  const aboutLinkElements = doc.querySelectorAll('a[href*="/about" i], a[href*="/team" i]');
  const hasAboutLinks = aboutLinkElements.length > 0 ||
    Array.from(doc.querySelectorAll('nav a')).some(a => a.textContent.toLowerCase().includes('about'));

  const metrics = {
    schema: schemaTypes.length > 1 ? 100 : schemaTypes.length > 0 ? 70 : 20,
    awards: hasAwards ? 100 : 20,
    aboutLinks: hasAboutLinks ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 3);

  const failed = [];
  if (schemaTypes.length < 2) failed.push("Implement relevant JSON-LD schema (Article, Person, Organization)");
  if (!hasAwards) failed.push("Mention any awards, endorsements, or media features");
  if (!hasAboutLinks) failed.push("Add links to an About or Team page");

  // For radar chart (slightly higher weight when 3+ schemas)
  const normalized = schemaTypes.length >= 3 ? 100 : schemaTypes.length >= 2 ? 95 : schemaTypes.length === 1 ? 65 : 20;

  return {
    score,
    metrics,
    failed,
    normalized,
    schemaTypes,          // needed for HTML report
    hasAboutLinks         // needed for priority fixes / plugin section
  };
}