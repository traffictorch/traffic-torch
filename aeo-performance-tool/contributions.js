// contributions.js — contributor cards for the AEO Log Analyzer
// Data-driven so more cards can be added without touching markup.
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
    contribution: 'Pushed back on the original AEO framing with a training-crawler vs. search-crawler distinction — GPTBot and ClaudeBot feed future model weights, while OAI-SearchBot and ChatGPT-User decide today\'s citations. His log data showed verified OAI-SearchBot and ClaudeBot receiving 429 rate-limit responses from his host, which drove the per-bot "Crawler Behaviour Notes" panel. Also flagged that bot JS behaviour is observed, not documented, which led to removing bot names from the diff column headers.',
    tags: ['Architecture', 'Crawler taxonomy', 'Behaviour data'],
    links: {
      linkedin: 'https://www.linkedin.com/in/hasan-kalkan/',
      github:   'https://github.com/HK2084',
      reddit:   'https://www.reddit.com/user/DrKJING/',
      website:  'https://evergrowsolution.de'
    }
  }
  // Future contributors go here.
];

export function renderContributions(containerId = 'contributions-section') {
  return renderToolContributions(contributors, containerId);
}
