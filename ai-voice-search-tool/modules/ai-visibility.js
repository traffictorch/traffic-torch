// ai-voice-search-tool/modules/ai-visibility.js
// Requires compromise.js CDN in index.html for NLP

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

export function computeAIVisibility(text, doc) {
  if (!text || text.length < 300) {
    return {
      score: 20,
      details: {
        citationPotential: 20,
        citableFreq: 20,
        directAnswerRate: 20,
        note: 'Insufficient text for reliable simulation. Add more content (300+ words) for accurate AI visibility estimate.',
        subMetrics: [
          { name: 'Citation Potential', score: 20 },
          { name: 'Citable Element Frequency', score: 20 },
          { name: 'Direct Answer Rate', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp;
    const parsedText = nlp(text);
    const wordArray = text.split(/\s+/).filter(w => w.length > 0);

    // Sub-metric 1: Citation Potential — schema 50% + entities 50%
    const entities = parsedText.people().concat(parsedText.places()).concat(parsedText.organizations()).unique().out('array');
    const entityDensity = wordArray.length ? (entities.length / wordArray.length) * 100 : 0;
    const schemaPresence = detectSchema(doc);
    const entityComponent = Math.min(100, entityDensity * 20);
    const citationPotential = clamp(Math.round(schemaPresence * 0.5 + entityComponent * 0.5));

    // Sub-metric 2: Citable Element Frequency
    const statsCount = (text.match(/\d+(\.\d+)?(%|k|m|b)?/g) || []).length;
    const quotesCount = (text.match(/"[^"]*"/g) || []).length;
    const internalCites = (text.match(/(source|cite|reference|according to)/gi) || []).length;
    const citableFreq = clamp(Math.round((statsCount + quotesCount + internalCites) / (text.length / 1000) * 10));

    // Sub-metric 3: Direct Answer Rate
    // NOTE: text must contain paragraph breaks (\n\n) — preserved by script-v1.1.js
    const paragraphs = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 40);

    let directAnswers = 0;
    paragraphs.forEach(p => {
      const wc = p.split(/\s+/).length;
      const hasSentenceEnders = (p.match(/[.!?]/g) || []).length >= 1;
      const isFactual =
        (p.match(/\d+/g) || []).length > 0 ||
        nlp(p).questions().out('array').length > 0 ||
        /\b(is|are|was|were|means|refers|represents|provides|offers|delivers|helps|lets)\b/i.test(p);

      if (wc >= 40 && wc <= 60 && hasSentenceEnders && isFactual) directAnswers++;
    });

    const directAnswerRate = paragraphs.length > 0
      ? clamp(Math.round((directAnswers / paragraphs.length) * 100))
      : 0;

    const score = clamp(Math.round((citationPotential + citableFreq + directAnswerRate) / 3));

    return {
      score,
      details: {
        citationPotential,
        citableFreq,
        directAnswerRate,
        subMetrics: [
          {
            name: 'Citation Potential',
            score: citationPotential,
            fix: 'Add more named entities (people, places, organizations) and implement relevant schema markup (FAQPage, Article, SpeakableSpecification) to increase authority signals for AI citations in voice responses.'
          },
          {
            name: 'Citable Element Frequency',
            score: citableFreq,
            fix: 'Incorporate more verifiable stats, quotes, and source references throughout the content to make sections more citable by AI assistants like Gemini and ChatGPT voice modes.'
          },
          {
            name: 'Direct Answer Rate',
            score: directAnswerRate,
            fix: 'Rewrite key paragraphs to be concise (40-60 words), factual, and directly answer common questions to improve direct inclusion in zero-click voice answers.'
          }
        ]
      }
    };
  } catch (error) {
    return {
      score: 0,
      details: {
        citationPotential: 0,
        citableFreq: 0,
        directAnswerRate: 0,
        note: 'Error in simulation. Ensure compromise.js loaded and content parseable.',
        subMetrics: [
          { name: 'Citation Potential', score: 0 },
          { name: 'Citable Element Frequency', score: 0 },
          { name: 'Direct Answer Rate', score: 0 }
        ]
      }
    };
  }
}

// Recursive schema walker — scores top-level AND @graph-nested types.
function detectSchema(doc) {
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let score = 0;

  const TYPE_WEIGHTS = {
    'SpeakableSpecification': 33,
    'FAQPage': 25,
    'HowTo': 25,
    'Article': 20,
    'NewsArticle': 20,
    'BlogPosting': 20,
    'Product': 20,
    'WebPage': 10,
    'WebSite': 10,
    'Person': 5,
    'Organization': 5,
    'BreadcrumbList': 5
  };

  const seen = new Set();

  function visit(obj) {
    if (!obj || typeof obj !== 'object') return;

    // ── Handle @type as BOTH string AND array ──
    const t = obj['@type'];
    const types = Array.isArray(t) ? t : (typeof t === 'string' ? [t] : []);

    types.forEach(type => {
      if (TYPE_WEIGHTS[type] && !seen.has(type)) {
        seen.add(type);
        score += TYPE_WEIGHTS[type];
      }
    });

    if (obj.speakable && obj.speakable['@type'] === 'SpeakableSpecification' && !seen.has('__nested_speakable')) {
      seen.add('__nested_speakable');
      score += 33;
    }

    if (Array.isArray(obj['@graph'])) {
      obj['@graph'].forEach(visit);
    }
  }

  schemaScripts.forEach(script => {
    try { visit(JSON.parse(script.textContent)); } catch (e) { /* silent */ }
  });

  return clamp(score);
}