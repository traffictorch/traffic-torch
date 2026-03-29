// ai-voice-search-tool/modules/ai-visibility.js
// Requires compromise.js CDN in index.html for NLP
export function computeAIVisibility(text, doc) {
  if (!text || text.length < 300) {
    // Reliability: Fallback for short/sparse content (e.g., landing pages)
    return {
      score: 20,
      details: {
        sov: 20,
        citationFreq: 20,
        presenceRate: 20,
        note: 'Insufficient text for reliable simulation. Add more content (300+ words) for accurate AI visibility estimate.',
        subMetrics: [
          { name: 'Share of Voice %', score: 20 },
          { name: 'Citation Frequency', score: 20 },
          { name: 'Presence Rate', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp; // compromise.js
    const parsedText = nlp(text);
    // Sub-metric 1: Share of Voice % (authority sim: entities + schema presence)
    const entities = parsedText.people().concat(parsedText.places()).concat(parsedText.organizations()).unique().out('array');
    const entityDensity = (entities.length / text.split(/\s+/).length) * 100; // % entities
    const schemaPresence = detectSchema(doc); // 0-100 based on types
    const sov = Math.min(100, Math.round((entityDensity * 2 + schemaPresence) / 3)); // Weighted; cap 100
    // Sub-metric 2: Citation Frequency (# potential citable elements: stats, quotes, internal citations)
    const statsCount = (text.match(/\d+(\.\d+)?(%|k|m|b)?/g) || []).length; // Numbers/percentages
    const quotesCount = (text.match(/"[^"]*"/g) || []).length; // Quoted text
    const internalCites = (text.match(/(source|cite|reference|according to)/gi) || []).length; // Heuristic phrases
    const citationFreq = Math.min(100, Math.round((statsCount + quotesCount + internalCites) / (text.length / 1000) * 10)); // Normalized per 1k chars
    // Sub-metric 3: Presence Rate (% paragraphs with direct, concise answers: 40-60 words, factual)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    let directAnswers = 0;
    paragraphs.forEach(p => {
      const wordCount = p.split(/\s+/).length;
      const isFactual = nlp(p).sentences().length > 0 && (p.match(/\d+/g) || []).length > 0; // Has sentences + facts
      if (wordCount >= 40 && wordCount <= 60 && isFactual) directAnswers++;
    });
    const presenceRate = paragraphs.length > 0 ? Math.round((directAnswers / paragraphs.length) * 100) : 0;
    // Overall score: Average, with boosts/fallbacks
    let score = Math.round((sov + citationFreq + presenceRate) / 3);
    // Site-type reliability: Boost for voice-friendly (e.g., FAQ schema + questions)
    if (schemaPresence > 50 && parsedText.questions().out('array').length > 0) score = Math.min(100, score + 10); // Voice AI favors Q&A
    // Ecom/news boost: If product/article schema, +5 (from research: structured data 2x citations)
    if (detectSiteType(doc) === 'ecom' || detectSiteType(doc) === 'news') score = Math.min(100, score + 5);
    return {
      score,
      details: {
        sov,
        citationFreq,
        presenceRate,
        subMetrics: [
  { 
    name: 'Share of Voice %', 
    score: sov,
    fix: 'Add more named entities (people, places, organizations) and implement relevant schema markup (FAQPage, Article, SpeakableSpecification) to increase authority signals for AI citations in voice responses.'
  },
  { 
    name: 'Citation Frequency', 
    score: citationFreq,
    fix: 'Incorporate more verifiable stats, quotes, and source references throughout the content to make sections more citable by AI assistants like Gemini and ChatGPT voice modes.'
  },
  { 
    name: 'Presence Rate', 
    score: presenceRate,
    fix: 'Rewrite key paragraphs to be concise (40-60 words), factual, and directly answer common questions to improve direct inclusion in zero-click voice answers.'
  }
]
      }
    };
  } catch (error) {
    // Reliability: Graceful error handling (e.g., NLP fail)
    return {
      score: 0,
      details: {
        sov: 0,
        citationFreq: 0,
        presenceRate: 0,
        note: 'Error in simulation. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Share of Voice %', score: 0 },
          { name: 'Citation Frequency', score: 0 },
          { name: 'Presence Rate', score: 0 }
        ]
      }
    };
  }
}
// Updated detectSchema – now checks both top-level @type AND nested speakable on WebPage/Article/Product
function detectSchema(doc) {
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let score = 0;

  schemaScripts.forEach(script => {
    try {
      const json = JSON.parse(script.textContent);

      // Top-level types (existing logic)
      if (json['@type'] === 'SpeakableSpecification' || 
          json['@type'] === 'FAQPage' || 
          json['@type'] === 'HowTo' || 
          json['@type'] === 'Article' || 
          json['@type'] === 'Product') {
        score += 25;
      }

      // NEW: Check nested speakable inside WebPage, Article, Product, etc.
      if (json['@type'] === 'WebPage' || json['@type'] === 'Article' || json['@type'] === 'Product') {
        if (json.speakable && json.speakable['@type'] === 'SpeakableSpecification') {
          score += 33; // Higher weight since it's explicitly voice-targeted
        }
      }

      // Bonus: If @graph array exists, check each item for SpeakableSpecification
      if (json['@graph'] && Array.isArray(json['@graph'])) {
        json['@graph'].forEach(item => {
          if (item['@type'] === 'SpeakableSpecification') {
            score += 33;
          }
          // Also check nested in graph items
          if (item.speakable && item.speakable['@type'] === 'SpeakableSpecification') {
            score += 33;
          }
        });
      }

    } catch (e) {
      // Silent fail on invalid JSON
    }
  });

  return Math.min(100, score); // Cap at 100
}
// Helper: Detect site type (heuristic for reliability across types)
function detectSiteType(doc) {
  if (doc.querySelector('[itemtype*="Product"]')) return 'ecom';
  if (doc.querySelector('article time[datetime]')) return 'news';
  return 'general'; // Default no boost
}