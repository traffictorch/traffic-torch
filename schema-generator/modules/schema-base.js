// modules/schema-base.js
// Shared utilities for all schema modules in Traffic Torch Schema Generator
// Latest best practices 2026: ES modules, optional chaining, structured errors, clean JSON output

/**
 * Builds the basic JSON-LD skeleton with required @context and @type
 * @param {string} type - The Schema.org @type (e.g. "FAQPage")
 * @param {object} [overrides={}] - Optional overrides (e.g. @id, name)
 * @returns {object} Base JSON-LD object
 */
export function buildJsonLdSkeleton(type, overrides = {}) {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
    ...overrides,
  };

  // Optional: Add @id if url or entity ID is provided
  if (overrides.url && !overrides['@id']) {
    base['@id'] = overrides.url + '#schema';
  }

  return base;
}

/**
 * Validates required fields for a schema object
 * @param {object} data - The form data / schema object to validate
 * @param {string[]} required - Array of required top-level keys (dot notation supported)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRequiredFields(data, required = []) {
  const errors = [];

  for (const field of required) {
    const value = getNestedValue(data, field);
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      errors.push(`Missing required field: ${field}`);
    } else if (Array.isArray(value) && value.length === 0) {
      errors.push(`Required array is empty: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Deep get for nested properties (e.g. "mainEntity.0.acceptedAnswer.text")
 * @param {object} obj 
 * @param {string} path 
 * @returns {any}
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, key) => {
    if (o === undefined || o === null) return undefined;
    // Handle array indices
    if (/^\d+$/.test(key)) return o[parseInt(key, 10)];
    return o[key];
  }, obj);
}

/**
 * Removes empty objects, empty arrays, null/undefined values from JSON-LD
 * Helps keep output clean and valid
 * @param {object} obj 
 * @returns {object}
 */
export function cleanJsonLd(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj
      .map(cleanJsonLd)
      .filter(item => item !== undefined && item !== null && !(Array.isArray(item) && item.length === 0));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanedValue = cleanJsonLd(value);
    if (
      cleanedValue !== undefined &&
      cleanedValue !== null &&
      !(typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0) &&
      !(Array.isArray(cleanedValue) && cleanedValue.length === 0)
    ) {
      cleaned[key] = cleanedValue;
    }
  }
  return cleaned;
}

/**
 * Pretty-prints JSON-LD with 2-space indentation (for preview)
 * @param {object} jsonLd 
 * @returns {string}
 */
export function prettyJsonLd(jsonLd) {
  try {
    return JSON.stringify(cleanJsonLd(jsonLd), null, 2);
  } catch (err) {
    return '// Error generating preview';
  }
}

/**
 * Nests one schema inside another (e.g. add FAQPage as mainEntity of WebPage)
 * @param {object} parent - Parent schema object
 * @param {object} child - Child schema to nest
 * @param {string} nestKey - Where to nest (default: "mainEntity")
 * @returns {object}
 */
export function nestSchema(parent, child, nestKey = 'mainEntity') {
  if (!parent || !child) return parent;

  const nested = { ...parent };

  if (!nested[nestKey]) {
    nested[nestKey] = child;
  } else if (Array.isArray(nested[nestKey])) {
    nested[nestKey] = [...nested[nestKey], child];
  } else {
    nested[nestKey] = [nested[nestKey], child];
  }

  return nested;
}

/**
 * Generates simple educational HTML snippet for tooltips / info boxes
 * @param {string} content - Markdown-like text
 * @returns {string} HTML string
 */
export function createEducationSnippet(content) {
  // Very basic markdown → HTML (expand later with marked.js if needed)
  const html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/- (.+)/g, '• $1<br>');

  return `<div class="text-sm text-gray-600 dark:text-gray-400 mt-2">${html}</div>`;
}

// Common error message generator
export function formatValidationErrors(errors) {
  if (!errors?.length) return '';
  return `
    <div class="text-red-600 dark:text-red-400 text-sm mt-2">
      <strong>Validation issues:</strong><br>
      ${errors.map(e => `• ${e}`).join('<br>')}
    </div>
  `;
}