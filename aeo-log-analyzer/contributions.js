// contributions.js — contributor cards for the AEO Log Analyzer
// Data-driven so more cards can be added without touching markup.

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
    tags: ['Architecture', 'Rate-limit detection', 'IP verification'],
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
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!contributors.length) {
    container.remove();
    return;
  }

  const initial = contributors.slice(0, 3);
  const rest = contributors.slice(3);

  container.innerHTML = `
    <section class="max-w-6xl mx-auto my-16 px-2">
      <div class="text-center mb-10">
        <h2 class="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
          Built With The Community
        </h2>
        <p class="text-base md:text-lg text-gray-600 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
          This tool exists because people who run it for real told us what was missing. Their feedback shaped the architecture.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${initial.map(renderCard).join('')}
      </div>

      ${rest.length ? `
        <div id="contrib-more" class="hidden mt-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${rest.map(renderCard).join('')}
          </div>
        </div>
        <div class="text-center mt-8">
          <button type="button" id="contrib-toggle" class="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold text-sm transition">
            Show ${rest.length} more contributor${rest.length === 1 ? '' : 's'}
          </button>
        </div>
      ` : ''}
    </section>
  `;

  const toggle = document.getElementById('contrib-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const more = document.getElementById('contrib-more');
      const isHidden = more.classList.contains('hidden');
      more.classList.toggle('hidden');
      toggle.textContent = isHidden
        ? 'Show fewer'
        : `Show ${rest.length} more contributor${rest.length === 1 ? '' : 's'}`;
    });
  }
}

function renderCard(c) {
  const linkIcons = {
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    github:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
    reddit:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Z"/></svg>`,
    website:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  };

  const linksHtml = Object.entries(c.links || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <a href="${escapeAttr(v)}" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition"
         aria-label="${escapeAttr(k)}">
        ${linkIcons[k] || ''}
        <span class="capitalize">${escapeHtml(k)}</span>
      </a>
    `).join('');

  return `
    <article class="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden flex flex-col">
      <div class="p-6 flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${c.avatarColor} flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-md">
          ${escapeHtml(c.avatarInitial || '?')}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-black text-gray-900 dark:text-gray-100 truncate">${escapeHtml(c.name)}</h3>
          <p class="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate">u/${escapeHtml(c.handle)}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-tight">${escapeHtml(c.role)}</p>
          ${c.subtitle ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-0.5 leading-tight">${escapeHtml(c.subtitle)}</p>` : ''}
        </div>
      </div>

      <div class="px-6 pb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
        <p>${escapeHtml(c.contribution)}</p>
      </div>

      ${c.tags?.length ? `
        <div class="px-6 pb-4 flex flex-wrap gap-1.5">
          ${c.tags.map(t => `<span class="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[11px] font-semibold uppercase tracking-wide">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}

      ${linksHtml ? `
        <div class="px-6 pb-6 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
          ${linksHtml}
        </div>
      ` : ''}
    </article>
  `;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }
