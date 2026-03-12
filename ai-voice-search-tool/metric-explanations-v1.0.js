const metricExplanations = [
  {
    id: "ai-visibility",
    emoji: "🌐",
    name: "AI Visibility",
    what: "Measures how discoverable, understandable, trustworthy, and citable your content is to large language models and voice-first assistants (Gemini, Perplexity, Grok, ChatGPT Search, etc.). Includes entity salience, citation probability, parseability, freshness signals, and training data inclusion likelihood. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#ai-visibility-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Client-side computation using compromise.js NLP: extracts named entities for Share of Voice %, counts citable elements (stats, quotes, references) for Citation Frequency, and evaluates direct-answer paragraphs (40–60 words with facts) for Presence Rate. Adds boosts for question sentences and relevant schema. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#ai-visibility-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Voice and AI assistants now dominate queries. Low AI Visibility means missing Position Zero voice answers, AI summaries, brand mentions, and indirect SEO lift. High visibility makes content the go-to source for Gemini, Perplexity, Grok and ChatGPT voice responses. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#ai-visibility-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "content-quality",
    emoji: "✍️",
    name: "Content Quality",
    what: "Evaluates how natural, human-like, engaging, and voice-friendly your writing sounds when read aloud. Covers natural language patterns, burstiness/perplexity, repetition avoidance, emotional resonance, confidence markers, and ideal spoken-answer conciseness (40–90 seconds). <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#content-quality-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Uses compromise.js for Flesch-Kincaid readability approximation, average sentence length (peaks at ~50 words), pronoun ratio (rewards conversational tone), and entity coverage (authority signals). Boosts for question sentences; penalises low readability. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#content-quality-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "AI assistants prefer content that mimics trusted human speech. Poor quality (robotic, repetitive, flat tone) reduces selection for voice answers and summaries. High quality improves dwell time, trust signals, and ranking in voice-first and generative results. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#content-quality-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "snippet-visibility",
    emoji: "🔍",
    name: "Snippet Visibility",
    what: "Measures likelihood of appearing as a featured snippet, rich result or direct voice answer (Position Zero). Checks direct-answer formatting, question alignment, structured data support (FAQPage, HowTo, Speakable), zero-click readiness, and multi-engine compatibility. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#snippet-visibility-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "DOM + NLP scan: counts question headings followed by lists/tables for Snippet Ownership %, evaluates 40–60 word factual paragraphs for Zero-Click Share, and combines schema (FAQ/HowTo/Speakable) with structure score for AI Overview Appearances. Boosts for question-heavy or blog/news sites. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#snippet-visibility-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Most voice queries end in zero-click answers. Winning snippet/Position Zero captures voice traffic, brand exposure, and indirect ranking lift. Without strong snippet signals, content is bypassed even if technically excellent. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#snippet-visibility-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "sentiment-quality",
    emoji: "❤️",
    name: "Sentiment Quality",
    what: "Assesses emotional tone, trust signals, positivity, confidence, and human resonance as perceived by AI assistants. Includes positive valence, confidence markers, empathy/relatability, trust/authority signals, and voice-friendly emotional delivery. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#sentiment-quality-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Uses word-list sentiment (positive/negative counts), hallucination risk (entity + speculative language mismatches), and mention sentiment (brand/product context tone). Boosts for e-commerce positive tone; penalises dominant negativity. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#sentiment-quality-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "AI prioritises confident, positive, empathetic content for voice answers and recommendations. Poor sentiment increases hallucination risk and deprioritisation — especially in trust-sensitive verticals — while high quality boosts citation and likability. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#sentiment-quality-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "traditional-keywords",
    emoji: "🔑",
    name: "Traditional Keywords",
    what: "Evaluates effective placement and density of exact-match, semantic, and long-tail keywords that anchor intent matching in 2026. Covers title/H1 placement, long-tail/question keyword integration, semantic/LSI coverage, density/distribution, and voice-query alignment. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#traditional-keywords-what' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Compromise.js detects question sentences for Conversational Rankings Sim, counts 4+ word clauses for Long-Tail Density, and combines average phrase length with commonality (rare words = higher score) for Query Volume/Difficulty. Boosts question-heavy or blog/news content. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#traditional-keywords-how' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Keywords remain the entry ticket for relevance, retrieval, and disambiguation across all engines and assistants. Weak keyword signals create a visibility floor — even perfect AI/voice scores cannot compensate for poor intent matching in 2026. <a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html#traditional-keywords-why' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "ai-voice-overview",
    emoji: "🔥",
    name: "AI Voice Search Help Guide",
    what: "<a href='https://traffictorch.net/blog/posts/ai-voice-search-help-guide.html' class='text-orange-600 dark:text-orange-400 hover:underline font-medium ml-1'>Read the full guide →</a>",
    how: "",
    why: ""
  }
];

// Keep your existing openDetailsFromHash() function unchanged

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

    // Special overview card (last one)
    if (m.id === "ai-voice-overview") {
      return `
        <div id="${m.id}" class="bg-gradient-to-br from-white-50 to-orange-50 dark:from-pink-950/30 dark:to-orange-950/20 rounded-3xl shadow-xl p-8 md:p-12 text-center border-2 border-pink-400 dark:border-pink-600">
          <div class="text-6xl mb-6">${m.emoji}</div>
          <h3 class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-6">${m.name}</h3>
          <p class="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
            ${m.what}
          </p>
        </div>
      `;
    }

    // Normal metric card with inline Learn more links in each section
    return `
      <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-4 hover:shadow-xl transition-shadow border-l-4 border-orange-500">
        <div class="text-5xl md:text-6xl mb-5 text-center">${m.emoji}</div>
        <h3 class="text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400 mb-5 text-center">${m.name}</h3>
        
        <details class="group mt-4">
          <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline flex items-center justify-between text-lg">
            What is ${m.name}?
            <span class="text-xl group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="mt-4 px-2 text-gray-700 dark:text-gray-300 leading-relaxed">
            ${m.what}
          </div>
        </details>

        <details class="group mt-4">
          <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline flex items-center justify-between text-lg">
            How is ${m.name} tested?
            <span class="text-xl group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="mt-4 px-2 text-gray-700 dark:text-gray-300 leading-relaxed">
            ${m.how}
          </div>
        </details>

        <details class="group mt-4">
          <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline flex items-center justify-between text-lg">
            Why does ${m.name} matter?
            <span class="text-xl group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div class="mt-4 px-2 text-gray-700 dark:text-gray-300 leading-relaxed">
            ${m.why}
          </div>
        </details>
      </div>
    `;
  }).join('');

  console.log('Cards rendered – final HTML length:', container.innerHTML.length);
  openDetailsFromHash();
});