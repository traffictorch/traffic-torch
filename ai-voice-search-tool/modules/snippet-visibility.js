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
          { name: 'Snippet Ownership %', score: snippetOwnership },
          { name: 'Zero-Click Share', score: zeroClickShare },
          { name: 'AI Overview Appearances', score: aiOverviewAppearances }
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
// Helper: Detect schema (regex/JSON parse for FAQ/HowTo/Speakable)
function detectSchema(doc) {
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let score = 0;
  schemaScripts.forEach(script => {
    try {
      const json = JSON.parse(script.textContent);
      if (json['@type'] === 'FAQPage' || json['@type'] === 'HowTo' || json['@type'] === 'SpeakableSpecification') {
        score += 33; // Boost per type; max ~100
      }
    } catch {}
  });
  return Math.min(100, score);
}
// Helper: Detect site type (heuristic for reliability)
function detectSiteType(doc) {
  if (doc.querySelector('article')) return 'blog';
  if (doc.querySelector('time[datetime]')) return 'news';
  if (doc.querySelector('[itemtype*="Product"]')) return 'ecom';
  return 'general'; // Default no boost
}