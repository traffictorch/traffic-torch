export function computeVocabulary(words, wordCount) {
  const uniqueWords = new Set(words).size;
  const vocabDiversity = wordCount > 0 ? (uniqueWords / wordCount) * 100 : 50;
  const wordFreq = {};
  words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const hapax = Object.values(wordFreq).filter(c => c === 1).length;
  const rareWordRatio = wordCount > 0 ? (hapax / wordCount) * 100 : 10;
  const vocabScore = vocabDiversity >= 65 ? 10 : 0;
  const rareScore = rareWordRatio >= 15 ? 10 : 0;
  const moduleScore = vocabScore + rareScore;
  const details = {
    diversity: vocabDiversity.toFixed(1),
    rare: rareWordRatio.toFixed(1),
    scores: {diversity: vocabScore, rare: rareScore}
  };
  return { moduleScore, details };
}