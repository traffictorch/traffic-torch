export function computeAntiAiSafety(mainText, variationScore) {
  const wordFreq = {};
  mainText.toLowerCase().split(/\s+/).forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const repeatedWords = Object.values(wordFreq).filter(c => c > 10).length;
  const sentencesArr = mainText.split(/[.!?]+/).filter(Boolean);
  const sentenceStarts = sentencesArr.map(s => s.trim().split(/\s+/)[0]?.toLowerCase() || '');
  const startFreq = {};
  sentenceStarts.forEach(s => startFreq[s] = (startFreq[s] || 0) + 1);
  const hasPredictable = Object.values(startFreq).some(c => c > 3);
  let antiAiSafety = 0;
  if (variationScore > 70) antiAiSafety += 50;
  if (repeatedWords <= 2) antiAiSafety += 30;
  if (!hasPredictable) antiAiSafety += 20;
  return {
    score: antiAiSafety,
    flags: {
      highBurstiness: variationScore > 70,
      lowRepetition: repeatedWords <= 2,
      noPredictable: !hasPredictable
    }
  };
}