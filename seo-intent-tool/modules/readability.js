import { countSyllables, detectLang, fleschLike } from '/shared/readability-lang.js';

export function analyzeReadability(cleanedText) {
  if (!cleanedText) return { score: 0, normalized: 0, measured: false };

  const words     = cleanedText.split(' ').filter(w => w.length > 0).length || 1;
  const sentences = (cleanedText.match(/[.!?]+/g) || []).length || 1;
  const lang      = detectLang(cleanedText);
  const syllables = countSyllables(cleanedText, lang);

  const fr = fleschLike(words / sentences, syllables / words, lang);

  if (!fr.measured) {
    // No trusted formula — neutral instead of a false English verdict.
    return { score: 60, normalized: 75, measured: false, lang, formula: null };
  }

  const score = Math.round(fr.ease);
  const normalized = score >= 60 && score <= 70 ? 100 : (score >= 50 && score <= 80) ? 75 : 40;
  return { score, normalized, measured: true, lang, formula: fr.formula };
}