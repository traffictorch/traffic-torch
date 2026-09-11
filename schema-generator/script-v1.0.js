// script-v1.0.js – Traffic Torch Schema Generator & Detector

import { canRunTool } from '/main-v1.1.js';
import { initShareModule } from '/share-module.js';
import { prettyJsonLd } from './modules/schema-base.js';
import { detectCMS } from '/cms-detect.js';

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
  // MANUAL SCHEMA BUILDER
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

    const codeInput = document.getElementById('schema-code-input');
    const codeValue = codeInput?.value?.trim() || '';
    const useCodeMode = codeValue.length > 0 && codeInput.offsetParent !== null;

    let requestBody;
    let url = '';
    let isCodeMode = false;

    if (useCodeMode) {
      requestBody = { mode: 'code', code: codeValue };
      isCodeMode = true;
    } else {
      let inputUrl = document.getElementById('url-input').value.trim();
      if (!inputUrl) {
        alert('Please enter a URL or paste JSON-LD code.');
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
      url = inputUrl;
      requestBody = { mode: 'url', url: inputUrl };
    }

    progressContainer.classList.remove('hidden');
    results.classList.add('hidden');

    const progressMessages = [
      'Fetching page content...',
      'Validating schema markup...',
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
      const res = await fetch('https://schema-validator.traffictorch.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(`Validator error (${res.status})`);

      const data = await res.json();
      await new Promise(r => setTimeout(r, 800));
      updateProgress();
      clearInterval(interval);

      const headerLabel = isCodeMode ? 'Pasted JSON-LD' : new URL(url).hostname;

      // Fetch live page data (CMS + signals) once — used for both CASE 1 and CASE 2
      const { cmsInfo, pageSignals } = await fetchLivePageData(url, isCodeMode);

      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

      // ── CASE 1: No schema found ──
      if (!data.hasSchema) {
        const suggested = data.suggestedType;
        results.innerHTML = `
          <div class="my-10 px-2">
            <h2 class="text-3xl font-black text-center mb-6 text-gray-800 dark:text-gray-200">
              Schema Detection for ${headerLabel}
            </h2>
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 text-center">
              <div class="text-6xl mb-4">🔍</div>
              <h3 class="text-2xl font-bold mb-4 text-orange-600 dark:text-orange-400">
                No Schema Markup Found
              </h3>
              <p class="text-lg mb-6 text-gray-700 dark:text-gray-300">
                This ${isCodeMode ? 'code block' : 'page'} has no JSON-LD structured data.
              </p>
              ${suggested ? `
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl mb-6">
                  <p class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Based on the page content, we suggest:
                  </p>
                  <button
                    onclick="document.getElementById('manual-schema-type').value='${suggested}'; document.getElementById('manual-schema-type').dispatchEvent(new Event('change')); document.querySelector('#manual-schema-type').scrollIntoView({behavior:'smooth'});"
                    class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition text-xl">
                    Build ${suggested} Schema →
                  </button>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Confidence score: ${data.suggestedConfidence}/10
                  </p>
                </div>
              ` : `
                <p class="text-lg mb-6 text-gray-700 dark:text-gray-300">
                  Use the manual builder below to create schema markup from scratch.
                </p>
              `}
            </div>

            <div id="schema-suggest-section" class="mt-8 max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-center mb-2">🧩 Suggest Schema to Add</h2>
              <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
                Ask Traffic Torch AI to build starter schema based on your page content.
              </p>
              <div class="flex flex-wrap justify-center gap-3 mb-6">
                <button id="schema-suggest-json-btn"
                  class="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg">
                  Suggest Schema (JSON)
                </button>
                <button id="schema-suggest-text-btn"
                  class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-lg">
                  Suggest Schema (Plain Text)
                </button>
              </div>
              <div id="schema-suggest-json-container" class="hidden"></div>
              <div id="schema-suggest-text-container" class="hidden"></div>
            </div>
          </div>
        `;

        window.__schemaValidatorData = { ...data, pageUrl: url, isCodeMode, cmsInfo, pageSignals };

        const sjb = document.getElementById('schema-suggest-json-btn');
        const stb = document.getElementById('schema-suggest-text-btn');
        if (sjb) sjb.addEventListener('click', () => requestSchemaSuggest('json'));
        if (stb) stb.addEventListener('click', () => requestSchemaSuggest('text'));

        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // ── CASE 2: Schema found ──
      const hasErrors = data.totalErrors > 0;
      const detectedTypes = data.detectedTypes || [];

      const cmsLabel = cmsInfo.name + (cmsInfo.version ? ' ' + cmsInfo.version : '');
      const cmsDotClass = cmsInfo.confidence === 'high'   ? 'bg-green-500'
                        : cmsInfo.confidence === 'medium' ? 'bg-yellow-500'
                        : cmsInfo.confidence === 'low'    ? 'bg-orange-500'
                        : 'bg-gray-400';

      results.innerHTML = `
        <div class="my-10 px-2">
          <h2 class="text-3xl font-black text-center mb-6 text-gray-800 dark:text-gray-200">
            Schema Validation for ${headerLabel}
          </h2>

          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-4xl font-black ${data.totalErrors === 0 ? 'text-green-500' : 'text-red-500'}">${data.totalErrors}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Errors</p>
              </div>
              <div>
                <p class="text-4xl font-black text-yellow-500">${data.totalWarnings}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
              </div>
              <div>
                <p class="text-4xl font-black text-blue-500">${data.jsonLdCount}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">JSON-LD Blocks</p>
              </div>
            </div>
            ${detectedTypes.length > 0 ? `
              <div class="mt-6 flex flex-wrap gap-2 justify-center">
                ${detectedTypes.map(t => `
                  <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">${t}</span>
                `).join('')}
              </div>
            ` : ''}
          </div>

          ${!hasErrors ? `
            <div class="text-center mb-8">
              <p class="text-xl font-semibold text-green-600 dark:text-green-400">
                ✅ All schema passed validation
              </p>
            </div>
          ` : ''}

          ${(data.validationResults || []).map((r) => `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-2xl">${r.isValid ? '✅' : '❌'}</span>
                <strong class="text-lg">${(r.types || []).join(', ') || 'Unknown Type'}</strong>
                ${r.isValid
                  ? '<span class="ml-auto px-6 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">Valid</span>'
                  : `<span class="ml-auto px-6 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">${r.errors.length} error(s)</span>`
                }
              </div>

              ${r.errors?.length > 0 ? `
                <div class="mb-4 space-y-2">
                  ${r.errors.map(er => `
                    <div class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span class="text-red-500 mt-0.5">●</span>
                      <div>
                        <p class="font-medium text-red-700 dark:text-red-300">${er.message}</p>
                        ${er.fieldNames?.length ? `<p class="text-sm text-red-500 dark:text-red-400">Fields: ${er.fieldNames.join(', ')}</p>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${r.warnings?.length > 0 ? `
                <div class="mb-4 space-y-2">
                  ${r.warnings.map(w => `
                    <div class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span class="text-yellow-500 mt-0.5">●</span>
                      <p class="text-yellow-700 dark:text-yellow-300">${w.message}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <details class="mt-4">
                <summary class="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  View raw JSON-LD
                </summary>
                <pre class="mt-2 text-xs bg-gray-900 text-green-300 p-4 rounded-lg overflow-auto max-h-60 break-words whitespace-pre-wrap">${prettyJsonLd(JSON.parse(r.raw))}</pre>
              </details>
            </div>
          `).join('')}

          ${hasErrors ? `
            <div id="schema-cms-fixes-section" class="mt-16 max-w-4xl mx-auto">
              <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
              <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
                Get step-by-step instructions for fixing these schema errors in your CMS.
              </p>

              <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
                <span class="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-gray-700">
                  <span id="schema-cms-badge-dot" class="inline-block w-2.5 h-2.5 rounded-full ${cmsDotClass} mr-2"></span>
                  <span id="schema-cms-badge-name">${cmsLabel}</span>
                </span>
                <button id="schema-cms-override-toggle" type="button" class="text-sm text-purple-600 dark:text-purple-400 underline hover:no-underline bg-transparent border-none cursor-pointer">
                  Change
                </button>
              </div>

              <div id="schema-cms-override-panel" class="hidden max-w-md mx-auto mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CMS</label>
                <select id="schema-cms-override-select" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="Custom / Unknown">Custom / Unknown</option>
                  <option value="WordPress">WordPress</option>
                  <option value="Shopify">Shopify</option>
                  <option value="Wix">Wix</option>
                  <option value="Squarespace">Squarespace</option>
                  <option value="Webflow">Webflow</option>
                  <option value="Drupal">Drupal</option>
                  <option value="Joomla">Joomla</option>
                  <option value="Ghost">Ghost</option>
                  <option value="HubSpot CMS">HubSpot CMS</option>
                  <option value="Magento">Magento</option>
                  <option value="BigCommerce">BigCommerce</option>
                  <option value="PrestaShop">PrestaShop</option>
                </select>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version (optional)</label>
                <input id="schema-cms-override-version" type="text" placeholder="e.g. 6.4.2"
                  class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value="${cmsInfo.version || ''}" />
              </div>

              <div class="text-center">
                <button id="ai-cms-fix-btn"
                  class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition">
                  Generate CMS Fixes
                </button>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Sends the top ${Math.min(data.topErrors.length, 5)} errors to Traffic Torch AI
                </p>
              </div>

              <div id="schema-cms-answer-container" class="mt-6 hidden">
                <div id="schema-cms-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
              </div>
            </div>
          ` : ''}

          ${!hasErrors ? `
            <div id="schema-suggest-section" class="mt-16 max-w-4xl mx-auto">
              <h2 class="text-3xl font-black text-center mb-2">🧩 Suggest Additional Schema</h2>
              <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
                Ask Traffic Torch AI to recommend extra schema types for this page, pre-filled with what it can infer.
              </p>
              <div class="flex flex-wrap justify-center gap-3 mb-6">
                <button id="schema-suggest-json-btn"
                  class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition">
                  Suggest Schema (JSON)
                </button>
                <button id="schema-suggest-text-btn"
                  class="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition">
                  Suggest Schema (Plain Text)
                </button>
              </div>
              <div id="schema-suggest-json-container" class="hidden"></div>
              <div id="schema-suggest-text-container" class="hidden"></div>
            </div>
          ` : ''}

          <div id="share-dashboard-container" class="mt-8"></div>
        </div>
      `;

      // Store everything
      window.__schemaValidatorData = { ...data, pageUrl: url, isCodeMode, cmsInfo, pageSignals };

      // Wire up CMS override toggle
      const overrideToggle = document.getElementById('schema-cms-override-toggle');
      const overridePanel  = document.getElementById('schema-cms-override-panel');
      const overrideSelect = document.getElementById('schema-cms-override-select');
      if (overrideToggle && overridePanel) {
        overrideToggle.addEventListener('click', () => overridePanel.classList.toggle('hidden'));
        if (overrideSelect) {
          const known = Array.from(overrideSelect.options).map(o => o.value);
          overrideSelect.value = known.includes(cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
        }
      }

      // Wire up AI fix button
      const aiBtn = document.getElementById('ai-cms-fix-btn');
      if (aiBtn) aiBtn.addEventListener('click', requestSchemaAiFix);

      // Wire up suggest buttons
      const sjb = document.getElementById('schema-suggest-json-btn');
      const stb = document.getElementById('schema-suggest-text-btn');
      if (sjb) sjb.addEventListener('click', () => requestSchemaSuggest('json'));
      if (stb) stb.addEventListener('click', () => requestSchemaSuggest('text'));

      // Share data
      const shareContainer = document.getElementById('share-dashboard-container');
      if (shareContainer && typeof initShareModule === 'function') {
        initShareModule(shareContainer, {
          toolName: 'Schema Generator & Detector',
          url: url || 'pasted-code',
          pageTitle: headerLabel,
          overallScore: hasErrors ? 60 : 100,
          moduleScores: [{ name: 'Schema Validation', score: hasErrors ? 60 : 100 }],
          passedMetrics: data.detectedTypes || [],
          failedMetrics: (data.topErrors || []).map(e => e.message),
          aiFixes: (data.topErrors || []).map(e => e.message),
          rawData: data,
          shareLink: `${window.location.origin}/schema-generator/?url=${encodeURIComponent(url || '')}`,
        });
      }

      results.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `
        <div class="text-red-600 dark:text-red-400 text-center text-xl p-10">
          Error: ${err.message}<br>
          Please try again.
        </div>
      `;
    }
  });

  // ─── Ask AI Listener ──────
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

// ──────────────────────────────────────────────
// Fetch live page data (CMS + signals) in one call
// ──────────────────────────────────────────────
async function fetchLivePageData(url, isCodeMode) {
  const fallback = {
    cmsInfo: { name: 'Custom / Unknown', version: null, confidence: 'low', signals: [] },
    pageSignals: {},
  };
  if (isCodeMode || !url) return fallback;

  try {
    const res = await fetch('https://full-render-v2.traffictorch.workers.dev/?url=' + encodeURIComponent(url));
    if (!res.ok) return fallback;
    const raw = await res.text();
    let html = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.success && parsed.result) html = parsed.result;
    } catch (_) {}
    const doc = new DOMParser().parseFromString(html, 'text/html');

    let cmsInfo = fallback.cmsInfo;
    try {
      const detected = detectCMS({ doc, url });
      if (detected && detected.name) cmsInfo = detected;
    } catch (e) {
      console.warn('CMS detect failed:', e);
    }

    return { cmsInfo, pageSignals: extractPageSignals(doc) };
  } catch (e) {
    console.warn('Live page data fetch failed:', e);
    return fallback;
  }
}

// ──────────────────────────────────────────────
// Extract page signals for AI suggest worker
// ──────────────────────────────────────────────
function extractPageSignals(doc) {
  if (!doc) return {};
  const q = (sel) => doc.querySelector(sel)?.textContent?.trim() || null;

  const h2s = Array.from(doc.querySelectorAll('h2'))
    .slice(0, 6)
    .map(el => el.textContent.trim())
    .filter(Boolean);

  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map(el => el.textContent.trim())
    .filter(t => t.length > 80)
    .slice(0, 3);

  const images = Array.from(doc.querySelectorAll('img'))
    .slice(0, 5)
    .map(img => ({ alt: img.getAttribute('alt') || '', src: img.getAttribute('src') || '' }));

  const author =
    doc.querySelector('[rel="author"]')?.textContent?.trim() ||
    doc.querySelector('.author, .byline, [itemprop="author"]')?.textContent?.trim() ||
    null;

  const datePublished =
    doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
    doc.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
    null;

  const bodyText = doc.body?.textContent || '';
  const hasFAQ = /frequently asked questions|faq/i.test(bodyText);
  const hasPrice = /[$€£]\s?\d|price|add to cart|buy now/i.test(bodyText);
  const hasAddress = /\b(street|avenue|road|suite|address|directions)\b/i.test(bodyText);
  const hasEvent = /\b(register|tickets|event date|starts at|conference|webinar)\b/i.test(bodyText);

  return {
    h1: q('h1'),
    h2s,
    firstParagraph: paragraphs[0] ? paragraphs[0].slice(0, 400) : null,
    author,
    datePublished,
    images,
    hasFAQ,
    hasPrice,
    hasAddress,
    hasEvent,
  };
}

// ──────────────────────────────────────────────
// Request AI schema suggestions
// ──────────────────────────────────────────────
async function requestSchemaSuggest(outputMode = 'json') {
  const data = window.__schemaValidatorData;
  if (!data) return;

  const btnId = outputMode === 'json' ? 'schema-suggest-json-btn' : 'schema-suggest-text-btn';
  const btn = document.getElementById(btnId);
  const containerId = outputMode === 'json' ? 'schema-suggest-json-container' : 'schema-suggest-text-container';
  const container = document.getElementById(containerId);
  if (!btn || !container) return;

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Generating...';
  container.classList.remove('hidden');
  container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-6">⏳ Asking Traffic Torch AI...</div>`;

  try {
    const res = await fetch('https://schema-suggest.traffictorch.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: data.pageUrl || null,
        pageTitle: document.title || null,
        cms: data.cmsInfo?.name || 'Custom / Unknown',
        cmsVersion: data.cmsInfo?.version || null,
        existingTypes: data.detectedTypes || [],
        pageSignals: data.pageSignals || {},
        outputMode,
      }),
    });

    if (!res.ok) throw new Error(`Server error (${res.status})`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'AI failed');

    if (outputMode === 'json') {
      renderJsonSuggestions(container, result.suggestions || []);
    } else {
      container.innerHTML = `
        <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <pre class="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans leading-relaxed">${escapeHtml(result.text || '')}</pre>
        </div>
      `;
    }

    btn.textContent = '✅ Done';
    btn.classList.remove('from-purple-600', 'to-cyan-600');
    btn.classList.add('from-green-500', 'to-emerald-600');
  } catch (err) {
    container.innerHTML = `<div class="text-red-500 text-center py-4">❌ ${escapeHtml(err.message)}</div>`;
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderJsonSuggestions(container, suggestions) {
  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-6">No additional schema recommended for this page.</div>`;
    return;
  }

  container.innerHTML = suggestions.map((s, i) => {
    const pretty = JSON.stringify(s.jsonLd || {}, null, 2);
    const placeholders = (s.placeholders || []).map(p => `
      <li class="mb-1"><code class="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">${escapeHtml(p.key)}</code> — ${escapeHtml(p.hint || '')}</li>
    `).join('');

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">🧩</span>
          <h3 class="text-xl font-bold text-purple-700 dark:text-purple-300">${escapeHtml(s.type || 'Suggestion')}</h3>
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-4">${escapeHtml(s.reason || '')}</p>
        <pre class="text-xs bg-gray-900 text-green-300 p-4 rounded-lg overflow-auto max-h-72 whitespace-pre-wrap mb-4" id="suggest-json-${i}">${escapeHtml(pretty)}</pre>
        ${s.placeholders?.length ? `
          <div class="mb-4">
            <p class="font-semibold text-gray-800 dark:text-gray-200 mb-2">Fill in these placeholders:</p>
            <ul class="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">${placeholders}</ul>
          </div>
        ` : ''}
        <button class="copy-suggestion-btn px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
          data-target="suggest-json-${i}">Copy JSON-LD</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.copy-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.target);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent).then(() => {
        btn.textContent = '✅ Copied';
        setTimeout(() => { btn.textContent = 'Copy JSON-LD'; }, 1500);
      });
    });
  });
}

