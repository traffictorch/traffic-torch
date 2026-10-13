// contributions.js — contributor cards for NUSA
// Data-driven so more cards can be added without touching markup.
// Profile fields (avatar, points, links) load live from /api/torcher/{username}.
import { renderToolContributions } from '/shared/contributions-renderer.js';

export const contributors = [
  {
    handle: 'DrKJING',
    username: 'hasan',
    name: 'Hasan Kalkan',
    role: 'Inhaber · EverGrow SEO Solution',
    subtitle: 'Informatiker (B.Sc.) · Team Lead SEO @ bike-components · Aachen',
    location: 'Aachen, Deutschland',
    avatarInitial: 'H',
    avatarColor: 'from-cyan-500 to-blue-600',
    contribution: 'Tested NUSA v5.x on a live site and identified four false positives: HSTS and X-Content-Type-Options reported as missing when they were actually sent (CORS blocks cross-origin header reads), form fields flagged as unlabelled when they were wrapped in a `<label>` element or hidden as honeypots, a cookie-consent warning fired by a code comment, and an infinite-scroll warning fired by a counter animation\'s IntersectionObserver. His feedback drove the "can\'t check from the browser" fallback, the wrapping-label and honeypot handling, and the AEO false-positive fixes.',
    tags: ['False positives', 'Header verification', 'Form labelling']
  }
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}