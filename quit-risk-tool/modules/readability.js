// quit-risk-tool/modules/readability.js — v2
//
// v2 change (DrKJING feedback, Oct 2026):
//   Flesch Reading Ease and Flesch-Kincaid are English syllable formulas.
//   Applied to non-English pages they produce nonsense — a German page with
//   perfectly normal prose reads as "Grade 22, needs urgent work".
//
//   Fix: lang-aware scoring. For languages with an adapted formula we use
//   that formula. For every other language we drop the vocabulary scores
//   (Flesch / FK) to N/A and score only on the three language-agnostic
//   structural signals: sentence length, paragraph density, scannability.
//
//   This is not a German special case — it's the general rule for any
//   language we can't honestly score with an English formula.

// ── Language detection ──
function normalizeLang(lang) {
  if (!lang) return 'und';
  const s = String(lang).trim().toLowerCase();
  return s.split(/[-_]/)[0] || 'und';
}

// ── Syllable counter — English default ──
function countSyllablesEnglish(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  return (word.match(/[aeiouy]{1,2}/g) || []).length;
}

// ── Language-specific syllable + word counters ──
// These are approximations tuned for the formula thresholds. Exactness is
// less important than consistency — the goal is that the same text scores
// the same regardless of which language page it lives on.
const SYLLABLE_COUNTERS = {
  en: countSyllablesEnglish,
  // German: count vowel clusters; umlauts and diphthongs count as one.
  de: (w) => {
    w = w.toLowerCase().replace(/[^a-zäöüß]/g, '');
    if (!w) return 1;
    return Math.max(1, (w.match(/[aeiouäöüy]+/g) || []).length);
  },
  // Spanish / Italian: same vowel-cluster rule works well.
  es: (w) => Math.max(1, (String(w).toLowerCase().match(/[aeiouáéíóúü]+/g) || []).length),
  it: (w) => Math.max(1, (String(w).toLowerCase().match(/[aeiouàèéìòù]+/g) || []).length),
  // French: count vowel clusters, but drop silent final 'e' as a first pass.
  fr: (w) => {
    w = String(w).toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿç]/g, '');
    if (!w) return 1;
    w = w.replace(/e$/, '');
    return Math.max(1, (w.match(/[aeiouyàâäéèêëîïôöùûü]+/g) || []).length);
  },
  // Dutch: vowel clusters, treat 'ij' as one syllable.
  nl: (w) => {
    w = String(w).toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 1;
    w = w.replace(/ij/g, 'y');
    return Math.max(1, (w.match(/[aeiouy]+/g) || []).length);
  },
  // Russian: count vowel letters (Cyrillic а, е, ё, и, о, у, ы, э, ю, я).
  ru: (w) => Math.max(1, (String(w).toLowerCase().match(/[аеёиоуыэюя]/g) || []).length),
};

function countSyllablesFor(lang, word) {
  const counter = SYLLABLE_COUNTERS[lang] || countSyllablesEnglish;
  return counter(word);
}

function countTotalSyllables(text, lang) {
  const words = String(text).trim().split(/\s+/).filter(w => w.length > 0);
  let total = 0;
  for (const w of words) total += countSyllablesFor(lang, w);
  return total;
}

// ── Language-specific readability formulas ──
// Only includes formulas with a published, citable basis.
// Each receives: avgSentenceLength, avgSyllablesPerWord.
// Returns null if the language has no formula we trust.
const FORMULAS = {
  en: {
    name: 'Flesch / Flesch-Kincaid',
    ease: (s, w) => 206.835 - 1.015 * s - 84.6 * w,
    grade: (s, w) => 0.39 * s + 11.8 * w - 15.59,
    easeGood: 60,      // ease >= 60 = plain English
    gradeMax: 10,      // grade <= 10 = ~high-school
  },
  de: {
    name: 'Amstad',
    // Amstad (1978): ease = 180 − ASL − 58.5 × ASW
    ease: (s, w) => 180 - s - 58.5 * w,
    // Grade equivalent: Amstad has a "Schulklasse" band, mapped here to a
    // US-grade-equivalent so the same threshold logic applies.
    grade: (s, w) => 0.20 * s + 6.5 * w - 4,
    easeGood: 50,      // Amstad 50+ ≈ "leicht"
    gradeMax: 10,
  },
  es: {
    name: 'Fernández-Huerta',
    // Fernández-Huerta (1959): ease = 206.84 − 0.60 × P − 1.02 × F
    // P = syllables per 100 words (× 100), F = sentences per 100 words
    // Equivalent form used here: ease = 206.84 − 60 × ASW − 102 / ASL
    ease: (s, w) => 206.84 - 60 * w - 102 / Math.max(s, 1),
    grade: (s, w) => 0.60 * (w * 100) + 1.02 * s,   // Szigriszt-Pazos grade proxy
    easeGood: 60,
    gradeMax: 10,
  },
  fr: {
    name: 'Kandel-Moles',
    // Kandel & Moles (1958): ease = 207 − 1.015 × ASL − 73.6 × ASW
    ease: (s, w) => 207 - 1.015 * s - 73.6 * w,
    grade: (s, w) => 0.39 * s + 11.8 * w - 15.59,   // Kincaid adapted
    easeGood: 60,
    gradeMax: 10,
  },
  it: {
    name: 'Flesch-Vacca',
    // Flesch-Vacca (1982): ease = 217 − 1.3 × ASL − 0.6 × ASW × 100
    ease: (s, w) => 217 - 1.3 * s - 0.6 * (w * 100),
    grade: (s, w) => 0.39 * s + 11.8 * w - 15.59,
    easeGood: 50,
    gradeMax: 10,
  },
  nl: {
    name: 'Douma',
    // Douma (1960): ease = 206.84 − 0.93 × ASL − 77 × ASW
    ease: (s, w) => 206.84 - 0.93 * s - 77 * w,
    grade: (s, w) => 0.39 * s + 11.8 * w - 15.59,
    easeGood: 60,
    gradeMax: 10,
  },
  ru: {
    name: 'Oborneva',
    // Oborneva (2006): ease = 206.835 − 1.3 × ASL − 60.1 × ASW
    ease: (s, w) => 206.835 - 1.3 * s - 60.1 * w,
    grade: (s, w) => 0.39 * s + 11.8 * w - 15.59,
    easeGood: 50,
    gradeMax: 10,
  },
};

