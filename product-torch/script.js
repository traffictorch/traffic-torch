// Dynamic import for plugin solutions
let renderPluginSolutions;
import('/product-torch/plugin-solutions.js')
  .then(module => {
    renderPluginSolutions = module.renderPluginSolutions;
    console.log('Plugin solutions module loaded successfully');
  })
  .catch(err => console.error('Failed to load plugin-solutions.js:', err));

// product-torch/script.js - Final polished version - fully generic, accurate across all eCommerce sites
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';

  const factorDefinitions = {
    onPage: {
      factors: [
  { name: "Title Tag Optimization", key: "title", threshold: 80, shortDesc: "Title length ideally 50–60 chars (max 70), includes product keywords and brand. Avoids truncation.", howToFix: "Include product name + key benefit + brand early. Target 50-60 chars. Use separator like | or -." },
  { name: "Meta Description Relevance", key: "metaDescription", threshold: 75, shortDesc: "100–170 chars, keyword-rich, includes CTA, unique per product.", howToFix: "Write benefit-driven copy with keywords early. Add urgency or offer. Avoid duplication." },
  { name: "Heading Structure (H1–H6)", key: "headings", threshold: 85, shortDesc: "Single H1 (product name), logical hierarchy, keywords in H1/H2.", howToFix: "Use one H1 for product name. Add H2/H3 for features, specs, benefits. Include long-tail keywords naturally." },
  { name: "URL Structure", key: "url", threshold: 90, shortDesc: "Clean, keyword-rich slug with hyphens, no parameters, readable.", howToFix: "Use /category/product-name format. Remove session IDs. Keep readable and descriptive." },
  { name: "Keyword Optimization", key: "keywords", threshold: 70, shortDesc: "Natural primary & long-tail keyword placement, density 0.4–3%, front-loaded.", howToFix: "Place main keywords in title, H1, first paragraph. Add long-tail variations naturally." }
],
      moduleWhat: "On-Page SEO evaluates title, meta, headings, URL, and keyword usage — the foundational elements that tell search engines and users what the product page is about.",
      moduleHow: "Optimize titles and metas for CTR. Use proper heading hierarchy. Include keywords naturally in prominent places. Keep URLs clean and descriptive.",
      moduleWhy: "Strong on-page signals improve relevance, click-through rates, and initial rankings. They help match user intent and reduce bounce from mismatched expectations."
    },
   technical: {
  factors: [
    { 
      name: "Mobile-Friendliness", 
      key: "mobile", 
      threshold: 85, 
      shortDesc: "Responsive + correct viewport meta + passes basic Core Web Vitals checks (no user-scalable=no).", 
      howToFix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>. Use responsive CSS. Avoid fixed widths or user-scalable=no. Test with Google's Mobile-Friendly Test." 
    },
    { 
      name: "HTTPS Implementation", 
      key: "https", 
      threshold: 95, 
      shortDesc: "Served over HTTPS with valid cert, no mixed content (HTTP resources on HTTPS page).", 
      howToFix: "Force HTTPS redirect. Update all images/scripts/links to https://. Fix mixed content via browser dev tools console." 
    },
    { 
      name: "Canonical Tags", 
      key: "canonical", 
      threshold: 85, 
      shortDesc: "Self-referencing canonical exists and exactly matches current URL (protocol + trailing slash).", 
      howToFix: "Add <link rel='canonical' href='https://full-current-url/'>. Ensure it matches live URL 100% (case-sensitive)." 
    },
    { 
      name: "Meta Robots Directives", 
      key: "robots", 
      threshold: 90, 
      shortDesc: "No noindex or nofollow on live product page (unless intentional).", 
      howToFix: "Remove <meta name='robots' content='noindex'> or similar. Use robots.txt only for blocking unwanted pages, not product pages." 
    },
    { 
      name: "Sitemap Inclusion Hints", 
      key: "sitemapHint", 
      threshold: 70, 
      shortDesc: "URL pattern matches typical product pages (suggests inclusion in sitemap.xml).", 
      howToFix: "Add this URL pattern to sitemap.xml. Submit sitemap in Google Search Console. Use dynamic sitemaps for large catalogs." 
    }
  ],
  moduleWhat: "Technical SEO checks crawlability, mobile readiness, security, and duplicate prevention — essential for product pages to be indexed and ranked properly.",
  moduleHow: "Ensure HTTPS, proper viewport, canonicals, and indexable robots directives. Keep technical foundation clean.",
  moduleWhy: "Technical issues can prevent indexing, hurt mobile rankings, or cause duplicate content penalties — all block traffic."
},
    contentMedia: {
  factors: [
    { 
      name: "Product Description Quality", 
      key: "description", 
      threshold: 75, 
      shortDesc: "300+ words ideal, unique, benefit-focused, structured (bullets/headings), keyword-rich.", 
      howToFix: "Expand to 400–800 words in competitive niches. Start with benefits, use bullets for features, add subheadings. Make it unique vs competitors." 
    },
    { 
      name: "Image Optimization", 
      key: "images", 
      threshold: 80, 
      shortDesc: "Meaningful images have descriptive keyword-rich alt text, lazy loading, responsive (srcset), <100KB.", 
      howToFix: "Add alt text like 'Santa Cruz Dreadnought Quilted Mahogany Acoustic Guitar front view'. Use loading='lazy', srcset/sizes. Compress images." 
    },
    { 
      name: "Video Embed Quality", 
      key: "video", 
      threshold: 70, 
      shortDesc: "Relevant videos present with captions (<track>), poster thumbnail, embedded properly.", 
      howToFix: "Embed YouTube/Vimeo with captions enabled. Add <track kind='subtitles'> or use platform auto-captions. Include poster image." 
    },
    { 
      name: "User-Generated Content (UGC)", 
      key: "ugc", 
      threshold: 70, 
      shortDesc: "Reviews/ratings visible with star aggregate and review count.", 
      howToFix: "Install review app (Judge.me, Yotpo, Loox). Display average rating + number of reviews. Encourage photo/video reviews." 
    },
    { 
      name: "Internal Linking", 
      key: "internalLinks", 
      threshold: 70, 
      shortDesc: "3+ relevant contextual links to related products/categories/guides with descriptive anchors.", 
      howToFix: "Add 3–6 internal links in description or below (e.g. 'see matching picks', 'learn more about tonewoods'). Use keyword-rich anchors." 
    },
    { 
      name: "Breadcrumb Navigation", 
      key: "breadcrumbs", 
      threshold: 85, 
      shortDesc: "Clear hierarchy breadcrumbs present (Home > Category > Subcategory > Product).", 
      howToFix: "Implement breadcrumbs with schema (BreadcrumbList JSON-LD). Use links like Home > Acoustic Guitars > Dreadnought > Santa Cruz Dreadnought." 
    }
  ],
  moduleWhat: "Content & Media evaluates richness, accessibility, and engagement signals that keep users on-page and build trust.",
  moduleHow: "Create detailed, benefit-driven descriptions. Optimize all images/videos. Encourage reviews. Add navigation aids.",
  moduleWhy: "High-quality content reduces bounce rate, improves dwell time, and strengthens topical authority — key ranking factors."
},
    ecommerce: {
      factors: [
        { name: "Product Schema Markup", threshold: 90, shortDesc: "JSON-LD Product schema with required fields.", howToFix: "Add full Product schema JSON-LD. Include name, image array, offers." },
        { name: "Price & Availability Markup", threshold: 85, shortDesc: "Schema includes priceCurrency, price, availability.", howToFix: "Ensure dynamic price and stock status in schema." },
        { name: "Review Schema & Aggregation", threshold: 80, shortDesc: "aggregateRating with ratingValue and reviewCount.", howToFix: "Add AggregateRating to Product schema. Pull real review data." },
        { name: "Variant Handling", threshold: 70, shortDesc: "Options detected without duplication issues.", howToFix: "Use variant selectors without separate URLs or add canonicals." },
        { name: "Social Sharing Integration", threshold: 65, shortDesc: "Open Graph meta tags and/or share buttons.", howToFix: "Add og:title, og:image, og:description. Include share buttons." }
      ],
      moduleWhat: "E-Commerce Specific SEO checks structured data, pricing, reviews, variants, and social signals — critical for rich results and conversions.",
      moduleHow: "Implement complete Product schema. Include price/stock/review data. Handle variants cleanly. Add Open Graph for social shares.",
      moduleWhy: "Schema unlocks rich snippets (price, stars, images in SERPs). Reviews build trust. Proper variants prevent duplicate content."
    }
  };

  // Helper functions
  function countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  function countMissingAlt(doc) {
    const imgs = doc.querySelectorAll('img');
    let missing = 0;
    let decorative = 0;
    let meaningful = 0;
    imgs.forEach(img => {
      const alt = img.getAttribute('alt');
      const isDecorative = img.classList.contains('decorative') ||
                          img.getAttribute('role') === 'presentation' ||
                          (alt !== null && alt.trim() === '' && !img.hasAttribute('title'));
      if (isDecorative) decorative++;
      else {
        meaningful++;
        if (alt === null || alt.trim() === '') missing++;
      }
    });
    return { missingCount: missing, meaningfulCount: meaningful, decorativeCount: decorative, totalImages: imgs.length };
  }

  function hasViewportMeta(doc) {
    const meta = doc.querySelector('meta[name="viewport"]');
    return meta && /width\s*=\s*device-width/i.test(meta.content);
  }

  function extractProductSchema(doc) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = [];
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Product' || (Array.isArray(data['@graph']) && data['@graph'].some(g => g['@type'] === 'Product'))) {
          schemas.push(data);
        }
      } catch (e) {}
    });
    return schemas;
  }

  function hasReviewSection(doc) {
    const selectors = [
      '.reviews', '.product-reviews', '#reviews', '.rating', '.yotpo', '.judge-me', '[data-reviews]', '.aggregate-rating', '.star-rating', '.customer-reviews',
      '[itemprop="aggregateRating"]', '[itemprop="review"]', '.woocommerce-product-rating', '.spr-reviews', '.stamped-main-widget', '.loox-rating', '.trustpilot-widget'
    ];
    return selectors.some(sel => doc.querySelector(sel));
  }

  function hasPriceMarkup(doc, schema) {
    if (schema && schema.offers && (schema.offers.price || schema.offers.availability)) return true;
    const pricePatterns = /\$[0-9,.]+|USD [0-9,.]+|€ [0-9,.]+|£ [0-9,.]+|In Stock|Out of Stock|Add to Cart/i;
    return pricePatterns.test(doc.body.textContent);
  }

  function hasSocialMeta(doc) {
    return !!doc.querySelector('meta[property^="og:"]');
  }

  function getProductPageContent(doc, url) {
    const textSelectors = 'p, li, div.product-description, #product-description, .description, article, section, .rte, .woocommerce-product-details__short-description, .product-single__description, .product__description, [itemprop="description"], .product-details, .wysiwyg, .content';
    const textElements = doc.querySelectorAll(textSelectors);
    let fullText = '';
    textElements.forEach(el => {
      const t = el.textContent.trim();
      if (t.length > 20) fullText += t + ' ';
    });
    const images = doc.querySelectorAll('img');
    const links = doc.querySelectorAll('a[href]');
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
    return {
      fullText,
      wordCount: countWords(fullText),
      imageCount: images.length,
      altData: countMissingAlt(doc),
      headingCount: headings.length,
      linkCount: links.length,
      hasViewport: hasViewportMeta(doc),
      viewportContent: doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      url
    };
  }

  function analyzeProductSEO(doc, inputUrl) {
    const data = getProductPageContent(doc, inputUrl);
    const onPageResult = analyzeOnPageSEO(doc, data);
    const technicalResult = analyzeTechnicalSEO(doc, data);
    const contentMediaResult = analyzeContentMedia(doc, data);
    const ecommerceResult = analyzeEcommerceSEO(doc, data);
    const weights = { onPage: 0.30, technical: 0.25, contentMedia: 0.25, ecommerce: 0.20 };
    const overallScore = Math.round(
      (onPageResult.score * weights.onPage) +
      (technicalResult.score * weights.technical) +
      (contentMediaResult.score * weights.contentMedia) +
      (ecommerceResult.score * weights.ecommerce)
    );
    return {
      score: isNaN(overallScore) ? 60 : Math.min(100, Math.max(0, overallScore)),
      onPage: onPageResult,
      technical: technicalResult,
      contentMedia: contentMediaResult,
      ecommerce: ecommerceResult
    };
  }

