// ai-voice-search-tool/modules/content-quality.js
// Requires compromise.js CDN in index.html for NLP
export function computeContentQuality(text) {
  if (!text || text.length < 300) {
    // Reliability: Fallback for short/sparse content (e.g., ecom product pages)
    return {
      score: 20,
      details: {
        readability: 20,
        conciseness: 20,
        pronounRatio: 20,
        entityCoverage: 20,
        note: 'Insufficient text for reliable assessment. Add more descriptive content (300+ words) to improve AI voice optimization score.',
        subMetrics: [
          { name: 'Readability Score', score: 20 },
          { name: 'Answer Conciseness', score: 20 },
          { name: 'Pronoun Ratio', score: 20 },
          { name: 'Entity Coverage', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp; // compromise.js
    const parsedText = nlp(text);
    // Sub-metric 1: Readability Score (Flesch-Kincaid approx: words/sentences/syllables)
    const sentences = parsedText.sentences().out('array');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0); // Helper below
    const flesch = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    const readability = Math.min(100, Math.max(0, Math.round((flesch / 100) * 100))); // Normalize 0-100 (ideal 60-70 → high score)
    // Sub-metric 2: Answer Conciseness (avg sentence words; ideal 40-60 for voice)
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    const conciseness = Math.min(100, Math.max(0, Math.round(100 - Math.abs(avgLength - 50) * 2))); // Peak at 50, drop off, min 0
    // Sub-metric 3: Pronoun Ratio (% for conversational tone)
    const pronouns = parsedText.pronouns().out('array').length;
    const pronounRatioRaw = (pronouns / words.length) * 100;
    const pronounRatio = Math.min(100, Math.round(pronounRatioRaw * 20)); // Scale; >5% ideal → full points
    // Sub-metric 4: Entity Coverage (% named entities for authority)
    const entities = parsedText.people().concat(parsedText.places()).concat(parsedText.organizations()).unique().out('array');
    const entityCoverageRaw = (entities.length / words.length) * 100;
    const entityCoverage = Math.min(100, Math.round(entityCoverageRaw * 33.3)); // >3% ideal → full points
    // Overall score: Average, with boosts/fallbacks
    let score = Math.round((readability + conciseness + pronounRatio + entityCoverage) / 4);
    // Site-type reliability: Boost for voice-friendly (e.g., questions/FAQs)
    const questions = parsedText.questions().out('array').length;
    if (questions > 5) score = Math.min(100, score + 10); // FAQs boost AI/voice per research
    // Penalize jargon-heavy (low readability) for ecom/news reliability
    if (readability < 50) score = Math.max(0, score - 10); // Ensure simple language
    return {
      score,
      details: {
        readability,
        conciseness,
        pronounRatio,
        entityCoverage,
        subMetrics: [
  { 
    name: 'Readability Score', 
    score: readability,
    fix: 'Aim for Flesch-Kincaid grade 6-8 by shortening sentences, using simpler words, and breaking up complex ideas to make content easier for AI voice synthesis and natural readout.'
  },
  { 
    name: 'Answer Conciseness', 
    score: conciseness,
    fix: 'Keep direct-answer paragraphs between 40-60 words; split long sentences and remove unnecessary details to match the ideal length for featured snippets and voice responses.'
  },
  { 
    name: 'Pronoun Ratio', 
    score: pronounRatio,
    fix: 'Increase first/second-person pronouns ("I", "you", "we") to create a more conversational tone that aligns with how people speak in voice queries.'
  },
  { 
    name: 'Entity Coverage', 
    score: entityCoverage,
    fix: 'Add more named entities (people, places, brands, organizations) related to your topic to boost E-E-A-T signals and improve AI recognition/citation in voice results.'
  }
]
      }
    };
  } catch (error) {
    // Reliability: Graceful error handling (e.g., NLP fail)
    console.error('Content Quality computation error:', error);
    return {
      score: 0,
      details: {
        readability: 0,
        conciseness: 0,
        pronounRatio: 0,
        entityCoverage: 0,
        note: 'Error in assessment. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Readability Score', score: 0 },
          { name: 'Answer Conciseness', score: 0 },
          { name: 'Pronoun Ratio', score: 0 },
          { name: 'Entity Coverage', score: 0 }
        ]
      }
    };
  }
}
// Helper: Approximate syllable count (simple regex for reliability)
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  return (word.match(/[aeiouy]{1,2}/g) || []).length || 1;
}