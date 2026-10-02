// ai-audit-tool/modules/burstiness.js

/**
 * Burstiness = variation in sentence length + word length.
 * Human writing -> high variance (rhythm).
 * AI writing    -> low variance  (uniform).
 *
 * Fixes applied:
 *  - Replaced binary thresholds with graded 0..10.
 *  - Guards for empty / tiny inputs.
 */
export function computeBurstiness(sentences, words) {
  const Ns = sentences.length;
  const Nw = words.length;

  // ── Sentence length standard deviation ────────────────────
  const sentenceLengths = sentences
    .map(s => s.split(/\s+/).filter(w => w.length).length)
    .filter(n => n > 0);

  let sentBurstiness = 0;
  if (sentenceLengths.length > 1) {
    const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths
      .reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / sentenceLengths.length;
    sentBurstiness = Math.sqrt(variance);
  }

  // ── Word length standard deviation ────────────────────────
  const wordLengths = words.map(w => w.length).filter(n => n > 0);

  let wordBurstiness = 0;
  if (wordLengths.length > 1) {
    const avg = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
    const variance = wordLengths
      .reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / wordLengths.length;
    wordBurstiness = Math.sqrt(variance);
  }

  // ── Graded scoring ────────────────────────────────────────
  // Sentence stddev: human ~6-10, AI ~2-4.
  //   <= 3.0 -> 0
  //   4.5    -> 5
  //   >= 6.5 -> 10
  function gradeSentence(v) {
    if (v <= 3.0) return 0;
    if (v >= 6.5) return 10;
    if (v >= 4.5) return Math.round(5 + ((v - 4.5) / 2.0) * 5);
    return Math.round(((v - 3.0) / 1.5) * 5);
  }

  // Word stddev: human ~2.5-3.5, AI ~1.5-2.0.
  //   <= 1.4 -> 0
  //   2.0    -> 5
  //   >= 2.8 -> 10
  function gradeWord(v) {
    if (v <= 1.4) return 0;
    if (v >= 2.8) return 10;
    if (v >= 2.0) return Math.round(5 + ((v - 2.0) / 0.8) * 5);
    return Math.round(((v - 1.4) / 0.6) * 5);
  }

  const burstinessScore1 = gradeSentence(sentBurstiness);
  const burstinessScore2 = gradeWord(wordBurstiness);

  const moduleScore = burstinessScore1 + burstinessScore2;

  const details = {
    sentence: sentBurstiness.toFixed(1),
    word: wordBurstiness.toFixed(1),
    scores: { sentence: burstinessScore1, word: burstinessScore2 }
  };

  return { moduleScore, details };
}