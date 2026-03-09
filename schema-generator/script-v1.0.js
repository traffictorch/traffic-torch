// script-v1.0.js  (adapted for Schema Generator & Detector)
// Traffic Torch Schema Markup Tool - Main Script
// Focus: URL → detect existing schema → content analysis → recommend FAQPage (v1) → edit/generate JSON-LD

// Schema modules – use barrel for future-proofing
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

  // Handle shared URL param (e.g. ?url=...)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  if (sharedUrl) {
    const input = document.getElementById('url-input');
    if (input) {
      input.value = decodeURIComponent(sharedUrl);
      setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 300);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Optional: keep usage limit
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
      'Analyzing content for FAQ opportunities...',
      'Generating recommendations...',
      'Preparing editable schema...'
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
      // Fetch rendered HTML via proxy
      const res = await fetch(API_PROXY + encodeURIComponent(url));
      if (!res.ok) throw new Error('Could not fetch page – check URL or try HTTPS');
      const html = await res.text();
      await new Promise(r => setTimeout(r, 800));
      updateProgress();

      const doc = new DOMParser().parseFromString(html, 'text/html');

      // ──────────────────────────────────────────────
      // 1. Detect existing schema
      // ──────────────────────────────────────────────
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

      // ──────────────────────────────────────────────
      // 2. Content analysis for FAQ opportunities
      // ──────────────────────────────────────────────
      const qaCandidates = [];
      // Simple heuristic: look for question-like headings + following paragraph/answer
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
      // Limit to top 8 for UX
      const detectedQAs = qaCandidates.slice(0, 8);

      updateProgress();

      // ──────────────────────────────────────────────
      // 3. Recommendations & pre-fill
      // ──────────────────────────────────────────────
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
          prefill: {} // Could extract existing mainEntity later
        });
      }

      // For v1: focus on FAQ only; later loop over registry
      const activeSchema = FAQPage;

      // Generate preview JSON-LD (use prefill if available)
      const initialData = recommendations[0]?.prefill || {};
      const generated = activeSchema.generate(initialData);
      const previewCode = prettyJsonLd(generated);

      updateProgress();

      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

      // ──────────────────────────────────────────────
      // Render results (mobile-friendly, educational)
      // ──────────────────────────────────────────────
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
              ? '<p class="text-gray-600 dark:text-gray-300">No immediate opportunities detected. Try adding FAQ content or test another page.</p>'
              : recommendations.map(rec => `
                  <div class="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow">
                    <h4 class="text-xl font-semibold text-blue-600 dark:text-blue-400">${rec.type}</h4>
                    <p class="text-gray-700 dark:text-gray-300 mt-2">${rec.reason}</p>
                  </div>
                `).join('')
            }
          </div>

          <!-- Editable FAQ Form + Preview (v1 focus) -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 class="text-2xl font-bold mb-6 text-center">Generate / Edit FAQPage Schema</h3>
            
            <div id="faq-editor" class="space-y-6">
              <!-- Dynamic Q&A fields will be injected here via JS below -->
            </div>

            <div class="mt-8">
              <button id="add-qa-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition">
                + Add Question & Answer
              </button>
            </div>

            <div class="mt-10">
              <h4 class="text-xl font-semibold mb-3">Live JSON-LD Preview</h4>
              <pre id="json-preview" class="bg-gray-900 text-green-300 p-6 rounded-xl overflow-auto text-sm max-h-96 font-mono">${previewCode}</pre>
            </div>

            <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <button id="generate-copy-btn" class="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition">
                Copy JSON-LD
              </button>
              <button id="validate-btn" class="px-10 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition">
                Validate with Google
              </button>
            </div>
          </div>

          <div class="text-center mt-12">
            <p class="text-lg opacity-80">Want more types? Coming soon: Article, HowTo, Product, Organization...</p>
          </div>
        </div>
        <!-- Manual Schema Builder -->
<div class="mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
  <h3 class="text-2xl font-bold mb-6 text-center">Create Schema Manually</h3>
  <select id="manual-schema-type" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Select Schema Type</option>
    <optgroup label="Core / Foundational">
      <option value="Organization">Organization</option>
      <option value="Article">Article / BlogPosting</option>
      <option value="LocalBusiness">LocalBusiness</option>
      <option value="Person">Person</option>
      <option value="BreadcrumbList">BreadcrumbList</option>
    </optgroup>
    <optgroup label="Content & Engagement">
      <option value="FAQPage">FAQPage</option>
      <option value="HowTo">HowTo</option>
      <option value="VideoObject">VideoObject</option>
      <option value="Recipe">Recipe</option>
      <option value="Event">Event</option>
      <option value="Review">Review / AggregateRating</option>
    </optgroup>
    <optgroup label="Advanced & Specialized">
      <option value="JobPosting">JobPosting</option>
      <option value="Course">Course</option>
      <option value="SoftwareApplication">SoftwareApplication</option>
      <option value="Book">Book</option>
      <option value="Dataset">Dataset</option>
      <option value="Speakable">Speakable</option>
      <option value="FactCheck">FactCheck</option>
    </optgroup>
  </select>
  <div id="manual-editor" class="mt-6"></div>
  <div id="manual-preview" class="mt-8 hidden">
    <h4 class="text-xl font-semibold mb-3">Live JSON-LD Preview</h4>
    <pre id="manual-json-preview" class="bg-gray-900 text-green-300 p-6 rounded-xl overflow-auto text-sm max-h-96 font-mono">// Select a type to generate preview</pre>
  </div>
  <div class="mt-6 flex flex-col sm:flex-row gap-4 justify-center hidden" id="manual-actions">
    <button id="manual-copy-btn" class="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition">Copy JSON-LD</button>
    <button id="manual-validate-btn" class="px-10 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition">Validate with Google</button>
  </div>
