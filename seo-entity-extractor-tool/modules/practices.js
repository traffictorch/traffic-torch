export function analyzePractices(extracted, doc) {
  if (extracted.length === 0 || !doc) {
    return { score: 10, metrics: ["No practices to evaluate"], failed: ["No entities or DOM – implement schema and consistent naming."] };
  }

  // Check for schema (basic)
  const hasSchema = !!doc.querySelector('script[type="application/ld+json"]');
  const schemaCount = doc.querySelectorAll('script[type="application/ld+json"]').length;

  // Check headings with entities
  let headingMentions = 0;
  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    const text = h.textContent.toLowerCase();
    if (extracted.some(e => text.includes(e.text.toLowerCase()))) headingMentions++;
  });

  // Alt text check (basic)
  let altMentions = 0;
  doc.querySelectorAll('img[alt]').forEach(img => {
    const alt = img.alt.toLowerCase();
    if (extracted.some(e => alt.includes(e.text.toLowerCase()))) altMentions++;
  });

  // Consistency (simple: no duplicate names with different casing)
  const uniqueNames = new Set(extracted.map(e => e.text.trim().toLowerCase()));
  const consistencyScore = uniqueNames.size === extracted.length ? 100 : 60;

  // Scoring
  let score = 0;
  if (hasSchema) score += 40 + (schemaCount > 1 ? 20 : 0);
  score += Math.min(20, headingMentions * 8);
  score += Math.min(15, altMentions * 5);
  score += consistencyScore * 0.25;
  score = Math.round(score);

  const metrics = [
    `Schema markup present: ${hasSchema ? 'Yes' : 'No'} (${schemaCount} blocks)`,
    `Headings with entities: ${headingMentions}`,
    `Image alts with entities: ${altMentions}`,
    `Name consistency: ${consistencyScore === 100 ? 'High' : 'Medium'}`,
  ];

  const failed = [];
  if (!hasSchema) {
    failed.push("No schema markup detected – add JSON-LD for Organization, Article, or relevant types to reinforce entities in search results.");
  }
  if (headingMentions < 2) {
    failed.push("Few headings mention entities – place key entities in H1/H2 tags to boost prominence and crawlability.");
  }

  return { score, metrics, failed };
}