// product-torch/script.js - COMPLETE WORKING VERSION - all modules, plugin solutions, radar chart, priority fixes

// Dynamic import for plugin solutions (same as working quit-risk-tool)
let renderPluginSolutions;
import('./plugin-solutions.js')
  .then(module => {
    renderPluginSolutions = module.renderPluginSolutions;
    console.log('[Plugin] Successfully loaded renderPluginSolutions');
  })
  .catch(err => console.error('[Plugin] Failed to load plugin-solutions.js:', err));

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
        { name: "Mobile-Friendliness", key: "mobile", threshold: 85, shortDesc: "Responsive + correct viewport meta + passes basic Core Web Vitals checks (no user-scalable=no).", howToFix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>. Use responsive CSS. Avoid fixed widths or user-scalable=no. Test with Google's Mobile-Friendly Test." },
        { name: "HTTPS Implementation", key: "https", threshold: 95, shortDesc: "Served over HTTPS with valid cert, no mixed content (HTTP resources on HTTPS page).", howToFix: "Force HTTPS redirect. Update all images/scripts/links to https://. Fix mixed content via browser dev tools console." },
        { name: "Canonical Tags", key: "canonical", threshold: 85, shortDesc: "Self-referencing canonical exists and exactly matches current URL (protocol + trailing slash).", howToFix: "Add <link rel='canonical' href='https://full-current-url/'>. Ensure it matches live URL 100% (case-sensitive)." },
        { name: "Meta Robots Directives", key: "robots", threshold: 90, shortDesc: "No noindex or nofollow on live product page (unless intentional).", howToFix: "Remove <meta name='robots' content='noindex'> or similar. Use robots.txt only for blocking unwanted pages, not product pages." },
        { name: "Sitemap Inclusion Hints", key: "sitemapHint", threshold: 70, shortDesc: "URL pattern matches typical product pages (suggests inclusion in sitemap.xml).", howToFix: "Add this URL pattern to sitemap.xml. Submit sitemap in Google Search Console. Use dynamic sitemaps for large catalogs." }
      ],
      moduleWhat: "Technical SEO checks crawlability, mobile readiness, security, and duplicate prevention — essential for product pages to be indexed and ranked properly.",
      moduleHow: "Ensure HTTPS, proper viewport, canonicals, and indexable robots directives. Keep technical foundation clean.",
      moduleWhy: "Technical issues can prevent indexing, hurt mobile rankings, or cause duplicate content penalties — all block traffic."
    },
    contentMedia: {
      factors: [
        { name: "Product Description Quality", key: "description", threshold: 75, shortDesc: "300+ words ideal, unique, benefit-focused, structured (bullets/headings), keyword-rich.", howToFix: "Expand to 400–800 words in competitive niches. Start with benefits, use bullets for features, add subheadings. Make it unique vs competitors." },
        { name: "Image Optimization", key: "images", threshold: 80, shortDesc: "Meaningful images have descriptive keyword-rich alt text, lazy loading, responsive (srcset), <100KB.", howToFix: "Add alt text like 'Santa Cruz Dreadnought Quilted Mahogany Acoustic Guitar front view'. Use loading='lazy', srcset/sizes. Compress images." },
        { name: "Video Embed Quality", key: "video", threshold: 70, shortDesc: "Relevant videos present with captions (<track>), poster thumbnail, embedded properly.", howToFix: "Embed YouTube/Vimeo with captions enabled. Add <track kind='subtitles'> or use platform auto-captions. Include poster image." },
        { name: "User-Generated Content (UGC)", key: "ugc", threshold: 70, shortDesc: "Reviews/ratings visible with star aggregate and review count.", howToFix: "Install review app (Judge.me, Yotpo, Loox). Display average rating + number of reviews. Encourage photo/video reviews." },
        { name: "Internal Linking", key: "internalLinks", threshold: 70, shortDesc: "3+ relevant contextual links to related products/categories/guides with descriptive anchors.", howToFix: "Add 3–6 internal links in description or below (e.g. 'see matching picks', 'learn more about tonewoods'). Use keyword-rich anchors." },
        { name: "Breadcrumb Navigation", key: "breadcrumbs", threshold: 85, shortDesc: "Clear hierarchy breadcrumbs present (Home > Category > Subcategory > Product).", howToFix: "Implement breadcrumbs with schema (BreadcrumbList JSON-LD). Use links like Home > Acoustic Guitars > Dreadnought > Santa Cruz Dreadnought." }
      ],
      moduleWhat: "Content & Media evaluates richness, accessibility, and engagement signals that keep users on-page and build trust.",
      moduleHow: "Create detailed, benefit-driven descriptions. Optimize all images/videos. Encourage reviews. Add navigation aids.",
      moduleWhy: "High-quality content reduces bounce rate, improves dwell time, and strengthens topical authority — key ranking factors."
    },
    ecommerce: {
      factors: [
        { name: "Product Schema Markup", key: "schema", threshold: 90, shortDesc: "Valid JSON-LD Product schema with required fields (name, image, description, offers, brand, sku/mpn).", howToFix: "Add complete <script type='application/ld+json'> Product schema in <head> or <body>. Include @context, @type: 'Product', name, image (array), description, brand, sku or mpn, offers." },
        { name: "Price & Availability Markup", key: "priceAvailability", threshold: 85, shortDesc: "Offers include priceCurrency, price (positive number), availability (InStock/OutOfStock/PreOrder etc.), priceValidUntil optional.", howToFix: "Ensure offers.price is a string number (e.g. '1299.00'), offers.priceCurrency (e.g. 'USD'), offers.availability uses schema.org enums like 'https://schema.org/InStock'." },
        { name: "Review Schema & Aggregation", key: "reviews", threshold: 80, shortDesc: "AggregateRating present with ratingValue (1.0–5.0) and reviewCount (or ratingCount), ideally with individual Review items.", howToFix: "Add AggregateRating inside Product schema: ratingValue (decimal), reviewCount (integer). Use real data from review app. Optional: add 2–5 Review objects." },
        { name: "Variant Handling", key: "variants", threshold: 75, shortDesc: "Variants use single-page selectors (dropdowns/swatches) or separate URLs have self-canonical + no duplicate content.", howToFix: "Prefer single URL with JS variant switching. If separate URLs, add <link rel='canonical'> pointing to main product. Avoid thin duplicate pages per variant." },
        { name: "Social Sharing Integration", key: "social", threshold: 70, shortDesc: "Open Graph tags (og:title, og:description, og:image 1200×630+, og:url) and optionally Twitter Cards.", howToFix: "Add <meta property='og:title' content='...'> etc. in <head>. Use high-res product image for og:image. Set og:url to canonical URL. Add twitter:card if desired." }
      ],
      moduleWhat: "eCommerce Signals checks structured data, pricing, reviews, variants, and social signals — essential for rich results and conversions.",
      moduleHow: "Implement complete Product + Offer + AggregateRating schema. Handle variants cleanly. Add Open Graph tags.",
      moduleWhy: "Schema enables rich snippets (price, stars, images in SERPs). Reviews add trust. Proper variants prevent duplicate content penalties."
    }
  };

  // Helper functions (all present)
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
      if (!script.textContent?.trim()) return;
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Product') {
          schemas.push(data);
        } else if (Array.isArray(data['@graph'])) {
          const productInGraph = data['@graph'].find(g => g['@type'] === 'Product');
          if (productInGraph) schemas.push(productInGraph);
        }
      } catch (e) {
        // skip invalid JSON
      }
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
    const stopWords = /^(the|a|an|best|top|new|buy|shop|order|free|sale|online|free shipping|with|for|and|in|at|to|of)$/i;
    primaryKeyword = primaryKeyword.replace(stopWords, '').trim().replace(stopWords, '').trim();
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
    else if (h1s.length === 0) headingScore += 20;
    else headingScore += 10;
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
    let mobileScore = data.hasViewport ? 60 : 10;
    if (data.viewportContent && /width\s*=\s*device-width/i.test(data.viewportContent)) mobileScore += 30;
    if (data.viewportContent.includes('initial-scale=1')) mobileScore += 10;
    if (!data.viewportContent.includes('user-scalable=no') && !data.viewportContent.includes('maximum-scale=1')) {
      mobileScore += 10;
    } else {
      mobileScore -= 15;
    }
    mobileScore = Math.min(100, Math.max(0, mobileScore));
    details.mobile = { viewportPresent: data.hasViewport, score: mobileScore };

    const isHttps = data.url.startsWith('https');
    details.https = { isHttps, score: isHttps ? 95 : 0 };

    const canonical = doc.querySelector('link[rel="canonical"]');
    let canonicalScore = 20;
    if (canonical && canonical.hasAttribute('href')) {
      const canonHref = canonical.href.trim();
      const currentNormalized = data.url.replace(/\/$/, '');
      const canonNormalized = canonHref.replace(/\/$/, '');
      if (canonHref === data.url || canonHref === data.url + '/') {
        canonicalScore = 95;
      } else if (currentNormalized === canonNormalized) {
        canonicalScore = 80;
      } else {
        canonicalScore = 40;
      }
    }
    details.canonical = {
      present: !!canonical,
      matchesUrl: canonical?.href === data.url || canonical?.href === data.url + '/',
      score: canonicalScore
    };

    const robotsMeta = doc.querySelector('meta[name="robots"]');
    let robotsScore = 95;
    if (robotsMeta) {
      const content = (robotsMeta.content || '').toLowerCase();
      if (/noindex/i.test(content) || /nofollow/i.test(content)) {
        robotsScore = 15;
      }
    }
    details.robots = { indexable: robotsScore === 95, score: robotsScore };

    let sitemapScore = /\/product[s]?\/|\/item\/|\/p\/|\/shop\/|\/collections\/[^/]+\/products\//i.test(data.url) ? 80 : 45;
    details.sitemapHint = { likelyIncluded: sitemapScore >= 70, score: sitemapScore };

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
    let descScore = 20;
    if (data.wordCount >= 500) descScore = 90;
    else if (data.wordCount >= 300) descScore = 75;
    else if (data.wordCount >= 200) descScore = 55;
    else if (data.wordCount >= 100) descScore = 35;
    else descScore = 15;
    const hasStructure = doc.querySelectorAll('h2,h3,ul,ol').length >= 3;
    if (hasStructure) descScore += 15;
    descScore = Math.min(100, descScore);
    details.description = { wordCount: data.wordCount, hasStructure, score: descScore };

    let imgScore = 30;
    const { missingCount, meaningfulCount, totalImages } = data.altData;
    if (totalImages === 0) imgScore = 40;
    else if (meaningfulCount > 0) {
      const altRatio = meaningfulCount > 0 ? (missingCount / meaningfulCount) : 1;
      if (altRatio === 0) imgScore = 90;
      else if (altRatio < 0.2) imgScore = 75;
      else if (altRatio < 0.5) imgScore = 50;
      else imgScore = 25;
    }
    details.images = { missingAlt: missingCount, meaningful: meaningfulCount, total: totalImages, score: imgScore };

    const videoElements = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="youtu.be"]');
    let videoScore = videoElements.length > 0 ? 50 : 25;
    if (videoElements.length > 0 && doc.querySelector('track')) videoScore += 30;
    if (videoElements.length > 1) videoScore += 10;
    videoScore = Math.min(100, videoScore);
    details.video = { present: videoElements.length > 0, captions: !!doc.querySelector('track'), count: videoElements.length, score: videoScore };

    const hasUGC = hasReviewSection(doc);
    let ugcScore = hasUGC ? 80 : 35;
    details.ugc = { detected: hasUGC, score: ugcScore };

    let linkScore = 20;
    if (data.linkCount >= 8) linkScore = 85;
    else if (data.linkCount >= 5) linkScore = 70;
    else if (data.linkCount >= 3) linkScore = 50;
    else linkScore = 25;
    details.internalLinks = { count: data.linkCount, score: linkScore };

    const breadcrumbSelectors = '[aria-label*="breadcrumb" i], .breadcrumbs, .breadcrumb, .woocommerce-breadcrumb, .yoast-breadcrumb, .site-breadcrumb, .bread-crumb, .crumbs, .pathway, [itemprop="breadcrumb"]';
    const hasBreadcrumbs = !!doc.querySelector(breadcrumbSelectors);
    let breadcrumbScore = hasBreadcrumbs ? 90 : 30;
    details.breadcrumbs = { present: hasBreadcrumbs, score: breadcrumbScore };

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
    let details = {};
    const schemas = extractProductSchema(doc);
    const productSchema = schemas.find(s => s['@type'] === 'Product' ||
      (Array.isArray(s['@graph']) && s['@graph'].some(g => g['@type'] === 'Product'))) || {};

    let schemaScore = 20;
    if (Object.keys(productSchema).length > 0) {
      const requiredFields = ['name', 'image', 'description', 'offers'];
      const presentFields = requiredFields.filter(f => productSchema[f] !== undefined && productSchema[f] !== null);
      schemaScore = 40 + (presentFields.length / requiredFields.length) * 50;
      if (productSchema.brand && (productSchema.brand.name || productSchema.brand['@type'] === 'Brand')) schemaScore += 10;
      if (productSchema.sku || productSchema.mpn) schemaScore += 10;
    }
    schemaScore = Math.min(100, schemaScore);
    details.schema = {
      present: Object.keys(productSchema).length > 0,
      fieldsCount: Object.keys(productSchema).length,
      score: schemaScore
    };

    let priceScore = 20;
    if (productSchema.offers) {
      const offers = Array.isArray(productSchema.offers) ? productSchema.offers[0] : productSchema.offers;
      if (offers && typeof offers.price === 'string' && !isNaN(parseFloat(offers.price))) priceScore += 30;
      if (offers && offers.priceCurrency) priceScore += 20;
      if (offers && /InStock|OutOfStock|PreOrder|https:\/\/schema\.org\/InStock/i.test(offers.availability || '')) priceScore += 25;
    } else if (hasPriceMarkup(doc, productSchema)) {
      priceScore = 60;
    }
    priceScore = Math.min(100, priceScore);
    details.priceAvailability = { detected: priceScore >= 60, score: priceScore };

    let reviewScore = 15;
    if (productSchema.aggregateRating) {
      const agg = productSchema.aggregateRating;
      if (typeof agg.ratingValue === 'number' && agg.ratingValue >= 1 && agg.ratingValue <= 5) reviewScore += 40;
      if (typeof agg.reviewCount === 'number' && agg.reviewCount > 0) reviewScore += 35;
    } else if (hasReviewSection(doc)) {
      reviewScore = 50;
    }
    reviewScore = Math.min(100, reviewScore);
    details.reviews = {
      aggregateRatingPresent: !!productSchema.aggregateRating,
      score: reviewScore
    };

    const variantSelectors = doc.querySelectorAll('select[name*="variant"], select[name*="size"], select[name*="color"], select[name*="option"], input[type="radio"][name*="variant"], .variant-select, .swatch, .product-variants, [data-variant]');
    let variantScore = variantSelectors.length > 0 ? 70 : 40;
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (variantSelectors.length > 0 && canonical) variantScore += 20;
    variantScore = Math.min(100, variantScore);
    details.variants = { detected: variantSelectors.length > 0, score: variantScore };

    const ogTags = doc.querySelectorAll('meta[property^="og:"]');
    let socialScore = ogTags.length >= 3 ? 60 : 25;
    const requiredOg = ['og:title', 'og:description', 'og:image', 'og:url'];
    const presentOg = requiredOg.filter(p => !!doc.querySelector(`meta[property="${p}"]`));
    if (presentOg.length === requiredOg.length) socialScore = 90;
    else if (presentOg.length >= 3) socialScore = 70;
    details.social = { ogPresent: presentOg.length > 0, count: presentOg.length, score: socialScore };

    const score = Math.round(
      details.schema.score * 0.35 +
      details.priceAvailability.score * 0.25 +
      details.reviews.score * 0.20 +
      details.variants.score * 0.10 +
      details.social.score * 0.10
    );
    return { score: Math.min(100, Math.max(0, score)), details, isPro: true };
  }

  function getHealthLabel(score) {
  if (score >= 85) return { text: "Excellent", color: "from-green-400 to-emerald-600" };
  if (score >= 70) return { text: "Very Good", color: "from-green-200 to-green-400" }; 
  if (score >= 50) return { text: "Needs Improvement", color: "from-orange-400 to-orange-600" }; 
  return { text: "Needs Work", color: "from-red-400 to-red-600" }; 
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
    if (score >= 70) return { grade: 'Very Good', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 50) return { grade: 'Needs Improvement', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
    return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
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
      statusMessage = "Very Good";
      statusEmoji = "✅";
    } else if (value >= 50) {
      statusMessage = "Needs Improvement";
      statusEmoji = "⚠️";
    } else {
      statusMessage = "Needs Work";
      statusEmoji = "❌";
    }

    let metricsHTML = '';
    let failedOnlyHTML = '';
    let failedCount = 0;

    moduleData.factors.forEach(f => {
      let individualScore = (factorScores && f.key && factorScores[f.key] && factorScores[f.key].score !== undefined)
        ? factorScores[f.key].score
        : value;

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

        const failedFactors = [];
        const modulesData = [
          { name: "On-Page SEO", result: seo.onPage, definitions: factorDefinitions.onPage },
          { name: "Technical SEO", result: seo.technical, definitions: factorDefinitions.technical },
          { name: "Content & Media", result: seo.contentMedia, definitions: factorDefinitions.contentMedia },
          { name: "E-Commerce Signals", result: seo.ecommerce, definitions: factorDefinitions.ecommerce }
        ];
        modulesData.forEach(mod => {
          if (mod.result.details) {
            mod.definitions.factors.forEach(f => {
              const factorScore = mod.result.details[f.key]?.score;
              if (factorScore !== undefined && factorScore < f.threshold) {
                failedFactors.push({
                  module: mod.name,
                  name: f.name,
                  score: factorScore,
                  threshold: f.threshold,
                  grade: getPluginGrade(factorScore),
                  howToFix: f.howToFix,
                  isPro: mod.name.includes("(Pro)")
                });
              }
            });
          }
        });

        const health = getHealthLabel(seo.score);
        document.getElementById('loading').classList.add('hidden');
        const safeScore = isNaN(seo.score) ? 60 : seo.score;
        const overallGrade = getGradeInfo(safeScore);
        const ringColor = safeScore < 50 ? '#ef4444' : safeScore < 70 ? '#fb923c' : safeScore < 85 ? '#22c55e' : '#10b981';
        const onPageHTML = buildModuleHTML('On-Page SEO', seo.onPage.score, factorDefinitions.onPage, seo.onPage.details);
        const technicalHTML = buildModuleHTML('Technical SEO', seo.technical.score, factorDefinitions.technical, seo.technical.details);
        const contentMediaHTML = buildModuleHTML('Content & Media', seo.contentMedia.score, factorDefinitions.contentMedia, seo.contentMedia.details);
        const ecommerceHTML = buildModuleHTML('E-Commerce Signals', seo.ecommerce.score, factorDefinitions.ecommerce, seo.ecommerce.details);
        
        const modulePriority = [
          { name: 'On-Page SEO', score: seo.onPage.score, threshold: 70, data: factorDefinitions.onPage },
          { name: 'Technical SEO', score: seo.technical.score, threshold: 80, data: factorDefinitions.technical },
          { name: 'Content & Media', score: seo.contentMedia.score, threshold: 70, data: factorDefinitions.contentMedia },
          { name: 'E-Commerce Signals', score: seo.ecommerce.score, threshold: 75, data: factorDefinitions.ecommerce }
        ];
        const failedModules = modulePriority.filter(m => m.score < m.threshold);
// Priority fixes at METRIC level (all failed factors, sorted by lowest score first)
const priorityFixes = failedFactors
  .sort((a, b) => a.score - b.score) // lowest score first
  .slice(0, 3); // limit to top 3 worst metrics

let priorityFixesHTML = '';
if (priorityFixes.length > 0) {
  priorityFixesHTML = priorityFixes.map((fix, index) => `
    <div class="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
      <div class="text-5xl font-black text-purple-600">${index + 1}</div>
      <div class="flex-1">
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          ${fix.module} → ${fix.name}
          <span class="text-sm font-normal text-purple-600 dark:text-purple-400 ml-3">(${Math.round(fix.score)}/${fix.threshold})</span>
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
      <p class="text-2xl text-gray-800 dark:text-gray-200">No critical metric failures detected.</p>
    </div>`;
}

        const failedCount = failedModules.length;
        let projectedHealth = health.text;
let healthImprovement = '';
if (failedCount >= 3) {
  projectedHealth = 'Very Good';
  healthImprovement = 'Needs Work → Very Good';
} else if (failedCount === 2) {
  projectedHealth = health.text === 'Needs Work' ? 'Needs Improvement' : 'Very Good';
  healthImprovement = health.text === 'Needs Work' ? 'Needs Work → Needs Improvement' : 'Needs Work → Very Good';
} else if (failedCount === 1) {
  healthImprovement = 'Moderate improvement';
} else {
  healthImprovement = 'Already strong';
}
const projectedColor = projectedHealth === 'Very Good' ? 'from-green-200 to-green-400' :
                       projectedHealth === 'Needs Improvement' ? 'from-orange-400 to-orange-600' :
                       projectedHealth === 'Needs Work' ? 'from-red-400 to-red-600' : 'from-green-400 to-emerald-600';

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
            <p class="text-lg text-gray-500 dark:text-gray-200">Potential ${failedCount === 0 ? 'Very Good' : failedCount * 10 + '-' + failedCount * 20 + '%'} from rich snippets</p>
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
          { name: 'E-Commerce Signals', score: seo.ecommerce.score }
        ];
        const scores = modules.map(m => m.score);
        const offset = 240;
        const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });

// Clear loading and prepare results container
document.getElementById('loading').classList.add('hidden');

// Create main wrapper (instead of innerHTML dump)
const wrapper = document.createElement('div');
wrapper.className = 'container mx-auto px-4 py-8';

// Append Score Card + Verdict
const scoreCard = document.createElement('div');
scoreCard.innerHTML = `
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
  <span class="${health.text === 'Excellent' ? 'text-green-600' : health.text === 'Very Good' ? 'text-green-400' : health.text === 'Needs Improvement' ? 'text-orange-600' : 'text-red-600'}">
    ${health.text === 'Excellent' ? '🏆' : health.text === 'Very Good' ? '✅' : health.text === 'Needs Improvement' ? '⚠️' : '❌'}
  </span>
</div>
<p class="text-4xl font-black bg-gradient-to-r ${health.color} bg-clip-text text-transparent">
  ${health.text}
</p>
    </div>
    <p class="text-xl text-gray-800 dark:text-gray-200 mt-10">Analyzed ${seoData.wordCount} words + ${seoData.imageCount} images</p>
  </div>
`;
wrapper.appendChild(scoreCard);

// Append Radar
const radarSection = document.createElement('div');
radarSection.innerHTML = `
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
`;
wrapper.appendChild(radarSection);

// Append Modules Grid
const modulesGrid = document.createElement('div');
modulesGrid.className = 'grid gap-8 my-16 max-w-7xl mx-auto px-4';
modulesGrid.innerHTML = `
  <div class="grid md:grid-cols-2 gap-8">${onPageHTML}${technicalHTML}</div>
  <div class="grid md:grid-cols-2 gap-8">${contentMediaHTML}${ecommerceHTML}</div>
`;
wrapper.appendChild(modulesGrid);

// Append Priority Fixes 
const prioritySection = document.createElement('div');
prioritySection.className = 'text-center my-20';
prioritySection.innerHTML = `
  <h2 class="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-12">
    Top Priority Fixes
  </h2>
  <div class="max-w-5xl mx-auto space-y-8">
    ${priorityFixesHTML || `
      <div class="p-12 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-3xl border border-green-500/50 text-center">
        <p class="text-5xl mb-6">🎉</p>
        <p class="text-4xl font-black text-green-600 dark:text-green-400 mb-4">Strong Product Page SEO!</p>
        <p class="text-2xl text-gray-800 dark:text-gray-200">No critical issues detected.</p>
      </div>
    `}
  </div>
  ${priorityFixes.length > 0 ? `
  <p class="mt-12 text-xl text-gray-800 dark:text-gray-200">
    Prioritized by impact — focus on lowest-scoring areas first for biggest ranking & conversion gains.
  </p>` : ''}
`;
wrapper.appendChild(prioritySection);

// Append Plugin Section (empty div)
const pluginSection = document.createElement('div');
pluginSection.id = 'plugin-solutions-section';
pluginSection.className = 'mt-16 px-4';
wrapper.appendChild(pluginSection);

// Append Impact Grid
const impactSection = document.createElement('div');
impactSection.innerHTML = impactHTML;
wrapper.appendChild(impactSection);

// Append PDF Button
const pdfSection = document.createElement('div');
pdfSection.className = 'text-center my-16';
pdfSection.innerHTML = `
  <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
          class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
    <span class="flex items-center gap-6">Save Report 📄</span>
    <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </button>
`;
wrapper.appendChild(pdfSection);

// Insert wrapper into results
results.appendChild(wrapper);

// Direct plugin render call
if (typeof renderPluginSolutions === 'function') {
  console.log('Calling renderPluginSolutions immediately');
  renderPluginSolutions(failedFactors, 'plugin-solutions-section');
} else {
  console.warn('renderPluginSolutions not loaded yet - delaying 500ms');
  setTimeout(() => {
    if (typeof renderPluginSolutions === 'function') {
      console.log('Delayed call successful');
      renderPluginSolutions(failedFactors, 'plugin-solutions-section');
    } else {
      console.error('renderPluginSolutions still not available');
    }
  }, 500);
}

// Radar chart
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

// Button toggle
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

      } catch (err) {
        console.error('[Analysis failed]', err);
        document.getElementById('loading').classList.add('hidden');
        results.innerHTML = `
          <div class="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-400 dark:border-red-600 max-w-2xl mx-auto">
            <p class="text-3xl font-bold text-red-600 dark:text-red-400 mb-6">Analysis Failed</p>
            <p class="text-xl text-gray-700 dark:text-gray-300 mb-6">
              ${err.message || 'Could not fetch or parse the page'}
            </p>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Please try a different public product page URL.
            </p>
          </div>`;
      }
    }
  });
});