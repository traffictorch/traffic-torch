// product-seo-tool/modules/technical.js
// v1.2 — Adds variant/color/size to ignored query params (Shopify/Amazon pattern).
//        Neutral HTTPS in pasted mode + mixed-content scan (from v1.1).

import { getMobileReadiness } from './helpers.js';

function analyzeTechnicalSEO(doc, data) {
  const details = {};

  // ─── Mobile-first readiness ───────────────────────────────
  const mr = getMobileReadiness(doc);
  let mobileScore = 0;
  if (mr.hasViewport)     mobileScore += 30;
  if (mr.hasWidth)        mobileScore += 25;
  if (mr.hasInitialScale) mobileScore += 15;
  if (!mr.blocksZoom)     mobileScore += 15;
  else                    mobileScore -= 20;

  const styledTargets = doc.querySelectorAll(
    'button[style*="height"], a[style*="height"], button[style*="padding"], a[style*="padding"]'
  );
  let tinyCount = 0;
  styledTargets.forEach(el => {
    const style = (el.getAttribute('style') || '').toLowerCase();
    const h = style.match(/height\s*:\s*(\d+)/);
    const p = style.match(/padding\s*:\s*(\d+)/);
    if (h && parseInt(h[1], 10) < 44) tinyCount++;
    else if (p && parseInt(p[1], 10) * 2 < 44) tinyCount++;
  });
  if (tinyCount > 0) mobileScore -= Math.min(20, tinyCount * 4);

  mobileScore = Math.min(100, Math.max(0, mobileScore));
  details.mobile = { ...mr, smallTargets: tinyCount, score: mobileScore };

  // ─── HTTPS + mixed content ────────────────────────────────
  const isPasted = !data.url
    || data.url.includes('Pasted HTML Code')
    || data.url.includes('pasted-html')
    || data.url.includes('example.com/pasted-html');
  const isHttps = !isPasted && /^https:\/\//i.test(data.url);

  let mixedContentCount = 0;
  if (isHttps) {
    mixedContentCount = doc.querySelectorAll(
      'img[src^="http://"], script[src^="http://"], link[href^="http://"], ' +
      'iframe[src^="http://"], video[src^="http://"], audio[src^="http://"]'
    ).length;
  }

  let httpsScore;
  if (isPasted) {
    httpsScore = 60;
  } else if (!isHttps) {
    httpsScore = 0;
  } else if (mixedContentCount > 0) {
    httpsScore = Math.max(40, 95 - mixedContentCount * 5);
  } else {
    httpsScore = 95;
  }
  details.https = { isHttps, mixedContentCount, isPasted, score: httpsScore };

  // ─── Canonical ────────────────────────────────────────────
  const canonical = doc.querySelector('link[rel="canonical"]');
  let canonicalScore = 20;
  const canonDetails = {
    present: !!canonical, href: '', absoluteHref: '',
    normalized: '', requestedNormalized: '', matchType: 'none'
  };

  if (canonical && canonical.hasAttribute('href')) {
    const rawHref = canonical.getAttribute('href').trim();
    canonDetails.href = rawHref;
    let absoluteCanon = rawHref;
    try {
      const baseUrl = (data.url && !isPasted) ? data.url : 'https://example.com/pasted-html';
      absoluteCanon = new URL(rawHref, baseUrl).href;
    } catch { absoluteCanon = rawHref; }
    canonDetails.absoluteHref = absoluteCanon;

    const normalizeUrl = (urlStr) => {
      try {
        const url = new URL(urlStr);
        const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
        const path = url.pathname.toLowerCase().replace(/\/$/, '');
        const params = new URLSearchParams(url.search.toLowerCase());
        // NOTE: 'variant', 'color', 'size' added to ignore list (Shopify/Amazon pattern)
        ['session_id','sid','utm_source','utm_medium','utm_campaign','utm_term',
         'utm_content','fbclid','_ga','_gl','gclid',
         'variant','color','size','colour','option','sku','pid']
          .forEach(p => params.delete(p));
        const search = params.toString() ? '?' + params.toString() : '';
        return `${hostname}${path}${search}`;
      } catch {
        return urlStr.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
      }
    };

    const requestedNorm = normalizeUrl(data.url || 'https://example.com/pasted-html');
    const canonNorm = normalizeUrl(absoluteCanon);
    canonDetails.normalized = canonNorm;
    canonDetails.requestedNormalized = requestedNorm;

    if (absoluteCanon === data.url || absoluteCanon === data.url + '/' || absoluteCanon === data.url?.replace(/\/$/, '')) {
      canonicalScore = 95; canonDetails.matchType = 'exact';
    } else if (requestedNorm === canonNorm) {
      canonicalScore = 90; canonDetails.matchType = 'normalized';
    } else if (requestedNorm === canonNorm + '/' || requestedNorm + '/' === canonNorm) {
      canonicalScore = 85; canonDetails.matchType = 'normalized_slash';
    } else if (canonNorm.includes(requestedNorm) || requestedNorm.includes(canonNorm)) {
      canonicalScore = 75; canonDetails.matchType = 'partial';
    } else {
      canonicalScore = 30; canonDetails.matchType = 'mismatch';
    }
  } else {
    canonicalScore = 15; canonDetails.matchType = 'missing';
  }

  details.canonical = {
    present: canonDetails.present,
    href: canonDetails.href,
    absoluteHref: canonDetails.absoluteHref,
    normalizedMatch: canonDetails.normalized === canonDetails.requestedNormalized,
    score: canonicalScore
  };

  // ─── Robots ───────────────────────────────────────────────
  const robotsMeta = doc.querySelector('meta[name="robots"]');
  let robotsScore = 95;
  if (robotsMeta) {
    const content = (robotsMeta.content || '').toLowerCase();
    if (/noindex/i.test(content) || /nofollow/i.test(content)) robotsScore = 15;
  }
  details.robots = { indexable: robotsScore === 95, score: robotsScore };

  // ─── Sitemap hint (informational only) ────────────────────
  // Cannot be verified from the DOM. Score is neutral (100) so it never
  // drags the module score. The `note` explains it in the fix panel.
  details.sitemapHint = {
    note: 'Sitemap inclusion cannot be verified from the DOM alone. Confirm the URL is in your sitemap.xml manually.',
    score: 100
  };

  const score = Math.round(
    details.mobile.score * 0.35 +
    details.https.score * 0.30 +
    details.canonical.score * 0.20 +
    details.robots.score * 0.15
  );

  return { score: Math.min(100, Math.max(0, score)), details };
}

export { analyzeTechnicalSEO };