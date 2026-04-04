import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js'; 

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const API_URL = 'https://keyword-ai.traffictorch.workers.dev';

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

     // === NEW DUAL ANALYZE BUTTONS (URL + CODE) ===
    const urlAnalyzeBtn = document.getElementById('url-analyze-btn');
    const codeAnalyzeBtn = document.getElementById('code-analyze-btn');
    const seedInput = document.getElementById('seed');
    const urlInputEl = document.getElementById('url');
    const codeInput = document.getElementById('code-input');
    let hasCheckedLimit = false;

    if (urlAnalyzeBtn) {
      urlAnalyzeBtn.addEventListener('click', async () => {
        if (hasCheckedLimit) return;
        hasCheckedLimit = true;
        const canProceed = await canRunTool('limit-audit-id');
        if (!canProceed) {
          hasCheckedLimit = false;
          return;
        }
        const seedValue = seedInput?.value.trim() || '';
        let inputUrl = urlInputEl?.value.trim();
        if (!seedValue && !inputUrl) {
          alert('Please enter at least a keyword or URL');
          hasCheckedLimit = false;
          return;
        }
        if (inputUrl && !inputUrl.startsWith('http')) {
          inputUrl = `https://${inputUrl}`;
        }

        loader.classList.remove('hidden');
        progressText.textContent = 'Analyzing...';
        const tipInterval = setInterval(() => {
          tipIndex = (tipIndex + 1) % tips.length;
          progressTip.textContent = tips[tipIndex];
        }, 2200);

        runAnalysis({ seed: seedValue, url: inputUrl || null, inputType: 'url', rawCode: null, tipInterval });
        hasCheckedLimit = false;
      });
    }

    if (codeAnalyzeBtn) {
      codeAnalyzeBtn.addEventListener('click', async () => {
        if (hasCheckedLimit) return;
        hasCheckedLimit = true;
        const canProceed = await canRunTool('limit-audit-id');
        if (!canProceed) {
          hasCheckedLimit = false;
          return;
        }
        const seedValue = seedInput?.value.trim() || '';
        const rawCode = codeInput?.value.trim();
        if (!rawCode) {
          alert('Please paste HTML code');
          hasCheckedLimit = false;
          return;
        }

        loader.classList.remove('hidden');
        progressText.textContent = 'Analyzing...';
        const tipInterval = setInterval(() => {
          tipIndex = (tipIndex + 1) % tips.length;
          progressTip.textContent = tips[tipIndex];
        }, 2200);

        runAnalysis({ seed: seedValue, url: null, inputType: 'code', rawCode, tipInterval });
        hasCheckedLimit = false;
      });
    }

    // === runAnalysis function (handles blocked + normal results) ===
    async function runAnalysis(params) {
      const { seed, url, inputType, rawCode, tipInterval } = params;

      try {
        let bodyData = {
          keyword: seed || 'topic research',
          url: url
        };
        if (inputType === 'code' && rawCode) {
          bodyData = {
            keyword: seed || 'topic research',
            code: rawCode
          };
        }

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
          throw new Error(`Worker error: ${response.status}`);
        }

        const data = await response.json();

        // BLOCKED DETECTION - simple user-friendly message
        if (data && data.blocked === true) {
          loader.classList.add('hidden');
          results.classList.remove('hidden');
          results.innerHTML = `
            <div class="max-w-2xl mx-auto px-6 py-12 text-center">
              <div class="text-5xl mb-6">🔒</div>
              <h2 class="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Analysis Blocked by Security</h2>
              <p class="text-lg text-gray-700 dark:text-gray-300 mb-8">
                Whitelist: keyword-ai.traffictorch.workers.dev or use Code Analysis.
              </p>
              <div class="bg-orange-50 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 rounded-3xl p-8 text-left max-w-md mx-auto">
                <p class="font-medium mb-4">Quick fix:</p>
                <ol class="text-base space-y-3 text-gray-700 dark:text-gray-300 list-decimal list-inside">
                  <li>Right-click on the page → <strong>View Page Source</strong></li>
                  <li>Select all and copy code</li>
                  <li>Paste into the <strong>Code Analysis</strong> box above</li>
                </ol>
              </div>
            </div>
          `;
          setTimeout(() => {
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => window.scrollBy({ top: -100, behavior: 'smooth' }), 300);
          }, 150);
          clearInterval(tipInterval);
          return; // stop normal results
        }

        // Normal success path - keep your original rendering logic below
        loader.classList.add('hidden');
        results.classList.remove('hidden');

        // Auto-scroll to results (single spinner already hidden)
        setTimeout(() => {
          results.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => window.scrollBy({ top: -100, behavior: 'smooth' }), 300);
        }, 150);

        // === ORIGINAL RESULTS CODE STARTS HERE (unchanged) ===
        const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        
        const titleEl = document.getElementById('analyzed-page-title');
        if (titleEl) {
          let titleText = seed ? `Keyword Research: ${seed}` : 'Keyword Research';
          if (url) {
            try {
              const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
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
                     
        document.body.setAttribute('data-print-date', new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }));
        document.body.setAttribute('data-keyword', seed || '—');
        document.body.setAttribute('data-url', url || '—');

      } catch (err) {
        loader.classList.add('hidden');
        results.classList.remove('hidden');
        suggestionsGrid.innerHTML = `<p class="text-center text-red-600 dark:text-red-400">Error: ${err.message || 'Failed to generate suggestions'}. Please try again or check your input.</p>`;
      } finally {
        clearInterval(tipInterval);
      }
    }
  });
});