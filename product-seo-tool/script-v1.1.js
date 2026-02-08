// product-seo-tool/script.js - COMPLETE WORKING VERSION - all modules, plugin solutions, radar chart, priority fixes

// Dynamic import for plugin solutions
let renderPluginSolutions;
import('./plugin-solutions-v1.0.js')
  .then(module => {
    renderPluginSolutions = module.renderPluginSolutions;
    console.log('[Plugin] Successfully loaded renderPluginSolutions');
  })
  .catch(err => console.error('[Plugin] Failed to load plugin-solutions-v1.0.js:', err));
  
  // ────────────────────────────────────────────────
// Dynamic imports for core analysis modules
// ────────────────────────────────────────────────

let analyzeOnPageSEO;
import('./modules/on-page.js')
  .then(module => {
    analyzeOnPageSEO = module.analyzeOnPageSEO;
    console.log('[Module] Successfully loaded on-page.js');
  })
  .catch(err => console.error('[Module] Failed to load on-page.js:', err));

let analyzeTechnicalSEO;
import('./modules/technical.js')
  .then(module => {
    analyzeTechnicalSEO = module.analyzeTechnicalSEO;
    console.log('[Module] Successfully loaded technical.js');
  })
  .catch(err => console.error('[Module] Failed to load technical.js:', err));

let analyzeContentMedia;
import('./modules/content-media.js')
  .then(module => {
    analyzeContentMedia = module.analyzeContentMedia;
    console.log('[Module] Successfully loaded content-media.js');
  })
  .catch(err => console.error('[Module] Failed to load content-media.js:', err));

