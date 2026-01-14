export const metricExplanations = [
  {
    id: 'nap-contact',
    emoji: '📍',
    name: 'NAP & Contact Signals',
    what: 'Evaluates the presence, consistency, and completeness of your business Name, Address, and Phone (NAP) across visible page elements and contact sections. Consistent NAP builds trust with search engines and users for local pack rankings.',
    how: 'The tool scans for <address>, footer text, tel: links, and structured data patterns to verify NAP presence, footer standardization, and full contact info (hours, email).',
    why: 'Inconsistent or missing NAP confuses Google’s entity understanding, hurting local visibility. Complete, standardized NAP on every page reinforces your business as a legitimate local entity — a core local ranking factor.'
  },
  {
    id: 'keywords-titles',
    emoji: '🔤',
    name: 'Local Keywords & Titles',
    what: 'Checks if local intent (city, "near me", service + location) appears in title, meta description, and headings. These elements signal to Google that your page targets specific geographic queries.',
    how: 'Scans <title>, meta description, and H1/H2 tags for city name or local phrases derived from your entered location.',
    why: 'Geo-optimized titles and headings dramatically improve relevance for "near me" and city-specific searches. They boost click-through rates and help Google match your page to local user intent.'
  },
  {
    id: 'content-relevance',
    emoji: '📄',
    name: 'Local Content & Relevance',
    what: 'Analyzes body content for natural local keywords, intent phrases ("near me", "in [city]"), and location mentions. Relevant, locally-focused content proves your page serves the area.',
    how: 'Extracts main content (excluding nav/footer), counts mentions of city, local intent patterns, and service+location combinations.',
    why: 'Google prioritizes pages that clearly demonstrate local relevance through natural language. Strong local content increases topical authority, user satisfaction, and map pack rankings.'
  },
  {
    id: 'maps-visuals',
    emoji: '🗺️',
    name: 'Maps & Visual Signals',
    what: 'Detects embedded Google Maps and location-specific image alt text. Maps improve user experience, while local alt text signals relevance in image and local search.',
    how: 'Looks for Google Maps iframes/links and scans <img> alt attributes for city/service mentions.',
    why: 'Embedded maps reduce bounce rates and confirm physical presence. Local alt text boosts image search visibility and provides additional geo-context to crawlers.'
  },
  {
    id: 'structured-data',
    emoji: '🏷️',
    name: 'Structured Data (Schema)',
    what: 'Verifies presence and validity of LocalBusiness schema, including geo coordinates and opening hours. Schema helps Google understand and display your business accurately in local results.',
    how: 'Parses <script type="application/ld+json"> tags for @type: LocalBusiness, geo, and openingHours data.',
    why: 'Proper local schema unlocks rich snippets (hours, directions, reviews) in search and maps. It’s one of the strongest signals for local pack placement and entity trust.'
  },
  {
    id: 'reviews-structure',
    emoji: '⭐',
    name: 'Reviews, Canonical & Linking',
    what: 'Checks for AggregateRating schema, canonical tags, and internal links to location pages. Reviews boost credibility, canonical prevents duplicate issues, and geo-links strengthen site architecture.',
    how: 'Scans schema for aggregateRating, <link rel="canonical">, and internal <a> tags pointing to contact/location pages with local context.',
    why: 'Star ratings in SERPs increase CTR. Correct canonicals avoid dilution in multi-location setups. Internal geo-links improve crawl depth and reinforce local topical clusters.'
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

  container.innerHTML = metricExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-950 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-500 dark:text-orange-400 font-bold hover:underline inline-flex items-center gap-2 whitespace-nowrap mx-auto">
          Learn More <span class="text-2xl transition-transform group-open:rotate-180">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-800 dark:text-gray-200 leading-relaxed">
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ${m.name} tested?</p>
            <p>${m.how}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">Why does ${m.name} matter?</p>
            <p>${m.why}</p>
          </div>
        </div>
      </details>
    </div>
  `).join('');

  // Open details on hash (for direct links)
  openDetailsFromHash();
});

// Handle hash changes (browser back/forward or internal links)
window.addEventListener('hashchange', openDetailsFromHash);

// Export for use in script.js if needed
window.metricExplanations = metricExplanations;