</div>
      `;

      // ──────────────────────────────────────────────
      // Dynamic FAQ Editor (simple v1 – add more fields later)
      // ──────────────────────────────────────────────
      const editor = document.getElementById('faq-editor');
      const previewEl = document.getElementById('json-preview');
      let qaCount = 0;

      function addQaField(question = '', answer = '') {
        qaCount++;
        const id = `qa-${qaCount}`;
        editor.insertAdjacentHTML('beforeend', `
          <div id="${id}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-5 bg-gray-50 dark:bg-gray-900">
            <div class="flex justify-between items-center mb-4">
              <h5 class="font-semibold text-lg">Q&A Pair ${qaCount}</h5>
              <button type="button" class="remove-qa text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
            <label class="block mb-2 font-medium">Question</label>
            <textarea class="qa-question w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2">${question}</textarea>
            
            <label class="block mt-4 mb-2 font-medium">Answer</label>
            <textarea class="qa-answer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="5">${answer}</textarea>
          </div>
        `);

        // Update preview on change
        const questionEl = editor.querySelector(`#${id} .qa-question`);
        const answerEl = editor.querySelector(`#${id} .qa-answer`);
        [questionEl, answerEl].forEach(el => {
          el.addEventListener('input', updatePreview);
        });

        // Remove handler
        editor.querySelector(`#${id} .remove-qa`).addEventListener('click', () => {
          document.getElementById(id).remove();
          updatePreview();
        });
      }

      function updatePreview() {
  const questions = [];
  editor.querySelectorAll('.qa-question').forEach((qEl, i) => {
    const aEl = editor.querySelectorAll('.qa-answer')[i];
    const qText = qEl.value.trim();
    const aText = aEl.value.trim();
    if (qText && aText) {
      questions.push({
        question: qText,
        answer: aText
      });
    }
  });

  const data = { questions };
  const jsonLd = FAQPage.generate(data);
  previewEl.textContent = prettyJsonLd(jsonLd);
}

      // Init with prefill
      if (initialData.questions?.length > 0) {
        initialData.questions.forEach(qa => addQaField(qa.question, qa.answer));
      } else {
        // Start with 2 empty pairs
        addQaField();
        addQaField();
      }
      updatePreview();

      // Add new pair button
      document.getElementById('add-qa-btn').addEventListener('click', () => addQaField());

      // Copy button
      document.getElementById('generate-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(previewEl.textContent)
          .then(() => alert('JSON-LD copied to clipboard! Paste into your <head> or GTM.'))
          .catch(() => alert('Copy failed – select and copy manually.'));
      });

      // Validate link (opens Google's tool)
      document.getElementById('validate-btn').addEventListener('click', () => {
        const encoded = encodeURIComponent(previewEl.textContent);
        window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`, '_blank');
      });
      
// Manual mode setup (using reusable schema-editor.js)
const manualSelect = document.getElementById('manual-schema-type');
const manualEditor = document.getElementById('manual-editor');
const manualPreview = document.getElementById('manual-json-preview');
const manualPreviewContainer = document.getElementById('manual-preview-container');
const manualActions = document.getElementById('manual-actions');

manualSelect.addEventListener('change', (e) => {
  const type = e.target.value;
  if (!type) {
    manualEditor.innerHTML = '';
    if (manualPreviewContainer) manualPreviewContainer.classList.add('hidden');
    if (manualActions) manualActions.classList.add('hidden');
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
    if (manualPreviewContainer) manualPreviewContainer.classList.add('hidden');
    if (manualActions) manualActions.classList.add('hidden');
    return;
  }

  // Clear previous editor
  manualEditor.innerHTML = '';

  // Render reusable editor component
console.log('Manual type selected:', type);
console.log('Schema loaded:', schema ? schema.type : 'null - no schema');
if (!schema) {
  console.warn('No schema for type:', type);
  manualEditor.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center py-6">Schema not available yet – try FAQPage</p>';
  return;
}
console.log('Rendering editor for:', schema.label);
manualEditor.innerHTML = ''; // clear
renderSchemaEditor(schema, manualEditor, manualPreview);
console.log('Editor render called');

  // Show preview and actions
  if (manualPreviewContainer) manualPreviewContainer.classList.remove('hidden');
  if (manualActions) manualActions.classList.remove('hidden');
});

// Copy button for manual preview
document.getElementById('manual-copy-btn')?.addEventListener('click', () => {
  const previewText = document.getElementById('manual-json-preview')?.textContent || '';
  if (previewText) {
    navigator.clipboard.writeText(previewText)
      .then(() => alert('JSON-LD copied to clipboard! Paste into your <head> or GTM.'))
      .catch(() => alert('Copy failed – select and copy manually.'));
  }
});

// Validate button for manual (opens Google's Rich Results Test with current page URL)
document.getElementById('manual-validate-btn')?.addEventListener('click', () => {
  const currentUrl = document.getElementById('url-input')?.value.trim() || window.location.href;
  window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(currentUrl)}`, '_blank');
});

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