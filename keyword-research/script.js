document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const detectedIntent = document.getElementById('detectedIntent');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    // Dynamic localization
    const locale = navigator.languages?.[0] || navigator.language || 'en-US';
    const country = locale.split('-')[1]?.toLowerCase() || 'us';
    const lang = locale.split('-')[0];

    const tips = [
        'Analyzing your input...',
        `Fetching localized suggestions for ${country.toUpperCase()}...`,
        'Grouping real Google autocompletes by intent...'
    ];
    let tipIndex = 0;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const seedInput = document.getElementById('seed').value.trim();
        const urlInput = document.getElementById('url').value.trim();

        if (!seedInput && !urlInput) {
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Please enter a keyword, URL, or both.</p>';
            results.classList.remove('hidden');
            return;
        }

        form.classList.add('hidden');
        loader.classList.remove('hidden');
        progressText.textContent = 'Generating...';
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2000);

        let seed = seedInput;
        let pageText = '';

        // If no keyword but URL provided → extract from title
        if (!seed && urlInput) {
            try {
                const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(urlInput)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    pageText = await response.text();
                    seed = extractTopics(pageText).trim();
                    seed = seed.split(' | ')[0].split(' - ')[0].split(':')[0].substring(0, 100).trim();
                    if (!seed) seed = new URL(urlInput).hostname.replace('www.', '');
                }
            } catch (err) {
                seed = new URL(urlInput).hostname.replace('www.', '');
            }
        }

        // If URL provided (with or without keyword) → fetch for intent
        if (urlInput) {
            try {
                const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(urlInput)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) pageText = await response.text();
            } catch (err) {}
        }

        const intents = detectIntents(pageText, seed);
        detectedIntent.textContent = intents.join(', ') || 'Commercial';

        let output = '';
        for (const intent of intents) {
            const prefix = getIntentPrefix(intent);
            const q = `${prefix}${seed}`.trim();

            try {
                const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&gl=${country}&hl=${lang}&q=${encodeURIComponent(q)}`;
                const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(suggestUrl)}`;
                const suggestRes = await fetch(suggestProxy);
                if (!suggestRes.ok) continue;

                const suggestData = await suggestRes.json();
                const suggestions = suggestData[1]?.slice(0, 3) || [];

                if (suggestions.length > 0) {
                    output += `<h3 class="text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-200">${intent} Intent</h3>`;
                    output += suggestions.map(query => `
                        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md hover:shadow-lg transition" title="Pure unmodified Google autocomplete – real search behavior in your region">
                            <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${query}</h4>
                        </div>
                    `).join('');
                }
            } catch (err) {}
        }

        suggestionsGrid.innerHTML = output || '<p class="text-center text-gray-600 dark:text-gray-400">No suggestions found – try a different keyword or URL.</p>';

        clearInterval(tipInterval);
        loader.classList.add('hidden');
        results.classList.remove('hidden');
    });

    function extractTopics(text) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return doc.title || '';
    }

    function detectIntents(pageText, seed) {
        const lower = (pageText + ' ' + seed).toLowerCase();
        const intents = new Set();
        if (lower.match(/book|stay|buy|price|accommodation|restaurant|menu|booking/)) intents.add('Commercial');
        if (lower.match(/how|guide|tips|tutorial|things to do|what is/)) intents.add('Informational');
        if (lower.match(/best|review|vs|compare|top|rating/)) intents.add('Transactional');
        if (lower.match(/where|location|map|directions|address/)) intents.add('Navigational');
        return Array.from(intents).slice(0, 4) || ['Commercial'];
    }

    function getIntentPrefix(intent) {
        switch (intent) {
            case 'Informational': return 'how to ';
            case 'Transactional': return 'best ';
            case 'Navigational': return 'where is ';
            default: return '';
        }
    }
});