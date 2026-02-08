export function computeRepetition(words) {
  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    const gram = words[i] + ' ' + words[i + 1];
    bigrams[gram] = (bigrams[gram] || 0) + 1;
  }
  const trigrams = {};
  for (let i = 0; i < words.length - 2; i++) {
    const gram = words.slice(i, i + 3).join(' ');
    trigrams[gram] = (trigrams[gram] || 0) + 1;
  }
  const maxBigram = Math.max(...Object.values(bigrams || {1:1}), 1);
  const maxTrigram = Math.max(...Object.values(trigrams || {1:1}), 1);
  const repetitionScore1 = maxBigram <= 3 ? 10 : 0;
  const repetitionScore2 = maxTrigram <= 2 ? 10 : 0;
  const moduleScore = repetitionScore1 + repetitionScore2;
  const details = {
    bigram: maxBigram,
    trigram: maxTrigram,
    scores: {bigram: repetitionScore1, trigram: repetitionScore2}
  };
  return { moduleScore, details };
}