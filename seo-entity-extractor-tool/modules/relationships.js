// relationships.js

/**
 * Analyzes semantic relationships between entities:
 * co-occurrence, type synergy, topical clustering signals
 * @param {Array} extracted - array of entity objects from NLP extraction
 * @returns {{ score: number, metrics: Array, failed: Array }}
 */
export function analyzeRelationships(extracted) {
  if (!Array.isArray(extracted) || extracted.length < 2) {
    return {
      score: 12,
      metrics: [
        { text: "Too few entities to evaluate relationships", grade: 'bad' }
      ],
      failed: [
        {
          text: "Fewer than 2 named entities detected. Add related people, organizations, products, concepts or locations to create topical connections and improve semantic depth.",
          grade: 'bad'
        }
      ]
    };
  }

  // ── Prepare top entities (focus on most salient ones) ───────────────
  const topEntities = [...extracted]
    .filter(e => (e.text || '').trim().length > 1)
    .sort((a, b) => (b.salience ?? 0.4) - (a.salience ?? 0.4))
    .slice(0, 18)   // usually enough — avoids noise from tail entities
    .map(e => ({
      text: (e.text || '').trim().toLowerCase(),
      type: (e.type || 'OTHER').toUpperCase(),
      salience: Math.max(0, Math.min(1, e.salience ?? 0.4))
    }));

  const entityCount = topEntities.length;

  // ── Co-mention / pair counting (simple proxy for proximity & relatedness) ──
  let coMentionPairs = 0;
  const strongPairExamples = [];

  for (let i = 0; i < entityCount - 1; i++) {
    for (let j = i + 1; j < entityCount; j++) {
      coMentionPairs++;
      // Collect a few good-looking examples
      if (strongPairExamples.length < 4 &&
          topEntities[i].salience > 0.58 &&
          topEntities[j].salience > 0.48) {
        strongPairExamples.push(`${topEntities[i].text} ↔ ${topEntities[j].text}`);
      }
    }
  }

  // ── Type synergy bonuses ──────────────────────────────────────────────
  const typeSet = new Set(topEntities.map(e => e.type));
  let synergyScore = 0;

  // Common strong combinations
  if (typeSet.has('CONCEPT') && (typeSet.has('ORGANIZATION') || typeSet.has('PERSON'))) {
    synergyScore += 18;
  }
  if (typeSet.has('PRODUCT') && (typeSet.has('PERSON') || typeSet.has('ORGANIZATION'))) {
    synergyScore += 15;
  }
  if (typeSet.has('TECHNOLOGY') && typeSet.has('CONCEPT')) {
    synergyScore += 12;
  }
  if (typeSet.has('LOCATION') && typeSet.size >= 4) {
    synergyScore += 10;
  }

  // Very common homepage pattern: strong local business signal
  const locationCount = topEntities.filter(e => e.type === 'LOCATION').length;
  if (typeSet.has('ORGANIZATION') && locationCount >= 2) {
    synergyScore += 16;           // strong local intent signal
  }
  if (typeSet.has('ORGANIZATION') && locationCount >= 4) {
    synergyScore += 8;            // extra for multi-location / area businesses
  }

  // ── Scoring ───────────────────────────────────────────────────────────
  const coMentionScore = Math.min(58, Math.round(Math.log1p(coMentionPairs) * 11.5));

  const diversityBonus = Math.min(28, typeSet.size * 7.2);

  let score = 0;

  if (entityCount < 6) {
    score = Math.min(38, coMentionPairs * 7 + synergyScore * 0.6);
  } else {
    score = coMentionScore + synergyScore + diversityBonus;

    // Small penalty if almost no connections on larger entity set
    if (coMentionPairs < 18 && entityCount >= 10) {
      score -= 14;
    }
  }

  score = Math.max(8, Math.min(100, Math.round(score)));

  // ── Metrics for UI ────────────────────────────────────────────────────
  const metrics = [
    { text: `Entities considered: ${entityCount}`, grade: entityCount >= 12 ? 'good' : entityCount >= 7 ? 'warning' : 'bad' },
    { text: `Possible co-mention pairs: ${coMentionPairs}`, grade: coMentionPairs >= 45 ? 'good' : coMentionPairs >= 20 ? 'warning' : 'bad' },
    { text: `Type synergy bonus: +${synergyScore}`, grade: synergyScore >= 25 ? 'good' : synergyScore >= 12 ? 'warning' : 'bad' },
    { text: `Example related pairs: ${strongPairExamples.length ? strongPairExamples.join(' • ') : 'None prominent'}`, grade: strongPairExamples.length >= 3 ? 'good' : strongPairExamples.length >= 1 ? 'warning' : 'bad' },
    { text: `Relationship strength: ${coMentionScore > 42 ? 'Strong' : coMentionScore > 24 ? 'Moderate' : 'Weak'}`, grade: coMentionScore > 42 ? 'good' : coMentionScore > 24 ? 'warning' : 'bad' }
  ];

  // ── Failed items + concrete fix suggestions ───────────────────────────
const failed = [];

// Low entity count (critical for relationships to even be possible)
if (entityCount < 6) {
  failed.push({
    text: "Too few entities detected (only " + entityCount + "). Relationships/clustering can't be meaningfully evaluated with fewer than 5–6 entities. Add more related named entities (people, products, concepts, locations, brands) to enable topical connections.",
    grade: 'bad'
  });
}

// Limited co-occurrences
if (coMentionPairs < 22 && entityCount >= 5) {  // lowered threshold slightly for small sets
  failed.push({
    text: "Limited entity co-occurrences detected (" + coMentionPairs + " pairs). Group related entities in the same sections, paragraphs or lists — this helps search engines see meaningful topical connections and build clusters.",
    grade: 'bad'
  });
}

// Narrow type diversity
if (typeSet.size < (entityCount > 12 ? 5 : 4) && score < 100) {
  failed.push({
    text: `Narrow range of entity types (${typeSet.size} unique types). Broaden topical coverage by naturally including complementary types (e.g. add CONCEPTS, PEOPLE or PRODUCTS if missing).`,
    grade: 'bad'
  });
}

// Weak type synergy
if (synergyScore < 15 && entityCount >= 6) {
  failed.push({
    text: "Weak type synergy (" + synergyScore + " bonus). Try connecting your main entities with supporting ones — for example: brand + product, person + concept, organization + location. This builds stronger entity clusters.",
    grade: 'bad'
  });
}

// Missing organization with locations
if (typeSet.has('LOCATION') && !typeSet.has('ORGANIZATION') && locationCount >= 3) {
  failed.push({
    text: "Locations are mentioned but no clear organization/brand entity. Adding your business name consistently (and ideally LocalBusiness schema) would greatly strengthen geographic + brand signals.",
    grade: 'warning'
  });
}

// Weak overall clustering on larger sets
if (coMentionScore < 28 && entityCount >= 8) {
  failed.push({
    text: "Topical clustering appears weak. Consider using internal links with descriptive anchors, grouping related topics in dedicated sections, and/or implementing Entity / Mention schema markup.",
    grade: 'bad'
  });
}

return { score, metrics, failed };
}