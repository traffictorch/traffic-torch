export function analyzeSalience(extracted) {
  if (extracted.length === 0) {
    return { score: 20, metrics: ["No entities to evaluate"], failed: ["No entities detected – salience cannot be assessed. Add prominent named entities early in content."] };
  }

  // Sort by salience descending
  const sorted = [...extracted].sort((a, b) => b.salience - a.salience);
  const avgSalience = extracted.reduce((sum, e) => sum + (e.salience || 0.5), 0) / extracted.length;
  const topSalience = sorted[0]?.salience || 0;
  const strongCount = extracted.filter(e => (e.salience || 0) > 0.6).length;

  // Scoring
  let score = Math.round(avgSalience * 100);
  if (topSalience > 0.7) score += 20;
  if (strongCount >= 3) score += 15;
  score = Math.min(100, score);

  const metrics = [
    `Average salience: ${avgSalience.toFixed(2)}`,
    `Top entity salience: ${sorted[0]?.text || 'N/A'} (${topSalience.toFixed(2)})`,
    `Strong entities (>0.6): ${strongCount} of ${extracted.length}`,
  ];

  const failed = [];
  if (avgSalience < 0.3) {
    failed.push("Low average salience – key entities are not prominent. Mention primary entities in title, headings, and first paragraph to increase focus.");
  }
  if (topSalience < 0.5) {
    failed.push("Weak top entity salience – no clear primary topic. Strengthen the main entity with early, frequent, and contextual mentions.");
  }

  return { score, metrics, failed };
}