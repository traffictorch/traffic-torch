// Aggregates contributions from every tool. Merges by handle.

import { contributors as aeoPerf } from '/aeo-performance-tool/contributions.js';
import { contributors as aeoLog }  from '/aeo-log-analyzer/contributions.js';

const SOURCES = [
  { tool: 'AEO Performance Tool', slug: 'aeo-performance-tool', contributors: aeoPerf },
  { tool: 'AEO Log Analyzer',     slug: 'aeo-log-analyzer',     contributors: aeoLog }
];

function merge(sources) {
  const byHandle = new Map();
  for (const src of sources) {
    for (const c of src.contributors || []) {
      const key = (c.handle || '').toLowerCase();
      if (!key) continue;
      if (!byHandle.has(key)) {
        byHandle.set(key, { ...c, tools: [], contributions: [], allTags: new Set(c.tags || []) });
      }
      const m = byHandle.get(key);
      m.tools.push({ tool: src.tool, slug: src.slug });
      m.contributions.push({ tool: src.tool, slug: src.slug, text: c.contribution });
      for (const t of c.tags || []) m.allTags.add(t);
    }
  }
  return [...byHandle.values()].map(m => ({ ...m, allTags: [...m.allTags] }));
}

export function renderContributorsPage(rootId = 'contributors-root') {
  const root = document.getElementById(rootId);
  if (!root) return;
  const merged = merge(SOURCES);
  if (!merged.length) {
    root.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-12">No contributors yet.</p>';
    return;
  }
  root.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${merged.map(card).join('')}</div>`;
}

function card(c) {
  const icons = {
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    github:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    reddit:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Z"/></svg>',
    website:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  };
  const links = Object.entries(c.links || {}).filter(([, v]) => v)
    .map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition">${icons[k] || ''}<span class="capitalize">${esc(k)}</span></a>`)
    .join('');
  const contribs = c.contributions.map(x => `
    <li class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      <a href="/${esc(x.slug)}/" class="font-semibold text-orange-600 dark:text-orange-400 hover:underline">${esc(x.tool)}</a>
      — ${esc(x.text)}
    </li>`).join('');

  return `
    <article class="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden flex flex-col">
      <div class="p-6 flex items-start gap-4">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${c.avatarColor} flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-md">${esc(c.avatarInitial || '?')}</div>
        <div class="min-w-0 flex-1">
          <h3 class="text-xl font-black text-gray-900 dark:text-gray-100">${esc(c.name)}</h3>
          <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">u/${esc(c.handle)}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${esc(c.role)}</p>
          ${c.subtitle ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-0.5">${esc(c.subtitle)}</p>` : ''}
          ${c.location ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-0.5">📍 ${esc(c.location)}</p>` : ''}
        </div>
      </div>
      <div class="px-6 pb-4 flex-1">
        <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 font-bold">Contributions to ${c.tools.length} tool${c.tools.length === 1 ? '' : 's'}</p>
        <ul class="space-y-3">${contribs}</ul>
      </div>
      ${c.allTags.length ? `<div class="px-6 pb-4 flex flex-wrap gap-1.5">${c.allTags.map(t => `<span class="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[11px] font-semibold uppercase tracking-wide">${esc(t)}</span>`).join('')}</div>` : ''}
      ${links ? `<div class="px-6 pb-6 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">${links}</div>` : ''}
    </article>`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
