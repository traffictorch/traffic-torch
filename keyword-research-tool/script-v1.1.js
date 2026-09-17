// KEYWORD RESEARCH TOOL Script js

import { canRunTool } from '/main-v1.1.js';
// Replace old share/feedback imports with the new dashboard
import { initShareModule } from '/share-module.js';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const API_URL = 'https://keyword-ai.traffictorch.workers.dev';

// NOTE: uses \x60 hex escapes for backticks so the source contains
// no literal triple-backtick sequences (avoids copy/paste corruption).
function renderCodeBlocks(text) {
  if (text === null || text === undefined) return '';
  let escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(
    /\x60\x60\x60([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)\x60\x60\x60/g,
    (_m, lang, code) => {
      const language = (lang || 'plaintext').toLowerCase();
      return '<pre class="code-block"><code class="language-' + language + '">' +
        code.replace(/\s+$/, '') + '</code></pre>';
    }
  );

  escaped = escaped.replace(
    /(<pre[\s\S]*?<\/pre>)|(\r?\n)/g,
    (_m, pre, nl) => (pre ? pre : '<br>')
  );

  return escaped;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('keywordForm');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');
    const progressTip = document.getElementById('progress-tip');
    const results = document.getElementById('results');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    // ── Center the loader text (defensive; safe if already centered) ──
    if (progressText) progressText.style.textAlign = 'center';
    if (progressTip) progressTip.style.textAlign = 'center';

    // ── Hide loader AND clear its inner text so nothing lingers ──
    function hideLoader() {
        if (loader) loader.classList.add('hidden');
        if (progressText) progressText.textContent = '';
        if (progressTip) progressTip.textContent = '';
    }

    const tips = [
        'Analyzing your keyword and optional page...',
        'Extracting key topics if URL provided...',
        'Generating high-impact keyword suggestions...'
    ];

    let tipIndex = 0;

    // Auto-fill HTML from ?input= query parameter (for VS Code extension + direct links)
    function autoFillAndRunFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const inputData = params.get('input');
        if (!inputData) return;

        const textarea = document.getElementById('code-input');
        if (!textarea) return;

        textarea.value = decodeURIComponent(inputData);

        const analyzeBtn = document.getElementById('analyze-code-btn') || document.getElementById('code-analyze-btn');
        if (analyzeBtn) {
            setTimeout(() => {
                analyzeBtn.click();
            }, 300);
        }
    }

    // Run after DOM is ready
    setTimeout(autoFillAndRunFromUrl, 150);

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

    // === DUAL ANALYZE BUTTONS (URL + CODE) ===
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
            // Explicitly clear the opposite input to prevent state leakage
            if (codeInput) codeInput.value = '';

            // Show spinner and scroll
            if (loader) loader.classList.remove('hidden');
            if (progressText) progressText.textContent = 'Analyzing...';
            if (progressTip) progressTip.textContent = tips[0];
            setTimeout(() => {
                if (loader) loader.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);

            // Cycle only until the LAST tip, then stay there
            let localTipIndex = 0;
            const tipInterval = setInterval(() => {
                if (localTipIndex < tips.length - 1) {
                    localTipIndex++;
                    if (progressTip) progressTip.textContent = tips[localTipIndex];
                } else {
                    clearInterval(tipInterval);
                }
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
            // Explicitly clear the opposite input to prevent state leakage
            if (urlInputEl) urlInputEl.value = '';

            // Show spinner and scroll
            if (loader) loader.classList.remove('hidden');
            if (progressText) progressText.textContent = 'Analyzing...';
            if (progressTip) progressTip.textContent = tips[0];
            setTimeout(() => {
                if (loader) loader.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);

            const tipInterval = setInterval(() => {
                tipIndex = (tipIndex + 1) % tips.length;
                if (progressTip) progressTip.textContent = tips[tipIndex];
            }, 2200);

            runAnalysis({ seed: seedValue, url: null, inputType: 'code', rawCode, tipInterval });
            hasCheckedLimit = false;
        });
    }

    // === runAnalysis function ===
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

            // Normal success path
            hideLoader();
            if (results) results.classList.remove('hidden');

            setTimeout(() => {
                if (results) {
                    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => window.scrollBy({ top: -100, behavior: 'smooth' }), 300);
                }
            }, 150);

            // === RESULTS RENDERING ===
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

            if (suggestionsGrid) {
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
            }

            document.body.setAttribute('data-print-date', new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }));
            document.body.setAttribute('data-keyword', seed || '—');
            document.body.setAttribute('data-url', url || '—');

            // ─── Share Dashboard Integration ──────────────────────────────
            const suggestionsCount = suggestions.length;
            const overallScore = suggestionsCount > 0 ? Math.min(100, suggestionsCount * 10) : 0;
            const moduleScores = [
                { name: 'Keyword Suggestions', score: overallScore }
            ];

            const passedMetrics = suggestions.length > 0 ? suggestions.slice(0, 5) : [];
            const failedMetrics = suggestions.length === 0 ? ['No suggestions generated'] : [];

            const shareLink = `${window.location.origin}/keyword-research-tool/?keyword=${encodeURIComponent(seed || '')}&url=${encodeURIComponent(url || '')}`;

            const shareData = {
                toolName: 'Keyword Research Tool',
                url: url || 'Code Analysis',
                pageTitle: seed ? `Keyword Research: ${seed}` : 'Keyword Research',
                overallScore: overallScore,
                moduleScores: moduleScores,
                passedMetrics: passedMetrics,
                failedMetrics: failedMetrics,
                aiFixes: [],
                rawData: { suggestions, seed, url },
                shareLink: shareLink
            };

            let shareContainer = document.getElementById('share-dashboard-container');
            if (!shareContainer && results) {
                shareContainer = document.createElement('div');
                shareContainer.id = 'share-dashboard-container';
                shareContainer.className = 'mt-16';
                results.appendChild(shareContainer);
            }

            if (shareContainer && typeof initShareModule === 'function') {
                initShareModule(shareContainer, shareData);
            }

        } catch (err) {
            console.error('Keyword research analysis failed:', err);
            hideLoader();
            if (results) results.classList.remove('hidden');
            if (suggestionsGrid) {
                suggestionsGrid.innerHTML = `<p class="text-center text-red-600 dark:text-red-400">Error: ${err.message || 'Failed to generate suggestions'}. Try whitelist: keyword-ai.traffictorch.workers.dev or use Code Analysis.</p>`;
            }
        } finally {
            clearInterval(tipInterval);
        }
    }

    // ─── Ask AI: build page context from the tool's inputs ────────────
    // This tool's Ask AI sits above results, so instead of cloning the
    // rendered DOM we parse whatever the user pasted into the HTML code
    // input (or fall back to seed/URL only).
    function getPageContextFromInputs() {
        const rawCode = codeInput?.value?.trim() || '';
        const urlValue = urlInputEl?.value?.trim() || '';
        const seed = seedInput?.value?.trim() || '';

        let pageTitle = '';
        let metaDescription = '';
        let h1 = '';
        let pageExcerpt = '';
        let linkCount = 0;
        let imageCount = 0;
        let headingCount = 0;
        let ctaCount = 0;
        let wordCount = 0;

        if (rawCode) {
            try {
                const doc = new DOMParser().parseFromString(rawCode, 'text/html');

                const excerptDoc = doc.cloneNode(true);
                excerptDoc.querySelectorAll('nav, header, footer, aside, script, style, .sidebar, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());
                const contentRoot = excerptDoc.querySelector('main, article, [role="main"]') || excerptDoc.body;
                const paragraphs = Array.from(contentRoot?.querySelectorAll('p') || [])
                    .map(p => p.textContent.replace(/\s+/g, ' ').trim())
                    .filter(t => t.length > 60);
                pageExcerpt = (paragraphs[0] || contentRoot?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300);

                pageTitle = doc.querySelector('title')?.textContent?.trim() || '';
                metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
                h1 = doc.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '';
                linkCount = doc.querySelectorAll('a[href]').length;
                imageCount = doc.querySelectorAll('img').length;
                headingCount = doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
                ctaCount = doc.querySelectorAll('button, a[href*="contact"], a[href*="signup"], a[href*="sign-up"], a[href*="get-started"], [class*="cta"], [class*="btn"]').length;
                wordCount = (contentRoot?.textContent || '').trim().split(/\s+/).filter(Boolean).length;
            } catch (e) {
                console.warn('Failed to parse code input for page context', e);
            }
        }

        return {
            pageTitle,
            metaDescription,
            h1,
            pageExcerpt,
            linkCount,
            imageCount,
            headingCount,
            ctaCount,
            wordCount,
            // This tool does not run CMS detection; stay on file-level advice.
            cms: { name: 'Custom / Unknown', version: null, confidence: 0 },
            seedKeyword: seed,
            url: urlValue || 'Not provided',
        };
    }

    // ─── Ask AI Listener ──────────────────────────────────────────────
    const askBtn = document.getElementById('ask-ai-btn');
    const askInput = document.getElementById('ai-question-input');
    const answerContainer = document.getElementById('ai-answer-container');
    const answerContent = document.getElementById('ai-answer-content');

    if (askBtn) {
        askBtn.addEventListener('click', async () => {
            const canProceed = await canRunTool('limit-audit-id');
            if (!canProceed) return;

            const question = askInput?.value?.trim();
            if (!question) {
                alert('Please enter a question.');
                return;
            }

            askBtn.disabled = true;
            askBtn.textContent = 'Thinking...';
            if (answerContainer) answerContainer.classList.remove('hidden');
            if (answerContent) answerContent.innerHTML = '⏳ Traffic Torching...';

            try {
                const seed = document.getElementById('seed')?.value?.trim() || '';
                const url = document.getElementById('url')?.value?.trim() || '';
                const suggestions = Array.from(document.querySelectorAll('#suggestionsGrid button'))
                    .map(btn => btn.textContent.trim())
                    .filter(text => text && !text.includes('Copied'));

                const pageContext = getPageContextFromInputs();

                const auditPayload = {
                    question: question,
                    auditData: {
                        ...pageContext,
                        seedKeyword: pageContext.seedKeyword || seed,
                        url: pageContext.url !== 'Not provided' ? pageContext.url : (url || 'Not provided'),
                        suggestionsCount: suggestions.length,
                        suggestions: suggestions.slice(0, 20),
                    },
                };

                const response = await fetch('https://keyword-research-ai.traffictorch.workers.dev/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(auditPayload),
                });

                if (!response.ok) throw new Error(`Server error (${response.status})`);

                const data = await response.json();

                if (answerContent) {
                    if (data.success) {
                        answerContent.innerHTML = '🧠 <strong>Traffic Torch AI</strong><br><br>' + renderCodeBlocks(data.answer);
                    } else {
                        answerContent.innerHTML = '❌ Error: ' + renderCodeBlocks(data.error || 'Unknown error');
                    }
                }
            } catch (err) {
                console.error('Ask AI failed:', err);
                if (answerContent) {
                    answerContent.innerHTML = '❌ Failed to get AI response. Please try again later. (' + renderCodeBlocks(err.message) + ')';
                }
            } finally {
                askBtn.disabled = false;
                askBtn.textContent = 'Ask Traffic Torch AI';
            }
        });
    }
});