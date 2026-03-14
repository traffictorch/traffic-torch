export function analyzeCoverage(extracted, cleanedText) {
  const entityCount = extracted.length;
  const wordCount = cleanedText ? cleanedText.split(/\s+/).length : 0;
  const density = wordCount > 0 ? (entityCount / wordCount) * 100 : 0;

  // Count types
  const typeCounts = extracted.reduce((acc, e) => {
    const t = e.type || 'OTHER';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const diversity = Object.keys(typeCounts).length;

  // Scoring logic (0-100)
  let score = 0;
  if (entityCount >= 12) score += 50;
  else if (entityCount >= 6) score += 30;
  else if (entityCount >= 3) score += 15;

  score += Math.min(20, density * 200);           // density bonus
  score += diversity * 8;                         // diversity bonus
  score = Math.min(100, Math.round(score));

  const metrics = [
    `Total entities: ${entityCount}`,
    `Density: ${density.toFixed(2)} entities per 100 words`,
    `Diversity: ${diversity} types (${Object.entries(typeCounts).map(([t,c]) => `${c} ${t}`).join(', ')})`,
  ];

  const failed = [];
  if (entityCount < 6) {
    failed.push("Low entity count – page may lack topical depth. Add more related named entities in natural context to improve coverage and authority.");
  }
  if (diversity < 3) {
    failed.push("Limited entity type diversity – mostly one or two types. Include people, organizations, technologies, concepts, and locations to signal broader expertise.");
  }
  if (density < 0.5) {
    failed.push("Low entity density – entities appear too sparsely. Weave more mentions naturally throughout the content.");
  }

  return { score, metrics, failed };
}