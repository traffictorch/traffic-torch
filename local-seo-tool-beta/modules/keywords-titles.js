// module-keywords-titles.js
import { moduleFixes } from "../fixes-v1.0.js";

export function analyzeKeywordsTitles(doc, city, hasLocalIntent) {
  const fixes = [];

  const titleText = doc.querySelector('title')?.textContent.trim() || '';
  const metaDesc = doc.querySelector('meta[name="description"]')?.content.trim() || '';

  // More accurate local check: require the city name to appear
  const cityLower = city.toLowerCase().trim();

  const titleLocal = titleText.toLowerCase().includes(cityLower);
  const metaLocal = metaDesc.toLowerCase().includes(cityLower);

  // For headings: at least one heading must contain the city name
  const headingsLocal = Array.from(doc.querySelectorAll('h1, h2, h3'))
    .some(h => h.textContent.toLowerCase().includes(cityLower));

  const data = {
    title: titleLocal,
    meta: metaLocal,
    headings: headingsLocal
  };

  const score = (titleLocal ? 7 : 0) + (metaLocal ? 4 : 0) + (headingsLocal ? 5 : 0);

  // Push fixes for failed checks
  if (!titleLocal) {
    fixes.push({
      module: 'Local Keywords & Titles',
      sub: 'Title Local',
      ...moduleFixes['Local Keywords & Titles']['Title Local']
    });
  }
  if (!metaLocal) {
    fixes.push({
      module: 'Local Keywords & Titles',
      sub: 'Meta Local',
      ...moduleFixes['Local Keywords & Titles']['Meta Local']
    });
  }
  if (!headingsLocal) {
    fixes.push({
      module: 'Local Keywords & Titles',
      sub: 'Headings Local',
      ...moduleFixes['Local Keywords & Titles']['Headings Local']
    });
  }

  return { data, fixes, score };
}