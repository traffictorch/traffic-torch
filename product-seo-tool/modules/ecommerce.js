// product-seo-tool/modules/ecommerce.js
// v1.2 — ProductGroup normalisation; best-offer scoring; Merchant-listing fields.

import { extractProductSchema, hasReviewSection } from './helpers.js';

/**
 * Normalise a ProductGroup schema into a Product-like shape by merging
 * properties from the first hasVariant entry. Google accepts ProductGroup
 * for merchant listings; nested variants carry image / offers / sku / gtin.
 */
function normaliseProduct(schema) {
  if (!schema || typeof schema !== 'object') return {};

  const isGroup = Array.isArray(schema['@type'])
    ? schema['@type'].includes('ProductGroup')
    : schema['@type'] === 'ProductGroup';

  if (!isGroup) return schema;

  const variants = Array.isArray(schema.hasVariant) ? schema.hasVariant : [];
  const first = variants[0] || {};

  return {
    ...schema,
    image: schema.image || first.image,
    offers: schema.offers || first.offers,
    sku: schema.sku || first.sku,
    mpn: schema.mpn || first.mpn,
    gtin: schema.gtin || first.gtin,
    gtin13: schema.gtin13 || first.gtin13,
    aggregateRating: schema.aggregateRating || first.aggregateRating,
    _isProductGroup: true,
    _variantCount: variants.length
  };
}

