// product-seo-tool/modules/on-page.js
// v1.1 — Replaces keyword-density penalty with prominence + semantic coverage.
//        Reduces over-weighted CTA & front-load bonuses (not ranking factors).

import { countWords, getProductPageContent } from './helpers.js';

/**
 * Detects unnatural keyword stuffing (repeated phrase in short span).
 * Modern replacement for the deprecated raw keyword-density penalty.
 */
function detectStuffing(text, keyword) {
  if (!text || !keyword) return { stuffed: false, ratio: 0 };
  const words = text.toLowerCase().split(/\s+/);
  const kw = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  if (kw.length === 0 || words.length < 100) return { stuffed: false, ratio: 0 };
  const occurrences = (text.toLowerCase().match(new RegExp(kw.join('\\s+'), 'g')) || []).length;
  const ratio = occurrences / words.length;
  return { stuffed: ratio > 0.045, ratio };
}

function analyzeOnPageSEO(doc, data) {
  const details = {};
  let primaryKeyword = '';
  const h1Text = doc.querySelector('h1')?.textContent?.trim().toLowerCase() || '';
  const titleText = doc.title.trim().toLowerCase();

  if (h1Text.length > 10) {
    primaryKeyword = h1Text.split(' ').slice(0, 4).join(' ');
  } else if (titleText.length > 10) {
    const parts = titleText.split(/[\|\-–—]/)[0].trim().split(' ');
    primaryKeyword = parts.slice(0, 4).join(' ');
  } else {
    let urlObj;
    try { urlObj = new URL(data.url); } catch { urlObj = new URL('https://example.com/pasted-html'); }
    const slug = urlObj.pathname.split('/').filter(Boolean).pop() || '';
    primaryKeyword = slug.replace(/[-_]/g, ' ').replace(/\d{4,}/g, '').trim();
    if (primaryKeyword.length < 5) primaryKeyword = 'product';
  }

  const stopWords = /^(the|a|an|best|top|new|buy|shop|order|free|sale|online|free shipping|with|for|and|in|at|to|of)$/i;
  primaryKeyword = primaryKeyword.replace(stopWords, '').trim().replace(stopWords, '').trim();

  const keywordRegex = new RegExp('\\b' + primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');

  // ─── Title ────────────────────────────────────────────────
  let titleScore = 0;
  const title = doc.title.trim();
  const titleLength = title.length;
  if (titleLength >= 50 && titleLength <= 60) titleScore += 50;
  else if (titleLength >= 40 && titleLength <= 70) titleScore += 35;
  else if (titleLength >= 30 && titleLength <= 80) titleScore += 20;
  else titleScore += 5;
  if (/[\|\-–—]/.test(title)) titleScore += 20;
  if (keywordRegex.test(title.toLowerCase())) titleScore += 30;
  titleScore = Math.min(100, titleScore);

  details.title = {
    length: titleLength,
    hasSeparator: /[\|\-–—]/.test(title),
    hasKeyword: keywordRegex.test(title.toLowerCase()),
    score: titleScore
  };

  // ─── Meta description (CTA +10 not +25; CTR signal only) ───
  let descScore = 0;
  const metaDesc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
  const descLength = metaDesc.length;
  if (descLength >= 120 && descLength <= 160) descScore += 55;
  else if (descLength >= 100 && descLength <= 170) descScore += 40;
  else if (descLength > 0) descScore += 15;
  if (/buy|shop|add to cart|purchase|order|view|learn more|discover/i.test(metaDesc.toLowerCase())) descScore += 10;
  if (keywordRegex.test(metaDesc.toLowerCase())) descScore += 35;
  descScore = Math.min(100, descScore);

  details.metaDescription = {
    length: descLength,
    hasCta: /buy|shop|add to/i.test(metaDesc.toLowerCase()),
    hasKeyword: keywordRegex.test(metaDesc.toLowerCase()),
    score: descScore
  };

  // ─── Headings ─────────────────────────────────────────────
  let headingScore = 0;
  const h1s = doc.querySelectorAll('h1');
  const h2s = doc.querySelectorAll('h2');
  if (h1s.length === 1) headingScore += 45;
  else if (h1s.length === 0) headingScore += 20;
  else headingScore += 10;
  if (h2s.length >= 2) headingScore += 25;
  if (data.headingCount >= 5) headingScore += 30;
  headingScore = Math.min(100, headingScore);

  details.headings = { h1Count: h1s.length, h2Count: h2s.length, total: data.headingCount, score: headingScore };

  // ─── URL ──────────────────────────────────────────────────
  let urlScore = 0;
  let urlObj;
  try { urlObj = new URL(data.url); } catch { urlObj = new URL('https://example.com/pasted-html'); }
  const path = urlObj.pathname;
  if (!path.includes('?') && !path.includes('&') && !path.includes(';')) urlScore += 40;
  if (path.split('/').length <= 5) urlScore += 30;
  if (path.length > 15 && !/\d{8,}/.test(path)) urlScore += 30;
  urlScore = Math.min(100, urlScore);

  details.url = { clean: !path.includes('?'), segments: path.split('/').length, length: path.length, score: urlScore };

  // ─── Keyword Prominence (replaces density) ────────────────
  // NOTE: use two regexes. `.test()` on a `g`-flagged regex mutates
  // lastIndex, so consecutive `.test()` calls return alternating results.
  const kwReTest  = new RegExp('\\b' + primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  const kwReAll   = new RegExp('\\b' + primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
  const titleHasKeyword = kwReTest.test(doc.title.toLowerCase());
  const h1HasKeyword    = kwReTest.test((doc.querySelector('h1')?.textContent || '').toLowerCase());

  let prominence = 0;
  if (titleHasKeyword) prominence += 25;
  if (h1HasKeyword)    prominence += 25;

  const firstText = data.fullText.toLowerCase();
  const firstKeywordPos = firstText.search(kwReTest);
  if (firstKeywordPos !== -1) {
    if (firstKeywordPos < 150) prominence += 20;
    else if (firstKeywordPos < 300) prominence += 14;
    else if (firstKeywordPos < 600) prominence += 8;
    else prominence += 3;
  }

  const headingsText = Array.from(doc.querySelectorAll('h2,h3,h4,h5,h6'))
    .map(h => h.textContent?.toLowerCase() || '').join(' ');
  const kwInHeadings = (headingsText.match(kwReAll) || []).length;
  if (kwInHeadings >= 2) prominence += 15;
  else if (kwInHeadings === 1) prominence += 8;

  // Semantic richness — related e-commerce terms around the keyword
  const relatedTerms = ['review','price','buy','features','specification','material','color','size','brand','model','shipping','warranty','dimensions'];
  const relatedHits = relatedTerms.filter(term => firstText.includes(term)).length;
  prominence += Math.min(15, relatedHits * 3);

  // Stuffing penalty (replaces density >5% penalty)
  const stuffing = detectStuffing(firstText, primaryKeyword);
  if (stuffing.stuffed) prominence -= 15;

  const prominenceScore = Math.min(100, Math.max(0, prominence));
  const keywordCount = (firstText.match(kwReAll) || []).length;

  details.keywords = {
    primaryKeyword,
    count: keywordCount,
    firstOccurrenceChars: firstKeywordPos !== -1 ? firstKeywordPos : 'not found',
    inTitle: titleHasKeyword,
    inH1: h1HasKeyword,
    inHeadings: kwInHeadings,
    relatedTermHits: relatedHits,
    stuffing: stuffing.stuffed,
    score: prominenceScore
  };

  const score = Math.round(
    titleScore * 0.30 +
    descScore * 0.20 +
    headingScore * 0.20 +
    urlScore * 0.15 +
    prominenceScore * 0.15
  );

  return { score: Math.min(100, Math.max(0, score)), details };
}

export { analyzeOnPageSEO };