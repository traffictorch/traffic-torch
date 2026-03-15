export function analyzeReadiness(coverageScore, salienceScore, relationshipsScore, practicesScore) {
  // Safeguard invalid/missing scores
  const safe = (val) => (typeof val === 'number' && !isNaN(val)) ? Math.max(0, Math.min(100, val)) : 0;

  const c = safe(coverageScore);
  const s = safe(salienceScore);
  const r = safe(relationshipsScore);
  const p = safe(practicesScore);

  // Weighted average – latest SEO priority (2025–2026): coverage & salience dominate
  const weights = { coverage: 0.35, salience: 0.35, relationships: 0.15, practices: 0.15 };
  let total = 
    c * weights.coverage +
    s * weights.salience +
    r * weights.relationships +
    p * weights.practices;

  const score = Math.round(total);

  // Dynamic readiness level with brief explanation
  let level = '';
  let levelDesc = '';
  if (score >= 85) {
    level = 'Excellent';
    levelDesc = 'Strong semantic foundation – well-positioned for entity-driven search and AI overviews.';
  } else if (score >= 70) {
    level = 'Good';
    levelDesc = 'Solid base – minor refinements will push toward top-tier performance.';
  } else if (score >= 50) {
    level = 'Fair';
    levelDesc = 'Average readiness – focus on weakest areas to avoid being outranked.';
  } else {
    level = 'Needs Work';
    levelDesc = 'Significant gaps – prioritize core entity signals before advanced optimizations.';
  }

  // Contribution percentages for transparency
  const totalWeight = c + s + r + p || 1; // avoid div by zero
  const metrics = [
    `Overall Readiness: ${level} – ${levelDesc}`,
    `Final score: ${score}/100`,
    `Coverage contribution: ${Math.round((c / totalWeight) * 100)}% (${c})`,
    `Salience contribution: ${Math.round((s / totalWeight) * 100)}% (${s})`,
    `Relationships contribution: ${Math.round((r / totalWeight) * 100)}% (${r})`,
    `Practices contribution: ${Math.round((p / totalWeight) * 100)}% (${p})`
  ];

  // Prioritized failed items (max 4, ordered by impact)
  const failed = [];

  // Core signals first (highest priority)
  if (c < 50 || s < 50) {
    failed.push(
      "Core signals (coverage + salience) are weak – these are the foundation for entity SEO. Strengthen entity count, diversity, and prominence first."
    );
  }

  // Then supporting signals
  if (r < 40) {
    failed.push(
      "Weak entity relationships – build topical clusters by grouping related entities in content and adding internal links with descriptive anchors."
    );
  }

  if (p < 40) {
    failed.push(
      "On-page practices need improvement – implement JSON-LD schema for detected entity types and use top entities in headings for better crawlability."
    );
  }

  // Overall low score catch-all
  if (score < 60) {
    failed.push(
      "Overall semantic readiness is low. Follow the priority order: 1) Boost coverage & salience, 2) Improve relationships, 3) Add schema & practices."
    );
  }

  return { score, metrics, failed };
}