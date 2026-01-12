const metricExplanations = [
  {
    id: "on-page-seo",
    emoji: "🔍",
    name: "On-Page SEO",
    what: "On-Page SEO evaluates title tags, meta descriptions, header structure, keyword usage, internal linking, and semantic optimization directly on your page.",
    how: "We scan HTML structure, analyze keyword placement and density, check schema markup, and assess E-E-A-T signals against best practices.",
    why: "Strong on-page SEO helps search engines understand your content, improves crawl efficiency, and directly impacts rankings and click-through rates."
  },
  {
    id: "mobile-pwa",
    emoji: "📱",
    name: "Mobile & PWA",
    what: "Mobile & PWA checks mobile-friendliness, viewport configuration, touch targets, and Progressive Web App installability features.",
    how: "We test responsiveness, simulate mobile rendering, evaluate manifest and service worker potential, and measure tap target sizing.",
    why: "With mobile traffic dominating, excellent mobile experience reduces bounce rates, boosts engagement, and is a key ranking factor."
  },
  {
    id: "performance",
    emoji: "⚡",
    name: "Performance",
    what: "Performance measures loading speed, Core Web Vitals (LCP, FID, CLS), resource optimization, and server response times.",
    how: "We analyze paint timings, resource sizes, render-blocking assets, and provide lab-based simulations of real-user metrics.",
    why: "Fast sites improve user satisfaction, lower bounce rates, and are heavily weighted in search rankings."
  },
  {
    id: "accessibility",
    emoji: "♿",
    name: "Accessibility",
    what: "Accessibility ensures your site is usable by everyone, including color contrast, ARIA labels, keyboard navigation, and alt text.",
    how: "We run automated checks against WCAG guidelines, flag contrast issues, missing landmarks, and form labeling errors.",
    why: "Accessible sites reach wider audiences, reduce legal risk, and contribute to better overall UX and SEO."
  },
  {
    id: "content-quality",
    emoji: "📝",
    name: "Content Quality",
    what: "Content Quality assesses readability, depth, originality, E-E-A-T signals, and alignment with search intent.",
    how: "We evaluate Flesch reading ease, topic coverage, duplicate content risks, and authority indicators like author markup.",
    why: "High-quality, helpful content builds trust with users and search engines, driving sustained traffic and authority."
  },
  {
    id: "ux-design",
    emoji: "🎨",
    name: "UX Design",
    what: "UX Design reviews visual hierarchy, navigation clarity, call-to-action placement, and psychological friction points.",
    how: "We analyze layout flow, whitespace usage, intrusive elements, and user journey signals to predict quit risk.",
    why: "Superior UX keeps visitors engaged longer, increases conversions, and indirectly boosts SEO through better behavioral metrics."
  },
  {
    id: "security",
    emoji: "🔒",
    name: "Security",
    what: "Security checks for HTTPS implementation, mixed content, secure headers, and vulnerability indicators.",
    how: "We verify certificate validity, scan for HTTP resources on HTTPS pages, and evaluate security headers like HSTS and CSP.",
    why: "Secure sites build user trust, avoid browser warnings, and are required for modern web features and ranking preferences."
  },
  {
    id: "indexability",
    emoji: "🤖",
    name: "Indexability",
    what: "Indexability ensures search engines can crawl and index your page properly via robots directives, sitemap, and canonical tags.",
    how: "We check robots.txt, meta robots, canonical links, XML sitemap references, and render-blocking issues.",
    why: "Proper indexability is foundational — if search engines can't access or understand your page, it won't rank."
  }
];

function openDetailsFromHash() {
  if (!window.location.hash) return;
  
  let hash = window.location.hash.substring(1);
  
  // Fallback: if short ID like "seo" is used, try mapped full ID
  const shortToFull = {
    seo: 'on-page-seo',
    mobile: 'mobile-pwa',
    perf: 'performance',
    access: 'accessibility',
    content: 'content-quality',
    ux: 'ux-design',
    security: 'security',
    indexability: 'indexability'
  };
  
  if (shortToFull[hash]) {
    hash = shortToFull[hash];
  }
  
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