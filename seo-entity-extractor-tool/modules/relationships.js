export function analyzeRelationships(extracted, doc) {
  if (extracted.length === 0 || !doc) {
    return { score: 15, metrics: ["Cannot evaluate relationships"], failed: ["No entities or DOM access – add internal links and schema relationships."] };
  }

  // Limit to top 10 by salience for performance
  const topEntities = [...extracted]
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 10)
    .map(e => e.text.toLowerCase());

  // Count internal links mentioning entities
  let linkCount = 0;
  doc.querySelectorAll('a[href]').forEach(a => {
    const text = a.textContent.toLowerCase();
    if (topEntities.some(ent => text.includes(ent))) linkCount++;
  });

  // Very basic co-mention count (within ~200 chars window – approximate)
  const text = doc.body?.textContent || '';
  let coMentionCount = 0;
  for (let i = 0; i < topEntities.length - 1; i++) {
    for (let j = i + 1; j < topEntities.length; j++) {
      if (text.includes(topEntities[i]) && text.includes(topEntities[j])) coMentionCount++;
    }
  }

  // Scoring
  let score = Math.min(60, linkCount * 6) + Math.min(40, coMentionCount * 4);
  score = Math.round(score);

  const metrics = [
    `Internal entity links detected: ${linkCount}`,
    `Approximate co-mentions (top entities): ${coMentionCount}`,
  ];

  const failed = [];
  if (linkCount < 5) {
    failed.push("Few internal links to related entities – build topical clusters by linking to supporting pages mentioning these entities.");
  }
  if (coMentionCount < 10) {
    failed.push("Limited entity co-occurrence – entities appear isolated. Group related entities in the same sections to signal stronger relationships.");
  }

  return { score, metrics, failed };
}