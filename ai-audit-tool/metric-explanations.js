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
  }
];

function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1); // remove #
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
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-500 font-bold hover:underline flex items-center justify-center gap-2">
          Learn More <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-600 dark:text-gray-400 leading-relaxed">
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

  // Open on initial load if hash present
  openDetailsFromHash();
});

// Open on hash change (e.g., when clicking internal links)
window.addEventListener('hashchange', openDetailsFromHash);