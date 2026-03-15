export function analyzePractices(extracted) {
  if (!extracted || extracted.length === 0) {
    return {
      score: 10,
      metrics: ["No entities to evaluate practices"],
      failed: [
        "No named entities detected. Add people, brands, concepts, products, or organizations to enable schema markup and on-page optimization opportunities."
      ]
    };
  }

  // ── All declarations first ──
  const sorted = [...extracted].sort((a, b) => b.salience - a.salience);

  const typeCounts = extracted.reduce((acc, e) => {
    const t = e.type || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const hasPerson   = typeCounts.PERSON > 0;
  const hasOrg      = typeCounts.ORGANIZATION > 0;
  const hasProduct  = typeCounts.PRODUCT > 0;
  const hasConcept  = typeCounts.CONCEPT > 0;
  const hasLocation = typeCounts.LOCATION > 0;

  // Estimate heading usage: top 30% most salient entities assumed likely in headings
  const topThirdCount = Math.ceil(extracted.length * 0.3);
  const likelyHeadingEntities = sorted.slice(0, topThirdCount).length;

  // Naming consistency check
  const normalizedNames = new Set(
    extracted.map(e => e.text.trim().toLowerCase().replace(/\s+/g, ' '))
  );
  const consistencyPercent = (normalizedNames.size / extracted.length) * 100;
  const consistencyLabel = consistencyPercent >= 95 ? 'High' :
                           consistencyPercent >= 80 ? 'Good' : 'Needs improvement';

  // ── Now calculate schema potential (after all deps are ready) ──
  let schemaPotential = 0;
  if (hasPerson) schemaPotential += 20;
  if (hasOrg) schemaPotential += 20;
  if (hasProduct && hasPerson) schemaPotential += 15;
  if (hasConcept && extracted.length > 10) schemaPotential += 15;
  if (hasLocation) schemaPotential += 8;

  // ── Heading prominence estimate (max 25) ──
  const headingScore = Math.min(25, likelyHeadingEntities * 3);

  // ── Final scoring (now safe) ──
  let score = 0;

  // Low-entity cap first
  if (extracted.length < 8) {
    score = Math.min(25, schemaPotential * 0.5 + headingScore * 0.5);
  } else {
    score += Math.min(50, schemaPotential);
    score += headingScore;
    score += Math.round(consistencyPercent * 0.15);
    if (likelyHeadingEntities >= 4) score += 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Metrics ──
  const metrics = [
    `Schema readiness: ${schemaPotential}/50 (${hasPerson ? 'Person' : ''}${hasOrg ? ', Organization' : ''}${hasProduct ? ', Product/Book' : ''}${hasConcept ? ', Article potential' : ''})`,
    `Likely heading entities: ~${likelyHeadingEntities} (top ${Math.round((topThirdCount / extracted.length) * 100)}% by salience)`,
    `Name consistency: ${consistencyLabel} (${normalizedNames.size} unique normalized names)`,
    `Recommended schema types: ${getSchemaSuggestions(typeCounts)}`
  ];

  // ── Failed items ──
  const failed = [];

  if (schemaPotential < 30) {
    const suggestions = [];
    if (hasPerson && !hasOrg) suggestions.push("Person");
    if (hasOrg) suggestions.push("Organization");
    if (hasProduct) suggestions.push("Product or Book");
    if (hasConcept && extracted.length > 8) suggestions.push("Article or WebPage");
    failed.push(
      `Low schema potential (${schemaPotential}/50). Add JSON-LD markup for: ${suggestions.join(', ') || 'relevant types based on content'}. This boosts rich results and E-E-A-T.`
    );
  }

  if (likelyHeadingEntities < 3 && extracted.length > 8) {
    failed.push(
      `Few entities likely in headings. Place top entities (e.g. ${sorted[0]?.text || 'main topic'}) in H1/H2 tags and supporting ones in H3 to improve crawlability and prominence.`
    );
  }

  if (consistencyPercent < 85) {
    failed.push(
      "Inconsistent entity naming detected. Standardize names (e.g. always 'Ylia Callan' not mixed casing/variations) across the page for better recognition by search engines."
    );
  }

  if (!hasConcept && extracted.length > 5) {
    failed.push(
      "Missing abstract CONCEPT entities. Include key topics/ideas (e.g. 'search engine optimization', 'consciousness') to strengthen semantic depth and topical authority."
    );
  }

  return { score, metrics, failed };
}

// Helper (unchanged)
function getSchemaSuggestions(typeCounts) {
  const suggestions = [];
  if (typeCounts.PERSON) suggestions.push("Person");
  if (typeCounts.ORGANIZATION) suggestions.push("Organization");
  if (typeCounts.PRODUCT) suggestions.push("Product/Book");
  if (typeCounts.CONCEPT && Object.keys(typeCounts).length > 3) suggestions.push("Article");
  return suggestions.length > 0 ? suggestions.join(', ') : "Start with Article or Organization";
}