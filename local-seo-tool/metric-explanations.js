const metricExplanations = [
  {
    id: 'nap-contact',
    emoji: '📍',
    name: 'NAP & Contact Signals',
    what: 'Evaluates the presence, consistency, and completeness of your business Name, Address, and Phone (NAP) across visible page elements and contact sections. Consistent NAP builds trust with search engines and users for local pack rankings.',
    how: 'The tool scans for &lt;address&gt;, footer text, tel: links, and structured data patterns to verify NAP presence, footer standardization, and full contact info (hours, email).',
    why: 'Inconsistent or missing NAP confuses Google\'s entity understanding, hurting local visibility. Complete, standardized NAP on every page reinforces your business as a legitimate local entity - a core local ranking factor.'
  },
  {
    id: 'keywords-titles',
    emoji: '🔤',
    name: 'Local Keywords & Titles',
    what: 'Checks if local intent (city, "near me", service + location) appears in title, meta description, and headings. These elements signal to Google that your page targets specific geographic queries.',
    how: 'Scans &lt;title&gt;, meta description, and H1/H2 tags for city name or local phrases derived from your entered location.',
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
    how: 'Looks for Google Maps iframes/links and scans &lt;img&gt; alt attributes for city/service mentions.',
    why: 'Embedded maps reduce bounce rates and confirm physical presence. Local alt text boosts image search visibility and provides additional geo-context to crawlers.'
  },
  {
    id: 'structured-data',
    emoji: '🏷️',
    name: 'Structured Data (Schema)',
    what: 'Verifies presence and validity of LocalBusiness schema, including geo coordinates and opening hours. Schema helps Google understand and display your business accurately in local results.',
    how: 'Parses &lt;script type="application/ld+json"&gt; tags for @type: LocalBusiness, geo, and openingHours data.',
    why: 'Proper local schema unlocks rich snippets (hours, directions, reviews) in search and maps. It is one of the strongest signals for local pack placement and entity trust.'
  },
  {
    id: 'reviews-structure',
    emoji: '⭐',
    name: 'Reviews, Canonical & Linking',
    what: 'Checks for AggregateRating schema, canonical tags, and internal links to location pages. Reviews boost credibility, canonical prevents duplicate issues, and geo-links strengthen site architecture.',
    how: 'Scans schema for aggregateRating, &lt;link rel="canonical"&gt;, and internal &lt;a&gt; tags pointing to contact/location pages with local context.',
    why: 'Star ratings in SERPs increase CTR. Correct canonicals avoid dilution in multi-location setups. Internal geo-links improve crawl depth and reinforce local topical clusters.'
  }
];

function openModuleDetails(moduleId) {
  const target = document.getElementById(moduleId);
  if (target) {
    const details = target.querySelector('details');
    if (details) {
      details.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Keep hash support for backward compatibility / direct links
function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    openModuleDetails(hash);
  }
}

window.openModuleDetails = openModuleDetails;

function injectMetricCards() {
  const container = document.getElementById('metric-cards-container');
  if (!container) {
    console.warn('Container not found');
    return;
  }

  if (container.dataset.cardsInjected === 'true') {
    console.log('Already injected');
    return;
  }

  console.log('Injecting ' + metricExplanations.length + ' cards');

  let cardsHTML = '';
  for (let i = 0; i < metricExplanations.length; i++) {
    const m = metricExplanations[i];
    try {
      console.log('Building card ' + (i + 1) + ': ' + m.id);

      cardsHTML += '<div id="' + m.id + '" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center w-full max-w-md">';
      cardsHTML += '  <div class="text-6xl mb-6">' + m.emoji + '</div>';
      cardsHTML += '  <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">' + m.name + '</div>';
      cardsHTML += '  <details class="group">';
      cardsHTML += '    <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center justify-center gap-2 whitespace-nowrap">';
      cardsHTML += '      Learn More <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>';
      cardsHTML += '    </summary>';
      cardsHTML += '    <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-600 dark:text-gray-400 leading-relaxed">';
      cardsHTML += '      <div>';
      cardsHTML += '        <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ' + m.name + '?</p>';
      cardsHTML += '        <p>' + m.what + '</p>';
      cardsHTML += '      </div>';
      cardsHTML += '      <div>';
      cardsHTML += '        <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ' + m.name + ' tested?</p>';
      cardsHTML += '        <p>' + m.how + '</p>';
      cardsHTML += '      </div>';
      cardsHTML += '      <div>';
      cardsHTML += '        <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">Why does ' + m.name + ' matter?</p>';
      cardsHTML += '        <p>' + m.why + '</p>';
      cardsHTML += '      </div>';
      cardsHTML += '    </div>';
      cardsHTML += '  </details>';
      cardsHTML += '</div>';
    } catch (err) {
      console.error('Failed card ' + (i + 1) + ' (' + (m ? m.id : 'unknown') + '): ', err);
    }
  }

  container.innerHTML = cardsHTML;
  container.dataset.cardsInjected = 'true';
  console.log('Done - rendered: ' + container.querySelectorAll('[id]').length + ' cards');

  openDetailsFromHash();
}

// Run immediately or on load
if (document.readyState !== 'loading') {
  injectMetricCards();
} else {
  document.addEventListener('DOMContentLoaded', injectMetricCards);
}