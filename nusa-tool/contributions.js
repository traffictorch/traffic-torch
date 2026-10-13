// contributions.js — contributor cards for NUSA
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
    contribution: 'Tested NUSA v5.x on a live site and identified four false positives: HSTS and X-Content-Type-Options reported as missing when they were actually sent (CORS blocks cross-origin header reads), form fields flagged as unlabelled when they were wrapped in a <label> element or hidden as honeypots, a cookie-consent warning fired by a code comment, and an infinite-scroll warning fired by a counter animation\'s IntersectionObserver. On a follow-up run he flagged two more: Flesch Reading Ease and Flesch-Kincaid being applied to a German page (English syllable formulas on lang="de" produce nonsense), and inline scripts being counted as "may hide content" even when the raw HTML already contained the content. All six reports shipped into the codebase.',
    tags: ['False positives', 'Header verification', 'Language detection', 'Regression report']
  }
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}