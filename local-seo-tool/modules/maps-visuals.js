// module-maps-visuals.js

import { moduleFixes } from './fixes-v1.0.js';

export function analyzeMapsVisuals(doc, city, hasLocalIntent) {
  const fixes = [];

  // 4. Maps & Visuals
  const mapIframe = doc.querySelector('iframe[src*="maps.google"], [src*="google.com/maps"]');

  const images = doc.querySelectorAll('img');
  const localAltImages = Array.from(images).filter(img => hasLocalIntent(img.alt || '', city));

  const localAlts = localAltImages.length >= 2;

  // Removed small bonus to prevent score > 100 (as per original comment)
  const strongLocalAlts = 0;

  const data = {
    embedded: !!mapIframe,
    localAlt: localAlts,
    localAltCount: localAltImages.length  // optional – useful for reporting
  };

  const score = (mapIframe ? 8 : 0) + (localAlts ? 8 : 0) + strongLocalAlts;

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