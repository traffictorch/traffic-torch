document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const detectedIntent = document.getElementById('detectedIntent');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    // Dynamic localization from browser (accurate, private)
    const locale = navigator.languages?.[0] || navigator.language || 'en-US';
    const country = locale.split('-')[1]?.toLowerCase() || 'us';
    const lang = locale.split('-')[0];

    const tips = [
        'Fetching page content securely via CORS proxy...',
        'Extracting main topic from title...',
        `Querying Google autocomplete (localized for ${country.toUpperCase()})...`,
        'Retrieving real-user recommended searches...'
    ];
    let tipIndex = 0;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url').value.trim();
        if (!url) return;

        form.classList.add('hidden');
        loader.classList.remove('hidden');
        progressText.textContent = 'Analyzing...';
        tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2000);

        try {
            // Fetch page to extract seed
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Page fetch failed');
            const text = await response.text();

            let seed = extractTopics(text).trim();
            seed = seed.split(' | ')[0].split(' - ')[0].split(':')[0].substring(0, 100).trim();
            if (!seed) {
                seed = new URL(url).hostname.replace('www.', '');
            }

            const intent = detectIntent(text);
            detectedIntent.textContent = intent;

            // Pure Google autocomplete (localized)
            const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&gl=${country}&hl=${lang}&q=${encodeURIComponent(seed)}`;
            const suggestProxy = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(suggestUrl)}`;
            const suggestRes = await fetch(suggestProxy);
            if (!suggestRes.ok) throw new Error('Suggestions fetch failed');

            const suggestData = await suggestRes.json();
            const suggestions = suggestData[1] || [];

            if (suggestions.length === 0) {
                suggestionsGrid.innerHTML = '<p class="text-center text-gray-600 dark:text-gray-400">No autocomplete suggestions found – topic may be very niche. Try a broader page.</p>';
            } else {
                suggestionsGrid.innerHTML = suggestions.map(query => `
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-md hover:shadow-lg transition" title="Pure unmodified Google autocomplete – reflects real popular searches in your region">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">${query}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Intent match: ${intent.toLowerCase()}</p>
                    </div>
                `).join('');
            }

            clearInterval(tipInterval);
            loader.classList.add('hidden');
            results.classList.remove('hidden');
        } catch (error) {
            clearInterval(tipInterval);
            loader.classList.add('hidden');
            form.classList.remove('hidden');
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Failed to retrieve suggestions. Check URL or try again later.</p>';
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
        if (lower.includes('how to') || lower.includes('guide') || lower.includes('best') || lower.includes('tutorial')) return 'Informational';
        if (lower.includes('review') || lower.includes('vs') || lower.includes('compare')) return 'Transactional';
        return 'Navigational';
    }
});