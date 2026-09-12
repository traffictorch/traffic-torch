// Renders the 10 Lighthouse Plus module explanation cards into #module-cards-container.
import { moduleExplanations } from './module-explanations-v1.0.js';

const MODULE_META = {
  "Core Web Vitals":          { icon: "⚡", color: "from-orange-500 to-red-500" },
  "Performance Score":        { icon: "🏎️", color: "from-red-500 to-pink-500" },
  "Accessibility":            { icon: "♿", color: "from-pink-500 to-purple-500" },
  "Best Practices":           { icon: "🔒", color: "from-purple-500 to-indigo-500" },
  "SEO On-Page":              { icon: "🔎", color: "from-indigo-500 to-blue-500" },
  "PWA Readiness":            { icon: "📱", color: "from-blue-500 to-cyan-500" },
  "Resource Optimisation":    { icon: "🖼️", color: "from-cyan-500 to-teal-500" },
  "Third-Party Impact":       { icon: "🌐", color: "from-teal-500 to-emerald-500" },
  "Mobile UX":                { icon: "👆", color: "from-emerald-500 to-green-500" },
  "Agentic Browsing":         { icon: "🤖", color: "from-green-500 to-lime-500" }
};

export function renderModuleCards(containerId = 'module-cards-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const guideBase = '/blog/posts/lighthouse-plus-help-guide/';

  container.innerHTML = Object.entries(moduleExplanations).map(([name, data]) => {
    const meta = MODULE_META[name] || { icon: '⚙️', color: 'from-gray-500 to-gray-700' };
    const slug = data.slug || name.toLowerCase().replace(/\s+/g, '-');
    return `
      <details class="module-card group w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <summary class="flex items-center gap-4 p-4 cursor-pointer list-none">
          <span class="text-3xl flex-shrink-0">${meta.icon}</span>
          <span class="flex-1 text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">${escapeHtml(name)}</span>
          <span class="text-orange-500 text-xl transition-transform duration-300 group-open:rotate-180">▾</span>
        </summary>

        <div class="px-5 pb-5 space-y-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">

          <div>
            <div class="flex items-baseline justify-between gap-3 mb-1">
              <p class="font-bold text-gray-800 dark:text-gray-200">What it measures</p>
              <a href="${guideBase}#${slug}-what"
                 class="text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium whitespace-nowrap">
                Learn more →
              </a>
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(data.what)}</p>
          </div>

          <div>
            <div class="flex items-baseline justify-between gap-3 mb-1">
              <p class="font-bold text-gray-800 dark:text-gray-200">How it's tested</p>
              <a href="${guideBase}#${slug}-how"
                 class="text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium whitespace-nowrap">
                Learn more →
              </a>
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(data.how)}</p>
          </div>

          <div>
            <div class="flex items-baseline justify-between gap-3 mb-1">
              <p class="font-bold text-gray-800 dark:text-gray-200">Why it matters</p>
              <a href="${guideBase}#${slug}-why"
                 class="text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium whitespace-nowrap">
                Learn more →
              </a>
            </div>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(data.why)}</p>
          </div>

          <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
            <a href="${guideBase}#${slug}"
               class="text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline text-sm font-semibold">
              Read the full ${escapeHtml(name)} guide →
            </a>
          </div>

        </div>
      </details>
    `;
  }).join('');
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}