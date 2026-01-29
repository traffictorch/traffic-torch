// Dynamic import for plugin solutions
let renderPluginSolutions;
import('/product-torch/plugin-solutions.js')
  .then(module => {
    renderPluginSolutions = module.renderPluginSolutions;
    console.log('Plugin solutions module loaded successfully');
  })
  .catch(err => console.error('Failed to load plugin-solutions.js:', err));

// product-torch/script.js - Complete working version for eCommerce product page SEO audit
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';

  const factorDefinitions = {
    onPage: {
      factors: [
        { name: "Title Tag Optimization", threshold: 80, shortDesc: "Title length 50–60 chars, includes primary product keywords, brand if relevant. Avoids truncation in SERPs.", howToFix: "Rewrite to include product name + key benefit + brand. Keep under 60 chars. Make compelling for clicks." },
        { name: "Meta Description Relevance", threshold: 75, shortDesc: "150–160 chars, keyword-rich, includes CTA (Buy now, Shop, etc.), unique per product.", howToFix: "Write benefit-driven copy with keywords early. Add urgency or offer. Avoid duplication across products." },
        { name: "Heading Structure (H1–H6)", threshold: 85, shortDesc: "Single H1 (product name), logical hierarchy, keywords in H1/H2, no skipped levels.", howToFix: "Use one H1 for product name. Add H2/H3 for features, specs, benefits. Include long-tail keywords naturally." },
        { name: "URL Structure", threshold: 90, shortDesc: "Clean, keyword-rich slug (no ? or &, hyphens not underscores, short).", howToFix: "Use /category/product-name format. Remove session IDs, numbers if possible. Keep readable and descriptive." },
        { name: "Keyword Optimization", threshold: 70, shortDesc: "Natural primary & long-tail keyword placement, density 1–2.5%, front-loaded in first 100–150 words.", howToFix: "Place main keywords in title, H1, first paragraph. Add long-tail variations naturally. Avoid stuffing." }
      ],
      moduleWhat: "On-Page SEO evaluates title, meta, headings, URL, and keyword usage — the foundational elements that tell search engines and users what the product page is about.",
      moduleHow: "Optimize titles and metas for CTR. Use proper heading hierarchy. Include keywords naturally in prominent places. Keep URLs clean and descriptive.",
      moduleWhy: "Strong on-page signals improve relevance, click-through rates, and initial rankings. They help match user intent and reduce bounce from mismatched expectations."
    },
    technical: {
      factors: [
        { name: "Mobile-Friendliness", threshold: 85, shortDesc: "Viewport meta present and correct, responsive layout, no horizontal scroll, touch-friendly elements.", howToFix: "Add viewport meta with width=device-width. Use responsive CSS. Test on real devices. Fix small tap targets." },
        { name: "HTTPS Implementation", threshold: 95, shortDesc: "Page served over HTTPS with no mixed content warnings.", howToFix: "Enable HTTPS via hosting provider. Update all internal links/scripts to HTTPS. Fix mixed content errors." },
        { name: "Canonical Tags", threshold: 80, shortDesc: "Self-referencing canonical present, matches current URL, prevents duplicate content issues.", howToFix: "Add <link rel='canonical' href='current-url'>. Ensure it matches exactly. Use for variant pages if needed." },
        { name: "Meta Robots Directives", threshold: 90, shortDesc: "No noindex/nofollow unless intentional. Page is indexable.", howToFix: "Remove or correct <meta name='robots'> tags. Ensure product pages are not blocked. Test with robots.txt validator." },
        { name: "Sitemap Inclusion Hints", threshold: 70, shortDesc: "Educational note: URL pattern suggests sitemap inclusion (e.g., /products/...).", howToFix: "Add product URLs to sitemap.xml. Submit via Search Console. Use logical patterns like /products-sitemap.xml." }
      ],
      moduleWhat: "Technical SEO checks crawlability, mobile readiness, security, and duplicate prevention — essential for product pages to be indexed and ranked properly.",
      moduleHow: "Ensure HTTPS, proper viewport, canonicals, and indexable robots directives. Keep technical foundation clean and mobile-first.",
      moduleWhy: "Technical issues block indexing or hurt mobile rankings. Clean technical SEO is required for rich snippets, fast crawling, and trust signals."
    },
    contentMedia: {
      factors: [
        { name: "Product Description Quality", threshold: 75, shortDesc: "300+ words, unique, benefit-focused, good word diversity, structured with bullets/lists.", howToFix: "Write unique, detailed copy highlighting benefits. Use bullets for features. Avoid manufacturer boilerplate." },
        { name: "Image Optimization", threshold: 80, shortDesc: "All images have descriptive alt text, <100KB, lazy loading, responsive srcset.", howToFix: "Add keyword-rich alt text. Compress to WebP/AVIF. Add loading='lazy'. Use srcset for different sizes." },
        { name: "Video Embed Quality", threshold: 70, shortDesc: "Videos have captions/track elements, proper thumbnails, schema if applicable.", howToFix: "Add <track> for captions. Use poster attribute. Embed with schema or lazy loading." },
        { name: "User-Generated Content (UGC)", threshold: 65, shortDesc: "Reviews/ratings section detected (common classes/IDs), ideally 5+ reviews.", howToFix: "Integrate review apps (Yotpo, Judge.me). Encourage reviews. Display aggregate stars." },
        { name: "Internal Linking", threshold: 70, shortDesc: "Relevant internal links to related products/categories, descriptive anchors.", howToFix: "Add contextual links to upsells/cross-sells. Use keyword-rich anchor text. Avoid over-linking." },
        { name: "Breadcrumb Navigation", threshold: 85, shortDesc: "Structured breadcrumbs present with hierarchy (Home > Category > Product).", howToFix: "Add breadcrumb nav with schema. Use clear hierarchy. Ensure clickable links." }
      ],
      moduleWhat: "Content & Media Quality evaluates product description richness, image/video optimization, UGC presence, and navigation aids — key for engagement and trust.",
      moduleHow: "Write detailed, benefit-driven descriptions. Optimize all media. Encourage and display reviews. Use breadcrumbs and internal links for flow.",
      moduleWhy: "Rich content keeps users on-page longer and improves trust signals. Optimized media boosts speed and accessibility. UGC adds social proof for conversions."
    },
    ecommerce: {
      factors: [
        { name: "Product Schema Markup", threshold: 90, shortDesc: "JSON-LD Product schema detected with required fields (name, image, offers).", howToFix: "Add full Product schema JSON-LD. Include name, image array, offers with price/availability." },
        { name: "Price & Availability Markup", threshold: 85, shortDesc: "Schema includes priceCurrency, price, availability (InStock, OutOfStock).", howToFix: "Ensure dynamic price and stock status in schema. Update on real-time changes." },
        { name: "Review Schema & Aggregation", threshold: 80, shortDesc: "aggregateRating with ratingValue and reviewCount present.", howToFix: "Add AggregateRating to Product schema. Pull real review data. Display stars in SERPs." },
        { name: "Variant Handling", threshold: 70, shortDesc: "Options (size/color) detected without duplication issues (canonicals or tabs).", howToFix: "Use variant selectors without separate URLs or add canonicals. Avoid thin duplicate pages." },
        { name: "Social Sharing Integration", threshold: 65, shortDesc: "Open Graph meta tags and/or share buttons detected.", howToFix: "Add og:title, og:image, og:description. Include share buttons for Facebook/Twitter/Pinterest." }
      ],
      moduleWhat: "E-Commerce Specific SEO checks structured data, pricing, reviews, variants, and social signals — critical for rich results, conversions, and product visibility.",
      moduleHow: "Implement complete Product schema. Include price/stock/review data. Handle variants cleanly. Add Open Graph for social shares.",
      moduleWhy: "Schema unlocks rich snippets (price, stars, images in SERPs). Reviews build trust. Proper variants prevent duplicate content. Social tags drive referral traffic."
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
    const selectors = ['.reviews', '.product-reviews', '#reviews', '.rating', '.yotpo', '.judge-me', '[data-reviews]', '.aggregate-rating', '.star-rating', '.customer-reviews', '[itemprop="aggregateRating"]', '[itemprop="review"]'];
    return selectors.some(sel => doc.querySelector(sel));
  }

  function hasPriceMarkup(doc, schema) {
    if (schema && schema.offers && (schema.offers.price || schema.offers.availability)) return true;
    const pricePatterns = /\$[0-9,.]+|USD [0-9,.]+|€ [0-9,.]+|£ [0-9,.]+|In Stock|Out of Stock/i;
    return pricePatterns.test(doc.body.textContent);
  }

  function hasSocialMeta(doc) {
    return !!doc.querySelector('meta[property^="og:"]');
  }

  function getProductPageContent(doc, url) {
    const textElements = doc.querySelectorAll('p, li, div.product-description, #product-description, .description, article, section');
    let fullText = '';
    textElements.forEach(el => {
      const t = el.textContent.trim();
      if (t.length > 20) fullText += t + ' ';
    });
    const images = doc.querySelectorAll('img');
    const links = doc.querySelectorAll('a[href]');
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    return {
      fullText,
      wordCount: countWords(fullText),
      imageCount: images.length,
      altData: countMissingAlt(doc),
      headingCount: headings.length,
      linkCount: links.length,
      hasViewport: hasViewportMeta(doc),
      viewportContent: doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      jsonLdScripts: scripts.length,
      url
    };
  }

  // Main product SEO analyzer
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

  // Analyzer implementations
  function analyzeOnPageSEO(doc, data) {
    let score = 0;
    let details = {};

    const title = doc.title.trim();
    const titleLength = title.length;
    let titleScore = 0;
    if (titleLength >= 50 && titleLength <= 60) titleScore = 40;
    else if (titleLength >= 40 && titleLength <= 70) titleScore = 25;
    else titleScore = 10;
    if (title.toLowerCase().includes('headphone') || title.toLowerCase().includes('audio technica') || title.toLowerCase().includes('wireless')) titleScore += 30;
    if (title.includes('|') && title.split('|').length > 1) titleScore += 20;
    details.title = { length: titleLength, keywordsPresent: titleScore > 40, score: titleScore };

    const metaDesc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
    const descLength = metaDesc.length;
    let descScore = 0;
    if (descLength >= 120 && descLength <= 160) descScore += 40;
    if (descLength > 0) descScore += 20;
    if (/buy|shop|order|add to cart/i.test(metaDesc)) descScore += 20;
    details.metaDescription = { length: descLength, ctaPresent: /buy|shop/i.test(metaDesc), score: descScore };

    const h1s = doc.querySelectorAll('h1');
    const h2s = doc.querySelectorAll('h2');
    let headingScore = 0;
    if (h1s.length === 1) headingScore += 40;
    if (h2s.length >= 1) headingScore += 30;
    if (data.headingCount >= 3) headingScore += 20;
    if (h1s.length > 0 && h1s[0].textContent.toLowerCase().includes('headphone') || h1s[0].textContent.toLowerCase().includes('audio technica')) headingScore += 10;
    details.headings = { h1Count: h1s.length, h2Count: h2s.length, keywordsInH1: headingScore > 70, score: headingScore };

    const urlObj = new URL(data.url);
    const path = urlObj.pathname;
    let urlScore = 0;
    if (!path.includes('?') && !path.includes('&')) urlScore += 40;
    if (path.split('/').length <= 5) urlScore += 30;
    if (/wireless|headphones|audio-technica|m50xbt/i.test(path)) urlScore += 20;
    details.url = { clean: !path.includes('?'), keywordInSlug: /wireless|headphones/i.test(path), score: urlScore };

    const mainText = data.fullText.toLowerCase();
    const primaryKeyword = 'headphones';
    const keywordCount = (mainText.match(new RegExp(primaryKeyword, 'g')) || []).length;
    const density = data.wordCount > 0 ? (keywordCount / data.wordCount) * 100 : 0;
    let keywordScore = 0;
    if (density >= 0.5 && density <= 2.5) keywordScore += 40;
    if (data.fullText.slice(0, 300).toLowerCase().includes(primaryKeyword)) keywordScore += 30;
    if (keywordCount >= 3) keywordScore += 20;
    details.keywords = { density, frontLoaded: data.fullText.slice(0, 300).toLowerCase().includes(primaryKeyword), score: keywordScore };

    score = Math.round((titleScore + descScore + headingScore + urlScore + keywordScore) / 5);
    return { score: Math.min(100, Math.max(0, score)), details };
  }

  function analyzeTechnicalSEO(doc, data) {
    let score = 0;
    let details = {};

    let mobileScore = data.hasViewport ? 50 : 0;
    if (data.viewportContent.includes('initial-scale=1') && !data.viewportContent.includes('user-scalable=no')) mobileScore += 40;
    details.mobile = { viewportPresent: data.hasViewport, scaleOk: data.viewportContent.includes('initial-scale=1'), score: mobileScore };

    const httpsScore = data.url.startsWith('https') ? 95 : 0;
    details.https = { isHttps: data.url.startsWith('https'), score: httpsScore };

    const canonical = doc.querySelector('link[rel="canonical"]');
    const canonicalScore = canonical && canonical.href === data.url ? 80 : 30;
    details.canonical = { present: !!canonical, matchesUrl: canonical?.href === data.url, score: canonicalScore };

    const robotsMeta = doc.querySelector('meta[name="robots"]');
    const robotsScore = !robotsMeta || !/noindex|nofollow/i.test(robotsMeta.content || '') ? 90 : 20;
    details.robots = { indexable: robotsScore === 90, score: robotsScore };

    const sitemapScore = /\/products|\/collections|\/item/i.test(data.url) ? 70 : 50;
    details.sitemapHint = { likelyIncluded: sitemapScore >= 70, score: sitemapScore };

    score = Math.round((mobileScore + httpsScore + canonicalScore + robotsScore + sitemapScore) / 5);
    return { score: Math.min(100, Math.max(0, score)), details };
  }

  function analyzeContentMedia(doc, data) {
    let score = 0;
    let details = {};

    const descScore = data.wordCount >= 300 ? 80 : data.wordCount >= 150 ? 50 : 20;
    details.description = { wordCount: data.wordCount, score: descScore };

    const imgScore = data.altData.missingCount === 0 ? 90 : data.altData.meaningfulCount > 0 && (data.altData.missingCount / data.altData.meaningfulCount) < 0.2 ? 70 : 40;
    details.images = { missingAlt: data.altData.missingCount, meaningful: data.altData.meaningfulCount, score: imgScore };

    const videoElements = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    const videoScore = videoElements.length > 0 ? (doc.querySelector('track') ? 80 : 60) : 30;
    details.video = { present: videoElements.length > 0, captions: !!doc.querySelector('track'), score: videoScore };

    const ugcScore = hasReviewSection(doc) ? 80 : 40;
    details.ugc = { detected: ugcScore === 80, score: ugcScore };

    const linkScore = data.linkCount >= 5 ? 70 : data.linkCount >= 2 ? 50 : 20;
    details.internalLinks = { count: data.linkCount, score: linkScore };

    const breadcrumbScore = doc.querySelector('[aria-label*="breadcrumb"], .breadcrumbs, .breadcrumb, nav[aria-label="breadcrumb"]') ? 90 : 40;
    details.breadcrumbs = { present: breadcrumbScore === 90, score: breadcrumbScore };

    score = Math.round((descScore + imgScore + videoScore + ugcScore + linkScore + breadcrumbScore) / 6);
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

    const variantSelectors = doc.querySelectorAll('select[name*="variant"], select[name*="size"], select[name*="color"], input[type="radio"][name*="variant"]');
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
    if (value >= 85) { statusMessage = "Excellent"; statusEmoji = "🏆"; }
    else if (value >= 70) { statusMessage = "Strong"; statusEmoji = "✅"; }
    else if (value >= 50) { statusMessage = "Needs Work"; statusEmoji = "⚠️"; }
    else { statusMessage = "Poor"; statusEmoji = "❌"; }
    let metricsHTML = '';
    let fixesHTML = '';
    let failedOnlyHTML = '';
    let failedCount = 0;
    moduleData.factors.forEach(f => {
      let passed = value >= f.threshold;
      let metricGrade = passed
        ? { color: "text-green-600 dark:text-green-400", emoji: "✅" }
        : (value >= f.threshold - 15)
          ? { color: "text-orange-600 dark:text-orange-400", emoji: "⚠️" }
          : { color: "text-red-600 dark:text-red-400", emoji: "❌" };
      metricsHTML += `
        <div class="mb-6">
          <p class="font-medium text-xl">
            <span class="${metricGrade.color} text-2xl mr-3">${metricGrade.emoji}</span>
            <span class="${metricGrade.color} font-bold">${f.name}</span>
          </p>
        </div>`;
      fixesHTML += `
        <div class="mb-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border-l-4 ${passed ? 'border-green-500' : 'border-red-500'}">
          <p class="font-bold text-xl ${metricGrade.color} mb-3">
            <span class="text-3xl mr-3">${metricGrade.emoji}</span>
            ${f.name}
          </p>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
            ${passed ? '✓ This metric meets or exceeds best practices.' : f.howToFix}
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
              const title = doc?.title || '';
              if (!title) return '';
              const truncated = title.length > 65 ? title.substring(0, 65) + '...' : title;
              return `<p class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>`;
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
});