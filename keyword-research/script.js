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
        'Fetching page content via CORS proxy...',
        'Extracting topic and detecting intents...',
        `Getting localized suggestions for ${country.toUpperCase()}...`,
        'Grouping real Google autocompletes by intent...'
    ];
    let tipIndex = 0;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url').value.trim();
        if (!url) return;

        form.classList.add('hidden');
        loader.classList.remove('hidden');
        progressText.textContent = 'Analyzing...';
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2000);

        try {
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Page fetch failed');
            const text = await response.text();

            let seed = extractTopics(text).trim();
            seed = seed.split(' | ')[0].split(' - ')[0].split(':')[0].substring(0, 100).trim();
            if (!seed) seed = new URL(url).hostname.replace('www.', '');

            const intents = detectIntents(text); // Up to 4

            let output = '';
            for (const intent of intents) {
                const prefix = getIntentPrefix(intent);
                const q = `${prefix}${seed}`.trim();

                const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&gl=${country}&hl=${lang}&q=${encodeURIComponent(q)}`;
                const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(suggestUrl)}`;
                const suggestRes = await fetch(suggestProxy);
                if (!suggestRes.ok) continue;

                const suggestData = await suggestRes.json();
                const suggestions = suggestData[1]?.slice(0, 3) || []; // 2-3 per intent

                if (suggestions.length > 0) {
                    output += `<h3 class="text-2xl font-bold mt-6 mb-4 text-gray-800 dark:text-gray-200">${intent} Intent</h3>`;
                    output += suggestions.map(query => `
                        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md hover:shadow-lg transition" title="Pure Google autocomplete for ${intent.toLowerCase()} – real searches in your region">
                            <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${query}</h4>
                        </div>
                    `).join('');
                }
            }

            detectedIntent.textContent = intents.join(', ') || 'Commercial';
            suggestionsGrid.innerHTML = output || '<p class="text-center text-gray-600 dark:text-gray-400">No suggestions found – try a broader page.</p>';

            clearInterval(tipInterval);
            loader.classList.add('hidden');
            results.classList.remove('hidden');
        } catch (error) {
            clearInterval(tipInterval);
            loader.classList.add('hidden');
            form.classList.remove('hidden');
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Failed to retrieve suggestions. Check URL or try again.</p>';
            results.classList.remove('hidden');
        }
    });

    function extractTopics(text) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return doc.title || '';
    }

    function detectIntents(text) {
        const lower = text.toLowerCase();
        const intents = new Set();
        if (lower.match(/book|stay|buy|price|accommodation/)) intents.add('Commercial');
        if (lower.match(/how to|guide|tips|things to do/)) intents.add('Informational');
        if (lower.match(/best|review|vs|compare/)) intents.add('Transactional');
        if (lower.match(/map|location|directions/)) intents.add('Navigational');
        return Array.from(intents).slice(0, 4);
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