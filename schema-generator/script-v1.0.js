// script-v1.0.js – Traffic Torch Schema Generator & Detector

import { canRunTool } from '/main-v1.1.js';
// Replace old share/feedback imports with the new dashboard
import { initShareModule } from '/share-module.js';
import { prettyJsonLd } from './modules/schema-base.js';

const API_PROXY = 'https://full-render-v2.traffictorch.workers.dev/?url=';

const waitForElements = () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');
  const progressContainer = document.getElementById('analysis-progress');

  if (form && results && progressContainer) {
    initTool(form, results, progressContainer);
  } else {
    requestAnimationFrame(waitForElements);
  }
};

const initTool = (form, results, progressContainer) => {
  const progressText = document.getElementById('progress-text');

  // Handle shared report URL param ?url=...
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  if (sharedUrl) {
    const input = document.getElementById('url-input');
    if (input) {
      input.value = decodeURIComponent(sharedUrl);
      setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 300);
    }
  }

  // ──────────────────────────────────────────────
  // MANUAL SCHEMA BUILDER – dynamic per-type import
  // ──────────────────────────────────────────────
  const manualSelect = document.getElementById('manual-schema-type');
  const manualEditor = document.getElementById('manual-editor-container');
  const manualPreviewContainer = document.getElementById('manual-preview-container');
  const manualActions = document.getElementById('manual-actions');
  let manualPreview = document.getElementById('manual-preview');

  if (manualSelect && manualEditor && manualPreview && manualPreviewContainer && manualActions) {
    manualSelect.addEventListener('change', async (e) => {
      const type = e.target.value.trim();
      if (!type) {
        manualEditor.innerHTML = '';
        manualPreviewContainer.classList.add('hidden');
        manualActions.classList.add('hidden');
        manualPreview.textContent = '// Select a schema type above to start building';
        return;
      }

      manualEditor.innerHTML = '<div class="text-center py-12 text-gray-500 dark:text-gray-400 animate-pulse">Loading editor...</div>';

      try {
        manualPreview.textContent = '// Loading new schema type...';
        const oldPreview = manualPreview;
        const newPreview = oldPreview.cloneNode(true);
        oldPreview.parentNode.replaceChild(newPreview, oldPreview);
        manualPreview = document.getElementById('manual-preview');

        const modulePath = `./modules/${type.toLowerCase()}-schema.js`;
        const { default: schema } = await import(modulePath);

        manualEditor.innerHTML = '';
        schema.render(manualEditor, manualPreview);

        manualPreviewContainer.classList.remove('hidden');
        manualActions.classList.remove('hidden');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const anyInput = manualEditor.querySelector('input, textarea, select');
            if (anyInput) {
              anyInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              manualPreview.textContent = prettyJsonLd({
                "@context": "https://schema.org",
                "@type": type
              });
            }
          });
        });
      } catch (err) {
        manualEditor.innerHTML = `
          <p class="text-red-600 dark:text-red-400 text-center py-10 text-lg font-medium">
            Cannot load ${type} editor.<br>
            File <code>modules/${type.toLowerCase()}-schema.js</code> is missing or has an error.
          </p>
        `;
        manualPreview.textContent = '// Failed to load editor';
        manualPreviewContainer.classList.add('hidden');
        manualActions.classList.add('hidden');
      }
    });

    document.getElementById('wrap-script-tags')?.addEventListener('change', (e) => {
      const pre = manualPreview;
      let text = pre.textContent.trim();
      if (e.target.checked) {
        pre.textContent = `<script type="application/ld+json">\n${text}\n</script>`;
      } else {
        text = text.replace(/^<script[^>]*>\n?|\n?<\/script>$/g, '').trim();
        pre.textContent = text;
      }
    });

    document.getElementById('manual-copy-btn')?.addEventListener('click', () => {
      const text = manualPreview.textContent?.trim();
      if (!text) return;
      navigator.clipboard.writeText(text)
        .then(() => alert('JSON-LD copied to clipboard!'))
        .catch(() => alert('Copy failed – please select text manually'));
    });

    document.getElementById('manual-validate-btn')?.addEventListener('click', () => {
      const urlInput = document.getElementById('url-input');
      const url = urlInput?.value.trim();
      if (url && /^https?:\/\//.test(url)) {
        window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`, '_blank');
      } else if (confirm(
        'No valid URL entered.\n\n' +
        'To validate:\n' +
        '1. Copy the JSON-LD from the preview\n' +
        '2. Click OK to open Google Rich Results Test\n' +
        '3. Switch to the "CODE" tab\n' +
        '4. Paste and click "TEST"'
      )) {
        window.open('https://search.google.com/test/rich-results', '_blank');
      }
    });
  }

  // ──────────────────────────────────────────────
  // URL SCAN & SCHEMA DETECTION
  // ──────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const canProceed = await canRunTool('limit-schema-scan');
    if (!canProceed) return;

    let inputUrl = document.getElementById('url-input').value.trim();
    if (!inputUrl) {
      alert('Please enter a URL to scan.');
      return;
    }
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = 'https://' + inputUrl;
      document.getElementById('url-input').value = inputUrl;
    }
    try {
      new URL(inputUrl);
    } catch (_) {
      alert('Please enter a valid URL (e.g., https://example.com/blog-post)');
      return;
    }
    const url = inputUrl;

    progressContainer.classList.remove('hidden');
    results.classList.add('hidden');

    const progressMessages = [
      'Fetching page content...',
      'Detecting existing schema markup...',
      'Preparing report...'
    ];
    let step = 0;
    progressText.textContent = progressMessages[step++];

    const updateProgress = () => {
      if (step < progressMessages.length) {
        progressText.textContent = progressMessages[step++];
      }
    };

    const interval = setInterval(updateProgress, 1800);

    try {
const res = await fetch(API_PROXY + encodeURIComponent(url));
if (!res.ok) throw new Error('Could not fetch page – check URL or HTTPS');

let html = await res.text();
// Always try to parse as JSON – the proxy returns a JSON envelope
try {
  const data = JSON.parse(html);
  if (data.success && data.result) {
    html = data.result;
  } else {
    const errMsg = data.errors?.[0]?.message || 'Unknown proxy error';
    throw new Error('Proxy error: ' + errMsg);
  }
} catch (parseErr) {
  // If parsing fails, treat it as raw HTML (e.g., direct fetch)
  console.warn('Response not JSON – treating as raw HTML.');
}
await new Promise(r => setTimeout(r, 800));
updateProgress();

const doc = new DOMParser().parseFromString(html, 'text/html');

      const existingSchemas = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const json = JSON.parse(script.textContent);
          const types = new Set();

          function collectTypes(obj) {
            if (!obj || typeof obj !== 'object') return;
            if (obj['@type']) {
              if (Array.isArray(obj['@type'])) {
                obj['@type'].forEach(t => types.add(t));
              } else {
                types.add(obj['@type']);
              }
            }
            Object.values(obj).forEach(val => {
              if (Array.isArray(val)) val.forEach(collectTypes);
              else collectTypes(val);
            });
          }

          if (Array.isArray(json)) {
            json.forEach(collectTypes);
          } else {
            collectTypes(json);
          }

          const displayTypes = types.size > 0 ? [...types].join(', ') : 'Unknown';

          existingSchemas.push({
            raw: json,
            types: displayTypes
          });
        } catch (e) {}
      });

      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

      const pageTitle = doc?.title || new URL(url).hostname;

      results.innerHTML = `
        <div class="my-10 px-2">
          <h2 class="text-3xl font-black text-center mb-6 text-gray-800 dark:text-gray-200">
            Schema Detection for ${new URL(url).hostname}
          </h2>

          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl font-bold mb-4">Detected Schema Markup</h3>
            ${existingSchemas.length === 0
              ? '<p class="text-orange-600 dark:text-orange-400 text-center py-6">No JSON-LD schema found on this page.</p>'
              : `<ul class="space-y-3">
                  ${existingSchemas.map(s => `
                    <li class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span class="text-green-500 text-xl px-4 mt-1">✅</span>
                      <div>
                        <strong>${s.types}</strong>
                        <pre class="mt-2 text-xs bg-gray-900 text-green-300 p-3 rounded overflow-auto max-h-40 break-words whitespace-pre-wrap">${prettyJsonLd(s.raw)}</pre>
                      </div>
                    </li>
                  `).join('')}
                </ul>`
            }
          </div>

          <!-- Share Dashboard Container -->
          <div id="share-dashboard-container" class="mt-8"></div>

          <!-- Manual builder (unchanged) -->
          <div class="text-center mt-10 opacity-80 space-y-6">
            <p>Use the manual builder below to create or enhance schemas.</p>
          </div>
        </div>
      `;

      document.body.setAttribute('data-url', url);

      const moduleScores = [
        { name: 'Schema Detection', score: existingSchemas.length > 0 ? 100 : 0 }
      ];

      const passedMetrics = [];
      const failedMetrics = [];
      if (existingSchemas.length > 0) {
        passedMetrics.push('Schema markup detected');
        existingSchemas.forEach(s => {
          passedMetrics.push(s.types);
        });
      } else {
        failedMetrics.push('No schema markup found');
      }

      const detectedTypes = existingSchemas.map(s => s.types).filter(t => t && t !== 'Unknown');
      const aiFixes = detectedTypes.length > 0
        ? [`Detected schema types: ${detectedTypes.join(', ')}`]
        : ['No schema detected. Consider adding relevant schema markup (e.g., Article, Product, FAQPage, LocalBusiness).'];

      const shareData = {
        toolName: 'Schema Generator & Detector',
        url: url,
        pageTitle: pageTitle,
        overallScore: existingSchemas.length > 0 ? 100 : 0,
        moduleScores: moduleScores,
        passedMetrics: passedMetrics,
        failedMetrics: failedMetrics,
        aiFixes: aiFixes,
        rawData: { existingSchemas, url, pageTitle },
        shareLink: `${window.location.origin}/schema-generator/?url=${encodeURIComponent(url)}`
      };

      const shareContainer = document.getElementById('share-dashboard-container');
      if (shareContainer) {
        initShareModule(shareContainer, shareData);
      }

      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `
        <div class="text-red-600 dark:text-red-400 text-center text-xl p-10">
          Error: ${err.message}<br>
          Failed to analyze - Whitelist: full-render-v2.traffictorch.workers.dev and try again.
        </div>
      `;
    }
  });

  // ─── Ask AI Listener (static, works before or after audit) ──────
  const askBtn = document.getElementById('ask-ai-btn');
  const askInput = document.getElementById('ai-question-input');
  const answerContainer = document.getElementById('ai-answer-container');
  const answerContent = document.getElementById('ai-answer-content');

  if (askBtn) {
    askBtn.addEventListener('click', async () => {
      const canProceed = await canRunTool('limit-schema-scan');
      if (!canProceed) return;

      const question = askInput?.value?.trim();
      if (!question) {
        alert('Please enter a question.');
        return;
      }

      askBtn.disabled = true;
      askBtn.textContent = 'Thinking...';
      answerContainer.classList.remove('hidden');
      answerContent.innerHTML = '⏳ Consulting Traffic Torch AI...';

      try {
        // Gather current audit data from the DOM
        const resultsDiv = document.getElementById('results');
        const hasResults = resultsDiv && !resultsDiv.classList.contains('hidden');

        let schemasDetected = 0;
        let schemaTypes = [];

        if (hasResults) {
          const schemaItems = resultsDiv.querySelectorAll('ul li strong');
          schemaItems.forEach(el => {
            const text = el.textContent.trim();
            if (text && text !== 'Unknown') {
              schemaTypes.push(text);
              schemasDetected++;
            }
          });
          // If no list items but the "No schema found" message is present, schemasDetected stays 0.
          if (resultsDiv.querySelector('.text-orange-600')?.textContent.includes('No JSON-LD schema')) {
            schemasDetected = 0;
            schemaTypes = [];
          }
        }

        const auditPayload = {
          question: question,
          auditData: {
            url: document.getElementById('url-input')?.value?.trim() || '',
            hasSchema: schemasDetected > 0,
            schemasDetected: schemasDetected,
            schemaTypes: schemaTypes.slice(0, 10),
          },
        };

        const response = await fetch('https://schema-ai.traffictorch.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditPayload),
        });

        if (!response.ok) throw new Error(`Server error (${response.status})`);

        const data = await response.json();

        if (data.success) {
          answerContent.innerHTML = `🧠 <strong>Traffic Torch AI</strong><br><br>${data.answer}`;
        } else {
          answerContent.innerHTML = `❌ Error: ${data.error || 'Unknown error'}`;
        }
      } catch (err) {
        answerContent.innerHTML = `❌ Failed to get AI response. Please try again later. (${err.message})`;
      } finally {
        askBtn.disabled = false;
        askBtn.textContent = 'Ask Traffic Torch AI';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', waitForElements);