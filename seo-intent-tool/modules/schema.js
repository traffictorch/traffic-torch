function extractAllSchemaTypes(obj, types = new Set()) {
  if (!obj || typeof obj !== 'object') return types;

  if (Array.isArray(obj)) {
    obj.forEach(item => extractAllSchemaTypes(item, types));
    return types;
  }

  // Handle @graph (common in many CMS)
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    extractAllSchemaTypes(obj['@graph'], types);
  }

  if (obj['@type']) {
    const t = obj['@type'];
    if (Array.isArray(t)) {
      t.forEach(type => types.add(String(type).trim()));
    } else {
      types.add(String(t).trim());
    }
  }

  // Recurse into all other properties (handles nested Person inside Article, etc.)
  Object.values(obj).forEach(val => extractAllSchemaTypes(val, types));

  return types;
}

export function analyzeSchema(doc) {
  const schemaTypes = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      let json = JSON.parse(s.textContent);

      // Some sites wrap everything in an array at top level
      if (Array.isArray(json) && json.length === 1) {
        json = json[0];
      }

      const extracted = Array.from(extractAllSchemaTypes(json));
      schemaTypes.push(...extracted);
    } catch (e) {
      // silent fail on invalid JSON
    }
  });

  const uniqueTypes = [...new Set(schemaTypes.filter(Boolean))];
  const normalized = uniqueTypes.length >= 3 ? 100 : uniqueTypes.length >= 2 ? 95 : uniqueTypes.length === 1 ? 65 : 20;

  return { schemaTypes: uniqueTypes, normalized };
}