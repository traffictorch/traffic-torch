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

    // Reset & show progress
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
      // Step 1: Fetch page HTML via CORS proxy
      const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch page');
      const html = await response.text();

      // Step 2: Client-side parsing (lightweight)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.textContent?.trim() || '';
      const h1 = doc.querySelector('h1')?.textContent?.trim() || '';
      const metaDesc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
      const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 2000) || '';
      const pageText = `${title} ${h1} ${metaDesc} ${bodyText}`.toLowerCase();

      // Step 3: Simple intent detection
      let intent = 'Informational';
      if (pageText.includes('buy') || pageText.includes('price') || pageText.includes('shop') || pageText.includes('add to cart')) intent = 'Transactional';
      else if (pageText.includes('best') || pageText.includes('review') || pageText.includes('vs') || pageText.includes('comparison')) intent = 'Commercial Investigation';
      else if (pageText.includes('how to') || pageText.includes('guide') || pageText.includes('tutorial') || pageText.includes('what is')) intent = 'Informational';
      detectedIntent.textContent = intent;

      // Step 4: Generate meaningful suggestions
      const baseKeywords = extractBaseKeywords(title + ' ' + h1);
      const suggestions = generateSuggestions(baseKeywords, intent);

      // Render suggestions
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

  // Helper: extract potential base keywords
  function extractBaseKeywords(text) {
    const common = ['the', 'and', 'for', 'with', 'how', 'what', 'best', 'top', 'guide', 'review'];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 4 && !common.includes(word))
      .slice(0, 8);
  }

  // Helper: generate meaningful suggestions
  function generateSuggestions(keywords, intent) {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their', 'them', 'he', 'she', 'him', 'her', 'i', 'me', 'my', 'not', 'no', 'yes', 'all', 'some', 'any', 'one', 'two', 'three', 'first', 'last', 'new', 'old', 'big', 'small', 'good', 'best', 'more', 'most', 'less', 'few', 'many', 'much', 'little', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'who', 'which']);

    const placements = ['H1 or page title', 'Intro paragraph', 'Subheadings (H2/H3)', 'Image alt text', 'Meta description', 'Body content naturally', 'CTA buttons', 'FAQ section'];
    const whyBase = intent === 'Transactional' ? 'Drives buying intent and conversions' :
                    intent === 'Commercial Investigation' ? 'Matches comparison shoppers' :
                    'Improves relevance for searchers seeking info';

    // Filter keywords
    const filtered = keywords.filter(word => word.length > 4 && !stopWords.has(word));

    // Generate phrases
    const phrases = [];
    for (let i = 0; i < filtered.length - 1; i++) {
      const phrase = `${filtered[i]} ${filtered[i+1]}`;
      phrases.push(phrase);
      if (i < filtered.length - 2) {
        const threeWord = `${filtered[i]} ${filtered[i+1]} ${filtered[i+2]}`;
        phrases.push(threeWord);
      }
    }

    // Intent-specific
    if (intent.includes('Informational')) {
      if (filtered[0]) phrases.push(`how to ${filtered[0]}`);
      if (filtered[1]) phrases.push(`what is ${filtered[1]}`);
    } else if (intent.includes('Commercial')) {
      if (filtered[0]) phrases.push(`best ${filtered[0]} 2025`);
      if (filtered[1]) phrases.push(`${filtered[0]} vs ${filtered[1]}`);
    }

    // Dedupe & limit
    const unique = [...new Set(phrases)].slice(0, 8);

    return unique.map((phrase, i) => ({
      phrase,
      placement: placements[i % placements.length],
      why: `${whyBase}. Boosts topical authority and findability.`
    }));
  }
});