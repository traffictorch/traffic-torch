const metricExplanations = [
  {
    id: "readability",
    emoji: "📖",
    name: "Readability",
    what: "Readability measures how easily visitors can understand and scan your content. It combines classic formulas like Flesch with modern web factors such as sentence length, paragraph structure, and visual hierarchy. High readability keeps users engaged longer and reduces bounce rates.",
    how: "Readability is tested using Flesch Reading Ease and Flesch-Kincaid Grade Level scores, average sentence length, paragraph density, and scannability elements like bolding, lists, and subheadings. Each factor is scored individually and combined into an overall module grade.",
    why: "Easy-to-read content reaches a wider audience, improves engagement metrics, and reduces cognitive strain. Search engines reward pages where users stay longer and interact more. Great readability is essential for modern web success."
  },
  {
    id: "navigation",
    emoji: "🧭",
    name: "Navigation",
    what: "Navigation Clarity evaluates how easily users can move through your site and find what they need. It examines menu structure, link density, internal linking patterns, and call-to-action visibility.",
    how: "Navigation is tested by analyzing link density, menu organization, internal linking balance, and CTA prominence. Each factor is scored based on best practices for user flow and discoverability.",
    why: "Intuitive navigation lowers bounce rates, increases pages per session, and helps users complete goals faster. Clear structure strengthens topical authority and sends positive user signals to search engines."
  },
  {
    id: "accessibility",
    emoji: "♿",
    name: "Accessibility",
    what: "Accessibility Health measures how inclusive your page is for users with disabilities. It checks alt text coverage, color contrast, semantic HTML structure, and overall WCAG alignment.",
    how: "Accessibility is tested through alt text completeness, contrast ratios, proper heading hierarchy, landmarks, and general WCAG compliance signals. Each factor contributes to the overall score.",
    why: "Accessible sites reach 15-20% more users, build trust, and face lower legal risk. Many accessibility improvements also enhance SEO and overall user experience for everyone."
  },
  {
    id: "mobile",
    emoji: "📱",
    name: "Mobile & PWA",
    what: "Mobile & PWA Readiness checks how well your page works on phones and tablets. It evaluates viewport configuration, responsive design, touch targets, and progressive web app signals.",
    how: "Mobile is tested by checking viewport meta tag, breakpoint behavior, touch target size, and PWA indicators like manifest and service worker presence.",
    why: "Most users browse on mobile devices. Poor mobile experience causes immediate bounces. PWA capabilities increase return visits and engagement significantly."
  },
  {
    id: "performance",
    emoji: "⚡",
    name: "Performance",
    what: "Performance Optimization measures loading speed and resource efficiency. It flags heavy assets, script bloat, font issues, lazy loading, and image optimization opportunities.",
    how: "Performance is tested through proxies for asset volume, script size, font delivery, lazy loading implementation, image formats, and render-blocking resources.",
    why: "Fast pages keep users and reduce bounce rates. Speed is a direct ranking factor. Users perceive faster sites as higher quality and more professional."
  }
];

function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const target = document.getElementById(hash);
    if (target) {
      const details = target.querySelector('details');
      if (details) {
        details.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('metric-cards-container');
  if (!container) return;

  const moduleCards = metricExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-purple-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-purple-600 dark:text-purple-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-purple-500 font-bold hover:underline inline-flex items-center justify-center gap-2 whitespace-nowrap">
          Learn More <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-700 dark:text-gray-300 leading-relaxed">
          <div>
            <p class="font-bold text-purple-600 dark:text-purple-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          <div>
            <p class="font-bold text-purple-600 dark:text-purple-400 text-lg mb-2">How is ${m.name} tested?</p>
            <p>${m.how}</p>
          </div>
          <div>
            <p class="font-bold text-purple-600 dark:text-purple-400 text-lg mb-2">Why does ${m.name} matter?</p>
            <p>${m.why}</p>
          </div>
        </div>
      </details>
    </div>
  `).join('');

  const allToolsCard = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-indigo-500 text-center lg:col-span-1">
      <div class="text-6xl mb-6">🛠️</div>
      <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-8">SEO UX AI Tools</div>
      <a href="https://traffictorch.net/ai-seo-ux-tools/" class="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition">
        Explore All Tools
      </a>
    </div>`;

  container.innerHTML = moduleCards + allToolsCard;

  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);