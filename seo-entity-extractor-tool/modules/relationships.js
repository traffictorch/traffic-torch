export function analyzeRelationships(extracted) {
  if (!extracted || extracted.length < 2) {
    return {
      score: 15,
      metrics: ["Insufficient entities to evaluate relationships"],
      failed: [
        "Too few entities detected. Add more related named entities (people, brands, concepts, products) to enable meaningful topical connections and clusters."
      ]
    };
  }

  // Sort by salience descending, take top 15 for relationship analysis (performance + focus)
  const topEntities = [...extracted]
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 15)
    .map(e => ({
      text: e.text.toLowerCase(),
      type: e.type || 'OTHER',
      salience: e.salience || 0.4
    }));

  // Count co-occurrences: every pair in the top list is considered "related" (AI already grouped them semantically)
  // This is a strong proxy since Llama extracts related entities together
  let coMentionPairs = 0;
  const pairExamples = []; // for metrics display

  for (let i = 0; i < topEntities.length - 1; i++) {
    for (let j = i + 1; j < topEntities.length; j++) {
      coMentionPairs++;
      // Collect a few illustrative pairs (highest salience first)
      if (pairExamples.length < 3 && topEntities[i].salience > 0.6 && topEntities[j].salience > 0.5) {
        pairExamples.push(`${topEntities[i].text} ↔ ${topEntities[j].text}`);
      }
    }
  }

  // Type synergy bonus: reward complementary types (SEO signals)
  let synergyScore = 0;
  const typePresence = new Set(topEntities.map(e => e.type));

  if (typePresence.has('CONCEPT') && (typePresence.has('ORGANIZATION') || typePresence.has('PERSON'))) synergyScore += 15;
  if (typePresence.has('PRODUCT') && typePresence.has('PERSON')) synergyScore += 12;
  if (typePresence.has('TECHNOLOGY') && typePresence.has('CONCEPT')) synergyScore += 10;
  if (typePresence.has('LOCATION') && typePresence.size > 3) synergyScore += 8;

  // Scoring (0–100)
  // Co-mentions (max 60): logarithmic to reward depth without over-scaling
  const coMentionScore = Math.min(60, Math.round(Math.log1p(coMentionPairs) * 12));
  // Synergy & diversity (max 40)
  const diversityBonus = Math.min(25, typePresence.size * 6);
  let score = coMentionScore + synergyScore + diversityBonus;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Educational metrics
  const metrics = [
    `Top entities analyzed: ${topEntities.length}`,
    `Potential relationship pairs: ${coMentionPairs} (all top entities considered related via extraction)`,
    `Type synergy bonus: +${synergyScore} (complementary types detected)`,
    `Example clusters: ${pairExamples.length > 0 ? pairExamples.join(' • ') : 'None prominent'}`,
    `Relationship strength: ${coMentionScore > 40 ? 'Strong' : coMentionScore > 20 ? 'Moderate' : 'Needs building'}`
  ];

  // Actionable failed items
  const failed = [];

  if (coMentionPairs < 20 && topEntities.length > 5) {
    failed.push(
      "Limited entity relationships detected. Entities appear isolated – group related terms (e.g. main topic + supporting brands/people/concepts) in the same sections/paragraphs to build stronger semantic clusters."
    );
  }

  if (typePresence.size < 4) {
    failed.push(
      "Narrow type relationships. Broaden connections by including complementary entity types (e.g. add PEOPLE or ORGANIZATIONS to CONCEPT-heavy pages, or LOCATIONS to global topics) for richer topical signals."
    );
  }

  if (coMentionScore < 30) {
    failed.push(
      "Weak topical clustering. Create internal links between pages mentioning related entities (anchor text = entity names) and use schema markup (e.g. mainEntity, mentions, about) to explicitly define relationships."
    );
  }

  return { score, metrics, failed };
}