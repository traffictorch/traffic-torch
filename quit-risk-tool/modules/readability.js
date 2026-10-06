// quit-risk-tool/modules/readability.js
// Readability scoring.
//
// Tuning applied:
//   • Adds a "technical" profile for long B2B/tooling pages and for
//     HTML-mode audits. In that profile we weight structural signals
//     (sentence length, paragraph density, scannability) higher and
//     let Flesch/FK vocabulary penalties pull less. This stops pages
//     about SEO/UX/AI from being punished purely for accurate
//     technical vocabulary.

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

  const staticWordCount   = data.wordCount || 0;
  const renderedWordCount = data.renderedWordCount || 0;

  // Only trust renderedWordCount when it is meaningfully smaller than
  // the static count (indicates nested-duplication in the extractor).
  const useRendered =
    renderedWordCount > 80 &&
    staticWordCount > 0 &&
    renderedWordCount < staticWordCount * 0.85;

  const effectiveWordCount = useRendered ? renderedWordCount : staticWordCount;
  const duplicationFactor = useRendered
    ? Math.max(1, staticWordCount / renderedWordCount)
    : 1;

  if (effectiveWordCount > 80 && data.fullText) {
    const rawSentenceCount =
      (data.fullText.match(/[.!?]+/g) || []).length || 1;
    const sentenceCount = Math.max(
      1,
      Math.round(rawSentenceCount / duplicationFactor)
    );

    const rawSyllables = countTotalSyllables(data.fullText);
    const syllableCount = rawSyllables / duplicationFactor;

    const avgSentenceLength  = effectiveWordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / effectiveWordCount;

    const fleschEase =
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    const kincaidGrade =
      0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    const paragraphCount = data.paragraphTexts.length || 1;
    const avgWordsPerParagraph = effectiveWordCount / paragraphCount;

    const scannabilityRaw =
      (data.boldCount * 5 + data.listItemCount * 3 + data.headingCount * 10) /
      (effectiveWordCount / 100 || 1);
    const scannability = Math.min(100, Math.round(scannabilityRaw));

    let paraDensityScore = 100;
    if (avgWordsPerParagraph > 120)      paraDensityScore -= 40;
    else if (avgWordsPerParagraph > 80)  paraDensityScore -= 20;

    let sentenceScore = 100 - (
      avgSentenceLength > 20 ? (avgSentenceLength - 20) * 5 : 0
    );
    sentenceScore = Math.max(40, Math.min(100, sentenceScore));

    const easeScore  = Math.max(0, Math.min(100, fleschEase));
    const gradeScore = kincaidGrade <= 8
      ? 100
      : Math.max(0, 100 - (kincaidGrade - 8) * 10);

    // ── Profile selection ──────────────────────────────────────────
    // Technical profile: SEO/UX/AI tooling pages, long pages, and all
    // HTML-mode audits. Flesch/FK vocabulary penalties hit legitimate
    // technical copy far too hard otherwise.
    const isTechnical =
      data.auditMode === 'html' ||
      effectiveWordCount > 800 ||
      staticWordCount > 1200;

    if (isTechnical) {
      score = Math.round(
        sentenceScore   * 0.35 +
        paraDensityScore * 0.30 +
        scannability    * 0.35
      );
    } else {
      score = Math.round(
        (easeScore + gradeScore + sentenceScore + paraDensityScore + scannability) / 5
      );
    }

    details = {
      fleschEase:        Math.round(fleschEase),
      kincaidGrade:      Math.round(kincaidGrade),
      avgSentence:       Math.round(avgSentenceLength),
      avgParagraph:      Math.round(avgWordsPerParagraph),
      scannability,
      usedRenderedCount: useRendered,
      duplicationFactor: Math.round(duplicationFactor * 100) / 100,
      effectiveWordCount,
      profile: isTechnical ? 'technical' : 'general',
      notMeasured: [],
    };
  }

  return { score, details };
}