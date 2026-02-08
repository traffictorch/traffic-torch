// module-nap-contact.js
import { moduleFixes } from "./fixes-v1.0.js";

export function analyzeNapContact(doc, city) {
  const data = {};
  const fixes = [];

  // NAP & Contact checks
  const addressEl = doc.querySelector('address, [itemprop="address"], [itemtype*="PostalAddress"], .address, footer, .contact, .location');
  const phoneEl   = doc.querySelector('a[href^="tel:"], [itemprop="telephone"]');

  const napPresent = !!(
    addressEl &&
    addressEl.textContent?.trim().toLowerCase().includes(city) &&
    phoneEl
  );

  const footerNap = !!doc.querySelector('footer')?.textContent.toLowerCase().includes(city) ||
                    !!doc.querySelector('footer address');

  const contactComplete = napPresent && !!doc.querySelector(
    '[itemprop="openingHours"], [itemprop="openingHoursSpecification"], time, .hours, .opening-hours'
  );

  data.present  = napPresent;
  data.footer   = footerNap;
  data.complete = contactComplete;

  if (!napPresent) {
    fixes.push({ module: 'NAP & Contact', sub: 'NAP Present', ...moduleFixes['NAP & Contact']['NAP Present'] });
  }
  if (!footerNap) {
    fixes.push({ module: 'NAP & Contact', sub: 'Footer NAP', ...moduleFixes['NAP & Contact']['Footer NAP'] });
  }
  if (!contactComplete) {
    fixes.push({ module: 'NAP & Contact', sub: 'Contact Complete', ...moduleFixes['NAP & Contact']['Contact Complete'] });
  }

  const score = (napPresent ? 8 : 0) + (footerNap ? 5 : 0) + (contactComplete ? 5 : 0);

  return { data, fixes, score, maxRaw: 18 };
}