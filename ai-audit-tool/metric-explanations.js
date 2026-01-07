const metricExplanations = [
  { id: "perplexity",     emoji: "🧠", name: "Perplexity",     full: "Perplexity evaluates text predictability through bigram and trigram entropy. High entropy means diverse, surprising word choices – a key hallmark of human writing. Modern AI often produces lower entropy due to reliance on common patterns, making this a strong signal for authenticity." },
  { id: "burstiness",     emoji: "📏", name: "Burstiness",     full: "Burstiness analyzes rhythm by measuring variance in sentence and word lengths. Human writers naturally mix short, punchy sentences with longer ones for engagement. Consistent lengths create monotony – a common AI trait that reduces reader interest." },
  { id: "repetition",     emoji: "🔁", name: "Repetition",     full: "Repetition tracks how often exact bigrams and trigrams reappear. Humans naturally vary expressions to keep text fresh. Excessive repetition of phrases makes content feel mechanical and formulaic – a frequent indicator of AI generation." },
  { id: "sentence-length",emoji: "📝", name: "Sentence Length",full: "This module combines average sentence length (ideal 15–23 words) with complexity markers like comma usage. Human writing balances clarity and depth through varied structure. Too uniform or overly simple/complex sentences can signal AI output." },
  { id: "vocabulary",     emoji: "📚", name: "Vocabulary",     full: "Vocabulary richness measures unique word ratio and frequency of rare (hapax) terms. Expert human content uses broad, context-specific vocabulary naturally. Limited word choice and lack of rare terms are common in AI writing optimized for efficiency." }
];

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
        <p class="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto">${m.full}</p>
      </details>
    </div>
  `).join('');

  // Auto-open details if URL hash matches card id
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
});