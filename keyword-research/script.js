document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const detectedIntent = document.getElementById('detectedIntent');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    // Detect user country/language dynamically (works on any site)
    const locale = navigator.languages?.[0] || navigator.language || 'en-US';
    const country = new Intl.DateTimeFormat(locale).resolvedOptions().timeZone.split('/')[0] === 'America' ? 'us' : // Basic fallback example
                   locale.split('-')[1]?.toLowerCase() || 'us';
    const lang = locale.split('-')[0];

    const tips = [
        'Fetching page content securely via our CORS proxy...',
        'Analyzing main topics and search intent...',
        `Generating localized suggestions for ${country.toUpperCase()}...`,
        'Expanding with synonyms and triggered terms...',
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
            let triggers = [];

            // Dynamic localized Google Suggest
            try {
                const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&gl=${country}&hl=${lang}&q=${encodeURIComponent(seed)}`)}`;
                const suggestRes = await fetch(suggestProxy);
                if (suggestRes.ok) {
                    const suggestData = await suggestRes.json();
                    suggestions = suggestData[1]?.slice(0, 6) || [];
                }
            } catch (err) {
                console.warn('Google Suggest failed');
            }

            // Datamuse: synonyms + triggered words for better relevance/variety
            try {
                const synProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(seed)}&max=5`)}`;
                const synRes = await fetch(synProxy);
                if (synRes.ok) {
                    const synData = await synRes.json();
                    synonyms = synData.map(item => item.word);
                }

                const trgProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(seed)}&max=5`)}`;
                const trgRes = await fetch(trgProxy);
                if (trgRes.ok) {
                    const trgData = await trgRes.json();
                    triggers = trgData.map(item => item.word);
                }
            } catch (err) {
                console.warn('Datamuse expansion failed');
            }

            // Combine for max diversity/relevance
            const combined = [...new Set([...suggestions, ...synonyms, ...triggers.map(t => `${t} ${seed.split(' ').pop()}`)])].slice(0, 8);

            detectedIntent.textContent = intent;
            suggestionsGrid.innerHTML = combined.map((query, i) => {
                const type = suggestions.includes(query) ? 'Autocomplete query' : synonyms.includes(query) ? 'Synonym variation' : 'Triggered related term';
                return `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md" title="${type} – Localized for better relevance; potential for targeted traffic.">
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
        if (lower.includes('book') || lower.includes('stay') || lower.includes('buy') || lower.includes('price')) return 'Commercial';
        if (lower.includes('how to') || lower.includes('what is') || lower.includes('guide')) return 'Informational';
        if (lower.includes('best') || lower.includes('review') || lower.includes('vs')) return 'Transactional';
        return 'Navigational';
    }
});