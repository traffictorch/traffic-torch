// module-maps-visuals.js
import { moduleFixes } from "../fixes-v1.0.js";

export function analyzeMapsVisuals(doc, city, hasLocalIntent) {
  const fixes = [];

  // 4. Maps & Visuals
  const mapIframe = doc.querySelector('iframe[src*="maps.google"], [src*="google.com/maps"]');

  const cityLower = city.toLowerCase().trim();

  // Stricter local alt text check: require the actual city name in alt text
  // Changed to >= 1 image (as requested)
  const images = doc.querySelectorAll('img');
  const localAltImages = Array.from(images).filter(img => {
    const alt = (img.alt || '').toLowerCase().trim();
    return alt.includes(cityLower);
  });

  const localAlts = localAltImages.length >= 1;   // ← Changed from 2 to 1

  const data = {
    embedded: !!mapIframe,
    localAlt: localAlts,
    localAltCount: localAltImages.length
  };

  const score = (mapIframe ? 8 : 0) + (localAlts ? 8 : 0);

  // Push fixes for failed checks
  if (!mapIframe) {
    fixes.push({
      module: 'Maps & Visuals',
      sub: 'Map Embedded',
      ...moduleFixes['Maps & Visuals']['Map Embedded']
    });
  }
  if (!localAlts) {
    fixes.push({
      module: 'Maps & Visuals',
      sub: 'Local Alt Text',
      ...moduleFixes['Maps & Visuals']['Local Alt Text']
    });
  }

  return { data, fixes, score, maxRaw: 16 };
}