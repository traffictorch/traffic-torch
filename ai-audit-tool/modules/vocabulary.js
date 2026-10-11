// ai-audit-tool/modules/vocabulary.js

export function computeVocabulary(words, wordCount) {
  const N = wordCount || words.length || 1;

  const uniqueWords = new Set(words).size;
  const hapax = (() => {
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    let n = 0;
    for (const c of Object.values(freq)) if (c === 1) n++;
    return n;
  })();

  // Guiraud's R: unique / sqrt(N). Real-world ranges:
  //   blogs:            9–15
  //   marketing pages:  5–10
  //   long FAQ pages:   6–11
  const diversityIndex = uniqueWords / Math.sqrt(N);
  const rareWordRatio  = (hapax / N) * 100;

  // Graded 0..10 with lowered thresholds.
  function grade(value, lo, mid, hi) {
    if (value >= hi)  return 10;
    if (value >= mid) return 5 + Math.round(((value - mid) / (hi - mid)) * 5);
    if (value >= lo)  return 1 + Math.round(((value - lo) / (mid - lo)) * 4);
    return 0;
  }

  const vocabScore = grade(diversityIndex, 5, 9, 13);
  const rareScore  = grade(rareWordRatio,  8, 18, 28);

  return {
    moduleScore: vocabScore + rareScore,
    details: {
      diversity: diversityIndex.toFixed(1),
      rare: rareWordRatio.toFixed(1),
      uniqueWords,
      hapax,
      scores: { diversity: vocabScore, rare: rareScore }
    }
  };
}