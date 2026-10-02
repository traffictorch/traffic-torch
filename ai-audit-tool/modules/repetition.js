// ai-audit-tool/modules/repetition.js

const STOPWORDS = new Set([
  'the','a','an','of','to','in','and','or','is','are','was','were',
  'for','on','at','by','with','as','it','this','that','from','be',
  'has','have','had','but','not','you','your','we','our','they','their'
]);
function isStop(w) { return STOPWORDS.has(w); }

export function computeRepetition(words) {
  const N = words.length;

  const bigrams = {};
  for (let i = 0; i < N - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (isStop(a) && isStop(b)) continue;
    const g = a + ' ' + b;
    bigrams[g] = (bigrams[g] || 0) + 1;
  }

  const trigrams = {};
  for (let i = 0; i < N - 2; i++) {
    const a = words[i], b = words[i + 1], c = words[i + 2];
    if (isStop(a) && isStop(b) && isStop(c)) continue;
    const g = a + ' ' + b + ' ' + c;
    trigrams[g] = (trigrams[g] || 0) + 1;
  }

  const maxBigram  = Math.max(1, ...Object.values(bigrams));
  const maxTrigram = Math.max(1, ...Object.values(trigrams));

  // Raised thresholds — realistic for English with repeated brand terms.
  const allowedBigram  = Math.max(6, Math.round(N / 150));
  const allowedTrigram = Math.max(3, Math.round(N / 400));

  // Gentle graded falloff:
  //   ratio 1.0 → 10
  //   ratio 1.5 →  8
  //   ratio 2.0 →  5
  //   ratio 3.0 →  2
  //   ratio 4.0 →  0
  function grade(max, allowed) {
    if (max <= allowed) return 10;
    const ratio = max / allowed;
    if (ratio <= 2) return Math.round(10 - (ratio - 1) * 5);
    if (ratio <= 4) return Math.round(5 - (ratio - 2) * 2.5);
    return 0;
  }

  const repetitionScore1 = grade(maxBigram,  allowedBigram);
  const repetitionScore2 = grade(maxTrigram, allowedTrigram);

  return {
    moduleScore: repetitionScore1 + repetitionScore2,
    details: {
      bigram: maxBigram,
      trigram: maxTrigram,
      bigramAllowed: allowedBigram,
      trigramAllowed: allowedTrigram,
      scores: { bigram: repetitionScore1, trigram: repetitionScore2 }
    }
  };
}