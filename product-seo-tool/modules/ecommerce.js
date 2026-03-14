 import { extractProductSchema, hasReviewSection, hasSocialMeta } from './helpers.js';
 
  function analyzeEcommerceSEO(doc, data) {
    let details = {};
    const schemas = extractProductSchema(doc);
    let productSchema = schemas.find(s => s['@type'] === 'Product') || {};
    if (!Object.keys(productSchema).length && schemas.length > 0) {
      productSchema = schemas[0];
    }

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
    let hasSchemaPrice = false;
    if (productSchema.offers) {
      let offers = Array.isArray(productSchema.offers) ? productSchema.offers : [productSchema.offers];
      offers.forEach(offer => {
        if (offer.price || (offer.priceSpecification && offer.priceSpecification.price)) {
          priceScore += 30;
          if (offer.priceCurrency) priceScore += 20;
        }
        if (offer.availability && /InStock|OutOfStock|PreOrder|LimitedAvailability|SoldOut|InStoreOnly|OnlineOnly|https:\/\/schema\.org\//i.test(offer.availability)) {
          priceScore += 25;
        }
      });
      hasSchemaPrice = priceScore > 20;
    }

    if (!hasSchemaPrice) {
      const pricePatterns = /(?:(?:\$|USD|AUD|EUR|GBP|CAD|JPY|CNY|INR|RUB|CHF|SEK|NOK|DKK|NZD|BRL|MXN|ZAR|TRY|KRW|SGD|HKD|THB|IDR|MYR|PHP|PKR|AED|SAR|ILS|QAR|KWD|BHD|OMR|JOD|LBP|SYP|EGP|LYD|TND|DZD|MAD|XAF|XOF|XCD|BSD|BBD|BMD|BZD|JMD|TTD|HTG|ANG|AWG|KYD|PAB|CRC|GTQ|HNL|NIO|SVC|UYU|ARS|BOB|CLP|COP|PEN|PYG|VES|KZT|UZS|AMD|AZN|BYN|GEL|MDL|UAH|MKD|BGN|RON|CZK|HUF|PLN|ISK|HRK|ALL|BAM|RSB|SEK|NOK|DKK|CHF|GBP|EUR) ?[0-9,.]+|[0-9,.]+ ?(?:\$|USD|AUD|EUR|GBP|CAD|JPY|CNY|INR|RUB|CHF|SEK|NOK|DKK|NZD|BRL|MXN|ZAR|TRY|KRW|SGD|HKD|THB|IDR|MYR|PHP|PKR|AED|SAR|ILS|QAR|KWD|BHD|OMR|JOD|LBP|SYP|EGP|LYD|TND|DZD|MAD|XAF|XOF|XCD|BSD|BBD|BMD|BZD|JMD|TTD|HTG|ANG|AWG|KYD|PAB|CRC|GTQ|HNL|NIO|SVC|UYU|ARS|BOB|CLP|COP|PEN|PYG|VES|KZT|UZS|AMD|AZN|BYN|GEL|MDL|UAH|MKD|BGN|RON|CZK|HUF|PLN|ISK|HRK|ALL|BAM|RSB|SEK|NOK|DKK|CHF|GBP|EUR))|(?:From|Now|Sale) ?(?:\$|[0-9,.]+)|In Stock|Out of Stock|Sold Out|Available|Low Stock|Limited Stock|Pre-Order|Coming Soon|Backorder|Add to Cart|Buy Now|Shop Now|Add to Bag|Purchase|Check Availability/i;
      const hasTextPrice = pricePatterns.test(doc.body.textContent);
      const priceSelectors = [
        '.price', '.product-price', '.money', '.woocommerce-Price-amount', '[data-price]',
        '.price-amount', '.current-price', '.sale-price', '.regular-price', '.final-price',
        '[itemprop="price"]', '.price-wrapper', '.variant-price', '.stock-status', '.availability'
      ];
      const hasVisiblePrice = priceSelectors.some(sel => doc.querySelector(sel));
      if (hasTextPrice && hasVisiblePrice) priceScore = 80;
      else if (hasVisiblePrice) priceScore = 70;
      else if (hasTextPrice) priceScore = 50;
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
  
 export { analyzeEcommerceSEO };