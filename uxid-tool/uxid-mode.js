// uxid-tool/uxid-mode.js
export const MODES = {
  both: {
    label: 'Both',
    accent: '#22d3ee',
    weights: {
      ctaSpecificity: 1.0, ctaVisibility: 1.0, valueFirst: 1.0, frictionValue: 1.0,
      commitment: 1.0, reciprocity: 1.0, socialProof: 1.0, trust: 1.0,
      urgency: 1.0, headings: 1.0, listPresence: 0.5, sourcedStats: 0.5,
      definitional: 0.5, faq: 0.5, structuredData: 0.4
    }
  },
  seo: {
    label: 'SEO',
    accent: '#34d399',
    weights: {
      ctaSpecificity: 1.5, ctaVisibility: 1.2, valueFirst: 1.4, frictionValue: 0.9,
      commitment: 0.8, reciprocity: 0.8, socialProof: 1.1, trust: 1.0,
      urgency: 0.7, headings: 1.4, listPresence: 0.4, sourcedStats: 0.4,
      definitional: 0.4, faq: 0.4, structuredData: 0.3
    }
  },
  aeo: {
    label: 'AEO',
    accent: '#fbbf24',
    weights: {
      ctaSpecificity: 0.9, ctaVisibility: 0.8, valueFirst: 1.0, frictionValue: 0.7,
      commitment: 0.6, reciprocity: 0.6, socialProof: 0.8, trust: 1.1,
      urgency: 0.5, headings: 1.1, listPresence: 1.5, sourcedStats: 1.5,
      definitional: 1.4, faq: 1.3, structuredData: 1.2
    }
  }
};

export function computeWeightedScore(metrics, mode = 'both') {
  const w = MODES[mode]?.weights || MODES.both.weights;
  let sum = 0, total = 0;
  const breakdown = [];
  for (const [key, weight] of Object.entries(w)) {
    const m = metrics[key];
    if (!m || m.score === null || m.score === undefined) continue;
    sum += m.score * weight;
    total += weight;
    breakdown.push({ key, score: m.score, weight, contribution: m.score * weight });
  }
  const score = total > 0 ? Math.round(sum / total) : 0;
  breakdown.sort((a, b) => b.contribution - a.contribution);
  return { score, breakdown };
}
