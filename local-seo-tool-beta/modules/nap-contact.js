// module-nap-contact.js
import { moduleFixes } from "../fixes-v1.0.js";

export function analyzeNapContact(doc, city) {
  const fixes = [];

  const cityLower = city.toLowerCase().trim();

  // NAP Present = has address-like element that actually contains the city name + phone
  const addressEls = doc.querySelectorAll('address, [itemprop="address"], [itemtype*="PostalAddress"], .address, .location');
  const phoneEl = doc.querySelector('a[href^="tel:"], [itemprop="telephone"]');

  const hasAddressWithCity = Array.from(addressEls).some(el => 
    el.textContent.toLowerCase().includes(cityLower)
  );

  const napPresent = hasAddressWithCity && !!phoneEl;

  // Footer NAP = footer contains city name (more reasonable than before)
  const footerEl = doc.querySelector('footer');
  const footerNap = footerEl ? footerEl.textContent.toLowerCase().includes(cityLower) : false;

  // Contact Complete = has opening hours (only if NAP is present)
  const hasHours = !!doc.querySelector(
    '[itemprop="openingHours"], [itemprop="openingHoursSpecification"], .hours, .opening-hours, time[datetime]'
  );

  const contactComplete = napPresent && hasHours;

  const data = {
    present: napPresent,
    footer: footerNap,
    complete: contactComplete
  };

  if (!napPresent) {
    fixes.push({ 
      module: 'NAP & Contact', 
      sub: 'NAP Present', 
      ...moduleFixes['NAP & Contact']['NAP Present'] 
    });
  }
  if (!footerNap) {
    fixes.push({ 
      module: 'NAP & Contact', 
      sub: 'Footer NAP', 
      ...moduleFixes['NAP & Contact']['Footer NAP'] 
    });
  }
  if (!contactComplete) {
    fixes.push({ 
      module: 'NAP & Contact', 
      sub: 'Contact Complete', 
      ...moduleFixes['NAP & Contact']['Contact Complete'] 
    });
  }

  const score = (napPresent ? 8 : 0) + (footerNap ? 5 : 0) + (contactComplete ? 5 : 0);

  return { data, fixes, score, maxRaw: 18 };
}