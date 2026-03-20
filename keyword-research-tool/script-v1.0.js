import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

const API_URL = 'https://keyword-research.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const detectedIntent = document.getElementById('detectedIntent');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    // Dynamic localization (kept for consistency, even if not used in AI)
    const locale = navigator.languages?.[0] || navigator.language || 'en-US';
    const country = locale.split('-')[1]?.toLowerCase() || 'us';
    const lang = locale.split('-')[0];

    const tips = [
        'Analyzing your keyword and page...',
        'Extracting top topics if URL provided...',
        'Generating high-impact Keyword suggestions...'
    ];
    let tipIndex = 0;

    // Initialize share & feedback once (assumes those modules exist and attach listeners)
    initShareReport();
    initSubmitFeedback();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const seedInput = document.getElementById('seed').value.trim();
        const urlInput = document.getElementById('url').value.trim();

        if (!seedInput && !urlInput) {
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Please enter a keyword, URL, or both.</p>';
            results.classList.remove('hidden');
            return;
        }

        // Check tool run limit (your existing guard)
        if (!canRunTool('keyword-research')) {
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Daily tool limit reached. Please try again tomorrow or upgrade.</p>';
            results.classList.remove('hidden');
            return;
        }

        form.classList.add('hidden');
        loader.classList.remove('hidden');
        progressText.textContent = 'Generating AI suggestions...';
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2200);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: seedInput || urlInput.split('/').pop() || 'topic research',
                    url: urlInput || undefined
                })
            });

            if (!response.ok) {
                throw new Error(`Worker returned ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

            // Simple intent detection (client-side, from seed + url if present)
            let pageText = seedInput;
            if (urlInput) {
                // Minimal fetch just for intent (no full text needed)
                try {
                    const res = await fetch(urlInput, { mode: 'no-cors' }); // best-effort
                    if (res.ok) pageText += ' ' + (await res.text()).slice(0, 800).toLowerCase();
                } catch {}
            }
            const intents = detectIntents(pageText);
            detectedIntent.textContent = intents.join(', ') || 'Mixed';

            // Render suggestions as copy buttons
            suggestionsGrid.innerHTML = '';
            suggestionsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6';

            if (suggestions.length === 0) {
                suggestionsGrid.innerHTML = '<p class="text-center text-gray-600 dark:text-gray-400 col-span-full">No suggestions generated – try a more specific keyword or different URL.</p>';
            } else {
                suggestions.forEach((kw) => {
                    const btn = document.createElement('button');
                    btn.className = 'px-5 py-4 text-sm font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all shadow-sm hover:shadow active:scale-98 focus:outline-none focus:ring-2 focus:ring-blue-500';
                    btn.textContent = kw;
                    btn.title = 'Click to copy to clipboard';
                    btn.addEventListener('click', () => {
                        navigator.clipboard.writeText(kw).then(() => {
                            const original = btn.textContent;
                            btn.textContent = 'Copied ✓';
                            btn.classList.add('bg-green-100', 'dark:bg-green-900/40', 'border-green-300', 'dark:border-green-700');
                            setTimeout(() => {
                                btn.textContent = original;
                                btn.classList.remove('bg-green-100', 'dark:bg-green-900/40', 'border-green-300', 'dark:border-green-700');
                            }, 1800);
                        }).catch(() => {
                            alert('Copy failed – please select and copy manually');
                        });
                    });
                    suggestionsGrid.appendChild(btn);
                });
            }
        } catch (err) {
            console.error('Keyword tool error:', err);
            suggestionsGrid.innerHTML = `<p class="text-center text-red-600 dark:text-red-400">Error: ${err.message || 'Failed to generate suggestions'}. Please try again or check your input.</p>`;
        } finally {
            clearInterval(tipInterval);
            loader.classList.add('hidden');
            results.classList.remove('hidden');
        }
    });

    // Keep your existing helper functions (unchanged)
    function detectIntents(text) {
        const lower = text.toLowerCase();
        const intents = new Set();
        if (lower.match(/book|stay|buy|price|accommodation|restaurant|menu|booking|cafe|hotel|shop|order/)) intents.add('Commercial');
        if (lower.match(/how|guide|tips|tutorial|what is|why|activities|learn/)) intents.add('Informational');
        if (lower.match(/best|review|vs|compare|top|rating|versus/)) intents.add('Transactional');
        if (lower.match(/where|location|map|directions|near|address/)) intents.add('Navigational');
        return Array.from(intents).slice(0, 4) || ['Mixed'];
    }
});