// contributions.js — contributor cards for the AEO Log Analyzer
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
    contribution: 'Suggested log-based crawler verification over spoofed user-agent probing — correctly noted that Cloudflare verifies crawlers by published IP range, not UA. His real-world log data showed verified OAI-SearchBot and ClaudeBot receiving 429 rate-limit responses from his host, which drove the "suspicious status codes" panel and the IP-verification architecture of this tool.',
    tags: ['Architecture', 'Rate-limit detection', 'IP verification']
  }
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}