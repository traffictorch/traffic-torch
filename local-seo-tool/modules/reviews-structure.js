// module-reviews-structure.js

import { moduleFixes } from './fixes-v1.0.js';

export function analyzeReviewsStructure(doc, fullUrl, city, schemaData) {
  const fixes = [];

  // Helper to find aggregateRating anywhere in the schema object
  const findAggregateRating = (obj) => {
    if (!obj) return null;
    if (obj.aggregateRating?.ratingValue) return obj.aggregateRating.ratingValue;
    // Check @graph
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        const found = findAggregateRating(item);
        if (found) return found;
      }
    }
    // Check common nesting (e.g. inside Review)
    if (obj.review && Array.isArray(obj.review)) {
      for (const review of obj.review) {
        if (review.author && review.reviewRating?.ratingValue) {
          return review.reviewRating.ratingValue; // fallback to individual if no aggregate
        }
      }
    }
    return null;
  };

  const aggregateRating = findAggregateRating(schemaData);

  const canonical = doc.querySelector('link[rel="canonical"]')?.href === fullUrl;

  const locationPagesPatterns = [
    /\/(contact|locations?|branches|stores?|offices?|areas|service-?areas?|cities|suburbs?|near-me)/i,
    new RegExp(city, 'i') // URL contains city name
  ];

  const geoAnchorPatterns = [
    /in\s+[\w\s]+/i,
    /near\s+[\w\s]+/i,
    /areas?\s+we\s+serve/i,
    /service\s+areas?/i,
    new RegExp(`\\b${city}\\b`, 'i')
  ];

  const internalGeoLinks = Array.from(doc.querySelectorAll('a')).some(a => {
    const href = a.href.toLowerCase();
    const text = (a.textContent || '').trim().toLowerCase();
    const hasLocationPath = locationPagesPatterns.some(p => p.test(href));
    const hasGeoText = geoAnchorPatterns.some(p => p.test(text));
    return (hasLocationPath && (text.length > 5)) || (hasGeoText && hasLocationPath);
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