// ── Main ──
export function calculateReadability(data) {
  let score = 55;
  let details = {};

  const lang = normalizeLang(data.htmlLang || data.lang);
  const formula = FORMULAS[lang] || null;

  const staticWordCount   = data.wordCount || 0;
  const renderedWordCount = data.renderedWordCount || 0;

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

    const rawSyllables = countTotalSyllables(data.fullText, lang);
    const syllableCount = rawSyllables / duplicationFactor;

    const avgSentenceLength   = effectiveWordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / effectiveWordCount;

    const paragraphCount = (data.paragraphTexts && data.paragraphTexts.length) || 1;
    const avgWordsPerParagraph = effectiveWordCount / paragraphCount;

    const scannabilityRaw =
      ((data.boldCount || 0) * 5 +
       (data.listItemCount || 0) * 3 +
       (data.headingCount || 0) * 10) /
      (effectiveWordCount / 100 || 1);
    const scannability = Math.min(100, Math.round(scannabilityRaw));

    let paraDensityScore = 100;
    if (avgWordsPerParagraph > 120)      paraDensityScore -= 40;
    else if (avgWordsPerParagraph > 80)  paraDensityScore -= 20;

    let sentenceScore = 100 - (
      avgSentenceLength > 20 ? (avgSentenceLength - 20) * 5 : 0
    );
    sentenceScore = Math.max(40, Math.min(100, sentenceScore));

    // ── Vocabulary scores: only if a trusted formula exists ──
    let easeScore   = null;
    let gradeScore  = null;
    let easeValue   = null;
    let gradeValue  = null;

    if (formula) {
      easeValue  = formula.ease(avgSentenceLength, avgSyllablesPerWord);
      gradeValue = formula.grade(avgSentenceLength, avgSyllablesPerWord);

      easeScore  = Math.max(0, Math.min(100, easeValue));
      gradeScore = gradeValue <= formula.gradeMax
        ? 100
        : Math.max(0, 100 - (gradeValue - formula.gradeMax) * 10);
    }

    // ── Profile selection ──
    // Technical profile: long pages, HTML-mode audits, and any page whose
    // language has no trusted formula. In that case we weight structure
    // only — the vocabulary half of the score would be dishonest.
    const isTechnical =
      data.auditMode === 'html' ||
      effectiveWordCount > 800 ||
      staticWordCount > 1200;

    if (!formula) {
      // No trusted formula for this language → structural-only scoring.
      score = Math.round(
        sentenceScore    * 0.35 +
        paraDensityScore * 0.30 +
        scannability     * 0.35
      );
    } else if (isTechnical) {
      score = Math.round(
        sentenceScore    * 0.35 +
        paraDensityScore * 0.30 +
        scannability     * 0.35
      );
    } else {
      score = Math.round(
        (easeScore + gradeScore + sentenceScore + paraDensityScore + scannability) / 5
      );
    }

    details = {
      lang,
      formula: formula ? formula.name : null,
      fleschEase:    easeValue  !== null ? Math.round(easeValue)  : null,
      kincaidGrade:  gradeValue !== null ? Math.round(gradeValue) : null,
      avgSentence:   Math.round(avgSentenceLength),
      avgParagraph:  Math.round(avgWordsPerParagraph),
      scannability,
      usedRenderedCount: useRendered,
      duplicationFactor: Math.round(duplicationFactor * 100) / 100,
      effectiveWordCount,
      profile: isTechnical ? 'technical' : 'general',
      notMeasured: formula ? [] : ['fleschEase', 'kincaidGrade'],
    };
  }

  return { score, details };
}