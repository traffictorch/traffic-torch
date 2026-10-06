const moduleExplanations = [
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

/**
 * Fix hints: first matching regex wins.
 * Ordered by specificity within each module group.
 */
export const fixHints = [
  // ── Perplexity ──────────────────────────────────────────────
  { pattern: /trigram entropy/i,      fix: 'Break predictable three-word chains: deliberately insert unexpected word combinations, personal anecdotes, or abrupt shifts in phrasing. Aim for surprise every few sentences instead of safe, formulaic transitions.' },
  { pattern: /bigram entropy/i,       fix: 'Swap common two-word pairs for creative alternatives. Introduce idiomatic or transitional phrases unique to your voice so no two-word sequence dominates the text.' },
  { pattern: /trigram/i,              fix: 'Vary three-word sequences with synonyms and restructured clauses. Read aloud and rewrite any triplet that repeats a familiar AI-style cadence.' },
  { pattern: /bigram/i,               fix: 'Replace the most frequent two-word pairings with fresh equivalents. Use a thesaurus strategically, but always keep natural readability.' },
  { pattern: /perplexity/i,           fix: 'Raise perplexity by mixing vocabulary registers, using less-common constructions, and weaving in concrete examples. Predictable phrasing is the #1 AI signal.' },
  { pattern: /entropy/i,              fix: 'Increase entropy by introducing surprising but coherent word choices. Avoid high-probability n-grams that detectors flag instantly.' },
  { pattern: /predictab/i,            fix: 'Edit specifically for surprise: replace the next obvious word with a vivid, unexpected alternative that still fits the sentence.' },
  { pattern: /word sequence/i,        fix: 'Diversify word sequences so no two- or three-word pattern recurs. This is the fastest way to lower AI detection risk.' },

  // ── Burstiness ──────────────────────────────────────────────
  { pattern: /sentence length variation/i, fix: 'Alternate short, punchy sentences (5–10 words) with longer, layered ones (20–30 words). This natural rhythm is one of the strongest human signals.' },
  { pattern: /word length burstiness/i,    fix: 'Mix short simple words with longer descriptive ones. Avoid paragraphs where every word is roughly the same length.' },
  { pattern: /sentence.*variation/i,  fix: 'Split or combine sentences so lengths vary widely. Aim for a standard deviation of 8+ words between sentences.' },
  { pattern: /word length.*variation/i, fix: 'Introduce 1–2 longer, richer words per paragraph alongside short everyday terms to break uniform word-length patterns.' },
  { pattern: /burstiness/i,           fix: 'Create rhythmic variation: short. Then a longer sentence that develops the idea further. Then short again. This cadence reads as unmistakably human.' },
  { pattern: /rhythm/i,               fix: 'Vary sentence cadence deliberately. Read aloud—if it sounds metronomic, rewrite until it breathes.' },
  { pattern: /uniform/i,              fix: 'Break uniformity: intentionally vary paragraph and sentence lengths across the page.' },

  // ── Repetition ──────────────────────────────────────────────
  { pattern: /bigram repetition/i,    fix: 'Identify the top two-word phrases and replace them with synonyms or restructured clauses. No two-word pair should appear more than 2–3 times.' },
  { pattern: /trigram repetition/i,   fix: 'Rewrite recurring three-word sequences using fresh vocabulary or inverted sentence structures. Re-introduce the idea from a different angle.' },
  { pattern: /repetition/i,           fix: 'Vary phrasing throughout: use synonyms, change sentence openings, and restructure recurring ideas so no exact phrase echoes.' },
  { pattern: /repeated phrase/i,      fix: 'Scan for echoed phrases and rewrite each occurrence with different wording or syntax.' },
  { pattern: /phrase.*repeat/i,       fix: 'Swap repeated phrases for alternatives that preserve meaning but change wording.' },
  { pattern: /overuse/i,              fix: 'Reduce overused terms with a thesaurus and sentence restructuring. Keep the strongest instance and rewrite the rest.' },
  { pattern: /echo/i,                 fix: 'Remove echoing patterns by rephrasing the second and subsequent instances of any repeated idea.' },

  // ── Sentence Length ─────────────────────────────────────────
  { pattern: /average length/i,       fix: 'Target 15–23 words per sentence on average. Break long run-ons and combine choppy fragments to reach this range.' },
  { pattern: /sentence complexity/i,  fix: 'Add subordinate clauses with commas, semicolons, or conjunctions to layer ideas. Aim for 1–2 clauses per sentence in key paragraphs.' },
  { pattern: /sentence length/i,      fix: 'Balance sentence lengths: mix concise statements with longer, developed ones to hit the ideal 15–23 word average.' },
  { pattern: /words per sentence/i,   fix: 'Adjust sentence length into the 15–23 word sweet spot. Shorter reads choppy; longer reads dense.' },
  { pattern: /complexity/i,           fix: 'Increase structural complexity: use relative clauses, conjunctions, and varied punctuation to mirror natural thought patterns.' },
  { pattern: /clause/i,               fix: 'Introduce more dependent clauses to add depth without bloat. Two clauses per sentence is the human-writing benchmark.' },

  // ── Vocabulary ──────────────────────────────────────────────
  { pattern: /rare word frequency/i,  fix: 'Add context-specific, niche vocabulary (terms that appear only once or twice). This signals genuine expertise to both readers and search engines.' },
  { pattern: /rare word/i,            fix: 'Introduce 2–3 specialized terms per section that you wouldn’t see in generic AI output. Weave them in naturally.' },
  { pattern: /vocabulary/i,           fix: 'Broaden lexical range with synonyms, related concepts, and analogies. Avoid repeating the same nouns and verbs.' },
  { pattern: /diversity/i,            fix: 'Boost vocabulary diversity by using synonyms and avoiding word repetition. Draw from broader themes and related fields.' },
  { pattern: /lexical/i,              fix: 'Enrich lexical variety with precise, context-appropriate terms. Replace generic words with specific ones.' },
  { pattern: /word choice/i,          fix: 'Choose more precise, vivid words over generic ones. Replace “good”, “thing”, “very” with stronger equivalents.' },
  { pattern: /unique word/i,          fix: 'Increase unique word ratio by replacing repeats with synonyms and rephrasing common constructions.' },

  // ── General fallbacks ───────────────────────────────────────
  { pattern: /all tests passed/i,     fix: 'All checks passed for this metric. No action needed — maintain current writing patterns.' },
  { pattern: /pass/i,                 fix: 'This check passed. Keep the current approach for this metric.' },
  { pattern: /fail/i,                 fix: 'Review the failing sub-metric and apply targeted improvements from the fix list.' },
  { pattern: /error/i,                fix: 'An error occurred during analysis. Re-run the audit to get a fresh result.' },
  { pattern: /improv/i,               fix: 'Focus on increasing variation, authenticity, and natural flow.' },
  { pattern: /fix/i,                  fix: 'Apply the recommended fix and re-run the audit to verify improvement.' }
];

export function fixFor(text) {
  if (!text) return 'Review this metric and apply the recommended improvements to enhance human-like writing patterns.';
  for (const hint of fixHints) {
    if (hint.pattern.test(text)) return hint.fix;
  }
  return 'Review this metric and apply targeted improvements to increase variation and authenticity.';
}

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
  const container = document.getElementById('module-cards-container');
  if (!container) return;

  container.innerHTML = moduleExplanations.map((m) => {
    if (m.id === "ai-content-overview") {
      return `
        <div id="${m.id}" class="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950/30 dark:to-orange-950/20 rounded-3xl shadow-xl p-8 md:p-12 text-center border-2 border-pink-400 dark:border-pink-600">
          <div class="text-6xl mb-6">${m.emoji}</div>
          <h3 class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-6">${m.name}</h3>
          <p class="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
            ${m.what}
          </p>
          <a href="https://traffictorch.net/blog/posts/ai-content-detection-guide"
             class="inline-flex items-center px-10 py-5 bg-gradient-to-r from-red-500 to-orange-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition duration-300">
            Full Guide →
          </a>
        </div>
      `;
    }

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

  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);