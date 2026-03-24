function extractAllSchemaTypes(obj, types = new Set()) {
  if (!obj || typeof obj !== 'object') return types;
  if (Array.isArray(obj)) {
    obj.forEach(item => extractAllSchemaTypes(item, types));
    return types;
  }
  if (obj['@type']) {
    const t = obj['@type'];
    if (Array.isArray(t)) t.forEach(type => types.add(type));
    else types.add(t);
  }
  Object.values(obj).forEach(val => extractAllSchemaTypes(val, types));
  return types;
}

export function analyzeSchema(doc) {
  const schemaTypes = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      const json = JSON.parse(s.textContent);
      const extracted = Array.from(extractAllSchemaTypes(json));
      schemaTypes.push(...extracted);
    } catch {}
  });
  const uniqueTypes = [...new Set(schemaTypes)];
  const normalized = uniqueTypes.length >= 3 ? 100 : uniqueTypes.length >= 2 ? 95 : uniqueTypes.length === 1 ? 65 : 20;
  return { schemaTypes: uniqueTypes, normalized };
}