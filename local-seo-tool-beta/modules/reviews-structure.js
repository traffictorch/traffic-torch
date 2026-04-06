// module-reviews-structure.js
import { moduleFixes } from "../fixes-v1.0.js";

export function analyzeReviewsStructure(doc, fullUrl, city, schemaData) {
  const fixes = [];

  // Helper to find aggregateRating (kept as-is — it's solid)
  const findAggregateRating = (obj) => {
    if (!obj) return null;
    if (obj.aggregateRating?.ratingValue) return obj.aggregateRating.ratingValue;
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        const found = findAggregateRating(item);
        if (found) return found;
      }
    }
    if (obj.review && Array.isArray(obj.review)) {
      for (const review of obj.review) {
        if (review.reviewRating?.ratingValue) {
          return review.reviewRating.ratingValue;
        }
      }
    }
    return null;
  };

  const aggregateRating = findAggregateRating(schemaData);
  const canonical = doc.querySelector('link[rel="canonical"]')?.href === fullUrl;

  const cityLower = city.toLowerCase().trim();

  // Stricter Internal Geo Links check
  const internalGeoLinks = Array.from(doc.querySelectorAll('a')).some(a => {
    const href = a.href.toLowerCase();
    const text = (a.textContent || '').trim().toLowerCase();

    // Must contain city name in link text OR have clear location-related path
    const hasCityInText = text.includes(cityLower);
    const hasLocationPath = /\/(contact|locations?|branches|stores?|offices?|service-?areas?|cities|suburbs?|near-me)/i.test(href);

    // Only count meaningful geo links (longer text + city or strong location path)
    return (hasCityInText && text.length > 8) || (hasLocationPath && hasCityInText);
  });

  const data = {
    schema: !!aggregateRating,
    canonical,
    internalLinks: internalGeoLinks
  };

  // Push fixes for failed checks
  if (!aggregateRating) {
    fixes.push({
      module: 'Reviews & Structure',
      sub: 'Review Schema',
      ...moduleFixes['Reviews & Structure']['Review Schema']
    });
  }
  if (!canonical) {
    fixes.push({
      module: 'Reviews & Structure',
      sub: 'Canonical Tag',
      ...moduleFixes['Reviews & Structure']['Canonical Tag']
    });
  }
  if (!internalGeoLinks) {
    fixes.push({
      module: 'Reviews & Structure',
      sub: 'Internal Geo Links',
      ...moduleFixes['Reviews & Structure']['Internal Geo Links']
    });
  }

  const score = (aggregateRating ? 7 : 0) + (canonical ? 5 : 0) + (internalGeoLinks ? 5 : 0);

  return { data, fixes, score, maxRaw: 17 };
}