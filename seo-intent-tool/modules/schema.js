export function analyzeSchema(doc) {
  const schemaTypes = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      const json = JSON.parse(s.textContent);
      const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
      schemaTypes.push(...types.filter(Boolean));
    } catch {}
  });

  const normalized = schemaTypes.length >= 3 ? 100 : schemaTypes.length >= 2 ? 95 : schemaTypes.length === 1 ? 65 : 20;

  return { schemaTypes, normalized };
}