function analyzeOnPageSEO(doc, data) {
  let details = {};
    // Extract primary keyword for regex (same logic as before)
  let primaryKeyword = '';
  const h1Text = doc.querySelector('h1')?.textContent?.trim().toLowerCase() || '';
  const titleText = doc.title.trim().toLowerCase();

  if (h1Text.length > 10) {
    primaryKeyword = h1Text.split(' ').slice(0, 4).join(' ');
  } else if (titleText.length > 10) {
    const parts = titleText.split(/[\|\-–—]/)[0].trim().split(' ');
    primaryKeyword = parts.slice(0, 4).join(' ');
  } else {
    const urlObj = new URL(data.url);
    const slug = urlObj.pathname.split('/').filter(Boolean).pop() || '';
    primaryKeyword = slug.replace(/[-_]/g, ' ').replace(/\d{4,}/g, '').trim();
    if (primaryKeyword.length < 5) primaryKeyword = 'product';
  }

  // Remove common stop words
  const stopWords = /^(the|a|an|best|top|new|buy|shop|order|free|sale|online|free shipping|with|for|and|in|at|to|of)$/i;
  primaryKeyword = primaryKeyword.replace(stopWords, '').trim().replace(stopWords, '').trim();

  // Create regex once — case-insensitive, whole word boundaries where possible
  const keywordRegex = new RegExp('\\b' + primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
  let titleScore = 0;
  const title = doc.title.trim();
  const titleLength = title.length;
  if (titleLength >= 50 && titleLength <= 60) titleScore += 50;
  else if (titleLength >= 40 && titleLength <= 70) titleScore += 35;
  else if (titleLength >= 30 && titleLength <= 80) titleScore += 20;
  else titleScore += 5;
  const separatorRegex = /[\|\-–—]/;
  if (separatorRegex.test(title)) titleScore += 20;
  if (keywordRegex.test(title.toLowerCase())) titleScore += 30;
  titleScore = Math.min(100, titleScore);
  details.title = { length: titleLength, hasSeparator: separatorRegex.test(title), hasKeyword: keywordRegex.test(title.toLowerCase()), score: titleScore };

  let descScore = 0;
  const metaDesc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
  const descLength = metaDesc.length;
  if (descLength >= 120 && descLength <= 160) descScore += 45;
  else if (descLength >= 100 && descLength <= 170) descScore += 35;
  else if (descLength > 0) descScore += 15;
  if (/buy|shop|add to cart|purchase|order|view|learn more|discover/i.test(metaDesc.toLowerCase())) descScore += 25;
  if (keywordRegex.test(metaDesc.toLowerCase())) descScore += 30;
  descScore = Math.min(100, descScore);
  details.metaDescription = { length: descLength, hasCta: /buy|shop|add to/i.test(metaDesc.toLowerCase()), hasKeyword: keywordRegex.test(metaDesc.toLowerCase()), score: descScore };

  let headingScore = 0;
  const h1s = doc.querySelectorAll('h1');
  const h2s = doc.querySelectorAll('h2');
  if (h1s.length === 1) headingScore += 45;
  else if (h1s.length === 0) headingScore += 20; // penalize missing
  else headingScore += 10; // multiple H1 bad
  if (h2s.length >= 2) headingScore += 25;
  if (data.headingCount >= 5) headingScore += 30;
  headingScore = Math.min(100, headingScore);
  details.headings = { h1Count: h1s.length, h2Count: h2s.length, total: data.headingCount, score: headingScore };

  let urlScore = 0;
  const urlObj = new URL(data.url);
  const path = urlObj.pathname;
  if (!path.includes('?') && !path.includes('&') && !path.includes(';')) urlScore += 40;
  if (path.split('/').length <= 5) urlScore += 30;
  if (path.length > 15 && !/\d{8,}/.test(path)) urlScore += 30;
  urlScore = Math.min(100, urlScore);
  details.url = { clean: !path.includes('?'), segments: path.split('/').length, length: path.length, score: urlScore };

  let keywordScore = 0;
  const keywordCount = (data.fullText.toLowerCase().match(keywordRegex) || []).length;
  const density = data.wordCount > 0 ? (keywordCount / data.wordCount) * 100 : 0;
  if (density >= 0.5 && density <= 2.5) keywordScore += 40;
  if (data.fullText.slice(0, 400).toLowerCase().match(keywordRegex)) keywordScore += 35;
  if (keywordCount >= 3) keywordScore += 25;
  keywordScore = Math.min(100, keywordScore);
  details.keywords = { primaryKeyword, density, frontLoaded: !!data.fullText.slice(0, 400).toLowerCase().match(keywordRegex), count: keywordCount, score: keywordScore };

  // Weighted module score (title & keywords heavier impact)
  const score = Math.round(
    titleScore * 0.30 +
    descScore * 0.20 +
    headingScore * 0.20 +
    urlScore * 0.15 +
    keywordScore * 0.15
  );

  return { score: Math.min(100, Math.max(0, score)), details };
}

function analyzeTechnicalSEO(doc, data) {
  let details = {};

  // Mobile-Friendliness (more reliable: penalize restrictive viewports)
  let mobileScore = data.hasViewport ? 60 : 10;
  if (data.viewportContent && /width\s*=\s*device-width/i.test(data.viewportContent)) {
    mobileScore += 30;
  }
  if (data.viewportContent.includes('initial-scale=1')) mobileScore += 10;
  if (!data.viewportContent.includes('user-scalable=no') && !data.viewportContent.includes('maximum-scale=1')) {
    mobileScore += 10;
  } else {
    mobileScore -= 15; // restrictive = bad for UX
  }
  mobileScore = Math.min(100, Math.max(0, mobileScore));
  details.mobile = { viewportPresent: data.hasViewport, score: mobileScore };

  // HTTPS (strict: check protocol only — mixed content hard to detect via proxy, so proxy hint)
  const isHttps = data.url.startsWith('https');
  details.https = { isHttps, score: isHttps ? 95 : 0 };

  // Canonical (stricter: exact match incl. protocol & trailing slash)
  const canonical = doc.querySelector('link[rel="canonical"]');
  let canonicalScore = 20; // default low if missing
  if (canonical && canonical.hasAttribute('href')) {
    const canonHref = canonical.href.trim();
    const currentNormalized = data.url.replace(/\/$/, ''); // ignore trailing slash difference
    const canonNormalized = canonHref.replace(/\/$/, '');
    if (canonHref === data.url || canonHref === data.url + '/') {
      canonicalScore = 95;
    } else if (currentNormalized === canonNormalized) {
      canonicalScore = 80; // close enough
    } else {
      canonicalScore = 40; // wrong URL
    }
  }
  details.canonical = { 
    present: !!canonical, 
    matchesUrl: canonical?.href === data.url || canonical?.href === data.url + '/', 
    score: canonicalScore 
  };

  // Robots (strict: any noindex/nofollow = fail)
  const robotsMeta = doc.querySelector('meta[name="robots"]');
  let robotsScore = 95;
  if (robotsMeta) {
    const content = (robotsMeta.content || '').toLowerCase();
    if (/noindex/i.test(content) || /nofollow/i.test(content)) {
      robotsScore = 15;
    }
  }
  details.robots = { indexable: robotsScore === 95, score: robotsScore };

  // Sitemap hint (pattern-based, educational)
  let sitemapScore = /\/product[s]?\/|\/item\/|\/p\/|\/shop\/|\/collections\/[^/]+\/products\//i.test(data.url) ? 80 : 45;
  details.sitemapHint = { likelyIncluded: sitemapScore >= 70, score: sitemapScore };

  // Weighted score (HTTPS & mobile highest impact)
  const score = Math.round(
    details.mobile.score * 0.30 +
    details.https.score * 0.30 +
    details.canonical.score * 0.20 +
    details.robots.score * 0.15 +
    details.sitemapHint.score * 0.05
  );

  return { score: Math.min(100, Math.max(0, score)), details };
}

function analyzeContentMedia(doc, data) {
  let details = {};

  // Product Description Quality (length + basic structure hint)
  let descScore = 20;
  if (data.wordCount >= 500) descScore = 90;
  else if (data.wordCount >= 300) descScore = 75;
  else if (data.wordCount >= 200) descScore = 55;
  else if (data.wordCount >= 100) descScore = 35;
  else descScore = 15;
  // Bonus for likely structure (multiple headings or lists)
  const hasStructure = doc.querySelectorAll('h2,h3,ul,ol').length >= 3;
  if (hasStructure) descScore += 15;
  descScore = Math.min(100, descScore);
  details.description = { wordCount: data.wordCount, hasStructure, score: descScore };

  // Image Optimization (alt text quality + count)
  let imgScore = 30;
  const { missingCount, meaningfulCount, totalImages } = data.altData;
  if (totalImages === 0) imgScore = 40; // no images = neutral
  else if (meaningfulCount > 0) {
    const altRatio = meaningfulCount > 0 ? (missingCount / meaningfulCount) : 1;
    if (altRatio === 0) imgScore = 90;
    else if (altRatio < 0.2) imgScore = 75;
    else if (altRatio < 0.5) imgScore = 50;
    else imgScore = 25;
  }
  details.images = { missingAlt: missingCount, meaningful: meaningfulCount, total: totalImages, score: imgScore };

  // Video Embed Quality
  const videoElements = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="youtu.be"]');
  let videoScore = videoElements.length > 0 ? 50 : 25;
  if (videoElements.length > 0 && doc.querySelector('track')) videoScore += 30;
  if (videoElements.length > 1) videoScore += 10;
  videoScore = Math.min(100, videoScore);
  details.video = { present: videoElements.length > 0, captions: !!doc.querySelector('track'), count: videoElements.length, score: videoScore };

  // UGC
  const hasUGC = hasReviewSection(doc);
  let ugcScore = hasUGC ? 80 : 35;
  details.ugc = { detected: hasUGC, score: ugcScore };

  // Internal Linking (count + quality hint)
  let linkScore = 20;
  if (data.linkCount >= 8) linkScore = 85;
  else if (data.linkCount >= 5) linkScore = 70;
  else if (data.linkCount >= 3) linkScore = 50;
  else linkScore = 25;
  details.internalLinks = { count: data.linkCount, score: linkScore };

  // Breadcrumb Navigation
  const breadcrumbSelectors = '[aria-label*="breadcrumb" i], .breadcrumbs, .breadcrumb, .woocommerce-breadcrumb, .yoast-breadcrumb, .site-breadcrumb, .bread-crumb, .crumbs, .pathway, [itemprop="breadcrumb"]';
  const hasBreadcrumbs = !!doc.querySelector(breadcrumbSelectors);
  let breadcrumbScore = hasBreadcrumbs ? 90 : 30;
  details.breadcrumbs = { present: hasBreadcrumbs, score: breadcrumbScore };

  // Weighted module score (description + images most important)
  const score = Math.round(
    descScore * 0.30 +
    imgScore * 0.25 +
    videoScore * 0.10 +
    ugcScore * 0.15 +
    linkScore * 0.10 +
    breadcrumbScore * 0.10
  );

  return { score: Math.min(100, Math.max(0, score)), details };
}

  function analyzeEcommerceSEO(doc, data) {
    let score = 0;
    let details = {};

    const schemas = extractProductSchema(doc);
    const productSchema = schemas.find(s => s['@type'] === 'Product' || (s['@graph'] && s['@graph'].some(g => g['@type'] === 'Product'))) || {};

    const schemaScore = Object.keys(productSchema).length > 5 ? 90 : 30;
    details.schema = { present: schemaScore === 90, fieldsCount: Object.keys(productSchema).length, score: schemaScore };

    const priceScore = hasPriceMarkup(doc, productSchema) ? 85 : 40;
    details.priceAvailability = { detected: priceScore === 85, score: priceScore };

    const reviewScore = productSchema.aggregateRating && productSchema.aggregateRating.ratingValue ? 80 : hasReviewSection(doc) ? 60 : 20;
    details.reviews = { aggregateRatingPresent: !!productSchema.aggregateRating, score: reviewScore };

    const variantSelectors = doc.querySelectorAll('select[name*="variant"], select[name*="size"], select[name*="color"], input[type="radio"][name*="variant"], select[name*="option"], .variant-select, .swatch, .product-variants, [data-variant]');
    const variantScore = variantSelectors.length > 0 ? 70 : 50;
    details.variants = { detected: variantSelectors.length > 0, score: variantScore };

    const socialScore = hasSocialMeta(doc) ? 65 : 30;
    details.social = { ogPresent: socialScore === 65, score: socialScore };

    score = Math.round((schemaScore + priceScore + reviewScore + variantScore + socialScore) / 5);
    return { score: Math.min(100, Math.max(0, score)), details, isPro: true };
  }

  function getHealthLabel(score) {
    if (score >= 85) return { text: "Excellent", color: "from-green-400 to-emerald-600" };
    if (score >= 70) return { text: "Strong", color: "from-teal-400 to-cyan-600" };
    if (score >= 50) return { text: "Needs Work", color: "from-yellow-400 to-orange-600" };
    return { text: "Poor", color: "from-red-500 to-pink-600" };
  }

  function getGradeInfo(score) {
    if (score >= 90) return { grade: "A+", color: "text-green-600", emoji: "🏆" };
    if (score >= 85) return { grade: "A", color: "text-green-600", emoji: "✅" };
    if (score >= 80) return { grade: "B+", color: "text-green-500", emoji: "✅" };
    if (score >= 70) return { grade: "B", color: "text-teal-500", emoji: "👍" };
    if (score >= 60) return { grade: "C+", color: "text-yellow-600", emoji: "⚠️" };
    if (score >= 50) return { grade: "C", color: "text-orange-600", emoji: "⚠️" };
    return { grade: "Needs Work", color: "text-red-600", emoji: "❌" };
  }

  function getPluginGrade(score) {
    if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
    return { grade: 'Poor', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  }

  function buildModuleHTML(moduleName, value, moduleData, factorScores = null) {
    const ringColor = value < 50 ? '#ef4444' : value < 70 ? '#fb923c' : value < 85 ? '#22c55e' : '#10b981';
    const borderClass = value < 50 ? 'border-red-500' : value < 70 ? 'border-orange-500' : value < 85 ? 'border-green-500' : 'border-emerald-500';
    const gradeInfo = getGradeInfo(value);
let statusMessage, statusEmoji;
if (value >= 85) {
  statusMessage = "Excellent";
  statusEmoji = "🏆";
} else if (value >= 70) {
  statusMessage = "Strong";
  statusEmoji = "✅";
} else if (value >= 50) {
  statusMessage = "Needs Work";
  statusEmoji = "⚠️";
} else {
  statusMessage = "Poor";
  statusEmoji = "❌";
}
    let metricsHTML = '';
    let fixesHTML = '';
    let failedOnlyHTML = '';
    let failedCount = 0;
    moduleData.factors.forEach(f => {
      let individualScore = (factorScores && f.key && factorScores[f.key] && factorScores[f.key].score !== undefined)
  ? factorScores[f.key].score
  : value; // fallback to module avg if no detail
let passed = individualScore >= f.threshold;
let metricGrade = passed
  ? { color: "text-green-600 dark:text-green-400", emoji: "✅" }
  : (individualScore >= f.threshold - 20)
    ? { color: "text-orange-600 dark:text-orange-400", emoji: "⚠️" }
    : { color: "text-red-600 dark:text-red-400", emoji: "❌" };
      metricsHTML += `
        <div class="mb-6">
          <p class="font-medium text-xl">
            <span class="${metricGrade.color} text-2xl mr-3">${metricGrade.emoji}</span>
            <span class="${metricGrade.color} font-bold">${f.name}</span>
          </p>
        </div>`;
      if (!passed) {
        failedOnlyHTML += `
          <div class="mb-8 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <p class="font-bold text-2xl ${metricGrade.color} mb-4">
              <span class="text-4xl">${metricGrade.emoji}</span>
            </p>
            <p class="font-bold text-2xl ${metricGrade.color} mb-4">
              ${f.name}
            </p>
            <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              ${f.howToFix}
            </p>
          </div>`;
        failedCount++;
      }
    });
    const moreDetailsHTML = `
      <div class="text-left px-4 py-6">
        <h4 class="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100 text-center">
          <button class="underline hover:text-purple-600 dark:hover:text-purple-400 bg-transparent border-none cursor-pointer" onclick="window.location.hash = '${moduleName.toLowerCase().replace(/\s+/g, '-')}';">
            How ${moduleName} is tested?
          </button>
        </h4>
        <div class="space-y-6">
          <div>
            <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">What it is:</strong>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleWhat}</p>
          </div>
          <div>
            <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">How to Improve:</strong>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleHow}</p>
          </div>
          <div>
            <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">Why it matters:</strong>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleWhy}</p>
          </div>
        </div>
      </div>`;
    const fixesPanelHTML = failedCount > 0
      ? `
        <div class="space-y-6">
          ${failedOnlyHTML}
        </div>
        <p class="text-center text-gray-600 dark:text-gray-400 mt-10 text-sm italic">
          <button class="underline hover:text-purple-600 dark:hover:text-purple-400 bg-transparent border-none cursor-pointer" onclick="window.location.hash = '${moduleName.toLowerCase().replace(/\s+/g, '-')}';">
            Learn more about ${moduleName}?
          </button>
        </p>
      `
      : '<p class="text-center text-gray-700 dark:text-gray-300 text-lg py-12 font-medium">All checks passed — no fixes needed!</p>';
    return `
      <div class="module-card text-center p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderClass}">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb dark:stroke-gray-700" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56"
                    stroke="${ringColor}"
                    stroke-width="12" fill="none"
                    stroke-dasharray="${(value / 100) * 352} 352"
                    stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${ringColor};">
            ${value}
          </div>
        </div>
        <p class="mt-4 text-2xl font-bold ${gradeInfo.color}"> ${moduleName}</p>
        <div class="mt-4 text-center">
          <p class="text-4xl ${gradeInfo.color}"> ${statusEmoji}</p>
          <p class="text-3xl font-bold ${gradeInfo.color} mt-2"> ${statusMessage}</p>
        </div>
        <div class="mt-6 text-center metrics-list px-2 sm:px-0">
          ${metricsHTML}
        </div>
        <div class="more-details-panel hidden mt-8 text-left px-2 sm:px-4">
          ${moreDetailsHTML}
        </div>
        <div class="mt-6 flex gap-4 justify-center flex-wrap">
          <button class="more-details px-6 py-3 sm:px-8 sm:py-3 rounded-full text-white font-medium hover:opacity-90 transition" style="background-color: ${ringColor};">
            More Details
          </button>
          <button class="show-fixes px-6 py-3 sm:px-8 sm:py-3 rounded-full bg-gray-600 text-white font-medium hover:opacity-90 transition">
            Show Fixes${failedCount > 0 ? ` (${failedCount})` : ''}
          </button>
        </div>
        <div class="fixes-panel hidden mt-8 text-left px-2 sm:px-4">
          ${fixesPanelHTML}
        </div>
      </div>`;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let url = input.value.trim();
    if (!url) {
      results.innerHTML = `<div class="text-center py-20"><p class="text-3xl text-red-500 font-bold">Please enter a product page URL</p></div>`;
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      input.value = url;
    }
    results.classList.remove('hidden');
    document.getElementById('loading').classList.remove('hidden');
    const progressText = document.getElementById('progressText');
    const steps = [
      { text: "Fetching product page...", delay: 1200 },
      { text: "Extracting content & metadata", delay: 1400 },
      { text: "Analyzing on-page & technical SEO", delay: 1600 },
      { text: "Evaluating content, media & schema", delay: 1400 },
      { text: "Checking eCommerce signals", delay: 1200 },
      { text: "Calculating health score", delay: 1000 },
      { text: "Building report & fixes", delay: 1200 }
    ];
    let currentStep = 0;
    const runStep = () => {
      if (currentStep < steps.length) {
        progressText.textContent = steps[currentStep].text;
        currentStep++;
        setTimeout(runStep, steps[currentStep - 1].delay);
      } else {
        progressText.textContent = "Generating SEO report";
        setTimeout(performAnalysis, 2000);
      }
    };
    runStep();

    async function performAnalysis() {
      try {
        const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error('Page not reachable or blocked');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const seoData = getProductPageContent(doc, url);
        const seo = analyzeProductSEO(doc, url);

        const failedMetrics = [];
        if (seo.onPage.score < 70) failedMetrics.push({ name: "On-Page SEO", grade: getPluginGrade(seo.onPage.score) });
        if (seo.technical.score < 80) failedMetrics.push({ name: "Technical SEO", grade: getPluginGrade(seo.technical.score) });
        if (seo.contentMedia.score < 70) failedMetrics.push({ name: "Content & Media", grade: getPluginGrade(seo.contentMedia.score) });
        if (seo.ecommerce.score < 75) failedMetrics.push({ name: "E-Commerce Signals (Pro)", grade: getPluginGrade(seo.ecommerce.score) });

        const health = getHealthLabel(seo.score);
        document.getElementById('loading').classList.add('hidden');
        const safeScore = isNaN(seo.score) ? 60 : seo.score;
        const overallGrade = getGradeInfo(safeScore);
        const ringColor = safeScore < 50 ? '#ef4444' : safeScore < 70 ? '#fb923c' : safeScore < 85 ? '#22c55e' : '#10b981';

        const onPageHTML = buildModuleHTML('On-Page SEO', seo.onPage.score, factorDefinitions.onPage, seo.onPage.details);
        const technicalHTML = buildModuleHTML('Technical SEO', seo.technical.score, factorDefinitions.technical, seo.technical.details);
        const contentMediaHTML = buildModuleHTML('Content & Media', seo.contentMedia.score, factorDefinitions.contentMedia, seo.contentMedia.details);
        const ecommerceHTML = `<div class="pro-blur relative">${buildModuleHTML('E-Commerce Specific (Pro)', seo.ecommerce.score, factorDefinitions.ecommerce, seo.ecommerce.details)}</div>`;

        const modulePriority = [
          { name: 'On-Page SEO', score: seo.onPage.score, threshold: 70, data: factorDefinitions.onPage },
          { name: 'Technical SEO', score: seo.technical.score, threshold: 80, data: factorDefinitions.technical },
          { name: 'Content & Media', score: seo.contentMedia.score, threshold: 70, data: factorDefinitions.contentMedia },
          { name: 'E-Commerce Specific', score: seo.ecommerce.score, threshold: 75, data: factorDefinitions.ecommerce }
        ];
        const failedModules = modulePriority.filter(m => m.score < m.threshold);
        const priorityFixes = [];
        failedModules.forEach(mod => {
          if (mod.data.factors.length > 0) {
            priorityFixes.push({ ...mod.data.factors[0], module: mod.name, extraCount: mod.data.factors.length });
          }
        });
        if (priorityFixes.length < 3 && failedModules.length > 0) {
          const worstModule = failedModules[0];
          if (worstModule.data.factors.length >= 2) {
            priorityFixes.push({ ...worstModule.data.factors[1], module: worstModule.name, isSecond: true, extraCount: worstModule.data.factors.length });
          }
        }

        let priorityFixesHTML = '';
        if (priorityFixes.length > 0) {
          priorityFixesHTML = priorityFixes.map((fix, index) => `
            <div class="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
              <div class="text-5xl font-black text-purple-600">${index + 1}</div>
              <div class="flex-1">
                <p class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  ${fix.module} → ${fix.name}
                  ${fix.isSecond ? `<span class="text-sm font-normal text-purple-600 dark:text-purple-400 ml-3">(${fix.extraCount}/${fix.extraCount} failed)</span>` : ''}
                </p>
                <p class="text-lg leading-relaxed text-gray-800 dark:text-gray-200">${fix.howToFix}</p>
              </div>
            </div>
          `).join('');
        } else {
          priorityFixesHTML = `
            <div class="p-12 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-3xl border border-green-500/50 text-center">
              <p class="text-5xl mb-6">🎉</p>
              <p class="text-4xl font-black text-green-600 dark:text-green-400 mb-4">Strong Product Page SEO!</p>
              <p class="text-2xl text-gray-800 dark:text-gray-200">Your page is well-optimized across all checked areas. No critical issues detected.</p>
              <p class="text-lg text-gray-500 dark:text-gray-200 mt-6">Keep monitoring — ongoing tweaks can still lift rankings and conversions.</p>
            </div>`;
        }

        const failedCount = failedModules.length;
        let projectedHealth = health.text;
        let healthImprovement = '';
        if (failedCount >= 3) {
          projectedHealth = 'Strong';
          healthImprovement = 'Poor → Strong';
        } else if (failedCount === 2) {
          projectedHealth = health.text === 'Poor' ? 'Needs Work' : 'Strong';
          healthImprovement = health.text === 'Poor' ? 'Poor → Needs Work' : 'Needs Work → Strong';
        } else if (failedCount === 1) {
          healthImprovement = 'Moderate improvement';
        } else {
          healthImprovement = 'Already strong';
        }
        const projectedColor = projectedHealth === 'Strong' ? 'from-green-400 to-emerald-600' :
                               projectedHealth === 'Needs Work' ? 'from-yellow-400 to-orange-600' : 'from-red-500 to-pink-600';

        let impactHTML = `
          <div class="grid md:grid-cols-2 gap-8 my-20">
            <div class="p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl border border-purple-400/30">
              <h3 class="text-3xl font-black mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">SEO Health Improvement</h3>
              <div class="text-center mb-8">
                <div class="flex items-center justify-center gap-8 text-4xl font-black mb-6">
                  <span class="bg-gradient-to-r ${health.color} bg-clip-text text-transparent">${health.text}</span>
                  <span class="text-purple-600">→</span>
                  <span class="bg-gradient-to-r ${projectedColor} bg-clip-text text-transparent">${projectedHealth}</span>
                </div>
                <p class="text-xl text-gray-800 dark:text-gray-200">${healthImprovement}</p>
              </div>
              <p class="text-center text-lg text-gray-500 dark:text-gray-200 mt-6">Fixing top issues can significantly boost rankings, rich snippet eligibility, and CTR.</p>
            </div>
            <div class="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl border border-cyan-400/30">
              <h3 class="text-3xl font-black mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent text-center">Potential Gains</h3>
              <ul class="space-y-8">
                <li class="flex items-center gap-6">
                  <span class="text-2xl">📈</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-500 dark:text-gray-200">Organic CTR Lift</p>
                    <p class="text-lg text-gray-500 dark:text-gray-200">Potential ${failedCount === 0 ? 'Strong' : failedCount * 10 + '-' + failedCount * 20 + '%'} from rich snippets</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-purple-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : 100 - failedCount * 20 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-2xl">🔍</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-500 dark:text-gray-200">Ranking Potential</p>
                    <p class="text-lg text-gray-500 dark:text-gray-200">Potential ${failedCount === 0 ? 'Top-tier' : 'Significant climb'} after fixes</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-cyan-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : 80 - failedCount * 15 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-2xl">🛒</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-500 dark:text-gray-200">Conversion Rate Lift</p>
                    <p class="text-lg text-gray-500 dark:text-gray-200">Potential ${failedCount === 0 ? 'Strong baseline' : failedCount * 10 + '-' + failedCount * 25 + '%'} from better UX</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-blue-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : 70 - failedCount * 15 + '%'}"></div>
                    </div>
                  </div>
                </li>
              </ul>
              <p class="text-sm text-gray-500 dark:text-gray-200 mt-8 text-center">Estimates based on eCommerce SEO benchmarks. Schema and content fixes often yield the biggest CTR gains.</p>
            </div>
          </div>`;

        const modules = [
          { name: 'On-Page SEO', score: seo.onPage.score },
          { name: 'Technical SEO', score: seo.technical.score },
          { name: 'Content & Media', score: seo.contentMedia.score },
          { name: 'E-Commerce (Pro)', score: seo.ecommerce.score }
        ];
        const scores = modules.map(m => m.score);
        const offset = 240;
        const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });

        results.innerHTML = `
          <!-- Big Overall Score Card -->
          <div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${safeScore >= 85 ? 'border-emerald-500' : safeScore >= 70 ? 'border-teal-500' : safeScore >= 50 ? 'border-orange-500' : 'border-red-500'}">
              <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Product Page Health Score</p>
              <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
                <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                  <circle cx="100" cy="100" r="90" stroke="#e5e7eb dark:stroke-gray-700" stroke-width="16" fill="none"/>
                  <circle cx="100" cy="100" r="90"
                          stroke="${ringColor}"
                          stroke-width="16" fill="none"
                          stroke-dasharray="${(safeScore / 100) * 565} 565"
                          stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-5xl sm:text-6xl font-black drop-shadow-lg" style="color: ${ringColor};">
                      ${safeScore}
                    </div>
                    <div class="text-lg sm:text-xl opacity-80 -mt-1" style="color: ${ringColor};">
                      /100
                    </div>
                  </div>
                </div>
              </div>
              ${(() => {
                const pageTitle = doc?.title?.trim() || '';
                const truncated = pageTitle.length > 65 ? pageTitle.substring(0, 65) + '...' : pageTitle;
                return truncated ? `<p class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>` : '';
              })()}
              <div class="mt-6 text-center">
                <p class="text-6xl sm:text-5xl md:text-6xl font-bold ${overallGrade.color} drop-shadow-lg">
                  ${overallGrade.emoji}
                </p>
                <p class="text-4xl sm:text-5xl font-bold ${overallGrade.color} mt-3 sm:mt-4">
                  ${overallGrade.grade}
                </p>
                <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-3 sm:mt-4">Product Page Health</p>
              </div>
            </div>
          </div>
          <!-- Health Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">Health Status:</p>
            <div class="flex flex-col items-center gap-6">
              <div class="flex items-center gap-6 text-4xl">
                <span class="${health.text === 'Excellent' ? 'text-green-600' : health.text === 'Strong' ? 'text-teal-600' : health.text === 'Needs Work' ? 'text-orange-600' : 'text-red-600'}">
                  ${health.text === 'Excellent' ? '🏆' : health.text === 'Strong' ? '✅' : health.text === 'Needs Work' ? '⚠️' : '❌'}
                </span>
              </div>
              <p class="text-4xl font-black bg-gradient-to-r ${health.color} bg-clip-text text-transparent">
                ${health.text}
              </p>
            </div>
            <p class="text-xl text-gray-800 dark:text-gray-200 mt-10">Analyzed ${seoData.wordCount} words + ${seoData.imageCount} images</p>
          </div>
          <!-- SEO Health Radar Chart -->
          <div class="max-w-5xl mx-auto my-16 px-4">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
              <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">SEO Health Radar</h3>
              <div class="hidden md:block w-full">
                <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
              </div>
              <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
                Radar chart available on desktop/tablet
              </p>
              <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
                Visual overview of your product page across key SEO areas
              </p>
            </div>
          </div>
          <!-- Modules Grid -->
          <div class="grid gap-8 my-16 max-w-7xl mx-auto px-4">
            <div class="grid md:grid-cols-2 gap-8">${onPageHTML}${technicalHTML}</div>
            <div class="grid md:grid-cols-2 gap-8">${contentMediaHTML}${ecommerceHTML}</div>
          </div>
          <!-- Top Priority Fixes -->
          <div class="text-center my-20">
            <h2 class="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-12">
              Top Priority SEO Fixes
            </h2>
            <div class="max-w-5xl mx-auto space-y-8">
              ${priorityFixesHTML}
            </div>
            ${priorityFixes.length > 0 ? `
            <p class="mt-12 text-xl text-gray-800 dark:text-gray-200">
              Prioritized by impact — focus on lowest-scoring areas first for biggest ranking & conversion gains.
            </p>` : ''}
          </div>
          <!-- Plugin Solutions Section -->
          <div id="plugin-solutions-section" class="mt-16 px-4"></div>
          <!-- SEO & Conversion Impact -->
          ${impactHTML}
          <!-- PDF Button -->
          <div class="text-center my-16">
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
              <span class="flex items-center gap-6">Save Report 📄</span>
              <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        `;

        setTimeout(() => {
          const canvas = document.getElementById('health-radar');
          if (!canvas) return;
          try {
            const ctx = canvas.getContext('2d');
            const labelColor = '#9ca3af';
            const gridColor = 'rgba(156, 163, 175, 0.3)';
            const borderColor = '#22c55e';
            const fillColor = 'rgba(34, 197, 94, 0.15)';
            window.myChart = new Chart(ctx, {
              type: 'radar',
              data: {
                labels: modules.map(m => m.name),
                datasets: [{
                  label: 'Health Score',
                  data: scores,
                  backgroundColor: fillColor,
                  borderColor: borderColor,
                  borderWidth: 4,
                  pointRadius: 8,
                  pointHoverRadius: 12,
                  pointBackgroundColor: scores.map(s => s >= 85 ? '#10b981' : s >= 70 ? '#22c55e' : s >= 50 ? '#fb923c' : '#ef4444'),
                  pointBorderColor: '#fff',
                  pointBorderWidth: 3
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: labelColor },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 15, weight: '600' } }
                  }
                },
                plugins: { legend: { display: false } }
              }
            });
          } catch (e) {
            console.error('Radar chart failed', e);
          }
        }, 150);

        if (typeof renderPluginSolutions === 'function') {
          renderPluginSolutions(failedMetrics, 'plugin-solutions-section');
        } else {
          setTimeout(() => {
            if (typeof renderPluginSolutions === 'function') {
              renderPluginSolutions(failedMetrics, 'plugin-solutions-section');
            }
          }, 500);
        }
      } catch (err) {
        document.getElementById('loading').classList.add('hidden');
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-600 dark:text-gray-400">Please try a public product page URL and check your connection.</p>
          </div>
        `;
      }
    }
  });

  // Button toggle for More Details and Show Fixes (delegated)
  document.addEventListener('click', e => {
    const target = e.target.closest('.more-details, .show-fixes');
    if (!target) return;
    const card = target.closest('.module-card');
    if (!card) return;
    if (target.classList.contains('more-details')) {
      const panel = card.querySelector('.more-details-panel');
      if (panel) panel.classList.toggle('hidden');
    } else if (target.classList.contains('show-fixes')) {
      const panel = card.querySelector('.fixes-panel');
      if (panel) panel.classList.toggle('hidden');
    }
  });
});