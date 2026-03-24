function extractAllSchemaTypes(obj, types = new Set()) {
  if (!obj || typeof obj !== 'object') return types;
  if (Array.isArray(obj)) {
    obj.forEach(item => extractAllSchemaTypes(item, types));
    return types;
  }
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    extractAllSchemaTypes(obj['@graph'], types);
  }
  if (obj['@type']) {
    const t = obj['@type'];
    if (Array.isArray(t)) t.forEach(type => types.add(String(type).trim()));
    else types.add(String(t).trim());
  }
  Object.values(obj).forEach(val => extractAllSchemaTypes(val, types));
  return types;
}

export function analyzeSchema(rawHtml, doc = null) {
  const schemaTypes = new Set();

  // 1. Raw HTML regex – catches the massive @graph block at the very bottom
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(rawHtml)) !== null) {
    try {
      let json = JSON.parse(match[1].trim());
      if (Array.isArray(json)) json.forEach(item => extractAllSchemaTypes(item, schemaTypes));
      else extractAllSchemaTypes(json, schemaTypes);
    } catch (e) {}
  }

  // 2. DOM fallback (if raw missed anything)
  if (doc) {
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        let json = JSON.parse(script.textContent.trim());
        if (Array.isArray(json)) json.forEach(item => extractAllSchemaTypes(item, schemaTypes));
        else extractAllSchemaTypes(json, schemaTypes);
      } catch (e) {}
    });
  }

  const uniqueTypes = Array.from(schemaTypes);
  const normalized = uniqueTypes.length >= 3 ? 100 : uniqueTypes.length >= 2 ? 95 : uniqueTypes.length === 1 ? 65 : 20;

  return { schemaTypes: uniqueTypes, normalized };
}