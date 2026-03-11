// ai-voice-search-tool/modules/sentiment-quality.js
// Requires compromise.js CDN in index.html for NLP
// Predefined word lists for reliability (expanded from research: positive/neutral for voice trust)
const positiveWords = ['excellent', 'great', 'positive', 'best', 'reliable', 'trustworthy', 'helpful', 'accurate', 'recommended']; // Add more from benchmarks
const negativeWords = ['bad', 'poor', 'negative', 'worst', 'unreliable', 'inaccurate', 'confusing', 'misleading'];
export function computeSentimentQuality(text) {
  if (!text || text.length < 300) {
    // Reliability: Fallback for short/sparse content (e.g., minimal review sites)
    return {
      score: 20,
      details: {
        sentimentScore: 20,
        hallucinationRisk: 20,
        mentionSentiment: 20,
        note: 'Insufficient text for reliable sentiment analysis. Add more factual, neutral content to improve AI voice quality score.',
        subMetrics: [
          { name: 'Sentiment Score', score: 20 },
          { name: 'Hallucination Risk', score: 20 },
          { name: 'Mention Sentiment', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp; // compromise.js
    const parsedText = nlp(text);
    // Sub-metric 1: Sentiment Score (pos/neg %; ideal >70% positive/neutral for voice)
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const posCount = words.filter(w => positiveWords.includes(w)).length;
    const negCount = words.filter(w => negativeWords.includes(w)).length;
    const sentimentRaw = (posCount - negCount) / words.length * 100; // Net positive %
    const sentimentScore = Math.min(100, Math.max(0, Math.round(50 + sentimentRaw))); // Normalize 0-100, bias neutral/high
    // Sub-metric 2: Hallucination Risk (entity consistency %; low mismatches = low risk)
    const entities = parsedText.people().concat(parsedText.places()).concat(parsedText.organizations()).unique().out('array');
    const sentences = parsedText.sentences().out('array');
    let inconsistencies = 0;
    sentences.forEach(s => {
      const sEntities = nlp(s).people().concat(nlp(s).places()).concat(nlp(s).organizations()).unique().out('array');
      const speculative = (s.match(/may|might|possible/gi) || []).length;
      if (sEntities.length > 0 && speculative > 0) inconsistencies++;
    });
    const hallucinationRiskRaw = inconsistencies / sentences.length * 100;
    const hallucinationRisk = Math.min(100, Math.round(100 - hallucinationRiskRaw)); // Invert: High consistency = high score
    // Sub-metric 3: Mention Sentiment (simulated tone in brand/context mentions; positive bias)
    const brandMentions = detectBrandMentions(text, parsedText); // Helper: Assume site brand from context
    let mentionTone = 0;
    brandMentions.forEach(m => {
      const context = nlp(m.context);
      const posInContext = context.match(positiveWords.join('|')).out('array').length;
      const negInContext = context.match(negativeWords.join('|')).out('array').length;
      mentionTone += (posInContext - negInContext);
    });
    const mentionSentiment = brandMentions.length > 0 ? Math.min(100, Math.round(50 + (mentionTone / brandMentions.length * 10))) : 50; // Neutral default
    // Overall score: Average, with boosts/fallbacks
    let score = Math.round((sentimentScore + hallucinationRisk + mentionSentiment) / 3);
    // Site-type reliability: Boost for positive-heavy (e.g., ecom reviews)
    if (detectSiteType(text) === 'ecom' && sentimentScore > 70) score = Math.min(100, score + 10); // Per research: Positive boosts citations
    // Penalize high negative (e.g., news with controversy)
    if (negCount > posCount) score = Math.max(0, score - 10); // Ensure neutral/positive for voice
    return {
      score,
      details: {
        sentimentScore,
        hallucinationRisk,
        mentionSentiment,
        subMetrics: [
          { name: 'Sentiment Score', score: sentimentScore },
          { name: 'Hallucination Risk', score: hallucinationRisk },
          { name: 'Mention Sentiment', score: mentionSentiment }
        ]
      }
    };
  } catch (error) {
    // Reliability: Graceful error handling (e.g., NLP fail)
    console.error('Sentiment Quality computation error:', error);
    return {
      score: 0,
      details: {
        sentimentScore: 0,
        hallucinationRisk: 0,
        mentionSentiment: 0,
        note: 'Error in analysis. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Sentiment Score', score: 0 },
          { name: 'Hallucination Risk', score: 0 },
          { name: 'Mention Sentiment', score: 0 }
        ]
      }
    };
  }
}
// Helper: Detect brand mentions (heuristic: capitalized nouns near positive/neg)
function detectBrandMentions(text, parsed) {
  const potentialBrands = parsed.nouns().filter(n => n.text().match(/^[A-Z]/)).out('array');
  return potentialBrands.map(brand => ({
    brand,
    context: text.substring(Math.max(0, text.indexOf(brand) - 50), text.indexOf(brand) + 50) // 50 char context
  }));
}
// Helper: Detect site type (heuristic for reliability, text-based)
function detectSiteType(text) {
  if (text.match(/product|buy|price/gi)) return 'ecom';
  if (text.match(/news|article|report/gi)) return 'news';
  return 'general'; // Default no boost
}