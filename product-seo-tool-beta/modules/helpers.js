// product-seo-tool/modules/helpers.js
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
  return meta && /width\s*=\s*device-width/i.test(meta.content);
}

export function extractProductSchema(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemas = [];
  scripts.forEach((script, index) => {
    const text = script.textContent?.trim();
    if (!text) return;
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return;
    }
    function findProducts(obj, currentPath = 'root') {
      if (typeof obj !== 'object' || obj === null) return;
      if (obj['@type'] === 'Product') {
        schemas.push({ ...obj, _debugPath: currentPath });
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
  uniqueSchemas.forEach(s => delete s._debugPath);
  return uniqueSchemas;
}

export function hasReviewSection(doc) {
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
  return hasVisibleWidget || hasSchemaRating;
}

export function hasSocialMeta(doc) {
  return !!doc.querySelector('meta[property^="og:"]');
}

export function getProductPageContent(doc, url) {
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
    url: url || 'https://example.com/pasted-html'   // Safe fallback for HTML paste mode
  };
}