// eeatSignals.js
export function computeEEAT(doc, url) {
  const hasAuthor = !!doc.querySelector(
    'meta[name="author"], meta[property="og:author"], meta[property="article:author"], ' +
    '.author, .byline, .post-author, .entry-author, [rel="author"], ' +
    '[itemprop="author"], [class*="author" i], [class*="byline" i], [class*="posted-by" i], ' +
    '[data-author], a[rel="author"]'
  );

  // ── JSON-LD date check ──
  const ldHasDate = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
    .some(s => s.textContent.includes('"datePublished"') || s.textContent.includes('"dateModified"'));

  // ── Visible text date check (catches "Published: 2025-11-01" etc.) ──
  const bodyText = doc.body?.textContent || '';
  const hasVisibleDate =
    /\b(published|updated|posted|modified|last\s+updated)(\s+on)?\b[:\s–\-]{0,3}\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i
      .test(bodyText);

  const hasDate =
    !!doc.querySelector(
      'time[datetime], time[pubdate], time[itemprop="datePublished"], time[itemprop="dateModified"], ' +
      'meta[name="date"], meta[property="article:published_time"], meta[property="article:modified_time"], ' +
      'meta[property="og:updated_time"], meta[itemprop="datePublished"], ' +
      '.published, .updated, .post-date, .entry-date, .date, [class*="date" i], [class*="time" i], ' +
      '[itemprop="datePublished"], [itemprop="dateModified"]'
    ) || ldHasDate || hasVisibleDate;

  // ── Hostname extraction (safely) ──
  let host = '';
  try { host = new URL(url).hostname; } catch { /* ignore */ }

  const externalLinks = Array.from(doc.querySelectorAll('a[href^="https"]'))
    .filter(a => {
      if (host && a.href.includes(host)) return false;
      if (a.href.includes('facebook.com')) return false;
      if (a.href.includes('twitter.com')) return false;
      if (a.href.includes('instagram.com')) return false;
      if (a.href.includes('youtube.com')) return false;
      return true;
    });

  const hasTrustedLinks = externalLinks.length >= 2;

  let eeat = 0;
  if (hasAuthor)                eeat += 40;
  if (hasDate)                  eeat += 28;
  if (hasTrustedLinks)          eeat += 18;
  if (url.startsWith('https:')) eeat += 10;

  const MAX = 40 + 28 + 18 + 10; // = 96

  return {
    score: Math.min(100, (eeat / MAX) * 100),
    flags: {
      hasAuthor,
      hasDate,
      hasTrustedLinks,
      hasHttps: url.startsWith('https:')
    }
  };
}