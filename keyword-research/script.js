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
      const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const pageText = `${title} ${h1} ${metaDesc} ${bodyText}`.toLowerCase();

      let intent = 'Informational';
      if (pageText.includes('buy') || pageText.includes('price') || pageText.includes('shop') || pageText.includes('add to cart') || pageText.includes('book') || pageText.includes('reserve')) intent = 'Transactional';
      else if (pageText.includes('best') || pageText.includes('review') || pageText.includes('vs') || pageText.includes('comparison')) intent = 'Commercial Investigation';
      detectedIntent.textContent = intent;

      const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
      const possibleBrand = domain.replace(/[-_]/g, ' ');
      const possibleLocation = title.toLowerCase().match(/\b(in|at|near|byron|bay|sydney|melbourne|london|new york|paris)\b/)?.[0] || '';

      const baseKeywords = extractBaseKeywords(title + ' ' + h1 + ' ' + bodyText);
      const suggestions = generateSmartSuggestions(baseKeywords, intent, possibleLocation, possibleBrand);

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

  function extractBaseKeywords(text) {
    const stop = new Set(['the', 'and', 'for', 'with', 'how', 'what', 'best', 'top', 'guide', 'review', 'in', 'at', 'on', 'by', 'near', 'of', 'a', 'an', 'to']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stop.has(w))
      .slice(0, 10);
  }

  function generateSmartSuggestions(keywords, intent, location, brand) {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their', 'them', 'he', 'she', 'him', 'her', 'i', 'me', 'my', 'not', 'no', 'yes', 'all', 'some', 'any', 'one', 'two', 'three', 'first', 'last', 'new', 'old', 'big', 'small', 'good', 'best', 'more', 'most', 'less', 'few', 'many', 'much', 'little', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'who', 'which']);

    const placements = ['H1 or page title', 'Intro paragraph', 'Subheadings (H2/H3)', 'Image alt text', 'Meta description', 'Body content naturally', 'CTA buttons', 'FAQ section'];
    const whyBase = intent === 'Transactional' ? 'Drives buying intent and conversions' :
                    intent === 'Commercial Investigation' ? 'Matches comparison shoppers' :
                    'Improves relevance for searchers seeking info';

    const filtered = keywords.filter(word => word.length > 3 && !stopWords.has(word));

    const phrases = new Set();

    if (location) {
      filtered.forEach(kw => {
        phrases.add(`things to do in ${location}`);
        phrases.add(`${location} ${kw}`);
        phrases.add(`best ${kw} in ${location}`);
        phrases.add(`places to ${kw} in ${location}`);
      });
    }

    filtered.forEach(kw => {
      const verb = kw.endsWith('ing') ? kw.slice(0, -3) + 'e' : kw; // relaxing → relax
      phrases.add(`how to ${verb}`);
      phrases.add(`best ${kw}`);
      phrases.add(`${kw} near me`);
    });

    if (intent === 'Transactional') {
      if (location) phrases.add(`book stay in ${location}`);
      phrases.add(`reserve ${filtered[0] || 'room'}`);
    }

    const unique = Array.from(phrases).slice(0, 8);

    return unique.map((phrase, i) => ({
      phrase,
      placement: placements[i % placements.length],
      why: `${whyBase}. Boosts topical authority and findability.`
    }));
  }
});