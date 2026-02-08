export function computeSentenceLength(sentences) {
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length).length);
  const avgSentLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 20;
  const sentLenInRange = avgSentLen >= 15 && avgSentLen <= 23;
  const sentLenScore = sentLenInRange ? 10 : 0;
  const commaCounts = sentences.map(s => (s.match(/,/g) || []).length);
  const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length || 0;
  const complexityScore = avgCommas >= 1.0 ? 10 : 0;
  const moduleScore = sentLenScore + complexityScore;
  const details = {
    avg: Math.round(avgSentLen),
    complexity: avgCommas.toFixed(1),
    scores: {avg: sentLenScore, complexity: complexityScore}
  };
  return { moduleScore, details };
}