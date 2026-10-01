// coverage.js

/**
 * Analyzes entity coverage: count, density, type diversity.
 * @param {Array}  extracted  - array of entity objects from NLP extraction
 * @param {number} wordCount  - real word count from the worker (0 = estimate)
 */
export function analyzeCoverage(extracted, wordCount = 0) {
  if (!Array.isArray(extracted)) extracted = [];

  const entityCount = extracted.length;

  // Real word count from worker; fall back to a rough estimate only if missing
  if (typeof wordCount !== 'number' || !Number.isFinite(wordCount) || wordCount <= 0) {
    wordCount = Math.round(entityCount * 18 + 120);
  }

  const isShortPage = wordCount < 400;
  const density = wordCount > 0 ? (entityCount / wordCount) * 100 : 0;

  // ── Density grade ──
  let densityGrade = 'bad';
  if (density >= 0.4 && density <= 5.5)          densityGrade = 'good';
  else if (density > 5.5 && density <= 9)        densityGrade = 'warning';
  else if (density > 9)                          densityGrade = 'bad';
  else if (isShortPage && density > 0.35)        densityGrade = 'good';
  else if (density > 0)                          densityGrade = 'warning';

  // ── Type distribution ──
  const typeCounts = extracted.reduce((acc, e) => {
    const t = (e?.type || 'OTHER').toUpperCase();
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const diversity = Object.keys(typeCounts).length;

  const weightedDiversity =
    (typeCounts.CONCEPT      || 0) * 1.6 +
    (typeCounts.ORGANIZATION || 0) * 1.3 +
    (typeCounts.PERSON       || 0) * 1.25 +
    (typeCounts.PRODUCT      || 0) * 1.15 +
    (typeCounts.LOCATION     || 0) * 0.9 +
    (typeCounts.TECHNOLOGY   || 0) * 0.85 +
    (typeCounts.OTHER        || 0) * 0.5;

  // ── Score ──
  let score = 0;
  if (entityCount === 0) {
    score = 5;
  } else if (entityCount < (isShortPage ? 5 : 10)) {
    score = Math.min(45, entityCount * (isShortPage ? 9 : 4.8));
  } else {
    // Base score buckets — higher thresholds for the top buckets
    if (entityCount >= (isShortPage ? 14 : 40))      score += 48;
    else if (entityCount >= (isShortPage ? 10 : 30)) score += 38;
    else if (entityCount >= (isShortPage ? 6 : 18))  score += 28;
    else                                             score += 16;

    // Density component (capped slightly tighter)
    const densityBonus = entityCount >= (isShortPage ? 4 : 7)
      ? Math.min(24, Math.log1p(density * 15) * 9)
      : Math.min(12, density * 8);
    score += densityBonus;

    // Diversity component (tighter cap, smaller bonuses)
    let diversityBonus = Math.min(28, weightedDiversity * 3.6);
    if (typeCounts.LOCATION >= 3 && typeCounts.ORGANIZATION >= 1) diversityBonus += 8;
    if (typeCounts.CONCEPT >= 4 && diversity >= 5)                diversityBonus += 6;
    score += diversityBonus;

    // Small penalty for very low diversity
    if (diversity <= (isShortPage ? 2 : 4) && entityCount >= (isShortPage ? 7 : 12)) {
      score -= 14;
    }

    // Word-count penalty for thin content
    if (!isShortPage && wordCount < 500) score -= 10;
    if (!isShortPage && wordCount < 300) score -= 10;
  }
  score = Math.max(5, Math.min(100, Math.round(score)));

  // ── Metrics ──
  const metrics = [
    {
      text: `Total entities: ${entityCount}`,
      grade: entityCount >= (isShortPage ? 12 : 30) ? 'good'
           : entityCount >= (isShortPage ? 6 : 15)  ? 'warning' : 'bad',
    },
    {
      text: `Approx. word count: ${wordCount.toLocaleString()}`,
      grade: wordCount >= 700 ? 'good' : wordCount >= 400 ? 'warning' : 'bad',
    },
    { text: `Entity density: ${density.toFixed(2)}%`, grade: densityGrade },
    {
      text: `Type diversity: ${diversity} types`,
      grade: diversity >= (isShortPage ? 5 : 7) ? 'good'
           : diversity >= (isShortPage ? 3 : 5) ? 'warning' : 'bad',
    },
    {
      text: `Weighted diversity score: ${weightedDiversity.toFixed(1)}`,
      grade: weightedDiversity >= 22 ? 'good'
           : weightedDiversity >= 12 ? 'warning' : 'bad',
    },
  ];

  // ── Failed items ──
  const failed = [];
  if (entityCount < (isShortPage ? 6 : 11)) {
    failed.push({
      text:
        'Entity count is quite low. Add more relevant named entities (brands, people, products, locations, concepts) naturally — especially in headings, first paragraphs and image alt text.',
      grade: 'bad',
    });
  }
  if (density < 0.45 && !isShortPage && entityCount > 0) {
    failed.push({
      text:
        'Entity density is rather low for a normal-length page. Weave 4–8 more related entities into the body copy, subheadings and lists without forcing it.',
      grade: 'bad',
    });
  }
  if (density > 7.5 && !isShortPage) {
    failed.push({
      text:
        'Entity density is unusually high — possible keyword stuffing signal. Reduce repetition of the same few entities and spread supporting entities more naturally.',
      grade: 'warning',
    });
  }
  if (diversity < (isShortPage ? 3 : 5)) {
    failed.push({
      text: `Low type diversity (${diversity} different types). Try to include at least one more type — for example add CONCEPTS if mostly ORGANIZATION/PERSON, or LOCATION/PRODUCT if missing.`,
      grade: 'bad',
    });
  }
  if (weightedDiversity < 10 && entityCount >= 8) {
    failed.push({
      text:
        'Weighted topical diversity is weak. Strengthen with more semantically rich entities (CONCEPT, ORGANIZATION, PRODUCT usually give highest weight).',
      grade: 'bad',
    });
  }
  if (typeCounts.LOCATION >= 1 && typeCounts.ORGANIZATION === 0 && entityCount >= 6) {
    failed.push({
      text:
        'You mention location(s) but no clear ORGANIZATION/brand. Adding your business name consistently (and preferably schema) would significantly improve local signals.',
      grade: 'warning',
    });
  }
  if (!isShortPage && wordCount < 500 && entityCount > 0) {
    failed.push({
      text: `Page is thin on content (${wordCount} words). Search engines and AI systems favour pages that develop their topics in depth — aim for at least 600–800 words of substantive content before adding more entities.`,
      grade: 'warning',
    });
  }

  return { score, metrics, failed };
}