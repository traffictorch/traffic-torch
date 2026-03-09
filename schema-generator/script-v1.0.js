// script-v1.0.js – Traffic Torch Schema Generator & Detector
// Simplified manual schema builder + basic URL scan
// March 2026 – Vanilla JS, Tailwind dark mode (gray-800 light / gray-200 dark), mobile-first
// Uses dynamic import per schema file → modules/xxx-schema.js

const API_PROXY = 'https://rendered-proxy-basic.traffictorch.workers.dev/?url=';

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
  const manualPreview = document.getElementById('manual-preview');
  const manualPreviewContainer = document.getElementById('manual-preview-container');
  const manualActions = document.getElementById('manual-actions');

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
        const modulePath = `./modules/${type.toLowerCase()}-schema.js`;
        const { default: schema } = await import(modulePath);

        manualEditor.innerHTML = '';
        schema.render(manualEditor, manualPreview);

        manualPreviewContainer.classList.remove('hidden');
        manualActions.classList.remove('hidden');
      } catch (err) {
        console.error(`Failed to load ${type} schema:`, err);
        manualEditor.innerHTML = `
          <p class="text-red-600 dark:text-red-400 text-center py-10 text-lg font-medium">
            Cannot load ${type} editor.<br>
            File <code>modules/${type.toLowerCase()}-schema.js</code> is missing or has an error.
          </p>
        `;
        manualPreviewContainer.classList.add('hidden');
        manualActions.classList.add('hidden');
      }
    });

    // Wrap in <script> tags checkbox
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

    // Copy JSON-LD
    document.getElementById('manual-copy-btn')?.addEventListener('click', () => {
      const text = manualPreview.textContent?.trim();
      if (!text) return;
      navigator.clipboard.writeText(text)
        .then(() => alert('JSON-LD copied to clipboard!'))
        .catch(() => alert('Copy failed – please select text manually'));
    });

    // Validate in Google Rich Results Test
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
  // URL SCAN & SCHEMA DETECTION (unchanged for now)
  // ──────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
      'Analyzing content for FAQ opportunities...',
      'Generating recommendations...',
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
      const html = await res.text();
      await new Promise(r => setTimeout(r, 800));
      updateProgress();

      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Detect existing schemas
      const existingSchemas = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const json = JSON.parse(script.textContent);
          const types = Array.isArray(json) ? json.map(o => o['@type']) : [json['@type']];
          existingSchemas.push({ raw: json, types: types.filter(Boolean) });
        } catch (e) {}
      });

      const hasFaqSchema = existingSchemas.some(s => s.types.includes('FAQPage'));
      updateProgress();

      // Simple FAQ pattern detection
      const qaCandidates = [];
      doc.querySelectorAll('h2, h3, h4').forEach(heading => {
        const text = heading.textContent.trim();
        if ((text.match(/^(what|how|why|when|where|who|is|does|can|should|will|are|could|would)\b/i) ||
             text.endsWith('?')) && text.length > 15) {
          let answerEl = heading.nextElementSibling;
          while (answerEl && !['H1','H2','H3','H4'].includes(answerEl.tagName)) {
            if (answerEl.tagName === 'P' && answerEl.textContent.trim().length > 40) {
              qaCandidates.push({
                question: text,
                answer: answerEl.textContent.trim().slice(0, 300) + (answerEl.textContent.length > 300 ? '...' : '')
              });
              break;
            }
            answerEl = answerEl.nextElementSibling;
          }
        }
      });
      const detectedQAs = qaCandidates.slice(0, 8);
      updateProgress();

      // Basic recommendations (expand later)
      const recommendations = [];
      if (detectedQAs.length > 0 && !hasFaqSchema) {
        recommendations.push({
          type: 'FAQPage',
          reason: `Found ${detectedQAs.length} potential Q&A patterns but no FAQPage schema.`,
          prefill: { questions: detectedQAs.map(qa => ({ question: qa.question, answer: qa.answer })) }
        });
      } else if (hasFaqSchema) {
        recommendations.push({
          type: 'FAQPage',
          reason: 'FAQPage schema already exists – consider enhancing it.',
          prefill: {}
        });
      }
      updateProgress();

      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

      // Render report
      results.innerHTML = `
        <div class="my-10 px-4">
          <h2 class="text-3xl font-black text-center mb-6 text-gray-800 dark:text-gray-200">
            Schema Analysis – ${new URL(url).hostname}
          </h2>

          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl font-bold mb-4">Detected Schema</h3>
            ${existingSchemas.length === 0
              ? '<p class="text-orange-600 dark:text-orange-400">No JSON-LD schema found on this page.</p>'
              : `<ul class="space-y-2">
                  ${existingSchemas.map(s => `<li class="flex items-center gap-2"><span class="text-green-500">✅</span> ${s.types.join(', ') || 'Unknown'}</li>`).join('')}
                </ul>`
            }
            ${hasFaqSchema ? '<p class="mt-4 text-green-600 dark:text-green-400 font-medium">FAQPage already implemented – great job!</p>' : ''}
          </div>

          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8">
            <h3 class="text-2xl font-bold mb-4">Recommended Enhancements</h3>
            ${recommendations.length === 0
              ? '<p class="text-gray-600 dark:text-gray-300">No clear opportunities detected yet. Try another page.</p>'
              : recommendations.map(rec => `
                  <div class="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow">
                    <h4 class="text-xl font-semibold text-blue-600 dark:text-blue-400">${rec.type}</h4>
                    <p class="text-gray-700 dark:text-gray-300 mt-2">${rec.reason}</p>
                  </div>
                `).join('')
            }
          </div>

          <div class="text-center mt-10 opacity-80">
            <p>Use the manual builder above to create or improve schemas.</p>
          </div>
        </div>
      `;

      // Optional shared features (keep if you still use them)
      initShareReport?.(results);
      initSubmitFeedback?.(results);

      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `
        <div class="text-red-600 dark:text-red-400 text-center text-xl p-10">
          Error: ${err.message}<br>
          Please check the URL and try again.
        </div>
      `;
    }
  });
};

document.addEventListener('DOMContentLoaded', waitForElements);