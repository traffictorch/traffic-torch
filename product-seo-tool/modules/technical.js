  function analyzeTechnicalSEO(doc, data) {
    let details = {};
    let mobileScore = data.hasViewport ? 60 : 10;
    if (data.viewportContent && /width\s*=\s*device-width/i.test(data.viewportContent)) mobileScore += 30;
    if (data.viewportContent.includes('initial-scale=1')) mobileScore += 10;
    if (!data.viewportContent.includes('user-scalable=no') && !data.viewportContent.includes('maximum-scale=1')) {
      mobileScore += 10;
    } else {
      mobileScore -= 15;
    }
    mobileScore = Math.min(100, Math.max(0, mobileScore));
    details.mobile = { viewportPresent: data.hasViewport, score: mobileScore };

    const isHttps = data.url.startsWith('https');
    details.https = { isHttps, score: isHttps ? 95 : 0 };

    const canonical = doc.querySelector('link[rel="canonical"]');
    let canonicalScore = 20;
    let canonDetails = {
      present: !!canonical,
      href: '',
      absoluteHref: '',
      normalized: '',
      requestedNormalized: '',
      matchType: 'none'
    };

    if (canonical && canonical.hasAttribute('href')) {
      const rawHref = canonical.getAttribute('href').trim();
      canonDetails.href = rawHref;
      let absoluteCanon = rawHref;
      try {
        absoluteCanon = new URL(rawHref, data.url).href;
      } catch (e) {
        console.warn('[Canonical] Failed to resolve relative href:', rawHref, e);
      }
      canonDetails.absoluteHref = absoluteCanon;

      const normalizeUrl = (urlStr) => {
        try {
          const url = new URL(urlStr);
          let hostname = url.hostname.toLowerCase().replace(/^www\./, '');
          let path = url.pathname.toLowerCase().replace(/\/$/, '');
          let search = url.search.toLowerCase();
          const ignoreParams = ['session_id', 'sid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', '_ga', '_gl', 'gclid'];
          const params = new URLSearchParams(search);
          ignoreParams.forEach(p => params.delete(p));
          search = params.toString() ? '?' + params.toString() : '';
          return `${hostname}${path}${search}`;
        } catch (e) {
          return urlStr.toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
        }
      };

      const requestedNorm = normalizeUrl(data.url);
      const canonNorm = normalizeUrl(absoluteCanon);
      canonDetails.normalized = canonNorm;
      canonDetails.requestedNormalized = requestedNorm;

      if (absoluteCanon === data.url || absoluteCanon === data.url + '/' || absoluteCanon === data.url.replace(/\/$/, '')) {
        canonicalScore = 95;
        canonDetails.matchType = 'exact';
      } else if (requestedNorm === canonNorm) {
        canonicalScore = 90;
        canonDetails.matchType = 'normalized';
      } else if (requestedNorm === canonNorm + '/' || requestedNorm + '/' === canonNorm) {
        canonicalScore = 85;
        canonDetails.matchType = 'normalized_slash';
      } else {
        if (canonNorm.includes(requestedNorm) || requestedNorm.includes(canonNorm)) {
          canonicalScore = 75;
          canonDetails.matchType = 'partial';
        } else {
          canonicalScore = 30;
          canonDetails.matchType = 'mismatch';
        }
      }
    } else {
      canonicalScore = 15;
      canonDetails.matchType = 'missing';
    }

    details.canonical = {
      present: canonDetails.present,
      href: canonDetails.href,
      absoluteHref: canonDetails.absoluteHref,
      normalizedMatch: canonDetails.normalized === canonDetails.requestedNormalized,
      score: canonicalScore
    };

    console.log('[Canonical Debug]', {
      requested: data.url,
      rawHref: canonDetails.href,
      absoluteHref: canonDetails.absoluteHref,
      requestedNorm: canonDetails.requestedNormalized,
      canonNorm: canonDetails.normalized,
      matchType: canonDetails.matchType,
      score: canonicalScore
    });

    const robotsMeta = doc.querySelector('meta[name="robots"]');
    let robotsScore = 95;
    if (robotsMeta) {
      const content = (robotsMeta.content || '').toLowerCase();
      if (/noindex/i.test(content) || /nofollow/i.test(content)) {
        robotsScore = 15;
      }
    }
    details.robots = { indexable: robotsScore === 95, score: robotsScore };

    let sitemapScore = /\/product[s]?\/|\/item\/|\/p\/|\/shop\/|\/collections\/[^/]+\/products\//i.test(data.url) ? 80 : 45;
    details.sitemapHint = { likelyIncluded: sitemapScore >= 70, score: sitemapScore };

    const score = Math.round(
      details.mobile.score * 0.30 +
      details.https.score * 0.30 +
      details.canonical.score * 0.20 +
      details.robots.score * 0.15 +
      details.sitemapHint.score * 0.05
    );
    return { score: Math.min(100, Math.max(0, score)), details };
  }
  
  export { analyzeTechnicalSEO };