let analyzeEcommerceSEO;
import('./modules/ecommerce.js')
  .then(module => {
    analyzeEcommerceSEO = module.analyzeEcommerceSEO;
    console.log('[Module] Successfully loaded ecommerce.js');
  })
  .catch(err => console.error('[Module] Failed to load ecommerce.js:', err));

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
        { name: "Product Schema Markup", key: "schema", threshold: 90, shortDesc: "Valid JSON-LD Product schema with required fields (name, image, description, offers, brand, sku/mpn).", howToFix: "Add full Product schema using JSON-LD in a <script type=\"application/ld+json\"> tag (place in <head> or <body>). Must include: @context: \"https://schema.org\", @type: \"Product\", name, image (array recommended), description, brand: {name: \"YourBrand\"}, sku or mpn, offers: {price, priceCurrency, availability (use full schema.org URL like https://schema.org/InStock), seller}. Validate with Google's Rich Results Test." },
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

  // Helper functions
  function countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  function countMissingAlt(doc) {
    const imgs = doc.querySelectorAll('img');
    let missing = 0;
    let meaningful = 0;
    let decorative = 0;
    let filenameOnly = 0;
    let goodDescriptive = 0;

    imgs.forEach(img => {
      const alt = img.getAttribute('alt') || '';
      const altTrim = alt.trim();
      const src = img.getAttribute('src') || '';
      const srcFilename = src.split('/').pop().split('?')[0].toLowerCase();

      const isDecorative =
        altTrim === '' || altTrim === ' ' || alt === null ||
        img.getAttribute('role') === 'presentation' ||
        img.getAttribute('aria-hidden') === 'true' ||
        img.classList.contains('decorative') ||
        img.classList.contains('icon') || img.classList.contains('svg') ||
        img.classList.contains('fa-') || img.classList.contains('feather-') ||
        img.classList.contains('material-icons') || img.classList.contains('lazy-') ||
        img.classList.contains('placeholder') || img.classList.contains('badge') ||
        img.classList.contains('arrow') || img.classList.contains('logo-small') ||
        img.classList.contains('hidden-img') || img.classList.contains('spacer') ||
        (img.width <= 50 && img.height <= 50) ||
        srcFilename.includes('icon') || srcFilename.includes('logo') ||
        srcFilename.includes('spacer') || srcFilename.includes('pixel') ||
        srcFilename.includes('blank') || srcFilename.includes('transparent');

      if (isDecorative) {
        decorative++;
        return;
      }

      meaningful++;

      if (altTrim === '' || altTrim === ' ' || alt === null) {
        missing++;
      } else if (
        altTrim.length < 5 ||
        altTrim === 'image' || altTrim === 'img' || altTrim === 'photo' ||
        altTrim.match(/^\d+$/) ||
        altTrim.toLowerCase().includes(srcFilename.split('.')[0])
      ) {
        filenameOnly++;
      } else {
        goodDescriptive++;
      }
    });

    console.log('[Image Alt Debug]', {
      totalImages: imgs.length,
      decorativeIgnored: decorative,
      meaningfulImages: meaningful,
      missingAlt: missing,
      filenameOnlyAlts: filenameOnly,
      goodDescriptiveAlts: goodDescriptive,
      altQualityRatio: meaningful > 0 ? (goodDescriptive / meaningful) : 0
    });

    return {
      missingCount: missing,
      filenameOnlyCount: filenameOnly,
      goodCount: goodDescriptive,
      meaningfulCount: meaningful,
      decorativeCount: decorative,
      totalImages: imgs.length
    };
  }

  function hasViewportMeta(doc) {
    const meta = doc.querySelector('meta[name="viewport"]');
    return meta && /width\s*=\s*device-width/i.test(meta.content);
  }

  function extractProductSchema(doc) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = [];
    let debugInfo = { scriptCount: scripts.length, parsedCount: 0, productCount: 0, errors: [] };

    scripts.forEach((script, index) => {
      const text = script.textContent?.trim();
      if (!text) {
        debugInfo.errors.push(`Script ${index}: empty or missing content`);
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
        debugInfo.parsedCount++;
      } catch (e) {
        debugInfo.errors.push(`Script ${index}: JSON parse failed - ${e.message}`);
        return;
      }

      function findProducts(obj, currentPath = 'root') {
        if (typeof obj !== 'object' || obj === null) return;
        if (obj['@type'] === 'Product') {
          schemas.push({ ...obj, _debugPath: currentPath });
          debugInfo.productCount++;
          return;
        }
        if (Array.isArray(obj)) {
          obj.forEach((item, i) => findProducts(item, `${currentPath}[${i}]`));
        } else {
          for (const [key, value] of Object.entries(obj)) {
            findProducts(value, `${currentPath}.${key}`);
          }
        }
      }

      findProducts(data);
    });

    const uniqueSchemas = schemas.filter((schema, index, self) =>
      index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(schema))
    );

    console.log('[Schema Extraction Debug]', {
      ...debugInfo,
      foundProducts: uniqueSchemas.map(s => ({
        name: s.name || 'Unnamed Product',
        offers: !!s.offers,
        aggregateRating: !!s.aggregateRating,
        debugPath: s._debugPath
      }))
    });

    uniqueSchemas.forEach(s => delete s._debugPath);
    return uniqueSchemas;
  }

  function hasReviewSection(doc) {
    const selectors = [
      '.reviews', '.product-reviews', '#reviews', '.rating', '.customer-reviews',
      '.product-rating', '.reviews-section', '.review-widget', '.ratings-reviews',
      '.yotpo', '.judge-me', '.loox', '.stamped', '.trustpilot-widget', '.okendo',
      '.rivyo', '.growave', '.ali-reviews', '.seal-subscriptions', '.power-reviews',
      '.bazaarvoice', '.reevo', '.reviews.io', '.endorsal', '.shoppable',
      '[itemprop="aggregateRating"]', '[itemprop="review"]', '[itemscope][itemtype*="Review"]',
      '[data-rating]', '[data-average-rating]', '[aria-label*="star rating"]',
      '.woocommerce-product-rating', '.spr-reviews', '.shopify-section--product-reviews',
      '.product-single__reviews', '.rating-stars', '.star-rating', '.product-reviews__container',
      '.review-summary', '.aggregate-rating', '.rating-summary'
    ];

    const hasVisibleWidget = selectors.some(sel => doc.querySelector(sel));

    const schemas = extractProductSchema(doc);
    let hasSchemaRating = false;
    schemas.forEach(schema => {
      if (schema.aggregateRating &&
          typeof schema.aggregateRating.ratingValue === 'number' &&
          schema.aggregateRating.ratingValue > 0 &&
          (schema.aggregateRating.reviewCount > 0 || schema.aggregateRating.ratingCount > 0)) {
        hasSchemaRating = true;
      }
    });

    console.log('[Review/UGC Detection Debug]', {
      visibleWidgetMatched: hasVisibleWidget,
      selectorsChecked: selectors.length,
      matchedSelectors: selectors.filter(sel => !!doc.querySelector(sel)),
      schemaHasRating: hasSchemaRating,
      schemaCount: schemas.length
    });

    return hasVisibleWidget || hasSchemaRating;
  }

  function hasPriceMarkup(doc, schema) {
    let hasSchemaPrice = false;
    if (schema && schema.offers) {
      let offers = Array.isArray(schema.offers) ? schema.offers : [schema.offers];
      offers.forEach(offer => {
        if (offer.price || (offer.priceSpecification && offer.priceSpecification.price) ||
            offer.availability?.includes('schema.org/') || /InStock|OutOfStock|PreOrder|LimitedAvailability|SoldOut|InStoreOnly|OnlineOnly/i.test(offer.availability || '')) {
          hasSchemaPrice = true;
        }
        if (offer.priceCurrency) hasSchemaPrice = true;
      });
    }

    const pricePatterns = /(?:(?:\$|USD|AUD|EUR|GBP|CAD|JPY|CNY|INR|RUB|CHF|SEK|NOK|DKK|NZD|BRL|MXN|ZAR|TRY|KRW|SGD|HKD|THB|IDR|MYR|PHP|PKR|AED|SAR|ILS|QAR|KWD|BHD|OMR|JOD|LBP|SYP|EGP|LYD|TND|DZD|MAD|XAF|XOF|XCD|BSD|BBD|BMD|BZD|JMD|TTD|HTG|ANG|AWG|KYD|PAB|CRC|GTQ|HNL|NIO|SVC|UYU|ARS|BOB|CLP|COP|PEN|PYG|VES|KZT|UZS|AMD|AZN|BYN|GEL|MDL|UAH|MKD|BGN|RON|CZK|HUF|PLN|ISK|HRK|ALL|BAM|RSB|SEK|NOK|DKK|CHF|GBP|EUR) ?[0-9,.]+|[0-9,.]+ ?(?:\$|USD|AUD|EUR|GBP|CAD|JPY|CNY|INR|RUB|CHF|SEK|NOK|DKK|NZD|BRL|MXN|ZAR|TRY|KRW|SGD|HKD|THB|IDR|MYR|PHP|PKR|AED|SAR|ILS|QAR|KWD|BHD|OMR|JOD|LBP|SYP|EGP|LYD|TND|DZD|MAD|XAF|XOF|XCD|BSD|BBD|BMD|BZD|JMD|TTD|HTG|ANG|AWG|KYD|PAB|CRC|GTQ|HNL|NIO|SVC|UYU|ARS|BOB|CLP|COP|PEN|PYG|VES|KZT|UZS|AMD|AZN|BYN|GEL|MDL|UAH|MKD|BGN|RON|CZK|HUF|PLN|ISK|HRK|ALL|BAM|RSB|SEK|NOK|DKK|CHF|GBP|EUR))|(?:From|Now|Sale) ?(?:\$|[0-9,.]+)|In Stock|Out of Stock|Sold Out|Available|Low Stock|Limited Stock|Pre-Order|Coming Soon|Backorder|Add to Cart|Buy Now|Shop Now|Add to Bag|Purchase|Check Availability/i;
    const hasTextPrice = pricePatterns.test(doc.body.textContent);

    const priceSelectors = [
      '.price', '.product-price', '.money', '.woocommerce-Price-amount', '[data-price]',
      '.price-amount', '.current-price', '.sale-price', '.regular-price', '.final-price',
      '[itemprop="price"]', '.price-wrapper', '.variant-price', '.stock-status', '.availability'
    ];
    const hasVisiblePrice = priceSelectors.some(sel => doc.querySelector(sel));

    console.log('[Price Markup Debug]', {
      schemaHasPrice: hasSchemaPrice,
      textHasPrice: hasTextPrice,
      visibleHasPrice: hasVisiblePrice,
      matchedSelectors: priceSelectors.filter(sel => doc.querySelector(sel))
    });

    return hasSchemaPrice || hasTextPrice || hasVisiblePrice;
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

      if (f.key === 'keywords') {
        const kDetails = factorScores?.keywords || {};
        metricsHTML += `
          <div class="mb-6">
            <p class="font-medium text-xl">
              <span class="${metricGrade.color} text-2xl mr-3">${metricGrade.emoji}</span>
              <span class="${metricGrade.color} font-bold">${f.name}</span>
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Primary: "${kDetails.primaryKeyword || '—'}"
              <br>• Count: ${kDetails.count || 0} • Density: ${kDetails.density || 0}%
              <br>• In Title/H1/Intro: ${kDetails.inTitle ? '✅' : '❌'} / ${kDetails.inH1 ? '✅' : '❌'} / ${kDetails.inIntro ? '✅' : '❌'}
              <br>• Related terms: ${kDetails.hasRelatedTerms ? 'Yes' : 'No'}
            </p>
          </div>`;
      } else {
        metricsHTML += `
          <div class="mb-6">
            <p class="font-medium text-xl">
              <span class="${metricGrade.color} text-2xl mr-3">${metricGrade.emoji}</span>
              <span class="${metricGrade.color} font-bold">${f.name}</span>
            </p>
          </div>`;
      }

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
      <div class="module-card text-center p-0 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderClass}">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#f3f4f6" stroke-width="12" fill="none"/>
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
        <p class="mt-4 text-2xl font-bold ${gradeInfo.color}">${moduleName}</p>
        <div class="mt-4 text-center">
          <p class="text-4xl ${gradeInfo.color}">${statusEmoji}</p>
          <p class="text-3xl font-bold ${gradeInfo.color} mt-2">${statusMessage}</p>
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
    results.innerHTML = '';
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

        const priorityFixes = failedFactors
          .sort((a, b) => a.score - b.score)
          .slice(0, 3);

        let priorityFixesHTML = '';
        if (priorityFixes.length > 0) {
          priorityFixesHTML = priorityFixes.map((fix, index) => `
            <div class="flex items-start gap-4 p-1 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
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
        let projectedHealth;
        let healthImprovement = '';
        if (failedCount >= 3) {
          projectedHealth = 'Very Good';
          healthImprovement = `${health.text} → Very Good (major lift expected)`;
        } else if (failedCount === 2) {
          projectedHealth = health.text === 'Needs Work' ? 'Needs Improvement' : 'Very Good';
          healthImprovement = `${health.text} → ${projectedHealth}`;
        } else if (failedCount === 1) {
          projectedHealth = health.text;
          healthImprovement = 'Moderate improvement expected';
        } else if (failedCount === 0) {
          if (health.text === 'Excellent') {
            projectedHealth = 'Excellent';
            healthImprovement = 'Already at peak performance – maintain it!';
          } else if (health.text === 'Very Good') {
            projectedHealth = 'Excellent';
            healthImprovement = 'Strong foundation – push to Excellent with minor tweaks';
          } else if (health.text === 'Needs Improvement') {
            projectedHealth = 'Very Good';
            healthImprovement = 'Needs Improvement → Very Good (realistic next step)';
          } else {
            projectedHealth = 'Needs Improvement';
            healthImprovement = 'Needs Work → Needs Improvement (first realistic step)';
          }
        }

        const projectedColor = projectedHealth === 'Excellent' ? 'from-green-400 to-emerald-600' :
                               projectedHealth === 'Very Good' ? 'from-green-200 to-green-400' :
                               projectedHealth === 'Needs Improvement' ? 'from-orange-400 to-orange-600' :
                               'from-red-400 to-red-600';

        let impactHTML = `
          <div class="max-w-5xl mx-auto my-20 px-4">
            <div class="p-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl border border-cyan-400/30">
              <h3 class="text-3xl md:text-4xl font-black mb-10 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent text-center">
                Potential Gains After Fixes
              </h3>
              <ul class="space-y-10">
                <li class="flex items-center gap-6">
                  <span class="text-4xl">📈</span>
                  <div class="flex-1">
                    <p class="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">Organic CTR Lift</p>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-3">Potential ${failedCount === 0 ? 'Very strong baseline' : failedCount * 10 + '-' + failedCount * 20 + '%'} from rich snippets & better titles/metas</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5">
                      <div class="bg-cyan-600 h-5 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : 100 - failedCount * 20 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">🔍</span>
                  <div class="flex-1">
                    <p class="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">Ranking Potential</p>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-3">Potential ${failedCount === 0 ? 'Top-tier positions' : 'Significant climb'} in SERPs</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5">
                      <div class="bg-blue-600 h-5 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : 85 - failedCount * 15 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">🛒</span>
                  <div class="flex-1">
                    <p class="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">Conversion Rate Lift</p>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-3">Potential ${failedCount === 0 ? 'Strong baseline' : failedCount * 10 + '-' + failedCount * 25 + '%'} from improved trust & UX</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5">
                      <div class="bg-indigo-600 h-5 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : 75 - failedCount * 15 + '%'}"></div>
                    </div>
                  </div>
                </li>
              </ul>
              <p class="text-center text-base text-gray-600 dark:text-gray-400 mt-10 italic">
                Estimates based on current eCommerce SEO benchmarks. Schema, content, and technical fixes usually deliver the fastest visible gains.
              </p>
            </div>
          </div>`;

        const modules = [
          { name: 'On-Page SEO', score: seo.onPage.score },
          { name: 'Technical SEO', score: seo.technical.score },
          { name: 'Content & Media', score: seo.contentMedia.score },
          { name: 'E-Commerce Signals', score: seo.ecommerce.score }
        ];
        const scores = modules.map(m => m.score);

        const offset = 140;
        const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });

        document.getElementById('loading').classList.add('hidden');

        const wrapper = document.createElement('div');
        wrapper.className = 'container mx-auto px-4 py-8';

        const scoreCard = document.createElement('div');
        scoreCard.innerHTML = `
          <div class="flex justify-center my-8 sm:my-12 px-0 sm:px-6">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-2 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${safeScore >= 85 ? 'border-emerald-500' : safeScore >= 70 ? 'border-teal-500' : safeScore >= 50 ? 'border-orange-500' : 'border-red-500'}">
              <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Product Page Health Score</p>
              <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
                <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                  <circle cx="100" cy="100" r="90" stroke="#f3f4f6" stroke-width="16" fill="none"/>
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
          <div class="text-center mb-12">
            <p class="text-4xl font-bold text-gray-800 mb-8">Health Status:</p>
            <div class="flex flex-col items-center gap-6">
              <div class="flex items-center gap-6 text-4xl">
                <span class="${health.text === 'Excellent' ? 'text-emerald-600' :
                              health.text === 'Very Good' ? 'text-green-600' :
                              health.text === 'Needs Improvement' ? 'text-orange-600' :
                              'text-red-600'}">
                  ${health.text === 'Excellent' ? '🏆' : health.text === 'Very Good' ? '✅' : health.text === 'Needs Improvement' ? '⚠️' : '❌'}
                </span>
              </div>
              <p class="${health.text === 'Excellent' ? 'text-emerald-600' :
                         health.text === 'Very Good' ? 'text-green-600' :
                         health.text === 'Needs Improvement' ? 'text-orange-600' :
                         'text-red-600'} text-4xl font-black">
                ${health.text}
              </p>
            </div>
            <p class="text-xl text-gray-800 mt-10">Analyzed ${seoData.wordCount} words + ${seoData.imageCount} images</p>
          </div>
        `;
        wrapper.appendChild(scoreCard);

        const radarSection = document.createElement('div');
        radarSection.innerHTML = `
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

        const modulesGrid = document.createElement('div');
        modulesGrid.className = 'grid gap-8 my-16 max-w-7xl mx-auto px-0';
        modulesGrid.innerHTML = `
          <div class="grid md:grid-cols-2 gap-8">${onPageHTML}${technicalHTML}</div>
          <div class="grid md:grid-cols-2 gap-8">${contentMediaHTML}${ecommerceHTML}</div>
        `;
        wrapper.appendChild(modulesGrid);

        const prioritySection = document.createElement('div');
        prioritySection.className = 'text-center my-20';
        prioritySection.innerHTML = `
          <h2 class="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-12">
            Top Priority Fixes
          </h2>
          <div class="max-w-5xl mx-auto space-y-8">
            ${priorityFixesHTML}
          </div>
          ${priorityFixes.length > 0 ? `
            <p class="mt-12 text-xl text-gray-800 dark:text-gray-200">
              Prioritized by impact — focus on lowest-scoring areas first for biggest ranking & conversion gains.
            </p>` : ''}
        `;
        wrapper.appendChild(prioritySection);

        const impactSection = document.createElement('div');
        impactSection.innerHTML = impactHTML;
        wrapper.appendChild(impactSection);

        const pluginSection = document.createElement('div');
        pluginSection.id = 'plugin-solutions-section';
        pluginSection.className = 'mt-16 px-1';
        wrapper.appendChild(pluginSection);

        const pdfSection = document.createElement('div');
        pdfSection.className = 'text-center my-16';
        pdfSection.innerHTML = `
          <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
                class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:opacity-90 transition transform hover:scale-105">
          Save Report 📄
        </button>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          This will expand all sections for a complete printable report
        </p>
      </div>
    `;
        wrapper.appendChild(pdfSection);

        results.appendChild(wrapper);

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