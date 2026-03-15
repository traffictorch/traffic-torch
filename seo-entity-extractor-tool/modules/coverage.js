export function analyzeCoverage(extracted, cleanedText = '') {
  const entityCount = extracted.length;

  // Approximate word count if cleanedText not provided (fallback)
  const wordCount = cleanedText 
    ? cleanedText.split(/\s+/).filter(w => w.length > 0).length 
    : entityCount * 20; // rough estimate: ~20 words per entity on average

  const density = wordCount > 0 ? (entityCount / wordCount) * 100 : 0;

  // Count types with SEO-relevant weighting
  const typeCounts = extracted.reduce((acc, e) => {
    const t = e.type || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const diversity = Object.keys(typeCounts).length;
  const weightedDiversity = 
    (typeCounts.CONCEPT || 0) * 1.5 + 
    (typeCounts.ORGANIZATION || 0) * 1.2 + 
    (typeCounts.PERSON || 0) * 1.2 + 
    (typeCounts.PRODUCT || 0) * 1.1 + 
    (typeCounts.LOCATION || 0) * 0.8 + 
    (typeCounts.TECHNOLOGY || 0) * 0.8 + 
    (typeCounts.OTHER || 0) * 0.5;

  // Scoring logic (0-100) – balanced for all page types
  let score = 0;

  // Entity count tiered scoring (most important factor)
  if (entityCount >= 30) score += 45;
  else if (entityCount >= 20) score += 40;
  else if (entityCount >= 12) score += 30;
  else if (entityCount >= 6) score += 20;
  else if (entityCount >= 3) score += 10;

  // Density bonus – capped to avoid rewarding tiny pages
  const densityBonus = Math.min(20, Math.log1p(density * 10) * 8);
  score += densityBonus;

  // Diversity bonus – weighted for SEO value
  score += Math.min(25, weightedDiversity * 3.5);

  // Small penalty if extremely low diversity
  if (diversity <= 2 && entityCount > 5) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Metrics for display (educational & concise)
  const metrics = [
    `Total entities: ${entityCount}`,
    `Approx. word count: ${wordCount.toLocaleString()}`,
    `Entity density: ${density.toFixed(2)}% (ideal: 0.8–2.5% for topical pages)`,
    `Type diversity: ${diversity} types (${Object.entries(typeCounts).map(([t, c]) => `${c} ${t}`).join(', ')})`,
    `Weighted diversity score: ${weightedDiversity.toFixed(1)} (higher = better topical signals)`
  ];

  // Actionable failed items (targeted fixes)
  const failed = [];

  if (entityCount < 12) {
    failed.push(
      "Entity count is low. Add more named entities (people, brands, concepts, products) naturally throughout the content to build stronger topical authority."
    );
  }

  if (density < 0.6 && entityCount > 0) {
    failed.push(
      "Entity density is below optimal. Entities are too sparse – try weaving more related terms and names into paragraphs, headings, and lists."
    );
  }

  if (diversity < 4) {
    failed.push(
      "Limited type diversity. Most pages benefit from at least 4–5 types (e.g. CONCEPT + ORGANIZATION + PERSON + LOCATION). Include a broader range to signal expertise."
    );
  }

  // Intent-specific checks
  const hasPerson = typeCounts.PERSON > 0;
  const hasProduct = typeCounts.PRODUCT > 0;
  const hasConcept = typeCounts.CONCEPT > 0;
  const hasOrg = typeCounts.ORGANIZATION > 0;

  if (hasPerson && hasProduct && entityCount > 10 && !hasOrg) {
    failed.push(
      "Author/product-heavy page detected but no organizations/brands. Consider mentioning publishers, platforms, or companies (e.g. Google Play, YouTube) to strengthen E-E-A-T."
    );
  }

  if (hasConcept && entityCount > 15 && diversity < 5) {
    failed.push(
      "Strong concept coverage but narrow types. Add supporting entities (e.g. PEOPLE who pioneered ideas, TECHNOLOGIES used, LOCATIONS relevant) for richer semantic signals."
    );
  }

  return { score, metrics, failed };
}