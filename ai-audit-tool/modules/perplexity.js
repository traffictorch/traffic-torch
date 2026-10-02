// ai-audit-tool/modules/perplexity.js

/**
 * Perplexity = how predictable the word sequence is.
 * Low entropy  -> predictable -> likely AI
 * High entropy -> surprising  -> likely human
 *
 * Thresholds are normalised against the Shannon cap (log2(N-1)) so long
 * documents are not unfairly penalised. Graded 0..10 per sub-metric.
 */
export function computePerplexity(words) {
  const N = words.length;

  function entropy(counts, total) {
    if (total <= 0) return 0;
    return -Object.values(counts).reduce((sum, c) => {
      const p = c / total;
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
  }

  // ── Bigrams ────────────────────────────────────────────────
  const bigrams = {};
  for (let i = 0; i < N - 1; i++) {
    const g = words[i] + ' ' + words[i + 1];
    bigrams[g] = (bigrams[g] || 0) + 1;
  }
  const bigramEntropy = N > 1 ? entropy(bigrams, N - 1) : 0;

  // ── Trigrams ───────────────────────────────────────────────
  const trigrams = {};
  for (let i = 0; i < N - 2; i++) {
    const g = words.slice(i, i + 3).join(' ');
    trigrams[g] = (trigrams[g] || 0) + 1;
  }
  const trigramEntropy = N > 2 ? entropy(trigrams, N - 2) : 0;

  // ── Normalise against Shannon cap ──────────────────────────
  const bigramCap  = N > 1 ? Math.log2(N - 1) : 1;
  const trigramCap = N > 2 ? Math.log2(N - 2) : 1;

  const bigramRatio  = bigramCap  > 0 ? bigramEntropy  / bigramCap  : 0;
  const trigramRatio = trigramCap > 0 ? trigramEntropy / trigramCap : 0;

  // ── Graded 0..10 ───────────────────────────────────────────
  // Below 0.55 ratio = 0. 0.55..0.80 = linear. Above 0.80 = 10.
  function grade(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0.55) return 0;
    if (ratio >= 0.80) return 10;
    return Math.round(((ratio - 0.55) / 0.25) * 10);
  }

  const perplexityScore1 = grade(trigramRatio); // trigram
  const perplexityScore2 = grade(bigramRatio);  // bigram

  const moduleScore = perplexityScore1 + perplexityScore2;

  const details = {
    trigram: trigramEntropy.toFixed(1),
    bigram: bigramEntropy.toFixed(1),
    trigramRatio: trigramRatio.toFixed(3),
    bigramRatio: bigramRatio.toFixed(3),
    scores: { trigram: perplexityScore1, bigram: perplexityScore2 }
  };

  return { moduleScore, details };
}