export function analyzeReadability(cleanedText) {
  const words     = cleanedText ? cleanedText.split(' ').filter(w => w.length > 0).length : 0;
  const sentences = cleanedText ? (cleanedText.match(/[.!?]+/g) || []).length || 1 : 1;
  const syllables = cleanedText ? cleanedText.split(' ').reduce((acc, word) => {
    const vowelGroups = (word.toLowerCase().match(/[aeiouy]+/g) || []).length;
    return acc + Math.max(vowelGroups, 1);
  }, 0) : 0;

  const score = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));

  const normalized = score >= 60 && score <= 70 ? 100 : (score >= 50 && score <= 80) ? 75 : 40;

  return { score, normalized };
}