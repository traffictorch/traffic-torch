// seo-entity-extractor-tool/metric-explanations.js

const metricExplanations = [
  {
    id: "seo-entities",
    emoji: "🧬",
    name: "SEO Entities",
    what: "Named, identifiable real-world things (people, brands, products, concepts, locations) that search engines recognize on your page. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#seo-entities-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Backend NLP extracts entities with type, salience score, and text. We sort by salience, filter noise, count diversity, and display in a clean grid. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#seo-entities-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Entity-first search relies on clear named entities for topical understanding, rich results, and AI citations. Strong signals build authority faster than keywords alone. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#seo-entities-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "coverage",
    emoji: "🌐",
    name: "Coverage",
    what: "Breadth, density, and type diversity of recognized entities are the foundation of topical authority. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#coverage-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Counts total entities, calculates density vs word count, weights type diversity (CONCEPT / ORGANIZATION highest), adapts for page length, and applies bonuses/penalties. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#coverage-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Comprehensive coverage shows depth and expertise. It improves relevance across related queries and helps compete in entity-aware rankings. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#coverage-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "salience",
    emoji: "🔥",
    name: "Salience",
    what: "How prominently and centrally each entity appears. Measured by position, repetition, and context weighting (0.0–1.0 score). <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#salience-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Normalizes salience scores, sorts descending, calculates average / top / strong counts, detects flat vs hierarchical distribution, and adapts scoring by entity count tiers. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#salience-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Clear salience hierarchy signals strong topical focus. It boosts authority, featured snippets, and selection for direct answers over diluted content. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#salience-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "relationships",
    emoji: "🔗",
    name: "Relationships",
    what: "How entities connect and form topical clusters. Measured via co-occurrence proxy and type synergies. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#relationships-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Limits to top 18 salient entities, counts combinatorial pairs, awards bonuses for strong type combos (CONCEPT + ORGANIZATION, ORGANIZATION + LOCATION, etc.), scales diversity. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#relationships-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Meaningful entity connections create semantic depth. They improve contextual relevance, AI understanding, and performance in complex or related-topic queries. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#relationships-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "practices",
    emoji: "⚙️",
    name: "Practices",
    what: "On-page optimizations that make entities machine-readable: schema readiness, heading placement, and name consistency. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#practices-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Scores schema potential by type/synergy, estimates heading usage from top salient entities, normalizes names and calculates consistency percentage. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#practices-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Machine-readable entities unlock rich results, knowledge graph inclusion, and better crawlability. Consistent practices strengthen identity and trust signals. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#practices-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "readiness",
    emoji: "📊",
    name: "Readiness",
    what: "Overall weighted semantic health index combining the four core modules. Your page's preparedness score for entity-first search. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#readiness-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Weights Coverage/Salience at 35% each, Relationships/Practices at 15% each, adds descriptive levels, contribution breakdown, and prioritized failed items. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#readiness-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Readiness predicts real-world performance in rankings, snippets, and answer engines. It guides precise fixes and shows how balanced optimization drives visibility. <a href='https://traffictorch.net/blog/posts/semantic-entity-help-guide/#readiness-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('metric-cards-container');
  if (!container) return;

  container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 justify-items-center max-w-7xl mx-auto px-4 sm:px-6';

  container.innerHTML = metricExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-l-4 border-orange-500 w-full max-w-md">
      <div class="text-7xl mb-6 text-center">${m.emoji}</div>
      <h3 class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-6 text-center">${m.name}</h3>
      <details class="group">
        <summary class="cursor-pointer text-xl font-bold text-orange-700 dark:text-orange-300 hover:underline flex items-center justify-between">
          <span>What is ${m.name}?</span>
          <span class="text-2xl px-2 group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 text-left text-gray-700 dark:text-gray-300 leading-relaxed">
          ${m.what}
        </div>
      </details>
      <details class="group mt-4">
        <summary class="cursor-pointer text-xl font-bold text-orange-700 dark:text-orange-300 hover:underline flex items-center justify-between">
          <span>How is ${m.name} tested?</span>
          <span class="text-2xl px-2 group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 text-left text-gray-700 dark:text-gray-300 leading-relaxed">
          ${m.how}
        </div>
      </details>
      <details class="group mt-4">
        <summary class="cursor-pointer text-xl font-bold text-orange-700 dark:text-orange-300 hover:underline flex items-center justify-between">
          <span>Why does ${m.name} matter?</span>
          <span class="text-2xl px-2 group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 text-left text-gray-700 dark:text-gray-300 leading-relaxed">
          ${m.why}
        </div>
      </details>
    </div>
  `).join('');
});