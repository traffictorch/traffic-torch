export function computeStructuredData(doc) {
  let hasArticle = false;
  let hasFaqHowto = false;
  let hasPerson = false;
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let structuredData = 0;
  let hasValidJsonLd = false;

  jsonLdScripts.forEach(s => {
    try {
      let data = JSON.parse(s.textContent.trim());
      hasValidJsonLd = true;

      // Handle common wrappers: @graph array, top-level array, or single object
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        data = data['@graph'];
      }
      const items = Array.isArray(data) ? data : [data];

      items.forEach(item => {
        if (!item || typeof item !== 'object') return;

        const type = item['@type'];
        if (!type) return;

        const types = Array.isArray(type) ? type : [type];

        types.forEach(t => {
          if (['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'ScholarlyArticle'].includes(t)) {
            hasArticle = true;
          }
          if (['FAQPage', 'HowTo'].includes(t)) {
            hasFaqHowto = true;
          }
          if (t === 'Person') {
            if (hasArticle || (item.name && item.name.length > 3) || item.givenName || item.familyName) {
              hasPerson = true;
            }
          }
        });
      });
    } catch (e) {
      // silently skip invalid JSON
    }
  });

  if (hasValidJsonLd) structuredData += 20;
  if (hasArticle) structuredData += 35;
  if (hasFaqHowto) structuredData += 18;
  if (hasPerson) structuredData += 22;

  return {
    score: structuredData,
    flags: {
      hasValidJsonLd,
      hasArticle,
      hasFaqHowto,
      hasPerson
    }
  };
}