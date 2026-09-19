export function computeEEAT(doc, url) {
  const hasAuthor = !!doc.querySelector(
    'meta[name="author"], meta[property="og:author"], meta[property="article:author"], ' +
    '.author, .byline, .post-author, .entry-author, [rel="author"], ' +
    '[itemprop="author"], [class*="author" i], [class*="byline" i], [class*="posted-by" i], ' +
    '[data-author], a[rel="author"]'
  );
  const hasDate = !!doc.querySelector(
    'time[datetime], time[pubdate], time[itemprop="datePublished"], time[itemprop="dateModified"], ' +
    'meta[name="date"], meta[property="article:published_time"], meta[property="article:modified_time"], ' +
    'meta[property="og:updated_time"], meta[itemprop="datePublished"], ' +
    '.published, .updated, .post-date, .entry-date, .date, [class*="date" i], [class*="time" i], ' +
    '[itemprop="datePublished"], [itemprop="dateModified"]'
  ) || Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
    .some(s => s.textContent.includes('"datePublished"') || s.textContent.includes('"dateModified"'));
  const externalLinks = Array.from(doc.querySelectorAll('a[href^="https"]'))
    .filter(a => !a.href.includes(new URL(url).hostname) &&
                  !a.href.includes('facebook.com') &&
                  !a.href.includes('twitter.com') &&
                  !a.href.includes('instagram.com') &&
                  !a.href.includes('youtube.com'));
  const hasTrustedLinks = externalLinks.length >= 2;
  let eeat = 0;
  if (hasAuthor) eeat += 40;
  if (hasDate) eeat += 28;
  if (hasTrustedLinks) eeat += 18;
  if (url.startsWith('https:')) eeat += 10;
  return {
    score: eeat,
    flags: {
      hasAuthor,
      hasDate,
      hasTrustedLinks,
      hasHttps: url.startsWith('https:')
    }
  };
}