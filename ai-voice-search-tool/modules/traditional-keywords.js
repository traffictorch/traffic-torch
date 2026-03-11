// ai-voice-search-tool/modules/traditional-keywords.js
// Requires compromise.js CDN in index.html for NLP
export function computeTraditionalKeywords(text) {
  if (!text || text.length < 300) {
    // Reliability: Fallback for short/sparse content (e.g., ecom pages with minimal text)
    return {
      score: 20,
      details: {
        convRankings: 20,
        longTailDensity: 20,
        queryVolDiff: 20,
        note: 'Insufficient text for reliable keyword simulation. Add more conversational phrases (300+ words) to boost traditional voice SEO score.',
        subMetrics: [
          { name: 'Conversational Rankings Sim', score: 20 },
          { name: 'Long-Tail Density', score: 20 },
          { name: 'Query Volume/Difficulty', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp; // compromise.js
    const parsedText = nlp(text);
    // Sub-metric 1: Conversational Rankings Sim (% question-based phrases; >10% ideal for voice)
    const questions = parsedText.questions().out('array');
    const sentences = parsedText.sentences().out('array');
    const convRankingsRaw = (questions.length / sentences.length) * 100;
    const convRankings = Math.min(100, Math.round(convRankingsRaw * 10)); // Scale; high questions = high sim rankings
    // Sub-metric 2: Long-Tail Density (% phrases 4+ words; >5% ideal)
    const phrases = parsedText.clauses().out('array'); // Approximate long-tails
    const longTails = phrases.filter(p => p.split(/\s+/).length >= 4).length;
    const longTailDensityRaw = (longTails / phrases.length) * 100;
    const longTailDensity = Math.min(100, Math.round(longTailDensityRaw * 20)); // >5% → full points
    // Sub-metric 3: Query Volume/Difficulty (rule-based sim: longer phrases=lower diff/higher volume potential)
    const avgPhraseLength = phrases.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / phrases.length;
    const commonality = estimateCommonality(text); // Helper: Low for unique words = low diff
    const queryVolDiff = Math.min(100, Math.round((avgPhraseLength * 10) + (100 - commonality))); // Long + unique = high score
    // Overall score: Average, with boosts/fallbacks
    let score = Math.round((convRankings + longTailDensity + queryVolDiff) / 3);
    // Site-type reliability: Boost for question-heavy (e.g., blogs/news)
    if (questions.length > 10 || detectSiteType(text) === 'blog' || detectSiteType(text) === 'news') score = Math.min(100, score + 10); // Per research: Boosts voice rankings
    // Penalize short phrases (e.g., ecom lists)
    if (avgPhraseLength < 4) score = Math.max(0, score - 10);
    return {
      score,
      details: {
        convRankings,
        longTailDensity,
        queryVolDiff,
        subMetrics: [
          { name: 'Conversational Rankings Sim', score: convRankings },
          { name: 'Long-Tail Density', score: longTailDensity },
          { name: 'Query Volume/Difficulty', score: queryVolDiff }
        ]
      }
    };
  } catch (error) {
    // Reliability: Graceful error handling (e.g., NLP fail)
    console.error('Traditional Keywords computation error:', error);
    return {
      score: 0,
      details: {
        convRankings: 0,
        longTailDensity: 0,
        queryVolDiff: 0,
        note: 'Error in simulation. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Conversational Rankings Sim', score: 0 },
          { name: 'Long-Tail Density', score: 0 },
          { name: 'Query Volume/Difficulty', score: 0 }
        ]
      }
    };
  }
}
// Helper: Estimate commonality (high % common words = high diff/low volume sim)
function estimateCommonality(text) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'to', 'in', 'of']; // Expand from benchmarks
  const words = text.toLowerCase().split(/\s+/);
  const commonCount = words.filter(w => commonWords.includes(w)).length;
  return (commonCount / words.length) * 100; // High common = high diff
}
// Helper: Detect site type (heuristic for reliability, text-based)
function detectSiteType(text) {
  if (text.match(/blog|article|how to/gi)) return 'blog';
  if (text.match(/news|report|update/gi)) return 'news';
  if (text.match(/product|buy|price/gi)) return 'ecom';
  return 'general'; // Default no boost
}