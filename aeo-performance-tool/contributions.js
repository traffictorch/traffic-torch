// contributions.js — contributor cards for the AEO Performance Tool
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
    contribution: 'Ran the tool on a live site and reported three false positives: a cookie-consent warning fired by a code comment saying "no cookie banner needed", an infinite-scroll warning fired by a counter animation\'s IntersectionObserver, and a text-to-code failure fired at 10.1% on a Tailwind/Astro page. All three checks were rewritten — cookie detection now strips scripts and comments first, infinite-scroll requires a named library or a scroll-plus-fetch pair with no pagination, and the text-density fail floor moved from 15% to 8%.',
    tags: ['False positives', 'Threshold calibration', 'Crawler accessibility']
  }
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}