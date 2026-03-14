export function analyzeReadiness(coverageScore, salienceScore, relationshipsScore, practicesScore) {
  // Weighted average – salience and coverage are most important
  const weights = { coverage: 0.30, salience: 0.30, relationships: 0.20, practices: 0.20 };
  let total = 
    coverageScore * weights.coverage +
    salienceScore * weights.salience +
    relationshipsScore * weights.relationships +
    practicesScore * weights.practices;

  const score = Math.round(total);

  const level = score >= 85 ? 'Excellent – AI & semantic search ready' :
                score >= 70 ? 'Good – solid foundation' :
                score >= 50 ? 'Fair – room for improvement' :
                'Needs Work – significant gaps';

  const metrics = [
    `Overall Readiness: ${level}`,
    `Weighted score: ${score}/100`,
    `Coverage contribution: ${coverageScore}`,
    `Salience contribution: ${salienceScore}`,
  ];

  const failed = [];
  if (score < 60) {
    failed.push("Low semantic readiness – prioritize coverage and salience first, then relationships and schema practices to become competitive in entity-driven search.");
  }
  if (salienceScore < 50 || coverageScore < 50) {
    failed.push("Core signals weak – focus on entity prominence and topical depth before advanced optimizations.");
  }

  return { score, metrics, failed };
}