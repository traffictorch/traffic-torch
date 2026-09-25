// quit-risk-tool/modules/readability.js
// Readability scoring.
//
// Fixes applied:
//   • The static text extractor in script-v1.3.js walks nested container
//     elements (p, li, article, section, main, div), so fullText contains
//     each paragraph several times. That inflates wordCount and sentence
//     counts and quietly distorts Flesch scores.
//   • The qr-full-render-worker supplies a real `renderedWordCount`
//     (visible text from the live browser). We use it as ground truth
//     and scale sentence/syllable counts by the observed duplication
//     factor: staticWordCount / renderedWordCount.
//   • Paragraph density now uses renderedWordCount when available, since
//     data.paragraphTexts only contains each <p> once (no duplication).

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

  // ── Decide which word count to trust ──────────────────────────────
  const staticWordCount = data.wordCount || 0;
  const renderedWordCount = data.renderedWordCount || 0;

  // Only use renderedWordCount when it's meaningfully smaller than the
  // static count — that signals the nested-duplication bug is present.
  // If they're close, the page simply has little nested text and we can
  // safely use the static count (which includes things like <li> text
  // that innerText may collapse).
  const useRendered = renderedWordCount > 80 &&
                      staticWordCount > 0 &&
                      renderedWordCount < staticWordCount * 0.85;

  const effectiveWordCount = useRendered ? renderedWordCount : staticWordCount;
  const duplicationFactor = useRendered
    ? Math.max(1, staticWordCount / renderedWordCount)
    : 1;

  if (effectiveWordCount > 80 && data.fullText) {
    // Static sentence count from the (duplicated) fullText.
    const rawSentenceCount = (data.fullText.match(/[.!?]+/g) || []).length || 1;
    const sentenceCount = Math.max(1, Math.round(rawSentenceCount / duplicationFactor));

    // Static syllable count from the (duplicated) fullText.
    const rawSyllables = countTotalSyllables(data.fullText);
    const syllableCount = rawSyllables / duplicationFactor;

    const avgSentenceLength = effectiveWordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / effectiveWordCount;

    const fleschEase = 206.835
      - 1.015 * avgSentenceLength
      - 84.6 * avgSyllablesPerWord;

    const kincaidGrade = 0.39 * avgSentenceLength
      + 11.8 * avgSyllablesPerWord
      - 15.59;

    // Paragraphs are captured once per <p> in getUXContent, so no
    // duplication there — but the previous code divided wordCount by
    // paragraphCount, which was itself inflated. Use effectiveWordCount.
    const paragraphCount = data.paragraphTexts.length || 1;
    const avgWordsPerParagraph = effectiveWordCount / paragraphCount;

    // Scannability: bold + list items + headings, normalised per 100 words.
    // Use effectiveWordCount so the denominator isn't inflated either.
    const scannabilityRaw =
      (data.boldCount * 5 + data.listItemCount * 3 + data.headingCount * 10) /
      (effectiveWordCount / 100 || 1);
    const scannability = Math.min(100, Math.round(scannabilityRaw));

    let paraDensityScore = 100;
    if (avgWordsPerParagraph > 120) paraDensityScore -= 40;
    else if (avgWordsPerParagraph > 80) paraDensityScore -= 20;

    let sentenceScore = 100 - (avgSentenceLength > 20 ? (avgSentenceLength - 20) * 5 : 0);
    sentenceScore = Math.max(40, Math.min(100, sentenceScore));

    const easeScore = Math.max(0, Math.min(100, fleschEase));
    const gradeScore = kincaidGrade <= 8 ? 100 : Math.max(0, 100 - (kincaidGrade - 8) * 10);

    score = Math.round(
      (easeScore + gradeScore + sentenceScore + paraDensityScore + scannability) / 5
    );

    details = {
      fleschEase: Math.round(fleschEase),
      kincaidGrade: Math.round(kincaidGrade),
      avgSentence: Math.round(avgSentenceLength),
      avgParagraph: Math.round(avgWordsPerParagraph),
      scannability,
      // Diagnostic fields — handy in the browser console when debugging
      usedRenderedCount: useRendered,
      duplicationFactor: Math.round(duplicationFactor * 100) / 100,
      effectiveWordCount,
    };
  }

  return { score, details };
}