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

        // Show loader with animated tips
        form.classList.add('hidden');
        loader.classList.remove('hidden');
        progressText.textContent = 'Analyzing...';
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2500);

        try {
            // Proxy fetch URL content
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const text = await response.text();

            // Extract seed/topics and detect intent
            const seed = extractTopics(text);
            const intent = detectIntent(text); // New: simple intent detection

            // Proxy Google Suggest for autocomplete
            const suggestUrl = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${seed}`)}`;
            const suggestRes = await fetch(suggestUrl);
            const suggestData = await suggestRes.json();
            const suggestions = suggestData[1].slice(0, 5);

            // Proxy Datamuse for semantic associations
            const assocUrl = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(`https://api.datamuse.com/words?ml=${seed}&max=5`)}`;
            const assocRes = await fetch(assocUrl);
            const assocData = await assocRes.json();
            const associations = assocData.map(word => word.word);

            // Combine unique 5-10, aim for 8
            const combined = [...new Set([...suggestions, ...associations])].slice(0, 8);

            // Display
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
            progressText.textContent = 'Error';
            progressTip.textContent = 'Try another URL.';
        }
    });

    function extractTopics(text) {
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        const metaDesc = text.match(/<meta name="description" content="(.*?)"/i);
        return (titleMatch ? titleMatch[1] : '') + ' ' + (metaDesc ? metaDesc[1] : '');
    }

    function detectIntent(text) {
        if (text.toLowerCase().includes('buy') || text.includes('price')) return 'Commercial';
        if (text.includes('how to') || text.includes('what is')) return 'Informational';
        if (text.includes('best') || text.includes('review')) return 'Transactional';
        return 'Navigational';
    }
});