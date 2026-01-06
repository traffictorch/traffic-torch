const metricExplanations = [
  {
    name: "Perplexity",
    short: "Measures how unpredictable and varied your word sequences are",
    full: "Perplexity evaluates text predictability through bigram and trigram entropy. High entropy means diverse, surprising word choices – a key hallmark of human writing. Modern AI often produces lower entropy due to reliance on common patterns, making this a strong signal for authenticity."
  },
  {
    name: "Burstiness",
    short: "Checks natural variation in sentence and word lengths",
    full: "Burstiness analyzes rhythm by measuring variance in sentence and word lengths. Human writers naturally mix short, punchy sentences with longer ones for engagement. Consistent lengths create monotony – a common AI trait that reduces reader interest."
  },
  {
    name: "Repetition",
    short: "Detects overuse of the same phrases and patterns",
    full: "Repetition tracks how often exact bigrams and trigrams reappear. Humans naturally vary expressions to keep text fresh. Excessive repetition of phrases makes content feel mechanical and formulaic – a frequent indicator of AI generation."
  },
  {
    name: "Sentence Length",
    short: "Evaluates balance and complexity of sentence structure",
    full: "This module combines average sentence length (ideal 15–23 words) with complexity markers like comma usage. Human writing balances clarity and depth through varied structure. Too uniform or overly simple/complex sentences can signal AI output."
  },
  {
    name: "Vocabulary",
    short: "Assesses word diversity and use of rare terms",
    full: "Vocabulary richness measures unique word ratio and frequency of rare (hapax) terms. Expert human content uses broad, context-specific vocabulary naturally. Limited word choice and lack of rare terms are common in AI writing optimized for efficiency."
  }
];

export default metricExplanations;