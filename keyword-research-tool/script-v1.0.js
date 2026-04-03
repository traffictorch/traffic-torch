import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js'; 

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const API_URL = 'https://keyword-research.traffictorch.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    const tips = [
        'Analyzing your keyword and optional page...',
        'Extracting key topics if URL provided...',
        'Generating high-impact AI keyword suggestions...'
    ];
    let tipIndex = 0;

    initShareReport();
    initSubmitFeedback();
    
    // Auto-fill from URL params (for shared reports)
const params = new URLSearchParams(window.location.search);
const sharedKeyword = params.get('keyword');
const sharedUrl = params.get('url');

if (sharedKeyword) {
  document.getElementById('seed').value = decodeURIComponent(sharedKeyword);
}
if (sharedUrl) {
  document.getElementById('url').value = decodeURIComponent(sharedUrl);
}

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const canProceed = await canRunTool('limit-audit-id');
        if (!canProceed) return;

        const seedInput = document.getElementById('seed').value.trim();
        const urlInput = document.getElementById('url').value.trim();

        if (!seedInput && !urlInput) {
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Please enter a keyword, URL, or both.</p>';
            results.classList.remove('hidden');
            return;
        }

        if (!canRunTool('keyword-research')) {
            results.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Daily tool limit reached. Please try again tomorrow or upgrade to Pro.</p>';
            results.classList.remove('hidden');
            return;
        }

        loader.classList.remove('hidden');
        progressText.textContent = 'Generating Keywords...';
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            progressTip.textContent = tips[tipIndex];
        }, 2200);

        // Clean and normalize URL input BEFORE fetch
        let cleanUrl = urlInput ? urlInput.trim() : '';
        let finalUrl = undefined;
        let fallbackKeyword = 'topic research';

        if (cleanUrl) {
          // Auto-add https:// if no protocol
          if (!cleanUrl.match(/^https?:\/\//i)) {
            cleanUrl = 'https://' + cleanUrl;
          }
          try {
            const urlObj = new URL(cleanUrl);
            finalUrl = urlObj.href; // normalized full URL
            // Smart fallback keyword if no seedInput
            if (!seedInput) {
              const pathParts = urlObj.pathname.split('/').filter(Boolean);
              fallbackKeyword = pathParts.length > 0 
                ? pathParts[pathParts.length - 1].replace(/-/g, ' ') 
                : urlObj.hostname.replace('www.', '');
            }
          } catch (e) {
            // finalUrl stays undefined → tool runs keyword-only mode
          }
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: seedInput || fallbackKeyword,
                    url: finalUrl
                })
            });

            if (!response.ok) {
                throw new Error(`Worker error: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

            // Set share-friendly page title for report
            const titleEl = document.getElementById('analyzed-page-title');
            if (titleEl) {
              let titleText = seedInput ? `Keyword Research: ${seedInput}` : 'Keyword Research';
              if (urlInput) {
                try {
                  const urlObj = new URL(urlInput.startsWith('http') ? urlInput : 'https://' + urlInput);
                  titleText += ` for ${urlObj.hostname.replace('www.', '')}`;
                } catch {}
              }
              titleEl.textContent = titleText;
              titleEl.classList.remove('hidden');
            }

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
                      
                    // Prepare print cover page data
document.body.setAttribute('data-print-date', new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }));
document.body.setAttribute('data-keyword', seedInput || '—');
document.body.setAttribute('data-url', urlInput || '—');

        } catch (err) {
            suggestionsGrid.innerHTML = `<p class="text-center text-red-600 dark:text-red-400">Error: ${err.message || 'Failed to generate suggestions'}. Please try again or check your input.</p>`;
        } finally {
            clearInterval(tipInterval);
            loader.classList.add('hidden');
            results.classList.remove('hidden');
        }
    });
});