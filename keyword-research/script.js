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
        'Preparing real Google autocomplete queries...',
        `Localized for ${country.toUpperCase()} search behavior...`,
        'Fetching pure unmodified suggestions by intent...'
    ];
    let tipIndex = 0;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const seedInput = document.getElementById('seed').value.trim();
        const urlInput = document.getElementById('url').value.trim();
        if (!seedInput) return;

        form.classList.add('hidden');
        loader.classList.remove('hidden');
        progressText.textContent = 'Generating...';
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2000);

        let pageText = '';
        if (urlInput) {
            try {
                const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(urlInput)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) pageText = await response.text();
            } catch (err) {
                console.warn('URL fetch failed – using keyword only');
            }
        }

        const intents = detectIntents(pageText, seedInput);
        detectedIntent.textContent = intents.join(', ') || 'Commercial';

        let output = '';
        for (const intent of intents) {
            const prefix = getIntentPrefix(intent);
            const q = `${prefix}${seedInput}`.trim();

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
                        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md hover:shadow-lg transition" title="Pure unmodified Google autocomplete – real popular search in your region">
                            <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${query}</h4>
                        </div>
                    `).join('');
                }
            } catch (err) {}
        }

        suggestionsGrid.innerHTML = output || '<p class="text-center text-gray-600 dark:text-gray-400">No suggestions returned – try a different keyword.</p>';

        clearInterval(tipInterval);
        loader.classList.add('hidden');
        results.classList.remove('hidden');
    });

    function detectIntents(pageText, seed) {
        const lower = (pageText + ' ' + seed).toLowerCase();
        const intents = new Set();
        if (lower.match(/book|stay|buy|price|accommodation|restaurant|menu/)) intents.add('Commercial');
        if (lower.match(/how|guide|tips|tutorial|things to do/)) intents.add('Informational');
        if (lower.match(/best|review|vs|compare|top/)) intents.add('Transactional');
        if (lower.match(/where|location|map|directions/)) intents.add('Navigational');
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