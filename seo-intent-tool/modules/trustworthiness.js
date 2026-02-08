export function analyzeTrustworthiness(url, doc, config) {
  const isHttps = url.startsWith('https');

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
  const updateDateElement = doc.querySelector(config.parsing.updateDateSelectors.join(', '));
  const hasUpdateDate = !!updateDateElement ||
    cleanedText.match(/\b(Updated|Last updated|Published|Modified on)[\s:]*\w+/gi);

  const metrics = {
    https:      isHttps     ? 100 : 20,
    contact:    hasContact  ? 100 : 20,
    policies:   hasPolicies ? 100 : 20,
    updateDate: hasUpdateDate ? 100 : 20
  };

  const score = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 4);

  const failed = [];
  if (!isHttps)         failed.push("Switch to HTTPS");
  if (!hasContact)      failed.push("Add a visible Contact page or contact details");
  if (!hasPolicies)     failed.push("Include links to Privacy Policy and/or Terms");
  if (!hasUpdateDate)   failed.push("Display a last updated date");

  // Radar uses same scale as score
  const normalized = score;

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