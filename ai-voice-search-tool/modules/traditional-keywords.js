// ai-voice-search-tool/modules/traditional-keywords.js
// Requires compromise.js CDN in index.html for NLP

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

export function computeTraditionalKeywords(text) {
  if (!text || text.length < 300) {
    return {
      score: 20,
      details: {
        questionCoverage: 20,
        longTailUsage: 20,
        queryComplexity: 20,
        note: 'Insufficient text for reliable keyword simulation. Add more conversational phrases (300+ words) to boost traditional voice SEO score.',
        subMetrics: [
          { name: 'Question Coverage', score: 20 },
          { name: 'Long-Tail Phrase Usage', score: 20 },
          { name: 'Query Complexity Estimate', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp;
    const parsedText = nlp(text);
    const sentences = parsedText.sentences().out('array');
    const sentenceCount = sentences.length || 1;

    // Question Coverage — combines NLP question detection with raw '?' count
    const questions = parsedText.questions().out('array');
    const questionMarkCount = (text.match(/\?/g) || []).length;
    const byNlp = (questions.length / sentenceCount) * 100;
    const byMark = (questionMarkCount / sentenceCount) * 100;
    const questionCoverageRaw = Math.max(byNlp, byMark);
    // Target ~15% for full score
    const questionCoverage = clamp(Math.round(questionCoverageRaw * 6.5));

    // Long-Tail Phrase Usage — target 20% for full score
    const phrases = parsedText.clauses().out('array');
    const phraseCount = phrases.length || 1;
    const longTails = phrases.filter(p => p.split(/\s+/).length >= 4).length;
    const longTailUsageRaw = (longTails / phraseCount) * 100;
    const longTailUsage = clamp(Math.round(longTailUsageRaw * 5));

    // Query Complexity Estimate
    const avgPhraseLength = phraseCount
      ? phrases.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / phraseCount
      : 0;
    const commonality = estimateCommonality(text);
    const queryComplexity = clamp(Math.round((avgPhraseLength * 10) + (100 - commonality)));

    const score = clamp(Math.round((questionCoverage + longTailUsage + queryComplexity) / 3));

    return {
      score,
      details: {
        questionCoverage,
        longTailUsage,
        queryComplexity,
        subMetrics: [
          {
            name: 'Question Coverage',
            score: questionCoverage,
            fix: 'Add more question-based sentences and phrases ("how to", "what is", "best way to") to match natural voice search queries.'
          },
          {
            name: 'Long-Tail Phrase Usage',
            score: longTailUsage,
            fix: 'Increase use of 4+ word phrases and natural long-tail expressions throughout the content to improve voice ranking potential.'
          },
          {
            name: 'Query Complexity Estimate',
            score: queryComplexity,
            fix: 'Focus on longer, specific phrases with lower competition to target high-intent voice searches more effectively.'
          }
        ]
      }
    };
  } catch (error) {
    return {
      score: 0,
      details: {
        questionCoverage: 0,
        longTailUsage: 0,
        queryComplexity: 0,
        note: 'Error in simulation. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Question Coverage', score: 0 },
          { name: 'Long-Tail Phrase Usage', score: 0 },
          { name: 'Query Complexity Estimate', score: 0 }
        ]
      }
    };
  }
}

function estimateCommonality(text) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'to', 'in', 'of', 'for', 'on', 'with', 'at', 'by', 'from'];
  const words = text.toLowerCase().split(/\s+/);
  const commonCount = words.filter(w => commonWords.includes(w)).length;
  return (commonCount / words.length) * 100;
}