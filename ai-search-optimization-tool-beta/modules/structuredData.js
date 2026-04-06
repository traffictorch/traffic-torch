export function computeStructuredData(doc) {
  let hasArticle = false;
  let hasFaqHowto = false;
  let hasPerson = false;
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let structuredData = 0;
  let hasValidJsonLd = false;
  jsonLdScripts.forEach(s => {
    try {
      const data = JSON.parse(s.textContent);
      hasValidJsonLd = true;
      const items = Array.isArray(data) ? data : [data];
      items.forEach(item => {
        if (!item?.['@type']) return;
        const type = item['@type'];
        if (['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'ScholarlyArticle'].includes(type)) {
          hasArticle = true;
        }
        if (['FAQPage', 'HowTo'].includes(type)) {
          hasFaqHowto = true;
        }
        if (type === 'Person') {
          if (hasArticle || item.name?.length > 3 || item.givenName || item.familyName) {
            hasPerson = true;
          }
        }
      });
    } catch {}
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