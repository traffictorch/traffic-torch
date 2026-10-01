// relationships.js

/**
 * Analyzes semantic relationships between entities:
 * co-occurrence in real paragraphs, type synergy, topical clustering.
 * @param {Array}  extracted - entity objects from NLP extraction
 * @param {Object} pageData  - { paragraphs: [...] } from the worker
 */
export function analyzeRelationships(extracted, pageData = {}) {
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

  const paragraphs = Array.isArray(pageData.paragraphs)
    ? pageData.paragraphs.map(p => String(p || '').toLowerCase())
    : [];

  // Top 18 salient entities — enough signal, avoids tail noise
  const topEntities = [...extracted]
    .filter(e => (e.text || '').trim().length > 1)
    .sort((a, b) => (b.salience ?? 0.4) - (a.salience ?? 0.4))
    .slice(0, 18)
    .map(e => ({
      text: (e.text || '').trim().toLowerCase(),
      type: (e.type || 'OTHER').toUpperCase(),
      salience: Math.max(0, Math.min(1, e.salience ?? 0.4))
    }));

  const entityCount = topEntities.length;

  // ── Real co-occurrence: count pairs that share a paragraph ──
  let coMentionPairs = 0;
  const strongPairExamples = [];

  for (let i = 0; i < entityCount - 1; i++) {
    for (let j = i + 1; j < entityCount; j++) {
      const a = topEntities[i].text;
      const b = topEntities[j].text;
      const coOccurs = paragraphs.some(p => p.includes(a) && p.includes(b));
      if (coOccurs) {
        coMentionPairs++;
        if (
          strongPairExamples.length < 4 &&
          topEntities[i].salience > 0.58 &&
          topEntities[j].salience > 0.48
        ) {
          strongPairExamples.push(`${topEntities[i].text} ↔ ${topEntities[j].text}`);
        }
      }
    }
  }

  // If the worker returned no paragraphs, fall back to a conservative proxy
  if (paragraphs.length === 0) {
    coMentionPairs = Math.min(coMentionPairs, Math.round(entityCount * 1.5));
  }

  // ── Type synergy (reduced values so synergy can't dominate) ──
  const typeSet = new Set(topEntities.map(e => e.type));
  let synergyScore = 0;

if (typeSet.has('CONCEPT') && (typeSet.has('ORGANIZATION') || typeSet.has('PERSON'))) synergyScore += 7;
if (typeSet.has('PRODUCT') && (typeSet.has('PERSON') || typeSet.has('ORGANIZATION'))) synergyScore += 6;
if (typeSet.has('TECHNOLOGY') && typeSet.has('CONCEPT'))                              synergyScore += 5;
if (typeSet.has('LOCATION') && typeSet.size >= 4)                                     synergyScore += 4;
const locationCount = topEntities.filter(e => e.type === 'LOCATION').length;
if (typeSet.has('ORGANIZATION') && locationCount >= 2) synergyScore += 7;
if (typeSet.has('ORGANIZATION') && locationCount >= 4) synergyScore += 4;

  // ── Score ──
  const coMentionScore  = Math.min(58, Math.round(Math.log1p(coMentionPairs) * 11.5));
  const diversityBonus  = Math.min(20, typeSet.size * 5.2);

  let score = 0;
  if (entityCount < 6) {
    score = Math.min(38, coMentionPairs * 7 + synergyScore * 0.6);
  } else {
    score = coMentionScore + synergyScore + diversityBonus;
    if (coMentionPairs < 6 && entityCount >= 10) score -= 14;
  }
  score = Math.max(8, Math.min(100, Math.round(score)));

  // ── Metrics ──
  const metrics = [
    {
      text: `Entities considered: ${entityCount}`,
      grade: entityCount >= 12 ? 'good' : entityCount >= 7 ? 'warning' : 'bad'
    },
    {
      text: `Real co-occurring pairs: ${coMentionPairs}`,
grade: coMentionPairs >= 30 ? 'good'
     : coMentionPairs >= 12 ? 'warning' : 'bad'
    },
    {
      text: `Type synergy bonus: +${synergyScore}`,
      grade: synergyScore >= 22 ? 'good'
           : synergyScore >= 11 ? 'warning' : 'bad'
    },
    {
      text: `Example related pairs: ${strongPairExamples.length ? strongPairExamples.join(' • ') : 'None prominent'}`,
      grade: strongPairExamples.length >= 3 ? 'good'
           : strongPairExamples.length >= 1 ? 'warning' : 'bad'
    },
    {
      text: `Relationship strength: ${coMentionScore > 42 ? 'Strong' : coMentionScore > 24 ? 'Moderate' : 'Weak'}`,
      grade: coMentionScore > 42 ? 'good'
           : coMentionScore > 24 ? 'warning' : 'bad'
    }
  ];

  // ── Failed items ──
  const failed = [];

  if (entityCount < 6) {
    failed.push({
      text:
        `Too few entities detected (only ${entityCount}). Relationships/clustering can't be meaningfully evaluated with fewer than 5–6 entities. Add more related named entities (people, products, concepts, locations, brands) to enable topical connections.`,
      grade: 'bad'
    });
  }
  if (coMentionPairs < 8 && entityCount >= 5) {
    failed.push({
      text:
        `Limited entity co-occurrences detected (${coMentionPairs} pairs appear together in the same paragraph). Group related entities in the same sections, paragraphs or lists — this helps search engines see meaningful topical connections.`,
      grade: 'bad'
    });
  }

  // BUG FIX: use the FULL entity set for type-diversity messaging,
  // not just the top 18. Otherwise a page with 5 overall types can be told it has 3.
  const allTypes = new Set(
    extracted.map(e => (e.type || 'OTHER').toUpperCase())
  );
  const totalEntityCount = extracted.length;

  if (allTypes.size < (totalEntityCount > 12 ? 4 : 3)) {
    failed.push({
      text:
        `Narrow range of entity types (${allTypes.size} unique types across the whole page). Broaden topical coverage by naturally including complementary types (e.g. add CONCEPTS, PEOPLE or PRODUCTS if missing).`,
      grade: 'bad'
    });
  }

  if (synergyScore < 11 && entityCount >= 6) {
    failed.push({
      text:
        `Weak type synergy (${synergyScore} bonus). Try connecting your main entities with supporting ones — for example: brand + product, person + concept, organization + location. This builds stronger entity clusters.`,
      grade: 'bad'
    });
  }
  if (typeSet.has('LOCATION') && !typeSet.has('ORGANIZATION') && locationCount >= 3) {
    failed.push({
      text:
        'Locations are mentioned but no clear organization/brand entity. Adding your business name consistently (and ideally LocalBusiness schema) would greatly strengthen geographic + brand signals.',
      grade: 'warning'
    });
  }
  if (coMentionScore < 28 && entityCount >= 8) {
    failed.push({
      text:
        'Topical clustering appears weak. Consider using internal links with descriptive anchors, grouping related topics in dedicated sections, and/or implementing Entity / Mention schema markup.',
      grade: 'bad'
    });
  }

  return { score, metrics, failed };
}