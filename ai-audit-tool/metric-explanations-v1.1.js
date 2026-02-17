const metricExplanations = [
  {
    id: "perplexity",
    emoji: "🧠",
    name: "Perplexity",
    what: "The degree to which your text uses unpredictable and varied word sequences rather than common, formulaic patterns. Human writers naturally create surprise and diversity in phrasing, while AI often relies on statistically probable combinations that feel repetitive and robotic.",
    how: "Calculates bigram and trigram entropy to measure how surprising word pairings are. Higher entropy indicates more creative, human-like flow; low entropy reveals predictable patterns typical of AI generation.",
    why: "Search engines and AI detectors increasingly penalize predictable text. High perplexity signals authentic human creativity, boosts engagement, and reduces the risk of being flagged as AI-generated content."
  },
  {
    id: "burstiness",
    emoji: "📏",
    name: "Burstiness",
    what: "The natural variation in sentence and word lengths that creates rhythm and emphasis in writing. Human text has bursts of short, punchy sentences mixed with longer, flowing ones, while AI often produces uniform lengths for consistency.",
    how: "Measures statistical variance in both sentence length (words) and word length (characters). Significant deviation from the average indicates natural human rhythm rather than mechanical uniformity.",
    why: "Readers engage more with text that has natural flow and emphasis. Search engines favor content that mirrors human writing patterns, improving dwell time, trust signals, and overall ranking potential."
  },
  {
    id: "repetition",
    emoji: "🔁",
    name: "Repetition",
    what: "The frequency with which exact phrases (bigrams and trigrams) repeat throughout the text. Humans instinctively vary expression, while AI models often reuse high-probability phrases to stay safe and coherent.",
    how: "Tracks the maximum occurrences of any two-word or three-word sequence. Low repetition of exact phrases indicates diverse, natural expression rather than pattern reliance.",
    why: "Excessive phrase repetition makes content feel robotic and reduces perceived originality. Varied expression improves readability, authority, and helps avoid AI detection flags in modern search algorithms."
  },
  {
    id: "sentence-length",
    emoji: "📝",
    name: "Sentence Length",
    what: "The balance between average sentence length and structural complexity that creates readable, sophisticated prose. Human writers mix concise statements with layered ideas, while AI often defaults to either overly simple or convoluted structures.",
    how: "Combines average sentence word count (ideal 15–23) with comma usage as a proxy for clauses and complexity. Balanced length and moderate complexity reflect natural human thought patterns.",
    why: "Optimal sentence variety enhances readability and comprehension. Search engines prioritize content that feels natural and authoritative, improving user satisfaction signals and ranking performance."
  },
  {
    id: "vocabulary",
    emoji: "📚",
    name: "Vocabulary",
    what: "The richness and diversity of word choice, including unique terms and rare words that demonstrate depth of knowledge. Human experts naturally use specialized, context-specific vocabulary, while AI tends toward safe, common words.",
    how: "Measures unique word ratio and frequency of hapax legomena (words appearing only once). High diversity and rare word usage indicate genuine expertise rather than generic output.",
    why: "Rich vocabulary signals authority and depth to both readers and search engines. It creates authentic expert tone, improves topical authority signals, and helps content stand out as genuinely human-written."
  },
  {
    id: "ai-content-overview",
    emoji: "🤖",
    name: "AI Detection",
    what: "",
    how: "",
    why: ""
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
  console.log('DOMContentLoaded fired – starting card render');
  const container = document.getElementById('metric-cards-container');
  if (!container) {
    console.error('ERROR: #metric-cards-container not found in DOM');
    return;
  }
  console.log('Container found – length before render:', container.innerHTML.length);

  container.innerHTML = metricExplanations.map((m, index) => {
    console.log(`Rendering card ${index + 1}/${metricExplanations.length}: ${m.id} (${m.name})`);

    if (m.id === "ai-content-overview") {
      console.log('Rendering special overview card');
      return `
        <div id="${m.id}" class="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950/30 dark:to-orange-950/20 rounded-3xl shadow-xl p-8 md:p-12 text-center border-2 border-pink-400 dark:border-pink-600">
          <div class="text-6xl mb-6">${m.emoji}</div>
          <h3 class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-6">${m.name}</h3>
          <p class="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
            ${m.what}
          </p>
          <a href="https://traffictorch.net/blog/posts/ai-content-detection-guide" 
             class="inline-flex items-center px-10 py-5 bg-gradient-to-r from-pink-500 to-orange-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition duration-300">
            Full Guide →
          </a>
        </div>
      `;
    }

    // Normal metric card
    return `
      <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
        <div class="text-6xl mb-6">${m.emoji}</div>
        <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-6">${m.name}</div>
        <details class="group">
          <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center justify-center gap-2">
            Quick explanation <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>
          </summary>
          <div class="mt-6 space-y-8 text-left max-w-lg mx-auto text-gray-600 dark:text-gray-400 leading-relaxed">
            <div>
              <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ${m.name}?</p>
              <p>${m.what}</p>
              <a href="https://traffictorch.net/blog/posts/ai-content-detection-guide#${m.id}-what" 
                 class="mt-2 block text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
                Learn more →
              </a>
            </div>
            <div>
              <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ${m.name} tested?</p>
              <p>${m.how}</p>
              <a href="https://traffictorch.net/blog/posts/ai-content-detection-guide#${m.id}-how" 
                 class="mt-2 block text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
                Learn more →
              </a>
            </div>
            <div>
              <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">Why does ${m.name} matter?</p>
              <p>${m.why}</p>
              <a href="https://traffictorch.net/blog/posts/ai-content-detection-guide#${m.id}-why" 
                 class="mt-2 block text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
                Learn more →
              </a>
            </div>
          </div>
        </details>
      </div>
    `;
  }).join('');

  console.log('Cards rendered – final HTML length:', container.innerHTML.length);
  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);