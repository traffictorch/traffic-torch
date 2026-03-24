function extractAllSchemaTypes(obj, types = new Set()) {
  if (!obj || typeof obj !== 'object') return types;

  if (Array.isArray(obj)) {
    obj.forEach(item => extractAllSchemaTypes(item, types));
    return types;
  }

  // Handle common @graph wrapper
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    extractAllSchemaTypes(obj['@graph'], types);
  }

  // Extract @type (can be string or array)
  if (obj['@type']) {
    const t = obj['@type'];
    if (Array.isArray(t)) {
      t.forEach(type => types.add(String(type).trim()));
    } else {
      types.add(String(t).trim());
    }
  }

  // Recurse into every value (handles deeply nested Person inside Article, Offer inside Product, etc.)
  Object.values(obj).forEach(val => extractAllSchemaTypes(val, types));

  return types;
}

export function analyzeSchema(doc) {
  const schemaTypes = [];

  // 1. Parse from rendered DOM (covers most cases)
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      let json = JSON.parse(script.textContent.trim());

      // Handle top-level array with single object
      if (Array.isArray(json) && json.length === 1) json = json[0];

      const extracted = Array.from(extractAllSchemaTypes(json));
      schemaTypes.push(...extracted);
    } catch (e) {}
  });

  // 2. Aggressive raw HTML scan (catches JS-injected schema that never appears in DOMParser)
  const fullHTML = doc.documentElement.outerHTML || '';
  const jsonMatches = fullHTML.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  jsonMatches.forEach(match => {
    try {
      const content = match
        .replace(/<script[^>]*>/i, '')
        .replace(/<\/script>/i, '')
        .trim();

      let json = JSON.parse(content);

      if (Array.isArray(json) && json.length === 1) json = json[0];

      const extracted = Array.from(extractAllSchemaTypes(json));
      schemaTypes.push(...extracted);
    } catch (e) {}
  });

  // 3. Final deduplication
  const uniqueTypes = [...new Set(schemaTypes.filter(t => t && typeof t === 'string'))];

  const normalized = uniqueTypes.length >= 3 ? 100 : uniqueTypes.length >= 2 ? 95 : uniqueTypes.length === 1 ? 65 : 20;

  return { 
    schemaTypes: uniqueTypes, 
    normalized 
  };
}