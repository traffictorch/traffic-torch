// metric-explanations.js - updated to match product-seo-tool SEO audit modules

const metricExplanations = [
  {
    id: "on-page-seo",
    emoji: "📄",
    name: "On-Page SEO",
    what: "On-Page SEO evaluates title, meta, headings, URL, and keyword usage — the foundational elements that tell search engines and users what the product page is about.",
    how: "On-Page is tested using title length & keyword inclusion, meta description relevance & CTA strength, heading hierarchy (single H1 + logical H2/H3), clean URL structure, and natural keyword placement/density in content.",
    why: "Strong on-page signals improve relevance, click-through rates, and initial rankings. They help match user intent and reduce bounce from mismatched expectations."
  },
  {
    id: "technical-seo",
    emoji: "🔧",
    name: "Technical SEO",
    what: "Technical SEO checks crawlability, mobile readiness, security, and duplicate prevention — essential for product pages to be indexed and ranked properly.",
    how: "Technical is tested by validating viewport & mobile-friendliness, HTTPS enforcement & mixed content, correct self-referencing canonical tags, absence of noindex/nofollow directives, and likely sitemap inclusion patterns.",
    why: "Technical issues can prevent indexing, hurt mobile rankings, or cause duplicate content penalties — all block traffic."
  },
  {
    id: "content-&-media",
    emoji: "🖼️",
    name: "Content & Media",
    what: "Content & Media evaluates richness, accessibility, and engagement signals that keep users on-page and build trust.",
    how: "Content & Media is tested by measuring description length & structure, image alt text coverage & optimization, video embed quality & captions, user-generated content (reviews), internal linking, and breadcrumb navigation presence.",
    why: "High-quality content reduces bounce rate, improves dwell time, and strengthens topical authority — key ranking factors."
  },
  {
    id: "e-commerce-signals",
    emoji: "🛒",
    name: "E-Commerce Signals",
    what: "E-Commerce Specific checks structured data, pricing, reviews, variants, and social signals — essential for rich results and conversions.",
    how: "E-Commerce is tested for complete Product schema markup (name, image, offers, brand), price & availability in schema, aggregate rating & review schema, variant handling (single-page or canonical), and Open Graph / social sharing tags.",
    why: "Schema enables rich snippets (price, stars, images in SERPs). Reviews add trust. Proper variants prevent duplicate content penalties."
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
        <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center justify-center gap-2 whitespace-nowrap">
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

  // Open panel if hash matches any module id
  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);