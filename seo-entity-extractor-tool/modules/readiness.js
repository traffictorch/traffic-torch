// readiness.js

/**
 * Aggregates the four core module scores into an overall semantic readiness index
 * with weighted contribution breakdown and prioritized improvement suggestions.
 *
 * @param {number} coverageScore
 * @param {number} salienceScore
 * @param {number} relationshipsScore
 * @param {number} practicesScore
 * @returns {{ score: number, metrics: Array, failed: Array }}
 */
export function analyzeReadiness(
  coverageScore,
  salienceScore,
  relationshipsScore,
  practicesScore
) {
  // Safeguard inputs
  const safe = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.max(0, Math.min(100, val));
  };

  const c = safe(coverageScore);
  const s = safe(salienceScore);
  const r = safe(relationshipsScore);
  const p = safe(practicesScore);

  // Current weights — feel free to tweak after real-world testing
  // Coverage + Salience are usually the most predictive → higher weight
  const weights = {
    coverage: 0.35,
    salience: 0.35,
    relationships: 0.15,
    practices: 0.15
  };

  const total = c * weights.coverage +
                s * weights.salience +
                r * weights.relationships +
                p * weights.practices;

  const score = Math.round(total);

  // Descriptive level + explanation — updated to 3-grade system
  let level = 'Needs Work';
  let levelDesc = 'Major foundational gaps exist. Focus first on increasing entity coverage and salience before investing in schema or advanced clustering.';
  if (score >= 80) {
    level = 'Excellent';
    levelDesc = 'Very strong semantic foundation — well positioned for entity-first ranking, AI overviews, and competitive SERPs.';
  } else if (score >= 40) {
    level = 'Average';
    levelDesc = 'Decent base with room for improvement. Targeted fixes in the weakest 1–2 modules will likely yield noticeable ranking/visibility gains.';
  } else {
    level = 'Needs Work';
    levelDesc = 'Below-average readiness. Core entity signals (coverage + salience) need urgent attention to avoid being deprioritized by modern ranking systems.';
  }

  // Contribution percentages (normalized so they always sum to ~100%)
  const sum = c + s + r + p || 1; // avoid division by zero
  const metrics = [
    {
      text: `Overall Readiness: ${level} (${score}/100)`,
      grade: score >= 80 ? 'good' : score >= 40 ? 'warning' : 'bad'
    },
    {
      text: `Coverage contribution: ${Math.round((c / sum) * 100)}% (${c})`,
      grade: c >= 78 ? 'good' : c >= 52 ? 'warning' : 'bad'
    },
    {
      text: `Salience contribution: ${Math.round((s / sum) * 100)}% (${s})`,
      grade: s >= 78 ? 'good' : s >= 52 ? 'warning' : 'bad'
    },
    {
      text: `Relationships contribution: ${Math.round((r / sum) * 100)}% (${r})`,
      grade: r >= 65 ? 'good' : r >= 35 ? 'warning' : 'bad'
    },
    {
      text: `Practices contribution: ${Math.round((p / sum) * 100)}% (${p})`,
      grade: p >= 65 ? 'good' : p >= 35 ? 'warning' : 'bad'
    }
  ];

  // ── Prioritized failed / improvement items — unchanged ─────────────────
  const failed = [];
  if (c < 52 || s < 52) {
    failed.push({
      text: "Core entity signals are weak (Coverage and/or Salience below 52). This is usually the #1 reason pages underperform in entity-aware and AI-driven search. Prioritize: more relevant entities + stronger topical focus in prominent positions.",
      grade: 'bad'
    });
  }
  if (r < 38) {
    failed.push({
      text: "Weak topical clustering / relationships. Improve by grouping related entities in the same sections, using descriptive internal links, and (when appropriate) adding entity/mention schema.",
      grade: 'bad'
    });
  }
  if (p < 40) {
    failed.push({
      text: "On-page semantic practices need work. Highest ROI fixes usually are: 1) Add JSON-LD schema for the most prominent entity type(s), 2) Place top entities in H1/H2 headings, 3) Standardize brand/business name usage.",
      grade: 'bad'
    });
  }
  if (score < 58) {
    failed.push({
      text: "Overall semantic readiness is low. Recommended improvement order:\n1. Boost Coverage + Salience first (more & better-promoted entities)\n2. Strengthen Relationships (clusters & connections)\n3. Implement Practices (schema + headings)\nStart with the lowest-scoring module from the radar chart.",
      grade: 'bad'
    });
  }
  if (score >= 70 && Math.min(c, s, r, p) <= 65) {
    failed.push({
      text: "Already good foundation — now focus on the weakest module (look at the radar chart). Lifting the lowest score by 10–20 points often creates outsized ranking/visibility improvements.",
      grade: 'warning'
    });
  }

  return { score, metrics, failed };
}