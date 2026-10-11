// ai-voice-search-tool/modules/snippet-visibility.js
// Requires compromise.js CDN in index.html for NLP

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

export function computeSnippetVisibility(text, doc) {
  if (!text || text.length < 300) {
    return {
      score: 20,
      details: {
        snippetStructure: 20,
        zeroClickReadiness: 20,
        aiOverviewReadiness: 20,
        note: 'Insufficient content for reliable snippet simulation. Add structured sections (lists/tables under headings) to boost AI/voice visibility.',
        subMetrics: [
          { name: 'Snippet Structure Score', score: 20 },
          { name: 'Zero-Click Answer Readiness', score: 20 },
          { name: 'AI Overview Readiness', score: 20 }
        ]
      }
    };
  }
  try {
    const nlp = window.nlp;
    const headings = doc.querySelectorAll('h1, h2, h3, h4');

    let questionHeadings = 0;
    let structuredUnder = 0;

    headings.forEach(h => {
      const hText = h.textContent.trim();
      if (nlp(hText).questions().out('array').length > 0) questionHeadings++;
      const nextSib = h.nextElementSibling;
      if (nextSib && (nextSib.tagName === 'UL' || nextSib.tagName === 'OL' || nextSib.tagName === 'TABLE')) structuredUnder++;
    });

    // Count question-like <summary> elements (accordions, FAQ blocks)
    doc.querySelectorAll('details > summary').forEach(s => {
      const t = s.textContent.trim();
      if (t.length > 8 && (t.endsWith('?') || nlp(t).questions().out('array').length > 0)) {
        questionHeadings++;
      }
    });

    // Snippet Structure — absolute counts (with a modest heading bonus)
    const headingBonus = Math.min(25, headings.length * 2.5);
    const qStructBonus = (questionHeadings + structuredUnder) * 10;
    const snippetStructure = clamp(Math.round(headingBonus + qStructBonus));

    // Zero-Click Answer Readiness — paragraphs from normalized text
    const textParas = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 30);

    let paraScore = 0;
    textParas.forEach(p => {
      const wc = p.split(/\s+/).length;
      const hasFacts = (p.match(/\d+/g) || []).length > 0;
      const isQuestion = nlp(p).questions().out('array').length > 0;
      const hasSentenceEnders = (p.match(/[.!?]/g) || []).length >= 1;

      let s = 0;
      if (wc >= 40 && wc <= 60) s = 1;
      else if (wc >= 25 && wc < 40) s = 0.6;
      else if (wc > 60 && wc <= 80) s = 0.6;
      else if (wc >= 15 && wc < 25) s = 0.3;
      else if (wc > 80) s = 0.2;

      if (hasSentenceEnders && (hasFacts || isQuestion)) s *= 1.2;
      paraScore += s;
    });

    const zeroClickReadiness = textParas.length > 0
      ? clamp(Math.round((paraScore / textParas.length) * 100))
      : 0;

    // AI Overview Readiness
    const schemaScore = detectSchema(doc);
    const structureScore = clamp((structuredUnder * 10) + (questionHeadings * 5));
    const aiOverviewReadiness = clamp(Math.round((schemaScore + structureScore) / 2));

    const score = clamp(Math.round((snippetStructure + zeroClickReadiness + aiOverviewReadiness) / 3));

    return {
      score,
      details: {
        snippetStructure,
        zeroClickReadiness,
        aiOverviewReadiness,
        subMetrics: [
          {
            name: 'Snippet Structure Score',
            score: snippetStructure,
            fix: 'Add question-based H2/H3 headings followed by ordered/unordered lists or tables to increase eligibility for featured snippets and voice readout.'
          },
          {
            name: 'Zero-Click Answer Readiness',
            score: zeroClickReadiness,
            fix: 'Write concise, factual paragraphs (40-60 words) that directly answer user questions to improve chances of zero-click voice answers.'
          },
          {
            name: 'AI Overview Readiness',
            score: aiOverviewReadiness,
            fix: 'Implement FAQPage, HowTo, or SpeakableSpecification schema to make content more extractable for AI Overviews and voice summaries.'
          }
        ]
      }
    };
  } catch (error) {
    return {
      score: 0,
      details: {
        snippetStructure: 0,
        zeroClickReadiness: 0,
        aiOverviewReadiness: 0,
        note: 'Error in simulation. Ensure compromise.js loaded and page has parseable structure.',
        subMetrics: [
          { name: 'Snippet Structure Score', score: 0 },
          { name: 'Zero-Click Answer Readiness', score: 0 },
          { name: 'AI Overview Readiness', score: 0 }
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