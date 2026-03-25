export function analyzeSchema(rawHtml, doc = null) {
  const schemaTypes = new Set();

  // Regex to find all JSON-LD scripts
  const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
 
  let match;
  while ((match = regex.exec(rawHtml)) !== null) {
    const content = match[1].trim();
    if (content.length < 20) continue;
    try {
      let json = JSON.parse(content);

      // Only collect top-level @type (matches schema.org validator behavior)
      if (Array.isArray(json)) {
        json.forEach(item => {
          if (item && item['@type']) {
            const t = item['@type'];
            if (Array.isArray(t)) t.forEach(type => schemaTypes.add(String(type).trim()));
            else schemaTypes.add(String(t).trim());
          }
        });
      } else if (json && json['@graph'] && Array.isArray(json['@graph'])) {
        json['@graph'].forEach(item => {
          if (item && item['@type']) {
            const t = item['@type'];
            if (Array.isArray(t)) t.forEach(type => schemaTypes.add(String(type).trim()));
            else schemaTypes.add(String(t).trim());
          }
        });
      } else if (json && json['@type']) {
        const t = json['@type'];
        if (Array.isArray(t)) t.forEach(type => schemaTypes.add(String(type).trim()));
        else schemaTypes.add(String(t).trim());
      }
    } catch (e) {}
  }

  // DOM fallback (same logic)
  if (doc) {
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        let json = JSON.parse(script.textContent.trim());
        if (Array.isArray(json)) {
          json.forEach(item => {
            if (item && item['@type']) {
              const t = item['@type'];
              if (Array.isArray(t)) t.forEach(type => schemaTypes.add(String(type).trim()));
              else schemaTypes.add(String(t).trim());
            }
          });
        } else if (json && json['@graph'] && Array.isArray(json['@graph'])) {
          json['@graph'].forEach(item => {
            if (item && item['@type']) {
              const t = item['@type'];
              if (Array.isArray(t)) t.forEach(type => schemaTypes.add(String(type).trim()));
              else schemaTypes.add(String(t).trim());
            }
          });
        } else if (json && json['@type']) {
          const t = json['@type'];
          if (Array.isArray(t)) t.forEach(type => schemaTypes.add(String(type).trim()));
          else schemaTypes.add(String(t).trim());
        }
      } catch (e) {}
    });
  }

  const uniqueTypes = Array.from(schemaTypes);

  // Scoring logic (unchanged)
  const normalized = uniqueTypes.length >= 3 ? 100 :
                     uniqueTypes.length >= 2 ? 95 :
                     uniqueTypes.length === 1 ? 65 : 20;

  return {
    schemaTypes: uniqueTypes,
    normalized
  };
}