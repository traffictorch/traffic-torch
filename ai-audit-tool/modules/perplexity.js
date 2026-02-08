export function computePerplexity(words) {
  function entropy(counts, total) {
    return -Object.values(counts).reduce((sum, c) => {
      const p = c / total;
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
  }
  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    const gram = words[i] + ' ' + words[i + 1];
    bigrams[gram] = (bigrams[gram] || 0) + 1;
  }
  const bigramEntropy = words.length > 1 ? entropy(bigrams, words.length - 1) : 6;
  const trigrams = {};
  for (let i = 0; i < words.length - 2; i++) {
    const gram = words.slice(i, i + 3).join(' ');
    trigrams[gram] = (trigrams[gram] || 0) + 1;
  }
  const trigramEntropy = words.length > 2 ? entropy(trigrams, words.length - 2) : 6;
  const perplexityScore1 = trigramEntropy >= 7.5 ? 10 : 0;
  const perplexityScore2 = bigramEntropy >= 7.0 ? 10 : 0;
  const moduleScore = perplexityScore1 + perplexityScore2;
  const details = {
    trigram: trigramEntropy.toFixed(1),
    bigram: bigramEntropy.toFixed(1),
    scores: {trigram: perplexityScore1, bigram: perplexityScore2}
  };
  return { moduleScore, details };
}