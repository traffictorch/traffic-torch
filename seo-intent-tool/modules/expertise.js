// seo-intent-tool/modules/expertise.js

export function analyzeExpertise(doc, cleanedText, config) {
  const hasAuthorByline = !!doc.querySelector(config.parsing.authorBylineSelectors.join(', '));
  const hasAuthorBio     = !!doc.querySelector(config.parsing.authorBioSelectors.join(', '));

  const credentialKeywords = (cleanedText.match(
    /\b(PhD|MD|doctor|Dr\.?|certified|licensed|years? of experience|expert in|specialist|award-winning|published in|fellow|board-certified|certificate|diploma|qualification|accredited|professional membership|industry leader|renowned|distinguished|master'?s degree|bachelor'?s degree|MBA|CPA|CFA|PMP|JD|LLB|engineer|architect|scientist|professor|consultant|coach|trainer|instructor|15\+ years?|10\+ years?|veteran|authority|thought leader)\b/gi
  ) || []).length;

  // ✅ hasCitations selector kept the same but debug logging added below.
  // Suspected false positive source on NUSA: the selector includes
  // `footer a[href*="/references"]` — a substring match that can hit unrelated
  // footer links whose URL happens to contain "/references" as part of a longer
  // path. If the debug log shows a match on NUSA that isn't a real citation,
  // narrow this list (see module-explanations note).
  const citationSelector =
    'cite, .references, .sources, a[href*="doi.org"], a[href*="pubmed"], a[href*="researchgate"], footer a[href*="/references"]';
  const citationMatch = doc.querySelector(citationSelector);
  const hasCitations = !!citationMatch;

  const metrics = {
    byline:      hasAuthorByline ? 100 : 20,
    bio:         hasAuthorBio    ? 100 : 20,
    credentials: credentialKeywords > 2 ? 100 : credentialKeywords > 0 ? 60 : 20,
    citations:   hasCitations    ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 4);

  const failed = [];
  if (!hasAuthorByline)      failed.push("Add a visible author byline/name");
  if (!hasAuthorBio)         failed.push("Create an author bio section with photo and background");
  if (credentialKeywords <= 2) failed.push("Mention relevant qualifications, certifications, or years of experience");
  if (!hasCitations)         failed.push("Include citations or links to supporting sources");

  const normalized = score;

  // Optional debug — set `window.SEO_INTENT_DEBUG = true` before auditing.
  // Logs which specific selector matched, so we can identify false positives.
  if (typeof window !== 'undefined' && window.SEO_INTENT_DEBUG) {
    const bylineHit = hasAuthorByline
      ? config.parsing.authorBylineSelectors.find(s => { try { return !!doc.querySelector(s); } catch { return false; } })
      : null;
    const bioHit = hasAuthorBio
      ? config.parsing.authorBioSelectors.find(s => { try { return !!doc.querySelector(s); } catch { return false; } })
      : null;
    console.log('[expertise]', {
      hasAuthorByline, bylineHit,
      hasAuthorBio, bioHit,
      credentialKeywords,
      hasCitations,
      citationHitSelector: citationMatch ? citationSelector : null,
      citationHitHTML: citationMatch ? citationMatch.outerHTML.slice(0, 200) : null,
      score
    });
  }

  return { score, metrics, failed, normalized, hasAuthorByline, hasAuthorBio };
}