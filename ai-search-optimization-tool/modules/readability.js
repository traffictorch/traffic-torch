export function computeReadability(mainText) {
  const words = mainText.split(/\s+/).filter(Boolean).length || 1;
  const sentences = (mainText.match(/[.!?]+/g) || []).length || 1;
  const syllables = mainText.split(/\s+/).reduce((a, w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
  const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const sentencesArr = mainText.split(/[.!?]+/).filter(Boolean);
  const lengths = sentencesArr.map(s => s.split(/\s+/).length);
  let variationScore = 50;
  if (lengths.length >= 3) {
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
    variationScore = Math.min(100, variance > 50 ? 100 : variance > 40 ? 95 : variance > 20 ? 80 : variance > 10 ? 60 : 40);
  }
  const passivePatterns = mainText.match(/\b(is|are|was|were|been|be|being|am|gets|got|has been|have been)\b.*?\b(by|using|with|through|of|from|to|for)\b/gi) || [];
  const passivePenalty = Math.max(0, 20 - (passivePatterns.length * 2));
  const complexWords = mainText.split(/\s+/).filter(w => w.length > 10 || (w.match(/[aeiouy]+/gi) || []).length >= 4).length;
  const complexRatio = words > 0 ? (complexWords / words) * 100 : 0;
  let readability = 0;
  if (flesch > 70) readability += 45;
  else if (flesch > 60) readability += 35;
  else if (flesch > 50) readability += 20;
  if (variationScore > 80) readability += 25;
  else if (variationScore > 60) readability += 15;
  readability += passivePenalty;
  if (complexRatio < 12) readability += 20;
  else if (complexRatio < 18) readability += 12;
  else if (complexRatio < 25) readability += 5;
  return {
    score: readability,
    flags: {
      goodFlesch: flesch > 60,
      naturalVariation: variationScore > 70,
      lowPassive: passivePatterns.length < 5,
      lowComplex: complexRatio < 15
    },
    variationScore,
    words
  };
}