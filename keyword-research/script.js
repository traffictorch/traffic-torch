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
        'Expanding with specific terms and how-to variations...',
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
            let specifics = [];
            let parts = [];

            // Localized Google Suggest
            try {
                const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&gl=${country}&hl=${lang}&q=${encodeURIComponent(seed)}`)}`;
                const suggestRes = await fetch(suggestProxy);
                if (suggestRes.ok) {
                    const suggestData = await suggestRes.json();
                    suggestions = suggestData[1]?.slice(0, 5) || [];
                }
            } catch (err) {}

            // Datamuse expansions for relevance
            try {
                const synProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(seed)}&max=4`)}`;
                const synRes = await fetch(synProxy);
                if (synRes.ok) synonyms = (await synRes.json()).map(item => item.word);

                const spcProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_spc=${encodeURIComponent(seed)}&max=4`)}`;
                const spcRes = await fetch(spcProxy);
                if (spcRes.ok) specifics = (await spcRes.json()).map(item => item.word);

                const parProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_par=${encodeURIComponent(seed)}&max=4`)}`;
                const parRes = await fetch(parProxy);
                if (parRes.ok) parts = (await parRes.json()).map(item => item.word);
            } catch (err) {}

            // Add educational how-to questions
            const howTos = [
                `how to use ${seed.toLowerCase()}`,
                `how to remove background in ${seed.toLowerCase()}`,
                `${seed.toLowerCase()} tutorial`,
                `${seed.toLowerCase()} vs photoshop`
            ];

            // Combine with priority for diversity
            const combined = [...new Set([
                ...suggestions,
                ...howTos,
                ...synonyms,
                ...specifics.map(s => `${s} ${seed.split(' ').pop()}`),
                ...parts
            ])].slice(0, 8);

            detectedIntent.textContent = intent;
            suggestionsGrid.innerHTML = combined.map((query, i) => {
                const type = suggestions.includes(query) ? 'Popular autocomplete' : howTos.some(h => query.includes(h)) ? 'How-to tutorial query' : 'Related term variation';
                return `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md" title="${type} – Targets user education or common tasks; great for content ideas.">
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
        if (lower.includes('download') || lower.includes('app') || lower.includes('free')) return 'Commercial';
        if (lower.includes('how') || lower.includes('tutorial') || lower.includes('review')) return 'Informational';
        return 'Commercial';
    }
});