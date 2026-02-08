// module-structured-data.js

import { moduleFixes } from "../fixes-v1.0.js";

export function analyzeStructuredData(doc) {
  const fixes = [];

  // 5. Structured Data
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let schemaData = null;

  const findLocalBusiness = (obj) => {
    if (!obj) return null;
    if (obj['@type'] === 'LocalBusiness') return obj;
    // Support common subtypes that behave like LocalBusiness
    if (['ProfessionalService', 'Store', 'Restaurant', 'Dentist', 'VeterinaryCare', 'LocalBusiness'].includes(obj['@type']) && obj.address) {
      return obj;
    }
    // Check @graph array
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        const found = findLocalBusiness(item);
        if (found) return found;
      }
    }
    // Check nested (e.g. Organization contains department LocalBusiness)
    if (obj.department && Array.isArray(obj.department)) {
      for (const dep of obj.department) {
        const found = findLocalBusiness(dep);
        if (found) return found;
      }
    }
    return null;
  };

  for (const script of schemaScripts) {
    try {
      const parsed = JSON.parse(script.textContent);
      const candidate = findLocalBusiness(parsed);
      if (candidate) {
        schemaData = candidate;
        break; // take the first valid one
      }
    } catch {}
  }

  const localSchemaPresent = !!schemaData;
  const geoCoords = !!schemaData?.geo?.latitude && !!schemaData?.geo?.longitude;
  const hoursPresent = !!schemaData?.openingHoursSpecification || !!schemaData?.openingHours;

  const data = {
    localPresent: localSchemaPresent,
    geoCoords,
    hours: hoursPresent
  };

  // Push fixes for failed checks
  if (!localSchemaPresent) {
    fixes.push({
      module: 'Structured Data',
      sub: 'Local Schema',
      ...moduleFixes['Structured Data']['Local Schema']
    });
  }
  if (!geoCoords) {
    fixes.push({
      module: 'Structured Data',
      sub: 'Geo Coords',
      ...moduleFixes['Structured Data']['Geo Coords']
    });
  }
  if (!hoursPresent) {
    fixes.push({
      module: 'Structured Data',
      sub: 'Opening Hours',
      ...moduleFixes['Structured Data']['Opening Hours']
    });
  }

  const score = (localSchemaPresent ? 8 : 0) + (geoCoords ? 5 : 0) + (hoursPresent ? 5 : 0);

  return { data, fixes, score, maxRaw: 18 };
}