function analyzeEcommerceSEO(doc, data) {
  const details = {};
  const schemas = extractProductSchema(doc);

  // Prefer a real Product; fall back to first normalised ProductGroup
  let productSchema = schemas.find(s => {
    const t = s['@type'];
    return t === 'Product' || (Array.isArray(t) && t.includes('Product'));
  });
  if (!productSchema) {
    const group = schemas.find(s => {
      const t = s['@type'];
      return t === 'ProductGroup' || (Array.isArray(t) && t.includes('ProductGroup'));
    });
    if (group) productSchema = normaliseProduct(group);
  }
  if (!productSchema) productSchema = {};

  // ─── Schema completeness ──────────────────────────────────
  let schemaScore = 20;
  if (Object.keys(productSchema).length > 0) {
    const requiredFields = ['name', 'image', 'description', 'offers'];
    const present = requiredFields.filter(f => productSchema[f] !== undefined && productSchema[f] !== null);
    schemaScore = 40 + (present.length / requiredFields.length) * 40;

    if (productSchema.brand && (productSchema.brand.name || productSchema.brand['@type'] === 'Brand')) schemaScore += 5;
    if (productSchema.sku || productSchema.mpn) schemaScore += 5;
    if (productSchema.gtin || productSchema.gtin8 || productSchema.gtin12 ||
        productSchema.gtin13 || productSchema.gtin14) schemaScore += 5;

    const offersArr = Array.isArray(productSchema.offers)
      ? productSchema.offers
      : [productSchema.offers].filter(Boolean);
    if (offersArr.some(o => o.shippingDetails)) schemaScore += 5;
    if (offersArr.some(o => o.hasMerchantReturnPolicy)) schemaScore += 5;
  }
  schemaScore = Math.min(100, schemaScore);

  const offersArr = Array.isArray(productSchema.offers)
    ? productSchema.offers
    : [productSchema.offers].filter(Boolean);

  details.schema = {
    present: Object.keys(productSchema).length > 0,
    isGroup: !!productSchema._isProductGroup,
    variantCount: productSchema._variantCount || 0,
    fieldsCount: Object.keys(productSchema).length,
    hasGtin: !!(productSchema.gtin || productSchema.gtin13 || productSchema.gtin12),
    hasShipping: offersArr.some(o => o.shippingDetails),
    hasReturnPolicy: offersArr.some(o => o.hasMerchantReturnPolicy),
    score: schemaScore
  };

  // ─── Price & availability — best offer ────────────────────
  let priceScore = 20;
  let hasSchemaPrice = false;

  if (productSchema.offers) {
    let best = 0;
    offersArr.forEach(offer => {
      let s = 0;
      const price = offer.price ?? offer.priceSpecification?.price;
      if (price !== undefined && price !== null && price !== '') s += 40;
      if (offer.priceCurrency) s += 20;
      if (offer.availability && /schema\.org\/(InStock|OutOfStock|PreOrder|BackOrder|LimitedAvailability|SoldOut|InStoreOnly|OnlineOnly)/i.test(offer.availability)) s += 25;
      if (offer.priceValidUntil) s += 5;
      if (offer.itemCondition && /schema\.org\/(NewCondition|UsedCondition|RefurbishedCondition|DamagedCondition)/i.test(offer.itemCondition)) s += 10;
      best = Math.max(best, s);
    });
    if (best > 0) { priceScore = best; hasSchemaPrice = true; }
  }

  if (!hasSchemaPrice) {
    const pricePatterns = /(?:\$|USD|AUD|EUR|GBP|CAD|¥|₹|R\$)\s?\d/;
    const hasTextPrice = pricePatterns.test(doc.body.textContent);
    const priceSelectors = [
      '.price', '.product-price', '.money', '.woocommerce-Price-amount',
      '[data-price]', '[itemprop="price"]', '.current-price', '.sale-price'
    ];
    const hasVisiblePrice = priceSelectors.some(sel => doc.querySelector(sel));
    if (hasTextPrice && hasVisiblePrice) priceScore = 80;
    else if (hasVisiblePrice) priceScore = 70;
    else if (hasTextPrice) priceScore = 50;
  }
  priceScore = Math.min(100, priceScore);
  details.priceAvailability = { detected: priceScore >= 60, score: priceScore };

  // ─── Reviews (group + variant aware) ──────────────────────
  let reviewScore = 15;
  const agg = productSchema.aggregateRating
    || (Array.isArray(productSchema.hasVariant)
        ? productSchema.hasVariant.find(v => v.aggregateRating)?.aggregateRating
        : null);
  if (agg) {
    if (typeof agg.ratingValue === 'number' && agg.ratingValue >= 1 && agg.ratingValue <= 5) reviewScore += 40;
    if (typeof agg.reviewCount === 'number' && agg.reviewCount > 0) reviewScore += 35;
  } else if (hasReviewSection(doc)) {
    reviewScore = 50;
  }
  reviewScore = Math.min(100, reviewScore);
  details.reviews = { aggregateRatingPresent: !!agg, score: reviewScore };

  // ─── Variants ─────────────────────────────────────────────
  const variantSelectors = doc.querySelectorAll(
    'select[name*="variant"], select[name*="size"], select[name*="color"], ' +
    'select[name*="option"], input[type="radio"][name*="variant"], ' +
    '.variant-select, .swatch, .product-variants, [data-variant], ' +
    'input[data-product-option-name], .product-option'
  );
  const offersCount = Array.isArray(productSchema.offers)
    ? productSchema.offers.length
    : (productSchema.offers ? 1 : 0);
  const isProductGroupWithVariants = !!(productSchema._isProductGroup && (productSchema._variantCount || 0) > 1);
  const isSimpleSingleSku = !isProductGroupWithVariants
    && variantSelectors.length === 0
    && offersCount <= 1;

  let variantScore;
  if (variantSelectors.length > 0) {
    variantScore = 70;
    if (doc.querySelector('link[rel="canonical"]')) variantScore += 20;
  } else if (isProductGroupWithVariants) {
    // ProductGroup with variants — Shopify renders these via JS
    variantScore = 85;
  } else if (isSimpleSingleSku) {
    // Simple product — variants N/A, neutral pass
    variantScore = 80;
  } else {
    variantScore = 50;
  }
  variantScore = Math.min(100, variantScore);
  details.variants = {
    detected: variantSelectors.length > 0 || isProductGroupWithVariants,
    isSimpleProduct: isSimpleSingleSku,
    score: variantScore
  };

  // ─── Social / OG ──────────────────────────────────────────
  const requiredOg = ['og:title', 'og:description', 'og:image', 'og:url'];
  const presentOg = requiredOg.filter(p => !!doc.querySelector(`meta[property="${p}"]`));
  let socialScore = 25;
  if (presentOg.length === requiredOg.length) socialScore = 90;
  else if (presentOg.length >= 3) socialScore = 70;
  else if (presentOg.length >= 1) socialScore = 45;
  details.social = { ogPresent: presentOg.length > 0, count: presentOg.length, score: socialScore };

  const score = Math.round(
    schemaScore * 0.35 +
    details.priceAvailability.score * 0.25 +
    details.reviews.score * 0.20 +
    details.variants.score * 0.10 +
    details.social.score * 0.10
  );

  return { score: Math.min(100, Math.max(0, score)), details, isPro: true };
}

export { analyzeEcommerceSEO };