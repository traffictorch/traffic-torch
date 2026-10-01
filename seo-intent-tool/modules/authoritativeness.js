// seo-intent-tool/modules/authoritativeness.js

// ✅ FIX: removed `testimonials?` and `case stud(?:y|ies)` — both are common
// marketing phrases that produced false positives on prose (e.g. "In one case
// study we boosted a client's dwell time" in NUSA's FAQ). Real testimonials and
// case studies should be detected via markup (`[class*="testimonial"]`,
// `blockquote`, `<cite>`), not prose. Ambiguous "best" / "top" alternatives now
// require a specific noun or year.
const AWARDS_PATTERN = [
  '\\b(?:',
    'award(?:s|-winning|-winner)?|awarded|',
    'winner|',
    'featured in|as seen (?:in|on)|',
    'recognized by|endorsed by|endorsement|',
    'certified by|accredited by|recommended by|',
    'trusted by|partnered with|collaborated with|',
    'press coverage|media mention|',
    'accolade|prize|nominee|finalist|',
    'honou?red|',
    'best (?:in|of) (?:class|the world|australia|\\d{4})|',
    'best (?:seller|product|service|company|agency|blog|site|platform|website) of \\d{4}|',
    'top \\d+ (?:rated|ranked)|',
    'top-rated|top rated|',
    '#1 (?:rated|ranked|in)|',
    'highly rated|',
    'ranked (?:#1|number one|first)|',
    'official (?:partner|sponsor)',
  ')\\b'
].join('');

const AWARDS_REGEX = new RegExp(AWARDS_PATTERN, 'gi');

export function analyzeAuthoritativeness(doc, cleanedText) {
  const hasAwards = !!cleanedText.match(AWARDS_REGEX);

  // === About / Team Links ===
  const aboutLinkElements = doc.querySelectorAll('a[href*="/about" i], a[href*="/team" i]');
  const hasAboutLinks = aboutLinkElements.length > 0 ||
    Array.from(doc.querySelectorAll('nav a')).some(a => {
      const t = (a.textContent || '').toLowerCase().trim();
      return t === 'about' || t === 'about us' || t === 'team' || t.startsWith('about ');
    });

  const metrics = {
    awards: hasAwards ? 100 : 20,
    aboutLinks: hasAboutLinks ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 2);

  const failed = [];
  if (!hasAwards) failed.push("Mention any awards, endorsements, or media features");
  if (!hasAboutLinks) failed.push("Add links to an About or Team page");

  // ✅ FIX: normalized now equals score (was hardcoded 100, masking the real
  // value anywhere a downstream consumer used `.normalized`).
  const normalized = score;

  // Optional debug — set `window.SEO_INTENT_DEBUG = true` in the console
  // before running an audit to log what actually matched.
  if (typeof window !== 'undefined' && window.SEO_INTENT_DEBUG) {
    const awardMatches = (cleanedText.match(AWARDS_REGEX) || []).slice(0, 10);
    console.log('[authoritativeness]', {
      hasAwards,
      awardMatches,
      hasAboutLinks,
      aboutLinkCount: aboutLinkElements.length,
      score
    });
  }

  return {
    score,
    metrics,
    failed,
    normalized,
    hasAboutLinks
  };
}