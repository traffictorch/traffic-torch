document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('keywordForm');
  const progressContainer = document.getElementById('progressContainer');
  const progressStep = document.getElementById('progressStep');
  const progressTip = document.getElementById('progressTip');
  const results = document.getElementById('results');
  const detectedIntent = document.getElementById('detectedIntent');
  const suggestionsGrid = document.getElementById('suggestionsGrid');

  const progressSteps = [
    { step: 'Fetching page...', tip: 'Pulling content securely via our CORS proxy...' },
    { step: 'Scanning content...', tip: 'Analyzing headings, meta, and body text...' },
    { step: 'Detecting intent...', tip: 'Identifying if the page is Informational, Commercial, Transactional, etc.' },
    { step: 'Generating suggestions...', tip: 'Crafting targeted phrases you can sprinkle naturally.' }
  ];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value.trim();
    if (!url) return;

    results.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    suggestionsGrid.innerHTML = '';
    let stepIndex = 0;
    const updateProgress = () => {
      if (stepIndex < progressSteps.length) {
        progressStep.textContent = progressSteps[stepIndex].step;
        progressTip.textContent = progressSteps[stepIndex].tip;
        stepIndex++;
        setTimeout(updateProgress, 1800);
      }
    };
    updateProgress();

    try {
      const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch page');
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.textContent?.trim() || '';
      const h1 = doc.querySelector('h1')?.textContent?.trim() || '';
      const metaDesc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
      const bodyText = doc.body?.textContent?.trim() || '';
      const pageText = `${title} ${h1} ${metaDesc} ${bodyText}`.toLowerCase();

      // Intent detection
      let intent = 'Informational';
      if (pageText.includes('buy') || pageText.includes('price') || pageText.includes('shop') || pageText.includes('book') || pageText.includes('reserve')) intent = 'Transactional';
      else if (pageText.includes('best') || pageText.includes('review') || pageText.includes('vs') || pageText.includes('comparison')) intent = 'Commercial Investigation';
      detectedIntent.textContent = intent;

      // Generic detection: location/activity from title/H1
      const titleWords = title.split(' ');
      const locationCandidates = titleWords.filter(w => w.length > 3 && /[A-Z]/.test(w[0]));
      const location = locationCandidates.length > 0 ? locationCandidates.join(' ') : '';

      const activityKeywords = ['hotel', 'spa', 'retreat', 'resort', 'accommodation', 'stay', 'boutique', 'luxury', 'restaurant', 'cafe', 'surf', 'yoga', 'wellness'];
      const activity = activityKeywords.find(k => pageText.includes(k)) || 'stay';

      // Generate universal high-intent suggestions
      const suggestions = generateUniversalSuggestions(activity, location, intent);

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

      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      progressContainer.classList.add('hidden');
      alert('Sorry, something went wrong fetching the page. Try another URL or check later.');
      console.error(err);
    }
  });

  function generateUniversalSuggestions(activity, location, intent) {
    const placements = ['H1 or page title', 'Intro paragraph', 'Subheadings (H2/H3)', 'Image alt text', 'Meta description', 'Body content naturally', 'CTA buttons', 'FAQ section'];
    const whyBase = intent === 'Transactional' ? 'Drives buying intent and conversions' :
                    intent === 'Commercial Investigation' ? 'Matches comparison shoppers' :
                    'Improves relevance for searchers seeking info';

    const phrases = [];

    if (location) {
      phrases.push(`things to do in ${location}`);
      phrases.push(`best things to do in ${location}`);
      phrases.push(`luxury ${activity}s in ${location}`);
      phrases.push(`best places to ${activity} in ${location}`);
      phrases.push(`top ${location} ${activity}s 2025`);
      phrases.push(`${location} ${activity} guide`);
    }

    // Generic fallbacks
    phrases.push(`best ${activity}`);
    phrases.push(`luxury ${activity}`);
    phrases.push(`how to find the best ${activity}`);
    phrases.push(`${activity} near me`);

    // Intent boosters
    if (intent === 'Transactional') {
      phrases.push(`book ${activity} now`);
      phrases.push(`reserve luxury ${activity}`);
    }

    const unique = [...new Set(phrases)].slice(0, 8);

    return unique.map((phrase, i) => ({
      phrase,
      placement: placements[i % placements.length],
      why: `${whyBase}. Boosts topical authority and findability.`
    }));
  }
});