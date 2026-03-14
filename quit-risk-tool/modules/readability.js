function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  return (word.match(/[aeiouy]{1,2}/g) || []).length;
}

function countTotalSyllables(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.reduce((sum, w) => sum + countSyllables(w), 0);
}

export function calculateReadability(data) {
  let score = 55;
  let details = {};
  if (data.wordCount > 80) {
    const sentenceCount = (data.fullText.match(/[.!?]+/g) || []).length || 1;
    const avgSentenceLength = data.wordCount / sentenceCount;
    const syllableCount = countTotalSyllables(data.fullText);
    const avgSyllablesPerWord = syllableCount / data.wordCount;
    const fleschEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    const kincaidGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
    const paragraphCount = data.paragraphTexts.length || 1;
    const avgWordsPerParagraph = data.wordCount / paragraphCount;
    const scannability = Math.min(100, (data.boldCount * 5 + data.listItemCount * 3 + data.headingCount * 10) / (data.wordCount / 100 || 1));
    let paraDensityScore = 100;
    if (avgWordsPerParagraph > 120) paraDensityScore -= 40;
    else if (avgWordsPerParagraph > 80) paraDensityScore -= 20;
    let sentenceScore = 100 - (avgSentenceLength > 20 ? (avgSentenceLength - 20) * 5 : 0);
    sentenceScore = Math.max(40, Math.min(100, sentenceScore));
    const easeScore = Math.max(0, Math.min(100, fleschEase));
    const gradeScore = kincaidGrade <= 8 ? 100 : Math.max(0, 100 - (kincaidGrade - 8) * 10);
    score = Math.round((easeScore + gradeScore + sentenceScore + paraDensityScore + scannability) / 5);
    details = {
      fleschEase: Math.round(fleschEase),
      kincaidGrade: Math.round(kincaidGrade),
      avgSentence: Math.round(avgSentenceLength),
      avgParagraph: Math.round(avgWordsPerParagraph),
      scannability: Math.round(scannability)
    };
  }
  return { score, details };
}