// script-v1.0.js – Traffic Torch Schema Generator & Detector
// Simplified manual schema builder + basic URL scan
// March 2026 – Vanilla JS, Tailwind dark mode (gray-800 light / gray-200 dark), mobile-first
// Uses dynamic import per schema file → modules/xxx-schema.js
import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';
import { prettyJsonLd } from './modules/schema-base.js';

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

    // Validate button (last part of manual block)
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
  } // closes the if (manualSelect && ...) block

  // ──────────────────────────────────────────────
  // URL SCAN & SCHEMA DETECTION (moved INSIDE initTool so 'form' is defined)
  // ──────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Rate limiting stub – uncomment when ready
    // const canProceed = await canRunTool('limit-schema-scan');
    // if (!canProceed) return;

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
      const html = await res.text();
      await new Promise(r => setTimeout(r, 800));
      updateProgress();

      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Detect all JSON-LD schemas
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
      // Recurse common nesting patterns
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
  } catch (e) {
    // silent fail on invalid JSON
  }
});

      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

      // Simplified report – only show detected schemas + shared buttons
      results.innerHTML = `
        <div class="my-10 px-4">
          <h2 class="text-3xl font-black text-center mb-6 text-gray-800 dark:text-gray-200">
            Schema Detection for ${new URL(url).hostname}
          </h2>

          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl font-bold mb-4">Detected Schema Markup</h3>
            ${existingSchemas.length === 0
              ? '<p class="text-orange-600 dark:text-orange-400 text-center py-6">No JSON-LD schema found on this page.</p>'
              : `<ul class="space-y-3">
                  ${existingSchemas.map(s => `
                    <li class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span class="text-green-500 text-xl mt-1">✅</span>
                      <div>
                        <strong>${s.types}</strong>
                        <pre class="mt-2 text-xs bg-gray-900 text-green-300 p-3 rounded overflow-auto max-h-40 break-words whitespace-pre-wrap">${prettyJsonLd(s.raw)}</pre>
                      </div>
                    </li>
                  `).join('')}
                </ul>`
            }
          </div>

          <div class="text-center mt-10 opacity-80">
            <p>Use the manual builder above to create or enhance schemas.</p>
          </div>
        </div>
      `;

      // Attach shared features
      initShareReport(results);
      initSubmitFeedback(results);

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
      console.error('Scan failed:', err);
    }
  });
}; // ← This closes initTool

document.addEventListener('DOMContentLoaded', waitForElements);