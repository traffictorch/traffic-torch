// product-seo-tool/modules/content-media.js
// v1.2 — Okendo UGC selectors, neutral no-video score (was penalising pages
//        without video), BreadcrumbList JSON-LD + .break-crumb detection.

import { countMissingAlt, extractProductSchema, hasReviewSection, countWords } from './helpers.js';

function detectVideoCaptions(doc, videoEls) {
  if (doc.querySelector('video track')) return { captions: true, source: 'track' };

  let embedHint = false;
  videoEls.forEach(v => {
    const src = v.getAttribute('src') || v.getAttribute('data-src') || '';
    if (/cc_load_policy=1|cc_lang_pref=/i.test(src)) embedHint = true;
  });
  if (embedHint) return { captions: true, source: 'embed-param' };

  const transcript = doc.querySelectorAll(
    '[class*="transcript" i], [id*="transcript" i], [aria-label*="transcript" i]'
  );
  if (transcript.length > 0) return { captions: true, source: 'transcript-section' };

  return { captions: false, source: 'none' };
}

function hasBreadcrumbSchemaOrDOM(doc) {
  const domSelectors =
    '[aria-label*="breadcrumb" i], .breadcrumbs, .breadcrumb, ' +
    '.woocommerce-breadcrumb, .yoast-breadcrumb, .site-breadcrumb, ' +
    '.bread-crumb, .crumbs, .pathway, [itemprop="breadcrumb"], ' +
    '.break-crumb, .bread-crumbs';
  if (doc.querySelector(domSelectors)) return { present: true, source: 'dom' };

  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    const txt = s.textContent || '';
    if (/"@type"\s*:\s*"BreadcrumbList"/i.test(txt) ||
        /"@type"\s*:\s*\[\s*"BreadcrumbList"/i.test(txt)) {
      return { present: true, source: 'json-ld' };
    }
  }

  return { present: false, source: 'none' };
}

function analyzeContentMedia(doc, data) {
  const details = {};

  // ─── Description quality ─────────────────────────────────
  let descScore = 20;
  if (data.wordCount >= 500) descScore = 90;
  else if (data.wordCount >= 300) descScore = 75;
  else if (data.wordCount >= 200) descScore = 55;
  else if (data.wordCount >= 100) descScore = 35;
  else descScore = 15;

  const hasStructure = doc.querySelectorAll('h2,h3,ul,ol').length >= 3;
  if (hasStructure) descScore += 15;
  descScore = Math.min(100, descScore);
  details.description = { wordCount: data.wordCount, hasStructure, score: descScore };

  // ─── Images ───────────────────────────────────────────────
  let imgScore = 30;
  const { missingCount, filenameOnlyCount, goodCount, meaningfulCount, decorativeCount, totalImages } = data.altData;

  if (totalImages === 0) {
    imgScore = 40;
  } else if (meaningfulCount === 0) {
    imgScore = 70;
  } else {
    const altQualityRatio = goodCount / meaningfulCount;
    const badRatio = (missingCount + filenameOnlyCount) / meaningfulCount;
    if (altQualityRatio >= 0.8 || badRatio <= 0.1) imgScore = 90;
    else if (altQualityRatio >= 0.5 || badRatio <= 0.3) imgScore = 75;
    else if (altQualityRatio >= 0.2 || badRatio <= 0.6) imgScore = 50;
    else imgScore = 25;
    if (decorativeCount > meaningfulCount * 2) imgScore += 10;
    imgScore = Math.min(100, imgScore);
  }

  details.images = {
    missingAlt: missingCount,
    filenameOnly: filenameOnlyCount,
    goodDescriptive: goodCount,
    meaningful: meaningfulCount,
    decorativeIgnored: decorativeCount,
    total: totalImages,
    score: imgScore
  };

  // ─── Video (neutral when no video present) ────────────────
  const videoElements = doc.querySelectorAll(
    'video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="youtu.be"]'
  );
  const captions = detectVideoCaptions(doc, videoElements);

  let videoScore;
  if (videoElements.length === 0) {
    videoScore = 70;                          // neutral — no video ≠ failure
  } else {
    videoScore = 50;
    if (captions.captions) videoScore += 30;
    if (videoElements.length > 1) videoScore += 10;
    videoScore = Math.min(100, videoScore);
  }

  details.video = {
    present: videoElements.length > 0,
    captions: captions.captions,
    captionSource: captions.source,
    count: videoElements.length,
    score: videoScore
  };

  // ─── UGC (uses hasReviewSection which now recognises Okendo) ──
  const selectors = [
    '.reviews', '.product-reviews', '#reviews', '.rating', '.customer-reviews',
    '.product-rating', '.reviews-section', '.review-widget', '.ratings-reviews',
    '.yotpo', '.judge-me', '.loox', '.stamped', '.trustpilot-widget', '.okendo',
    '.rivyo', '.growave', '.ali-reviews', '.seal-subscriptions', '.power-reviews',
    '.bazaarvoice', '.reevo', '.reviews.io', '.endorsal', '.shoppable',
    '.okeReviews', '[data-oke-container]', '[data-oke-widget]',
    '[data-oke-reviews-widget]', '[data-oke-star-rating]', '[data-oke-reviews-product-id]',
    '[itemprop="aggregateRating"]', '[itemprop="review"]', '[itemscope][itemtype*="Review"]',
    '[data-rating]', '[data-average-rating]', '[aria-label*="star rating"]',
    '.woocommerce-product-rating', '.spr-reviews', '.shopify-section--product-reviews',
    '.product-single__reviews', '.rating-stars', '.star-rating', '.product-reviews__container',
    '.review-summary', '.aggregate-rating', '.rating-summary'
  ];
  const hasVisibleUGC = selectors.some(sel => doc.querySelector(sel));
  const hasSchemaUGC = hasReviewSection(doc);

  let ugcScore = 20;
  if (hasVisibleUGC && hasSchemaUGC) ugcScore = 90;
  else if (hasSchemaUGC) ugcScore = 75;
  else if (hasVisibleUGC) ugcScore = 60;
  details.ugc = { detected: hasVisibleUGC || hasSchemaUGC, score: ugcScore };

  // ─── Internal links ───────────────────────────────────────
  let linkScore = 20;
  if (data.linkCount >= 8) linkScore = 85;
  else if (data.linkCount >= 5) linkScore = 70;
  else if (data.linkCount >= 3) linkScore = 50;
  else linkScore = 25;
  details.internalLinks = { count: data.linkCount, score: linkScore };

  // ─── Breadcrumbs (DOM + JSON-LD + .break-crumb) ───────────
  const bc = hasBreadcrumbSchemaOrDOM(doc);
  const breadcrumbScore = bc.present ? 90 : 30;
  details.breadcrumbs = { present: bc.present, source: bc.source, score: breadcrumbScore };

  const score = Math.round(
    descScore * 0.30 +
    imgScore * 0.25 +
    videoScore * 0.10 +
    ugcScore * 0.15 +
    linkScore * 0.10 +
    breadcrumbScore * 0.10
  );

  return { score: Math.min(100, Math.max(0, score)), details };
}

export { analyzeContentMedia };