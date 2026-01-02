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
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Proxy fetch failed');
            const text = await response.text();

            let seed = extractTopics(text).trim();
            if (!seed || seed.length > 100) {
                // Shorten to key phrase if too long
                seed = seed.split(' | ')[0].split(' - ')[0].substring(0, 80);
            }
            if (!seed) {
                seed = new URL(url).hostname.replace('www.', '').replace('.com.au', '').replace('.com', '');
            }
            const intent = detectIntent(text);

            let suggestions = [];
            let associations = [];

            // Try Google Suggest first
            try {
                const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seed)}`)}`;
                const suggestRes = await fetch(suggestProxy);
                if (suggestRes.ok) {
                    const suggestData = await suggestRes.json();
                    suggestions = suggestData[1]?.slice(0, 5) || [];
                }
            } catch (err) {
                console.warn('Google Suggest failed, using Datamuse only');
            }

            // Datamuse as reliable backup/expansion
            const assocProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(`https://api.datamuse.com/words?ml=${encodeURIComponent(seed)}&max=8`)}`;
            const assocRes = await fetch(assocProxy);
            if (assocRes.ok) {
                const assocData = await assocRes.json();
                associations = assocData.map(word => word.word);
            }

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
        if (lower.includes('buy') || lower.includes('price') || lower.includes('shop') || lower.includes('sale')) return 'Commercial';
        if (lower.includes('how to') || lower.includes('what is') || lower.includes('guide')) return 'Informational';
        if (lower.includes('best') || lower.includes('review') || lower.includes('vs')) return 'Transactional';
        return 'Navigational';
    }
});