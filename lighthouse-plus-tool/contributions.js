// contributions.js — contributor cards for Lighthouse Plus
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
    contribution: 'Reported the Core Web Vitals module showing "100 / Excellent" while simultaneously saying "Not measured" — the score was being fabricated from default zeros when no browser capture was available. Also flagged the PWA category being treated as a critical failure after Google removed it from Lighthouse 12. Both reports drove the N/A handling for unmeasured modules and the PWA / Installability (optional) rework with intent detection.',
    tags: ['Core Web Vitals', 'PWA module', 'Regression report']
  }
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}