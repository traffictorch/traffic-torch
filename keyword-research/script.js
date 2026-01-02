document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const detectedIntent = document.getElementById('detectedIntent');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    const tips = [
        'Fetching page content securely via our CORS proxy...',
        'Analyzing main topics and search intent...',
        'Generating related queries from real search data...',
        'Adding semantic expansions for broader coverage...',
        'Filtering for unique, high-potential suggestions...'
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
            // Fixed: Use ?url= format for the worker
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Proxy fetch failed');
            const text = await response.text();

            const seed = extractTopics(text);
            const intent = detectIntent(text);

            // Fixed suggest URLs similarly
            const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seed)}`)}`;
            const suggestRes = await fetch(suggestProxy);
            if (!suggestRes.ok) throw new Error('Suggestions fetch failed');
            const suggestData = await suggestRes.json();
            const suggestions = suggestData[1]?.slice(0, 5) || [];

            const assocProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?ml=${encodeURIComponent(seed)}&max=5`)}`;
            const assocRes = await fetch(assocProxy);
            if (!assocRes.ok) throw new Error('Associations fetch failed');
            const assocData = await assocRes.json();
            const associations = assocData.map(word => word.word);

            const combined = [...new Set([...suggestions, ...associations])].slice(0, 8);

            detectedIntent.textContent = intent;
            suggestionsGrid.innerHTML = combined.map((query, i) => {
                const opportunity = query.split(' ').length > 3 ? 'Low competition long-tail' : 'Higher volume potential';
                return `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md" title="${opportunity} – Use in content for better SEO match.">
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
            progressTip.textContent = 'Unable to fetch page – check URL or try again later. Proxy may need update.';
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Fetch failed. Please ensure the URL is valid and publicly accessible.</p>';
            results.classList.remove('hidden');
        }
    });

    function extractTopics(text) {
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        const metaDesc = text.match(/<meta name="description" content="(.*?)"/i);
        return (titleMatch ? titleMatch[1] : '') + ' ' + (metaDesc ? metaDesc[1] : '');
    }

    function detectIntent(text) {
        const lower = text.toLowerCase();
        if (lower.includes('buy') || lower.includes('price') || lower.includes('shop')) return 'Commercial';
        if (lower.includes('how to') || lower.includes('what is') || lower.includes('guide')) return 'Informational';
        if (lower.includes('best') || lower.includes('review') || lower.includes('vs')) return 'Transactional';
        return 'Navigational';
    }
});