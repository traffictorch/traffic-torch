document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('keywordForm');
  const loader = document.getElementById('loader');
  const progressText = document.getElementById('progress-text');
  const results = document.getElementById('results');
  const detectedIntent = document.getElementById('detectedIntent');
  const suggestionsGrid = document.getElementById('suggestionsGrid');

  const progressMessages = [
    "Fetching page...",
    "Scanning content...",
    "Detecting intent...",
    "Generating suggestions..."
  ];

  let messageIndex = 0;
  let interval;

  function startLoader() {
    loader.classList.remove('hidden');
    messageIndex = 0;
    progressText.textContent = progressMessages[messageIndex++];
    interval = setInterval(() => {
      if (messageIndex < progressMessages.length) {
        progressText.textContent = progressMessages[messageIndex++];
      }
    }, 3000);
  }

  function stopLoader() {
    clearInterval(interval);
    loader.classList.add('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value.trim();
    if (!url) return;

    results.classList.add('hidden');
    startLoader();
    suggestionsGrid.innerHTML = '';

    try {
      const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch page');
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.textContent?.trim() || '';
      const h1 = doc.querySelector('h1')?.textContent?.trim() || '';
      const bodyText = doc.body?.textContent?.trim() || '';
      const pageText = `${title} ${h1} ${bodyText}`.toLowerCase();

      // Intent detection
      let intent = 'Informational';
      if (pageText.includes('buy') || pageText.includes('price') || pageText.includes('shop') || pageText.includes('book') || pageText.includes('reserve')) intent = 'Transactional';
      else if (pageText.includes('best') || pageText.includes('review') || pageText.includes('vs') || pageText.includes('comparison')) intent = 'Commercial Investigation';
      detectedIntent.textContent = intent;

      // Core topic from title/H1
      const coreMatch = title.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,4})/) || h1.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,4})/);
      const coreTopic = coreMatch ? coreMatch[0].trim().toLowerCase() : 'experience';

      // Location detection
      const locationMatch = title.match(/(?:in|at|near)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
      const location = locationMatch ? locationMatch[1].trim() : '';

      // Generate suggestions
      const suggestions = generateUniversalSuggestions(coreTopic, location, intent);

      // Render
      suggestions.forEach(sugg => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 dark:bg-gray-700 rounded-xl p-5 space-y-3';
        card.innerHTML = `
          <div class="font-bold text-lg text-gray-900 dark:text-white">${sugg.phrase}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Best placement:</span> ${sugg.placement}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Why it helps:</span> ${sugg.why}
          </div>
        `;
        suggestionsGrid.appendChild(card);
      });

      stopLoader();
      results.classList.remove('hidden');
      results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      stopLoader();
      alert('Sorry, something went wrong fetching the page. Try another URL or check later.');
      console.error(err);
    }
  });

  function generateUniversalSuggestions(coreTopic, location, intent) {
    const placements = ['H1 or page title', 'Intro paragraph', 'Subheadings (H2/H3)', 'Image alt text', 'Meta description', 'Body content naturally', 'CTA buttons', 'FAQ section'];
    const whyBase = intent === 'Transactional' ? 'Drives buying intent and conversions' :
                    intent === 'Commercial Investigation' ? 'Matches comparison shoppers' :
                    'Improves relevance for searchers seeking info';

    const phrases = [];

    phrases.push(`best ${coreTopic}`);
    phrases.push(`how to ${coreTopic}`);
    phrases.push(`${coreTopic} near me`);
    phrases.push(`top ${coreTopic} 2025`);
    phrases.push(`${coreTopic} reviews`);
    phrases.push(`ultimate guide to ${coreTopic}`);

    if (location) {
      phrases.push(`best ${coreTopic} in ${location}`);
      phrases.push(`${location} ${coreTopic}`);
    }

    if (intent === 'Transactional') {
      phrases.push(`buy ${coreTopic}`);
      phrases.push(`best deals on ${coreTopic}`);
    }

    const unique = [...new Set(phrases)].slice(0, 8);

    return unique.map((phrase, i) => ({
      phrase,
      placement: placements[i % placements.length],
      why: `${whyBase}. Boosts topical authority and findability.`
    }));
  }
});