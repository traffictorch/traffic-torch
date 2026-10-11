// ai-audit-tool/modules/sentenceLength.js

export function computeSentenceLength(sentences) {
  // Only count proper sentences — skip fragments, headers, nav items.
  const cleanSentences = sentences.filter(s => {
    const n = s.split(/\s+/).filter(w => w.length).length;
    return n >= 5;
  });

  if (cleanSentences.length === 0) {
    return {
      moduleScore: 0,
      details: { avg: 0, complexity: '0.00', scores: { avg: 0, complexity: 0 } }
    };
  }

  const lengths = cleanSentences.map(s => s.split(/\s+/).filter(w => w.length).length);
  const avgSentLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  const commaCounts = cleanSentences.map(s => (s.match(/,/g) || []).length);
  const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length;

  // Graded average-length scoring (15–23 = ideal, graded outward).
  function gradeAvg(n) {
    if (n >= 15 && n <= 23) return 10;
    if (n >= 12 && n < 15)  return Math.round(6 + ((n - 12) / 3) * 4); // 6..10
    if (n > 23 && n <= 26)  return Math.round(10 - ((n - 23) / 3) * 2); // 8..10
    if (n >= 10 && n < 12)  return Math.round(3 + ((n - 10) / 2) * 3);  // 3..6
    if (n > 26 && n <= 30)  return Math.max(0, Math.round(8 - ((n - 26) / 4) * 8));
    return 0;
  }

  // Graded complexity: commas per sentence.
  function gradeComplexity(c) {
    if (c >= 1.0) return 10;
    if (c >= 0.8) return 9;
    if (c >= 0.6) return 8;
    if (c >= 0.4) return 6;
    if (c >= 0.25) return 4;
    if (c >= 0.1) return 2;
    return 0;
  }

  const sentLenScore   = gradeAvg(avgSentLen);
  const complexityScore = gradeComplexity(avgCommas);

  return {
    moduleScore: sentLenScore + complexityScore,
    details: {
      avg: Math.round(avgSentLen),
      complexity: avgCommas.toFixed(2),
      sentencesAnalyzed: cleanSentences.length,
      scores: { avg: sentLenScore, complexity: complexityScore }
    }
  };
}