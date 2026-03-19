// practices.js

/**
 * Evaluates on-page semantic & SEO best practices:
 * - Schema / structured data potential
 * - Entity usage in headings
 * - Name consistency
 * @param {Array} extracted - array of entity objects from NLP extraction
 * @returns {{ score: number, metrics: Array, failed: Array }}
 */
export function analyzePractices(extracted) {
  if (!Array.isArray(extracted) || extracted.length === 0) {
    return {
      score: 8,
      metrics: [
        { text: "No entities detected – practices cannot be evaluated", grade: 'bad' }
      ],
      failed: [
        {
          text: "No named entities found on the page. Add relevant brands, people, products, organizations, concepts or locations to unlock schema opportunities and better on-page signals.",
          grade: 'bad'
        }
      ]
    };
  }

  // ── Prepare data ──────────────────────────────────────────────────────
  const sortedBySalience = [...extracted].sort((a, b) => (b.salience ?? 0.4) - (a.salience ?? 0.4));

  const typeCounts = extracted.reduce((acc, e) => {
    const t = (e?.type || 'OTHER').toUpperCase();
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const hasPerson     = !!typeCounts.PERSON;
  const hasOrg        = !!typeCounts.ORGANIZATION;
  const hasProduct    = !!typeCounts.PRODUCT;
  const hasConcept    = !!typeCounts.CONCEPT;
  const hasLocation   = !!typeCounts.LOCATION;

  // Rough proxy: top ~30% most salient entities are good candidates for headings
  const topThirdCount = Math.ceil(extracted.length * 0.32);
  const likelyHeadingEntities = Math.min(topThirdCount, sortedBySalience.length);

  // Name consistency (normalized)
  const normalizedNames = new Set(
    extracted.map(e => 
      (e.text || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9 ]/g, '')   // remove punctuation for fair comparison
    ).filter(Boolean)
  );
  const consistencyPercent = extracted.length > 0 
    ? (normalizedNames.size / extracted.length) * 100 
    : 0;

  // ── Schema readiness scoring ─────────────────────────────────────────
  let schemaPotential = 0;

  if (hasPerson)     schemaPotential += 22;
  if (hasOrg)        schemaPotential += 22;
  if (hasProduct)    schemaPotential += 18;
  if (hasConcept && extracted.length >= 12) schemaPotential += 16;
  if (hasLocation)   schemaPotential += 10;

  // LocalBusiness / Place / Organization + location synergy
  const locationCount = typeCounts.LOCATION || 0;
  if (hasOrg && locationCount >= 2) {
    schemaPotential += 14;          // strong local signal
  }
  if (hasOrg && locationCount >= 4) {
    schemaPotential += 8;
  }

  // Article / WebPage potential
  if (hasConcept && hasOrg && extracted.length >= 15) {
    schemaPotential += 10;
  }

  schemaPotential = Math.min(100, schemaPotential);

  // ── Heading usage proxy score ────────────────────────────────────────
  const headingScore = Math.min(32, likelyHeadingEntities * 4.2);

  // ── Final score calculation ──────────────────────────────────────────
  let score = 0;

  if (extracted.length < 7) {
    // Very short entity set → limited opportunity
    score = Math.round(schemaPotential * 0.55 + headingScore * 0.45);
    score = Math.min(38, score);
  } else {
    score += Math.min(55, schemaPotential * 0.65);
    score += headingScore;
    // Small bonus for high name consistency on decent-sized entity sets
    if (extracted.length >= 10 && consistencyPercent >= 92) {
      score += 12;
    } else if (extracted.length >= 8 && consistencyPercent >= 84) {
      score += 6;
    }
  }

  score = Math.max(5, Math.min(100, Math.round(score)));

  // ── Metrics for display ───────────────────────────────────────────────
  const metrics = [
    { 
      text: `Schema potential: ${Math.round(schemaPotential)}/100`, 
      grade: schemaPotential >= 65 ? 'good' : schemaPotential >= 38 ? 'warning' : 'bad' 
    },
    { 
      text: `Likely in headings: ~${likelyHeadingEntities} entities (top ~${Math.round(100 * 0.32)}%)`, 
      grade: likelyHeadingEntities >= 6 ? 'good' : likelyHeadingEntities >= 3 ? 'warning' : 'bad' 
    },
    { 
      text: `Name consistency: ${consistencyPercent.toFixed(0)}% (${normalizedNames.size} unique normalized forms)`, 
      grade: consistencyPercent >= 92 ? 'good' : consistencyPercent >= 82 ? 'warning' : 'bad' 
    }
  ];

  // ── Failed / improvement suggestions ──────────────────────────────────
const failed = [];

// Low schema readiness (already good, but keep)
if (schemaPotential < 38) {
  const suggestions = [];
  if (hasPerson) suggestions.push("Person");
  if (hasOrg) suggestions.push("Organization");
  if (hasProduct) suggestions.push("Product");
  if (hasConcept) suggestions.push("Article / WebPage");
  if (hasLocation && hasOrg) suggestions.push("LocalBusiness");
  failed.push({
    text: `Low schema readiness (${Math.round(schemaPotential)}/100). Add JSON-LD structured data for: ${suggestions.length ? suggestions.join(', ') : 'the most prominent entity types detected'}. Start with Organization or LocalBusiness if applicable.`,
    grade: 'bad'
  });
}

// Few entities in headings (missing fix – now added)
if (likelyHeadingEntities < 4) {  // lowered threshold so it triggers on ~1 like your example
  failed.push({
    text: `Very few high-salience entities appear to be used in headings (~${likelyHeadingEntities}). Place your top entities (${sortedBySalience[0]?.text || 'main topic'}, ${sortedBySalience[1]?.text || ''}, etc.) into H1, H2 and some H3 tags to create stronger topical signals and improve crawlability.`,
    grade: 'bad'
  });
}

// Inconsistent naming (not triggered in your example – keep)
if (consistencyPercent < 84 && extracted.length >= 8) {
  failed.push({
    text: `Inconsistent entity naming detected (${consistencyPercent.toFixed(0)}%). Standardize spelling, capitalization and formatting of key names (especially brand/business name) across the entire page — including title, headings, body and alt text.`,
    grade: 'bad'
  });
}

// Location without organization (warning – keep)
if (!hasOrg && hasLocation && locationCount >= 3) {
  failed.push({
    text: "You mention multiple locations but no clear organization/brand. Adding a consistent Organization entity (business name) + LocalBusiness schema would dramatically improve local SEO strength.",
    grade: 'warning'
  });
}

// Decent volume but no strong schema candidates (warning – keep)
if (extracted.length >= 12 && schemaPotential < 50 && !hasOrg && !hasProduct) {
  failed.push({
    text: "Page has decent entity volume but lacks strong schema candidates (no Organization or Product detected). Consider explicitly marking your brand/business or main offering as Organization/Product in content and schema.",
    grade: 'warning'
  });
}

return { score, metrics, failed };
}