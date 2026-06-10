export function analyzeExpertise(doc, cleanedText, config) {
  const hasAuthorByline = !!doc.querySelector(config.parsing.authorBylineSelectors.join(', '));
  const hasAuthorBio     = !!doc.querySelector(config.parsing.authorBioSelectors.join(', '));
  const credentialKeywords = (cleanedText.match(/\b(PhD|MD|doctor|Dr\.?|certified|licensed|years? of experience|expert in|specialist|award-winning|published in|fellow|board-certified|certificate|diploma|qualification|accredited|professional membership|industry leader|renowned|distinguished|master'?s degree|bachelor'?s degree|MBA|CPA|CFA|PMP|JD|LLB|engineer|architect|scientist|professor|consultant|coach|trainer|instructor|15\+ years?|10\+ years?|veteran|authority|thought leader)\b/gi) || []).length;
  const hasCitations = !!doc.querySelector('cite, .references, .sources, a[href*="doi.org"], a[href*="pubmed"], a[href*="researchgate"], footer a[href*="/references"]');

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

  return { score, metrics, failed, normalized, hasAuthorByline, hasAuthorBio };
}