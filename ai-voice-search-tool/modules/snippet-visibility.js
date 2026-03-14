// ai-voice-search-tool/modules/snippet-visibility.js
// Requires compromise.js CDN in index.html for NLP
export function computeSnippetVisibility(text, doc) {
  if (!text || text.length < 300) {
    // Reliability: Fallback for short/sparse content (e.g., landing pages without structures)
    return {
      score: 20,
      details: {
        snippetOwnership: 20,
        zeroClickShare: 20,
        aiOverviewAppearances: 20,
        note: 'Insufficient content for reliable snippet simulation. Add structured sections (lists/tables under headings) to boost AI/voice visibility.',
        subMetrics: [
          { name: 'Snippet Ownership %', score: 20 },
          { name: 'Zero-Click Share', score: 20 },
          { name: 'AI Overview Appearances', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp; // compromise.js
    const parsedText = nlp(text);
    // Sub-metric 1: Snippet Ownership % (eligible formats: lists/tables under question-headings)
    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    let questionHeadings = 0;
    let structuredUnder = 0;
    headings.forEach(h => {
      const hText = h.textContent.trim();
      if (nlp(hText).questions().out('array').length > 0) questionHeadings++;
      const nextSib = h.nextElementSibling;
      if (nextSib && (nextSib.tagName === 'UL' || nextSib.tagName === 'OL' || nextSib.tagName === 'TABLE')) structuredUnder++;
    });
    const snippetOwnership = headings.length > 0 ? Math.round(((questionHeadings + structuredUnder) / headings.length) * 100) : 0;
    // Sub-metric 2: Zero-Click Share (sim % direct, concise answers: 40-60 word paras with facts)
    const paragraphs = doc.querySelectorAll('p');
    let directParas = 0;
    paragraphs.forEach(p => {
      const pText = p.textContent.trim();
      const wordCount = pText.split(/\s+/).length;
      const hasFacts = (pText.match(/\d+/g) || []).length > 0 || nlp(pText).questions().out('array').length > 0;
      if (wordCount >= 40 && wordCount <= 60 && hasFacts) directParas++;
    });
    const zeroClickShare = paragraphs.length > 0 ? Math.round((directParas / paragraphs.length) * 100) : 0;
    // Sub-metric 3: AI Overview Appearances (schema presence + structure score for AI extraction)
    const schemaScore = detectSchema(doc); // 0-100, focus FAQ/HowTo/Speakable
    const structureScore = Math.min(100, (structuredUnder * 10) + (questionHeadings * 5)); // Weighted
    const aiOverviewAppearances = Math.round((schemaScore + structureScore) / 2);
    // Overall score: Average, with boosts/fallbacks
    let score = Math.round((snippetOwnership + zeroClickShare + aiOverviewAppearances) / 3);
    // Site-type reliability: Boost for snippet-friendly (e.g., blogs/news with questions/lists)
    const questions = parsedText.questions().out('array').length;
    if (questions > 5 || detectSiteType(doc) === 'news' || detectSiteType(doc) === 'blog') score = Math.min(100, score + 10); // Per research: Higher for informational
    // Penalize unstructured (e.g., ecom without HowTo)
    if (structuredUnder < 1) score = Math.max(0, score - 10);
    return {
      score,
      details: {
        snippetOwnership,
        zeroClickShare,
        aiOverviewAppearances,
        subMetrics: [
  { 
    name: 'Snippet Ownership %', 
    score: snippetOwnership,
    fix: 'Add question-based H2/H3 headings followed by ordered/unordered lists or tables to increase eligibility for featured snippets and voice readout.'
  },
  { 
    name: 'Zero-Click Share', 
    score: zeroClickShare,
    fix: 'Write concise, factual paragraphs (40-60 words) that directly answer user questions to improve chances of zero-click voice answers.'
  },
  { 
    name: 'AI Overview Appearances', 
    score: aiOverviewAppearances,
    fix: 'Implement FAQPage, HowTo, or SpeakableSpecification schema to make content more extractable for AI Overviews and voice summaries.'
  }
]
      }
    };
  } catch (error) {
    // Reliability: Graceful error handling (e.g., DOM/NLP fail)
    console.error('Snippet Visibility computation error:', error);
    return {
      score: 0,
      details: {
        snippetOwnership: 0,
        zeroClickShare: 0,
        aiOverviewAppearances: 0,
        note: 'Error in simulation. Ensure compromise.js loaded and page has parseable structure.',
        subMetrics: [
          { name: 'Snippet Ownership %', score: 0 },
          { name: 'Zero-Click Share', score: 0 },
          { name: 'AI Overview Appearances', score: 0 }
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
// Helper: Detect site type (heuristic for reliability)
function detectSiteType(doc) {
  if (doc.querySelector('article')) return 'blog';
  if (doc.querySelector('time[datetime]')) return 'news';
  if (doc.querySelector('[itemtype*="Product"]')) return 'ecom';
  return 'general'; // Default no boost
}