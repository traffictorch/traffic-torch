export function analyzeSalience(extracted) {
  if (!extracted || extracted.length === 0) {
    return {
      score: 20,
      metrics: ["No entities detected – salience cannot be evaluated"],
      failed: [
        "No named entities found. Add prominent people, brands, concepts, or products early in content to establish clear topical focus."
      ]
    };
  }

  // Sort descending by salience (ensure valid numbers)
  const sorted = [...extracted]
    .map(e => ({ ...e, salience: Math.max(0, Math.min(1, e.salience || 0.4)) }))
    .sort((a, b) => b.salience - a.salience);

  const avgSalience = extracted.reduce((sum, e) => sum + (e.salience || 0.4), 0) / extracted.length;
  const topSalience = sorted[0]?.salience || 0;
  const secondSalience = sorted[1]?.salience || 0;
  const strongCount = sorted.filter(e => e.salience > 0.6).length;
  const veryStrongCount = sorted.filter(e => e.salience > 0.8).length;

  // Detect flat vs hierarchical distribution
  const salienceDrop = topSalience - (sorted[Math.min(4, sorted.length - 1)]?.salience || 0);
  const isFlat = salienceDrop < 0.25 && strongCount > 5;

  // Scoring (0–100) – balanced across page types
  let score = Math.round(avgSalience * 80); // base from average

  // Top entity strength tiers
  if (topSalience >= 0.90) score += 20;
  else if (topSalience >= 0.70) score += 15;
  else if (topSalience >= 0.50) score += 8;

  // Multiple strong entities bonus
  if (strongCount >= 5) score += 15;
  else if (strongCount >= 3) score += 10;
  else if (strongCount >= 1) score += 5;

  // Very strong primary entity extra credit
  if (veryStrongCount >= 1) score += 8;

  // Penalty for flat distribution (weak hierarchy)
  if (isFlat) score -= 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Educational metrics
  const topEntitiesDisplay = sorted
    .slice(0, 3)
    .map(e => `${e.text} (${(e.salience * 100).toFixed(0)}%)`)
    .join(' • ');

  const metrics = [
    `Average salience: ${avgSalience.toFixed(2)} (higher = more prominent entities)`,
    `Top entity: ${sorted[0]?.text || 'N/A'} – ${(topSalience * 100).toFixed(0)}%`,
    `Strong entities (>60%): ${strongCount} of ${extracted.length} (${((strongCount / extracted.length) * 100).toFixed(0)}%)`,
    `Top 3 entities: ${topEntitiesDisplay}`,
    `Distribution: ${isFlat ? 'Flat (needs clearer focus)' : 'Hierarchical (good topical emphasis)'}`
  ];

  // Actionable failed items
  const failed = [];

  if (topSalience < 0.70) {
    failed.push(
      "Primary entity salience is weak (<70%). Place your main topic/brand/person in the page title, H1, first paragraph, and repeat naturally to boost prominence."
    );
  }

  if (strongCount < 3 && extracted.length > 10) {
    failed.push(
      "Few strongly salient entities. Most entities have low prominence – move key terms to headings (H2/H3), bold/italic, or early sections to create stronger authority signals."
    );
  }

  if (isFlat && strongCount > 4) {
    failed.push(
      "Flat salience distribution detected (entities have similar importance). Create clearer hierarchy: make one primary entity dominant in title/headings, then support with secondary ones."
    );
  }

  if (avgSalience < 0.40 && extracted.length > 5) {
    failed.push(
      "Overall low salience. Entities lack emphasis – increase frequency of top terms, use them in context-rich sentences, and consider schema markup to reinforce importance."
    );
  }

  return { score, metrics, failed };
}