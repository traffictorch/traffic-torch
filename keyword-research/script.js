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
      const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 2000) || '';
      const pageText = `${title} ${h1} ${metaDesc} ${bodyText}`.toLowerCase();

      let intent = 'Informational';
      if (pageText.includes('buy') || pageText.includes('price') || pageText.includes('shop') || pageText.includes('add to cart') || pageText.includes('book') || pageText.includes('reserve')) intent = 'Transactional';
      else if (pageText.includes('best') || pageText.includes('review') || pageText.includes('vs') || pageText.includes('comparison')) intent = 'Commercial Investigation';
      else if (pageText.includes('how to') || pageText.includes('guide') || pageText.includes('tutorial') || pageText.includes('what is')) intent = 'Informational';
      detectedIntent.textContent = intent;

      // Generic location detection
      const locationPattern = /\b(in|at|near|byron bay|byron|sydney|melbourne|london|new york|paris|tokyo|bali|phuket)\b/g;
      const locations = pageText.match(locationPattern) || [];
      const location = locations[0] ? locations[0].charAt(0).toUpperCase() + locations[0].slice(1) : 'your area';

      // Activity/type detection
      const activityPatterns = ['hotel', 'spa', 'retreat', 'resort', 'accommodation', 'stay', 'boutique', 'luxury', 'pool', 'garden', 'bar', 'restaurant', 'surf', 'yoga', 'fishing', 'gear', 'rod', 'reel', 'lure', 'tackle'];
      const activity = activityPatterns.find(k => pageText.includes(k)) || 'experience';

      // Generate suggestions using templates
      const suggestions = generateSuggestions(activity, location, intent);

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

  function generateSuggestions(activity, location, intent) {
    const placements = ['H1 or page title', 'Intro paragraph', 'Subheadings (H2/H3)', 'Image alt text', 'Meta description', 'Body content naturally', 'CTA buttons', 'FAQ section'];
    const whyBase = intent === 'Transactional' ? 'Drives buying intent and conversions' :
                    intent === 'Commercial Investigation' ? 'Matches comparison shoppers' :
                    'Improves relevance for searchers seeking info';

    const templates = [
      `things to do in ${location}`,
      `best things to do in ${location}`,
      `luxury ${activity}s in ${location}`,
      `best places to ${activity} in ${location}`,
      `top ${location} ${activity}s 2025`,
      `how to find the best ${activity}`,
      `${activity} near me`,
      `${location} ${activity} guide`
    ];

    // Intent boosters
    if (intent === 'Transactional') {
      templates.push(`book ${activity} now`);
      templates.push(`best deals on ${activity} in ${location}`);
    } else if (intent === 'Commercial Investigation') {
      templates.push(`best ${activity} reviews`);
      templates.push(`${activity} vs alternatives`);
    } else if (intent === 'Informational') {
      templates.push(`ultimate guide to ${activity}`);
      templates.push(`${activity} tips for beginners`);
    }

    const unique = [...new Set(templates)].slice(0, 8);

    return unique.map((phrase, i) => ({
      phrase,
      placement: placements[i % placements.length],
      why: `${whyBase}. Boosts topical authority and findability.`
    }));
  }
});