// ──────────────────────────────────────────────
// AI CMS Fix
// ──────────────────────────────────────────────
async function requestSchemaAiFix() {
  const data = window.__schemaValidatorData;
  const btn = document.getElementById('ai-cms-fix-btn');
  if (!data || !btn) return;

  if (!data.topErrors || data.topErrors.length === 0) {
    btn.textContent = '✅ No errors to fix';
    return;
  }

  const selectedCms     = document.getElementById('schema-cms-override-select')?.value?.trim() || data.cmsInfo?.name || 'Custom / Unknown';
  const selectedVersion = document.getElementById('schema-cms-override-version')?.value?.trim() || data.cmsInfo?.version || null;

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Generating...';

  const answerContainer = document.getElementById('schema-cms-answer-container');
  const answerContent   = document.getElementById('schema-cms-answer-content');
  answerContainer?.classList.remove('hidden');
  if (answerContent) answerContent.textContent = '⏳ Building CMS-specific fix instructions...';

  try {
    const res = await fetch('https://schema-cms-fixes.traffictorch.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cms: selectedCms,
        cmsVersion: selectedVersion,
        cmsConfidence: data.cmsInfo?.confidence || null,
        cmsSignals: data.cmsInfo?.signals || [],
        url: data.pageUrl || null,
        pageTitle: document.title || null,
        detectedTypes: data.detectedTypes || [],
        topErrors: data.topErrors,
        jsonLdCount: data.jsonLdCount || 0,
        mode: data.isCodeMode ? 'pasted-code' : 'live-url',
      }),
    });

    if (!res.ok) throw new Error(`Server error (${res.status})`);
    const result = await res.json();

    if (result.success && result.answer && answerContent) {
      answerContent.textContent = '';
      const header = document.createElement('div');
      header.style.fontWeight = 'bold';
      header.style.marginBottom = '0.75rem';
      header.textContent = '🛠️ CMS Fixes for ' + selectedCms + (selectedVersion ? ' ' + selectedVersion : '');
      const body = document.createElement('div');
      body.textContent = result.answer;
      answerContent.appendChild(header);
      answerContent.appendChild(body);
      btn.textContent = '✅ Fixes Generated';
      btn.classList.remove('from-purple-600', 'to-cyan-600');
      btn.classList.add('from-green-500', 'to-emerald-600');
      btn.disabled = true;
      answerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (answerContent) {
      answerContent.textContent = '❌ Error: ' + (result.error || 'Unknown error');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  } catch (err) {
    if (answerContent) answerContent.textContent = '❌ Failed to generate CMS fixes. (' + err.message + ')';
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

window.requestSchemaAiFix = requestSchemaAiFix;

// ──────────────────────────────────────────────
// Code-paste: trigger main form submit
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('validate-code-btn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const code = document.getElementById('schema-code-input')?.value?.trim();
    if (!code) {
      alert('Please paste some JSON-LD code first.');
      return;
    }
    document.getElementById('audit-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
  });
});

document.addEventListener('DOMContentLoaded', waitForElements);