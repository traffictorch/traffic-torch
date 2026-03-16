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
    { text: `Average salience: ${avgSalience.toFixed(2)}`, grade: avgSalience >= 0.72 ? 'good' : avgSalience >= 0.52 ? 'warning' : 'bad' },
    { text: `Top entity salience: ${(topSalience * 100).toFixed(0)}%`, grade: topSalience >= 0.82 ? 'good' : topSalience >= 0.64 ? 'warning' : 'bad' },
    { text: `Strong entities (>62%): ${strongCount} / ${entityCount}`, grade: strongCount >= entityCount * 0.48 ? 'good' : strongCount >= entityCount * 0.30 ? 'warning' : 'bad' },
    { text: `Top 3 entities: ${top3Display}`, grade: topSalience >= 0.78 ? 'good' : topSalience >= 0.58 ? 'warning' : 'bad' },
    { text: `Distribution: ${isFlat ? 'Flat / unclear focus' : 'Good hierarchy'}`, grade: !isFlat ? 'good' : 'warning' }
  ];

  // ── Failed items with concrete, polite fix suggestions ────────────────
  const failed = [];

  if (topSalience < 0.68 && entityCount >= 5) {
    failed.push({
      text: "Main topic / brand has weak prominence. Move your primary entity into: title tag, H1, first 100–150 words, and repeat 2–4 times naturally in prominent positions.",
      grade: 'bad'
    });
  }

  if (strongCount < Math.max(2, Math.floor(entityCount * 0.38)) && entityCount >= 7) {
    failed.push({
      text: "Too few entities are strongly emphasized. Try placing 3–5 key terms in H2/H3 headings, bold/strong tags, or early in sections to create clearer topical hierarchy.",
      grade: 'bad'
    });
  }

  if (isFlat && strongCount >= 5 && entityCount >= 9) {
    failed.push({
      text: "Salience is too flat — the page doesn't clearly signal one primary topic. Strengthen focus by making one main entity dominant in title, H1, intro and at least 40% of headings.",
      grade: 'bad'
    });
  }

  if (veryStrongCount === 0 && entityCount >= 12 && topSalience < 0.88) {
    failed.push({
      text: "No entity reaches very high prominence. For better chance at featured snippets or AI overviews, push your most important entity to salience >85–90% by using it in early + structurally important positions.",
      grade: 'warning'
    });
  }

  if (entityCount >= 6 && avgSalience < 0.48) {
    failed.push({
      text: "Overall prominence is quite low. Entities appear buried or mentioned only in passing. Bring key topics closer to the top of the page and use them in visible, high-attention areas.",
      grade: 'bad'
    });
  }

  return { score, metrics, failed };
}