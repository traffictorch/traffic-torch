// module-content-relevance.js
import { moduleFixes } from "../fixes-v1.0.js";

export function analyzeContentRelevance(doc, city, getCleanContent, hasLocalIntent) {
  const fixes = [];

  const cleanContent = getCleanContent(doc);
  const cityLower = city.toLowerCase().trim();

  // Stricter checks - require actual presence of the city name
  const bodyHasCity = cleanContent.toLowerCase().includes(cityLower);

  // Intent patterns only count if city is also present (prevents false positives)
  const intentPatterns = (cleanContent.match(/near me|nearby|local(ly)?\s|in the area|close to|in my area|areas? we serve/gi) || []).length > 1 
    && bodyHasCity ? 1 : 0;

  const locationMentionsCount = (cleanContent.match(new RegExp(city, 'gi')) || []).length;
  const locationMentions = locationMentionsCount > 2 ? 1 : 0;

  const data = {
    localKeywords: bodyHasCity ? 1 : 0,
    intentPatterns,
    locationMentions,
    mentionsCount: locationMentionsCount
  };

  let score = (bodyHasCity ? 8 : 0) + (intentPatterns * 6) + (locationMentions * 6);
  if (locationMentionsCount >= 5) score += 4;
  score = Math.min(20, score);

  // Push fixes for failed checks
  if (!bodyHasCity) {
    fixes.push({
      module: 'Local Content & Relevance',
      sub: 'Body Keywords',
      ...moduleFixes['Local Content & Relevance']['Body Keywords']
    });
  }
  if (!intentPatterns) {
    fixes.push({
      module: 'Local Content & Relevance',
      sub: 'Intent Patterns',
      ...moduleFixes['Local Content & Relevance']['Intent Patterns']
    });
  }
  if (!locationMentions) {
    fixes.push({
      module: 'Local Content & Relevance',
      sub: 'Location Mentions',
      ...moduleFixes['Local Content & Relevance']['Location Mentions']
    });
  }

  return { data, fixes, score, maxRaw: 20 };
}