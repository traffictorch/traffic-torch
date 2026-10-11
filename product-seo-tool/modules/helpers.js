// product-seo-tool/modules/helpers.js
// v1.2 — Okendo support, ProductGroup schema, @type arrays.
//        Contextual internal links, leaf-focus word count (from v1.1).

export function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function countMissingAlt(doc) {
  const imgs = doc.querySelectorAll('img');
  let missing = 0;
  let meaningful = 0;
  let decorative = 0;
  let filenameOnly = 0;
  let goodDescriptive = 0;

  imgs.forEach(img => {
    const hasAltAttr = img.hasAttribute('alt');
    const altTrim = (img.getAttribute('alt') || '').trim();
    const src = img.getAttribute('src') || '';
    const srcFilename = src.split('/').pop().split('?')[0].toLowerCase();

    const w = parseInt(img.getAttribute('width') || '0', 10) || 0;
    const h = parseInt(img.getAttribute('height') || '0', 10) || 0;

    const isDecorative =
      (hasAltAttr && altTrim === '') ||
      img.getAttribute('role') === 'presentation' ||
      img.getAttribute('aria-hidden') === 'true' ||
      img.classList.contains('decorative') ||
      img.classList.contains('icon') ||
      img.classList.contains('svg') ||
      img.classList.contains('fa-') ||
      img.classList.contains('feather-') ||
      img.classList.contains('material-icons') ||
      img.classList.contains('placeholder') ||
      img.classList.contains('badge') ||
      img.classList.contains('arrow') ||
      img.classList.contains('spacer') ||
      (w > 0 && h > 0 && w <= 50 && h <= 50) ||
      srcFilename.includes('icon') ||
      srcFilename.includes('logo') ||
      srcFilename.includes('spacer') ||
      srcFilename.includes('pixel') ||
      srcFilename.includes('blank') ||
      srcFilename.includes('transparent');

    if (isDecorative) {
      decorative++;
      return;
    }

    meaningful++;

    if (!hasAltAttr) {
      missing++;
    } else if (
      altTrim.length < 5 ||
      /^(image|img|photo|picture)$/i.test(altTrim) ||
      /^\d+$/.test(altTrim) ||
      (srcFilename && altTrim.toLowerCase().includes(srcFilename.split('.')[0]))
    ) {
      filenameOnly++;
    } else {
      goodDescriptive++;
    }
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

export function hasViewportMeta(doc) {
  const meta = doc.querySelector('meta[name="viewport"]');
  return !!(meta && /width\s*=\s*device-width/i.test(meta.content || ''));
}

/**
 * Mobile-first readiness proxies (replaces the retired Mobile-Friendly Test).
 * Returns granular flags so scores can reflect partial compliance.
 */
export function getMobileReadiness(doc) {
  const meta = doc.querySelector('meta[name="viewport"]');
  const content = (meta?.getAttribute('content') || '').toLowerCase();
  const hasWidth        = /width\s*=\s*device-width/.test(content);
  const hasInitialScale = /initial-scale\s*=\s*1/.test(content);
  const blocksZoom      = /user-scalable\s*=\s*no/.test(content) || /maximum-scale\s*=\s*1/.test(content);
  return { hasViewport: !!meta, hasWidth, hasInitialScale, blocksZoom, content };
}

/**
 * Find Product OR ProductGroup schemas, handling @type arrays.
 */
export function extractProductSchema(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemas = [];

  const isProductType = (t) => {
    if (!t) return false;
    if (Array.isArray(t)) {
      return t.some(x => typeof x === 'string' && /^(product|productgroup)$/i.test(x));
    }
    return typeof t === 'string' && /^(product|productgroup)$/i.test(t);
  };

  scripts.forEach((script) => {
    const text = script.textContent?.trim();
    if (!text) return;
    let data;
    try { data = JSON.parse(text); } catch { return; }

    function walk(obj) {
      if (typeof obj !== 'object' || obj === null) return;
      if (isProductType(obj['@type'])) {
        schemas.push(obj);
        return;
      }
      if (Array.isArray(obj)) obj.forEach(walk);
      else Object.values(obj).forEach(walk);
    }
    walk(data);
  });

  return schemas.filter((s, i, self) => self.indexOf(s) === i);
}

export function hasReviewSection(doc) {
  const selectors = [
    '.reviews', '.product-reviews', '#reviews', '.rating', '.customer-reviews',
    '.product-rating', '.reviews-section', '.review-widget', '.ratings-reviews',
    '.yotpo', '.judge-me', '.loox', '.stamped', '.trustpilot-widget', '.okendo',
    '.rivyo', '.growave', '.ali-reviews', '.seal-subscriptions', '.power-reviews',
    '.bazaarvoice', '.reevo', '.reviews.io', '.endorsal', '.shoppable',
    // Okendo live-widget markers
    '.okeReviews', '[data-oke-container]', '[data-oke-widget]',
    '[data-oke-reviews-widget]', '[data-oke-star-rating]', '[data-oke-reviews-product-id]',
    '#testfreaks-reviews', '.tf-reviews', '[id*="testfreaks" i]', '[class*="testfreaks" i]',
    '[id*="trustpilot" i]', '[id*="bazaarvoice" i]', '[data-bv-show]',
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
    const agg = schema.aggregateRating
      || (Array.isArray(schema.hasVariant) ? schema.hasVariant.find(v => v.aggregateRating)?.aggregateRating : null);
    if (agg &&
        typeof agg.ratingValue === 'number' &&
        agg.ratingValue > 0 &&
        (agg.reviewCount > 0 || agg.ratingCount > 0)) {
      hasSchemaRating = true;
    }
  });
  return hasVisibleWidget || hasSchemaRating;
}

export function hasSocialMeta(doc) {
  return !!doc.querySelector('meta[property^="og:"]');
}

/**
 * Extract page content data. Deduplicates nested containers, contextual
 * internal links only (nav/header/footer/external excluded).
 */
export function getProductPageContent(doc, url) {
  const candidates = doc.querySelectorAll(
    'p, li, h2, h3, .product-description, [itemprop="description"], .rte, ' +
    '.product-single__description, .product__description, ' +
    '.woocommerce-product-details__short-description'
  );

  const accepted = [];
  candidates.forEach(el => {
    if (accepted.some(a => a.contains(el))) return;
    const t = (el.textContent || '').trim();
    if (t.length < 20) return;
    accepted.push(el);
  });

  let fullText = '';
  accepted.forEach(el => { fullText += (el.textContent || '').trim() + ' '; });

  const images = doc.querySelectorAll('img');
  const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');

  let baseHost = '';
  try { baseHost = new URL(url || 'https://example.com').hostname.replace(/^www\./, ''); } catch {}
  const allLinks = doc.querySelectorAll('a[href]');
  const internalLinks = [];
  allLinks.forEach(a => {
    if (a.closest('nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"]')) return;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    try {
      const u = new URL(href, 'https://placeholder.test/');
      const host = u.hostname.replace(/^www\./, '');
      if (host === baseHost || host === 'placeholder.test') internalLinks.push(a);
    } catch {}
  });

  const viewportContent = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';

  return {
    fullText,
    wordCount: countWords(fullText),
    imageCount: images.length,
    altData: countMissingAlt(doc),
    headingCount: headings.length,
    linkCount: internalLinks.length,
    allLinkCount: allLinks.length,
    hasViewport: hasViewportMeta(doc),
    viewportContent,
    hasSocialMeta: hasSocialMeta(doc),
    url: url || 'https://example.com/pasted-html'
  };
}