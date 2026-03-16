// salience.js

/**
 * Analyzes entity salience / prominence distribution
 * @param {Array} extracted - array of entity objects from NLP extraction
 * @returns {{ score: number, metrics: Array, failed: Array }}
 */
export function analyzeSalience(extracted) {
  if (!Array.isArray(extracted) || extracted.length === 0) {
    return {
      score: 15,
      metrics: [
        { text: "No entities detected – salience cannot be evaluated", grade: 'bad' }
      ],
      failed: [
        {
          text: "No named entities were found on the page. Add your main topic/brand, key people, products or concepts — especially in the title, H1, opening paragraph and prominent images.",
          grade: 'bad'
        }
      ]
    };
  }

  // Normalize & prepare
  const entities = extracted.map(e => ({
    ...e,
    salience: Math.max(0, Math.min(1, e.salience ?? 0.4)),
    text: (e.text || '').trim()
  })).filter(e => e.text.length > 0);

  const entityCount = entities.length;
  if (entityCount === 0) return analyzeSalience([]); // fallback

  // Sort descending by salience
  const sorted = [...entities].sort((a, b) => b.salience - a.salience);

  const avgSalience   = entities.reduce((sum, e) => sum + e.salience, 0) / entityCount;
  const topSalience   = sorted[0]?.salience ?? 0;
  const strongCount   = sorted.filter(e => e.salience > 0.62).length;
  const veryStrongCount = sorted.filter(e => e.salience > 0.82).length;

  // Salience drop from top entity to roughly 5th strongest (or last if <5)
  const dropIndex = Math.min(4, entityCount - 1);
  const salienceDrop = topSalience - (sorted[dropIndex]?.salience ?? 0);

  const isFlat = salienceDrop < 0.28 && strongCount > Math.max(4, Math.floor(entityCount * 0.45));

  // ── Base score ────────────────────────────────────────────────────────
  let score = Math.round(avgSalience * 68);   // base ~68 max for perfect average

  const isVeryShort   = entityCount <= 4;
  const isShortFocus  = entityCount <= 9;
  const isNormal      = entityCount >= 10;

  if (isVeryShort) {
    // Very few entities → conservative scoring
    score = Math.round(avgSalience * 92 + entityCount * 6);
    if (topSalience >= 0.93) score += 12;
    if (entityCount <= 2) score -= 18;
    score = Math.min(78, score);
  }
  else if (isShortFocus) {
    // Focused / medium pages
    score = Math.round(avgSalience * 105);
    if (topSalience >= 0.91) score += 20;
    if (strongCount >= 0.6 * entityCount) score += 14;
    if (veryStrongCount >= 1) score += 9;
    if (isFlat && entityCount >= 6) score -= 12;
    score = Math.min(93, score);
  }
  else {
    // Normal / content-rich pages
    if (topSalience >= 0.93) score += 24;
    else if (topSalience >= 0.84) score += 16;
    else if (topSalience >= 0.70) score += 9;

    if (strongCount >= Math.max(7, entityCount * 0.45)) score += 19;
    else if (strongCount >= Math.max(4, entityCount * 0.32)) score += 11;

    if (veryStrongCount >= 3) score += 12;
    else if (veryStrongCount >= 1) score += 6;

    if (isFlat && entityCount >= 14) score -= 20;
    else if (isFlat && entityCount >= 9) score -= 11;
  }

  // Final safety caps
  score = Math.max(10, Math.min(100, Math.round(score)));

  // ── Display metrics ───────────────────────────────────────────────────
  const top3Display = sorted.slice(0, 3)
    .map(e => `${e.text} (${(e.salience * 100).toFixed(0)}%)`)
    .join(' • ') || 'None prominent';

const metrics = [
  { 
    text: `Average salience: ${avgSalience.toFixed(2)}`, 
    grade: avgSalience >= 0.75 ? 'good' : avgSalience >= 0.60 ? 'warning' : 'bad' 
  },
  { 
    text: `Top entity salience: ${(topSalience * 100).toFixed(0)}%`, 
    grade: topSalience >= 0.85 ? 'good' : topSalience >= 0.70 ? 'warning' : 'bad' 
  },
  { 
    text: `Strong entities (>62%): ${strongCount} / ${entityCount}`, 
    grade: strongCount >= entityCount * 0.70 ? 'good' : strongCount >= entityCount * 0.50 ? 'warning' : 'bad' 
  },
  { 
    text: `Top 3 entities: ${top3Display}`, 
    grade: topSalience >= 0.82 ? 'good' : topSalience >= 0.65 ? 'warning' : 'bad' 
  },
  { 
    text: `Distribution: ${isFlat ? 'Flat / unclear focus' : 'Good hierarchy'}`, 
    grade: !isFlat && entityCount >= 3 ? 'good' : entityCount >= 2 ? 'warning' : 'bad' 
  }
];

  // ── Failed items with concrete, polite fix suggestions ────────────────
const failed = [];

if (entityCount < 4) {
  failed.push({
    text: "Very few entities detected. Salience/prominence cannot be meaningfully evaluated with fewer than 4 entities. Add your main topic/brand and supporting entities in prominent positions.",
    grade: 'bad'
  });
}

if (topSalience < 0.75 && entityCount >= 2) {
  failed.push({
    text: "Main topic / brand has weak prominence. Move your primary entity into title tag, H1, first 100 words, and repeat naturally in visible areas.",
    grade: 'bad'
  });
}

if (strongCount < Math.max(1, Math.floor(entityCount * 0.6)) && entityCount >= 3) {
  failed.push({
    text: "Too few strongly emphasized entities. Place key terms in headings, bold tags, or early sections to build clearer authority signals.",
    grade: 'bad'
  });
}

if (isFlat && entityCount >= 4) {
  failed.push({
    text: "Salience distribution is too flat. Create clearer hierarchy: make one primary entity dominant in title, H1, intro, and headings.",
    grade: 'bad'
  });
}

if (avgSalience < 0.55 && entityCount >= 3) {
  failed.push({
    text: "Overall entity prominence is low. Bring key topics closer to the top of the page and use them in high-attention areas (headings, first paragraphs).",
    grade: 'bad'
  });
}

return { score, metrics, failed };
}