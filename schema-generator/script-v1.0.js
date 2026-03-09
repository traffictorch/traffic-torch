// script-v1.0.js (adapted for Schema Generator & Detector)
// Traffic Torch Schema Markup Tool - Main Script

import {
  buildJsonLdSkeleton,
  validateRequiredFields,
  cleanJsonLd,
  prettyJsonLd,
  createEducationSnippet
} from './modules/index.js';

import { FAQPage } from './modules/index.js';
import { renderSchemaEditor } from './modules/index.js';

import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

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

// Manual mode setup (always active, independent of scan)
const manualSelect = document.getElementById('manual-schema-type');
const manualEditor = document.getElementById('manual-editor-container');
const manualPreview = document.getElementById('manual-preview');
const manualPreviewContainer = document.getElementById('manual-preview-container');
const manualActions = document.getElementById('manual-actions');

if (manualSelect && manualEditor && manualPreview && manualPreviewContainer && manualActions) {
  manualSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    if (!type) {
      manualEditor.innerHTML = '';
      manualPreviewContainer.classList.add('hidden');
      manualActions.classList.add('hidden');
      return;
    }

    let schema;
    switch (type) {
      case 'FAQPage':
        schema = FAQPage;
        break;
      default:
        schema = null;
    }

    if (!schema) {
      manualEditor.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center py-6">Schema type not loaded yet – coming soon!</p>';
      manualPreviewContainer.classList.add('hidden');
      manualActions.classList.add('hidden');
      return;
    }

    manualEditor.innerHTML = '';
    renderSchemaEditor(schema, manualEditor, manualPreview);

    // Prefill title from page title (fallback)
    const titleInput = manualEditor.querySelector('input[type="text"][placeholder*="Frequently Asked Questions"]');
    if (titleInput) {
      const pageTitle = document.title.trim() || 'Frequently Asked Questions';
      titleInput.value = pageTitle;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    manualPreviewContainer.classList.remove('hidden');
    manualActions.classList.remove('hidden');
  });

  // Checkbox to toggle wrap in preview
  const wrapCheckbox = document.getElementById('wrap-script-tags');
  if (wrapCheckbox) {
    wrapCheckbox.addEventListener('change', () => {
      const currentText = manualPreview.textContent || '';
      if (wrapCheckbox.checked) {
        manualPreview.textContent = `<script type="application/ld+json">
${currentText}
</script>`;
      } else {
        manualPreview.textContent = currentText.replace(/<script type="application\/ld\+json">|<\/script>/g, '').trim();
      }
    });
  }

  // Copy button
  document.getElementById('manual-copy-btn')?.addEventListener('click', () => {
    const previewText = manualPreview.textContent || '';
    if (previewText) {
      navigator.clipboard.writeText(previewText)
        .then(() => alert('JSON-LD copied!'))
        .catch(() => alert('Copy failed – select manually.'));
    }
  });

  // Validate button with no-URL instructions
  document.getElementById('manual-validate-btn')?.addEventListener('click', () => {
    const urlInput = document.getElementById('url-input');
    const currentUrl = urlInput?.value.trim();

    if (currentUrl) {
      window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(currentUrl)}`, '_blank');
    } else {
      const googleUrl = 'https://search.google.com/test/rich-results';
      if (confirm(
        'No URL entered.\n\n' +
        'To validate:\n' +
        '1. Copy the JSON-LD from the preview.\n' +
        '2. Click OK to open Google Rich Results Test.\n' +
        '3. Click the "CODE" tab.\n' +
        '4. Paste the code and click "TEST".'
      )) {
        window.open(googleUrl, '_blank');
      }
    }
  });
} else {
  console.error('Manual mode elements missing – check HTML IDs');
}

  // ──────────────────────────────────────────────
  // Scan form submit (URL analysis)
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
      'Analyzing content for opportunities...',
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
      if (!res.ok) throw new Error('Could not fetch page – check URL or try HTTPS');
      const html = await res.text();
      await new Promise(r => setTimeout(r, 800));
      updateProgress();

      const doc = new DOMParser().parseFromString(html, 'text/html');

      // 1. Detect existing schema
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

      // 2. Content analysis for FAQ opportunities (simple heuristic)
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

      // 3. Recommendations & pre-fill (v1: FAQ only)
      const recommendations = [];
      if (detectedQAs.length > 0 && !hasFaqSchema) {
        recommendations.push({
          type: 'FAQPage',
          reason: `Detected ${detectedQAs.length} question-answer patterns but no FAQPage schema found.`,
          prefill: { questions: detectedQAs.map(qa => ({ question: qa.question, answer: qa.answer })) }
        });
      } else if (hasFaqSchema) {
        recommendations.push({
          type: 'FAQPage',
          reason: 'FAQPage schema already present – you can edit/enhance it.',
          prefill: {}
        });
      }

      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

      // Render scan results (recommendations only – no manual builder here)
      results.innerHTML = `
        <div class="my-10 px-4">
          <h2 class="text-3xl font-black text-center mb-6 text-gray-800 dark:text-gray-200">
            Schema Analysis for ${new URL(url).hostname}
          </h2>

          <!-- Existing Schema Summary -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl font-bold mb-4">Detected Schema Markup</h3>
            ${existingSchemas.length === 0
              ? '<p class="text-orange-600 dark:text-orange-400">No JSON-LD schema found on this page.</p>'
              : `<ul class="space-y-2">
                  ${existingSchemas.map(s => `<li class="flex items-center gap-2"><span class="text-green-500">✅</span> ${s.types.join(', ') || 'Unknown type'}</li>`).join('')}
                </ul>`
            }
            ${hasFaqSchema ? '<p class="mt-4 text-green-600 dark:text-green-400 font-medium">FAQPage already implemented – great job!</p>' : ''}
          </div>

          <!-- Recommendations -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8">
            <h3 class="text-2xl font-bold mb-4">Recommended Schema Enhancements</h3>
            ${recommendations.length === 0
              ? '<p class="text-gray-600 dark:text-gray-300">No immediate opportunities detected. Try adding content or test another page.</p>'
              : recommendations.map(rec => `
                  <div class="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow">
                    <h4 class="text-xl font-semibold text-blue-600 dark:text-blue-400">${rec.type}</h4>
                    <p class="text-gray-700 dark:text-gray-300 mt-2">${rec.reason}</p>
                  </div>
                `).join('')
            }
          </div>

          <div class="text-center mt-12">
            <p class="text-lg opacity-80">Use the manual builder above to create or edit schemas.</p>
          </div>
        </div>
      `;

      // Init shared features
      initShareReport(results);
      initSubmitFeedback(results);

      // Smooth scroll to results
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `<div class="text-red-600 dark:text-red-400 text-center text-xl p-10">Error: ${err.message}<br>Please try again or check the URL.</div>`;
    }
  });
};

document.addEventListener('DOMContentLoaded', waitForElements);