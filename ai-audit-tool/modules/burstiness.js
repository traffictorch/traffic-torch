export function computeBurstiness(sentences, words) {
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length).length);
  const avgSentLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 20;
  const sentVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentLen, 2), 0) / sentenceLengths.length;
  const sentBurstiness = Math.sqrt(sentVariance);
  const wordLengths = words.map(w => w.length);
  const avgWordLen = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length || 6;
  const wordVariance = wordLengths.reduce((sum, len) => sum + Math.pow(len - avgWordLen, 2), 0) / wordLengths.length;
  const wordBurstiness = Math.sqrt(wordVariance);
  const burstinessScore1 = sentBurstiness >= 4.5 ? 10 : 0;
  const burstinessScore2 = wordBurstiness >= 2.0 ? 10 : 0;
  const moduleScore = burstinessScore1 + burstinessScore2;
  const details = {
    sentence: sentBurstiness.toFixed(1),
    word: wordBurstiness.toFixed(1),
    scores: {sentence: burstinessScore1, word: burstinessScore2}
  };
  return { moduleScore, details };
}