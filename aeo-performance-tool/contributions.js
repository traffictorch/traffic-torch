// contributions.js — contributor cards for the AEO Performance Tool
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
    contribution: 'Ran the tool on a live site and reported three false positives: a cookie-consent warning fired by a code comment saying "no cookie banner needed", an infinite-scroll warning fired by a counter animation\'s IntersectionObserver, and a text-to-code failure fired at 10.1% on a Tailwind/Astro page. Also flagged that the semantic-HTML-ratio penalty punished utility-CSS wrappers rather than real div-soup, and that inline scripts were counted as "may hide content" even when the raw HTML already contained the content. All four checks were rewritten: cookie detection strips scripts and comments first; infinite-scroll requires a named library or scroll-plus-fetch with no pagination; the text-density fail floor moved from 15% to 8%; and the semantic ratio was replaced with four content-findability checks.',
    tags: ['False positives', 'Threshold calibration', 'Semantic structure', 'Crawler accessibility']
  }
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}