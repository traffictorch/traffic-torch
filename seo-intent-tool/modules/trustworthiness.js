// seo-intent-tool/modules/trustworthiness.js

export function analyzeTrustworthiness(url, doc, config, cleanedText) {
  const isHttps = url.startsWith('https');
  const httpsUnknown = !url;                     // paste-mode: URL was not provided

  // === Contact ===
  const contactLinkElements = doc.querySelectorAll(
    config.parsing.contactLinkSelectors.join(', ') +
    ', a[href*="contact"], a[href*="/contact"], [class*="contact" i], [id*="contact" i]'
  );
  const footerContactText = Array.from(doc.querySelectorAll('footer a, footer span, footer div, footer p, .contact-info, .get-in-touch'))
    .some(el =>
      el.textContent.toLowerCase().includes('contact') ||
      el.textContent.toLowerCase().includes('get in touch') ||
      /\b(email|phone|tel|call|message|reach us|say hello)\b/i.test(el.textContent)
    );
  const hasContact = contactLinkElements.length > 0 || footerContactText;

  // === Policies ===
  const policyLinkElements = doc.querySelectorAll(
    config.parsing.policyLinkSelectors.join(', ') +
    ', a[href*="/policy" i], a[href*="/cookie" i], a[href*="/gdpr" i], a[href*="/legal" i]'
  );
  const footerPolicyText = Array.from(doc.querySelectorAll('footer a, footer span, footer div, footer p'))
    .some(el => /privacy|terms|cookie|gdpr|legal|disclaimer|imprint/i.test(el.textContent.toLowerCase()));
  const hasPolicies = policyLinkElements.length > 0 || footerPolicyText;

  // === Update Date ===
  // Config now uses only specific selectors (time[datetime], .updated, meta[property="article:modified_time"], etc).
  // Text fallback regex widened to allow non-word separators between the verb and the date.
  const updateDateElement = doc.querySelector(config.parsing.updateDateSelectors.join(', '));
  const updateDateTextMatch = cleanedText.match(
    /\b(?:Updated|Last updated|Last modified|Published|Modified on|Revised)[\s:\-—]+[A-Za-z0-9]/i
  );
  const hasUpdateDate = !!updateDateElement || !!updateDateTextMatch;

  const metrics = {
    https:      httpsUnknown ? 60 : (isHttps ? 100 : 20),
    contact:    hasContact  ? 100 : 20,
    policies:   hasPolicies ? 100 : 20,
    updateDate: hasUpdateDate ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 4);

  const failed = [];
  if (!isHttps && !httpsUnknown) failed.push("Switch to HTTPS");
  if (!hasContact)               failed.push("Add a visible Contact page or contact details");
  if (!hasPolicies)              failed.push("Include links to Privacy Policy and/or Terms");
  if (!hasUpdateDate)            failed.push("Display a last updated date");

  const normalized = score;

  if (typeof window !== 'undefined' && window.SEO_INTENT_DEBUG) {
    console.log('[trustworthiness]', {
      isHttps, httpsUnknown,
      hasContact, contactSelectorCount: contactLinkElements.length, footerContactText,
      hasPolicies, policySelectorCount: policyLinkElements.length, footerPolicyText,
      hasUpdateDate,
      updateDateElementHTML: updateDateElement ? updateDateElement.outerHTML.slice(0, 200) : null,
      updateDateTextMatch: updateDateTextMatch ? updateDateTextMatch[0] : null,
      score
    });
  }

  return {
    score,
    metrics,
    failed,
    normalized,
    hasContact,
    hasPolicies,
    hasUpdateDate
  };
}