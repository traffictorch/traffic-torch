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
        'Fetching page content securely via our CORS proxy...',
        'Analyzing main topics and search intent...',
        `Generating localized suggestions for ${country.toUpperCase()}...`,
        'Expanding with real-user queries and related terms...',
        'Curating 8 diverse, high-relevance suggestions...'
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
        }, 2500);

        try {
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Proxy fetch failed');
            const text = await response.text();

            let seed = extractTopics(text).trim();
            seed = seed.split(' | ')[0].split(' - ')[0].split(':')[0].substring(0, 80).trim();
            if (!seed) {
                seed = new URL(url).hostname.replace('www.', '');
            }
            const intent = detectIntent(text);

            let suggestions = [];
            let synonyms = [];
            let adjectives = [];
            let triggers = [];

            // Localized Google Suggest - primary source for real queries
            try {
                const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&gl=${country}&hl=${lang}&q=${encodeURIComponent(seed)}`)}`;
                const suggestRes = await fetch(suggestProxy);
                if (suggestRes.ok) {
                    const suggestData = await suggestRes.json();
                    suggestions = suggestData[1]?.slice(0, 7) || [];
                }
            } catch (err) {}

            // Datamuse expansions for topical depth
            try {
                const synProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(seed)}&max=4`)}`;
                const synRes = await fetch(synProxy);
                if (synRes.ok) synonyms = (await synRes.json()).map(item => item.word);

                const adjProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_jja=${encodeURIComponent(seed)}&max=4`)}`;
                const adjRes = await fetch(adjProxy);
                if (adjRes.ok) adjectives = (await adjRes.json()).map(item => item.word);

                const trgProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(seed)}&max=4`)}`;
                const trgRes = await fetch(trgProxy);
                if (trgRes.ok) triggers = (await trgRes.json()).map(item => item.word);
            } catch (err) {}

            // Dynamic intent-based variations (universal patterns)
            const dynamicVariations = [];
            const lowerSeed = seed.toLowerCase();
            if (intent === 'Commercial' || lowerSeed.includes('hotel') || lowerSeed.includes('stay') || lowerSeed.includes('activity')) {
                dynamicVariations.push(`best ${lowerSeed}`, `things to do in ${lowerSeed}`, `${lowerSeed} for adults`, `${lowerSeed} reviews`);
            }
            if (lowerSeed.includes('how') || intent === 'Informational') {
                dynamicVariations.push(`how to ${lowerSeed}`, `${lowerSeed} guide`, `${lowerSeed} tips`);
            }

            // Combine with strong diversity
            const combined = [...new Set([
                ...suggestions,
                ...dynamicVariations,
                ...adjectives.map(a => `${a} ${seed.split(' ').slice(-2).join(' ')}`),
                ...synonyms,
                ...triggers
            ])].slice(0, 8);

            detectedIntent.textContent = intent;
            suggestionsGrid.innerHTML = combined.map((query, i) => {
                const source = suggestions.includes(query) ? 'Real user autocomplete' : dynamicVariations.some(v => query.includes(v)) ? 'Common intent pattern' : 'Topical expansion';
                return `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md" title="${source} – Reflects actual search behavior; ideal for content targeting.">
                        <h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">${query}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Intent match: ${intent.toLowerCase()}</p>
                    </div>
                `;
            }).join('');

            clearInterval(tipInterval);
            loader.classList.add('hidden');
            results.classList.remove('hidden');
        } catch (error) {
            clearInterval(tipInterval);
            loader.classList.add('hidden');
            form.classList.remove('hidden');
            progressText.textContent = 'Error';
            progressTip.textContent = 'Unable to process – try a different URL.';
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Analysis failed. Ensure URL is valid and accessible.</p>';
            results.classList.remove('hidden');
        }
    });

    function extractTopics(text) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return doc.title || '';
    }

    function detectIntent(text) {
        const lower = text.toLowerCase();
        if (lower.includes('book') || lower.includes('stay') || lower.includes('buy') || lower.includes('price') || lower.includes('activities')) return 'Commercial';
        if (lower.includes('how to') || lower.includes('guide') || lower.includes('best') || lower.includes('things to do')) return 'Informational';
        if (lower.includes('review') || lower.includes('vs')) return 'Transactional';
        return 'Navigational';
    }
});