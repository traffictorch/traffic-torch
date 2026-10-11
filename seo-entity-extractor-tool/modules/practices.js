// practices.js

/**
 * Evaluates on-page semantic & SEO best practices using real page structure:
 * - Actual JSON-LD schema types
 * - Actual H1–H6 heading contents
 * - Actual <title> and meta description
 * - Actual image alt text AND width/height attributes
 * - Name consistency across extracted entities
 *
 * @param {Array}  extracted - entity objects from NLP extraction
 * @param {Object} pageData  - { headings, jsonLd, meta, images } from the worker
 */
export function analyzePractices(extracted, pageData = {}) {
  if (!Array.isArray(extracted) || extracted.length === 0) {
    return {
      score: 8,
      metrics: [
        { text: "No entities detected – practices cannot be evaluated", grade: 'bad' }
      ],
      failed: [
        {
          text:
            "No named entities found on the page. Add relevant brands, people, products, organizations, concepts or locations to unlock schema opportunities and better on-page signals.",
          grade: 'bad'
        }
      ]
    };
  }

  const {
    headings = [],
    jsonLd = [],
    meta = {},
    images = []
  } = pageData;

  // ── Real JSON-LD types (walk @graph) ──
  const schemaTypes = new Set();
  const collectTypes = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    const t = obj['@type'];
    if (Array.isArray(t)) t.forEach(x => schemaTypes.add(x));
    else if (t) schemaTypes.add(t);
    if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(collectTypes);
  };
  jsonLd.forEach(collectTypes);

  const hasOrgSchema     = schemaTypes.has('Organization');
  const hasLocalSchema   = schemaTypes.has('LocalBusiness');
  const hasProductSchema = schemaTypes.has('Product');
  const hasPersonSchema  = schemaTypes.has('Person');
  const hasArticleSchema = schemaTypes.has('Article')
                        || schemaTypes.has('WebPage')
                        || schemaTypes.has('BlogPosting')
                        || schemaTypes.has('NewsArticle');

  // ── Real heading coverage ──
  const headingText = headings.map(h => String(h.text || '').toLowerCase());

  const salienceSorted = [...extracted].sort(
    (a, b) => (b.salience ?? 0.4) - (a.salience ?? 0.4)
  );
  const topEntities = salienceSorted.slice(
    0,
    Math.max(5, Math.ceil(extracted.length * 0.3))
  );

  const topInHeadings = topEntities.filter(e => {
    const t = (e.text || '').toLowerCase().trim();
    if (!t) return false;
    return headingText.some(h => h.includes(t));
  }).length;

  // ── Real title / meta description checks ──
  const titleLower = String(meta.title || '').toLowerCase();
  const descLower  = String(meta.description || '').toLowerCase();
  const primary    = (salienceSorted[0]?.text || '').toLowerCase().trim();

  const primaryInTitle = !!primary && titleLower.includes(primary);
  const primaryInDesc  = !!primary && descLower.includes(primary);

  // ── Real image alt + dims coverage ──
  const totalImages    = images.length;
  const imagesWithAlt  = images.filter(i => i.alt && i.alt.trim().length > 3).length;
  const imagesWithDims = images.filter(i => i.width && i.height).length;
  const altRatio       = totalImages ? imagesWithAlt / totalImages : 1;
  const dimsRatio      = totalImages ? imagesWithDims / totalImages : 1;

  // ── Name consistency ──
  const normalizedNames = new Set(
    extracted
      .map(e =>
        (e.text || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^a-z0-9 ]/g, '')
      )
      .filter(Boolean)
  );
  const consistencyPercent = extracted.length
    ? (normalizedNames.size / extracted.length) * 100
    : 0;

  // ── Scoring ──
  let schemaScore = 0;
  if (hasOrgSchema)     schemaScore += 18;
  if (hasLocalSchema)   schemaScore += 8;
  if (hasProductSchema) schemaScore += 8;
  if (hasPersonSchema)  schemaScore += 6;
  if (hasArticleSchema) schemaScore += 6;
  schemaScore = Math.min(40, schemaScore);

  const headingScore = Math.min(28, topInHeadings * 4);
  const titleBonus   = primaryInTitle ? 6 : 0;
  const descBonus    = primaryInDesc  ? 4 : 0;
  const altScore     = Math.round(altRatio * 16);
  const dimsScore    = Math.round(dimsRatio * 4);

  const consistencyBonus =
    consistencyPercent >= 90 ? 8 :
    consistencyPercent >= 80 ? 5 : 0;

  let score =
    schemaScore + headingScore + titleBonus + descBonus +
    altScore + dimsScore + consistencyBonus;
  score = Math.max(5, Math.min(100, Math.round(score)));

  // ── Metrics ──
  const schemaList = schemaTypes.size ? [...schemaTypes].join(', ') : 'None found';
  const metrics = [
    {
      text: `JSON-LD schema types: ${schemaList}`,
      grade: schemaTypes.size >= 2 ? 'good' : schemaTypes.size === 1 ? 'warning' : 'bad'
    },
    {
      text: `Top entities in headings: ${topInHeadings} of ${topEntities.length}`,
      grade: topInHeadings >= 4 ? 'good' : topInHeadings >= 2 ? 'warning' : 'bad'
    },
    {
      text: `Primary entity in title: ${primaryInTitle ? 'Yes' : 'No'} | in description: ${primaryInDesc ? 'Yes' : 'No'}`,
      grade: primaryInTitle && primaryInDesc ? 'good'
           : primaryInTitle || primaryInDesc ? 'warning' : 'bad'
    },
    {
      text: `Images with descriptive alt: ${imagesWithAlt} / ${totalImages}`,
      grade: altRatio >= 0.8 ? 'good' : altRatio >= 0.5 ? 'warning' : 'bad'
    },
    {
      text: `Images with width/height: ${imagesWithDims} / ${totalImages}`,
      grade: dimsRatio >= 0.9 ? 'good' : dimsRatio >= 0.5 ? 'warning' : 'bad'
    },
    {
      text: `Name consistency: ${consistencyPercent.toFixed(0)}%`,
      grade: consistencyPercent >= 90 ? 'good'
           : consistencyPercent >= 80 ? 'warning' : 'bad'
    }
  ];

  // ── Failed items ──
  const failed = [];

  if (schemaTypes.size === 0) {
    failed.push({
      text:
        "No JSON-LD structured data found on the page. Add schema for your most prominent entity type (Organization, LocalBusiness, Person, Product, or Article/WebPage).",
      grade: 'bad'
    });
  } else if (!hasOrgSchema && !hasPersonSchema && !hasProductSchema && !hasLocalSchema) {
    failed.push({
      text:
        `Only generic schema present (${schemaList}). Add Organization, Person, LocalBusiness or Product schema to strengthen entity identity.`,
      grade: 'warning'
    });
  }

  if (topInHeadings < 3) {
    failed.push({
      text:
        `Only ${topInHeadings} of your top ${topEntities.length} entities appear in H1–H6. Place your primary entity "${salienceSorted[0]?.text || 'main topic'}" and 2–3 supporting entities into headings.`,
      grade: 'bad'
    });
  }

  if (!primaryInTitle && primary) {
    failed.push({
      text:
        `Your primary entity "${salienceSorted[0]?.text || ''}" does not appear in the <title> tag. Add it near the front of the title.`,
      grade: 'bad'
    });
  }

  if (!primaryInDesc && primary) {
    failed.push({
      text:
        `Your primary entity "${salienceSorted[0]?.text || ''}" does not appear in the meta description. Include it for better topical signal in SERP snippets.`,
      grade: 'warning'
    });
  }

  if (altRatio < 0.7 && totalImages >= 3) {
    failed.push({
      text:
        `${totalImages - imagesWithAlt} of ${totalImages} images have missing or empty alt text. Describe them using relevant entities.`,
      grade: 'bad'
    });
  }

  if (dimsRatio < 0.8 && totalImages >= 3) {
    failed.push({
      text:
        `${totalImages - imagesWithDims} of ${totalImages} images are missing explicit width/height attributes, which can cause layout shift (CLS). Add them or use CSS aspect-ratio.`,
      grade: 'warning'
    });
  }

  if (consistencyPercent < 84 && extracted.length >= 8) {
    failed.push({
      text:
        `Inconsistent entity naming detected (${consistencyPercent.toFixed(0)}%). Standardize spelling, capitalization and formatting of key names (especially brand/business name) across the entire page.`,
      grade: 'bad'
    });
  }

  return { score, metrics, failed };
}