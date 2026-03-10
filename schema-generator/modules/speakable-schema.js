// modules/speakable-schema.js
// Self-contained Speakable schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on SpeakableForNewsArticle / SpeakableSpecification for Google Assistant / voice search

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Speakable guidelines (2026)
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Speakable Schema</h5>
      <p class="mb-3">Marks text on the page that Google can read aloud via Google Assistant / voice search — ideal for news, FAQs, how-to articles.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="SpeakableSpecification", cssSelector or xpath (array of selectors)</li>
        <li>Google speaks the content inside the matched elements</li>
        <li>Best practice 2026: use cssSelector (more reliable), target headline + first paragraph or FAQ answers</li>
        <li>Combine with Article/FAQPage/NewsArticle schema on the same page</li>
        <li>Max ~3–5 selectors per page to avoid long reading</li>
        <li>Validate with Google Rich Results Test (shows in Speakable section)</li>
      </ul>
    </div>
  `;

  // Main form – simple selectors + context
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Speakable Configuration -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Speakable Content Selectors</h4>
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Add CSS selectors (recommended) or XPath that point to the text Google should read aloud.<br>
          Example: <code>h1</code>, <code>.article-lead p:first-child</code>, <code>#faq-answer-1</code>
        </p>

        <div id="selectors-list" class="space-y-4"></div>
        <button type="button" id="add-selector-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Selector
        </button>
      </div>

      <!-- Optional context fields -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Optional Context</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Speakable Headline / Title (for reference)</label>
            <input type="text" data-field="headline" placeholder="Frequently Asked Questions About Schema Markup"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Body Text Preview (for reference)</label>
            <textarea data-field="body" rows="4" placeholder="Schema markup helps search engines understand your content..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
        </div>
      </div>
    </div>
  `);

  // Dynamic selectors list
  const selectorsList = editorContainer.querySelector('#selectors-list');
  const addSelectorBtn = editorContainer.querySelector('#add-selector-btn');

  let selectorCount = 0;

  function addSelector() {
    const index = selectorCount++;
    selectorsList.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3">
        <select data-field="speakable.cssSelector.${index}" class="w-32 px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          <option value="cssSelector">CSS Selector</option>
          <option value="xpath">XPath</option>
        </select>
        <input type="text" data-field="speakable.selectors.${index}" placeholder="h1, .lead-paragraph, #faq-section"
               class="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <button type="button" class="remove-selector text-red-600 hover:text-red-800 text-sm font-medium">
          × Remove
        </button>
      </div>
    `);

    selectorsList.lastElementChild.querySelector('.remove-selector').onclick = () => {
      selectorsList.lastElementChild.remove();
      updatePreview();
    };

    updatePreview();
  }

  addSelectorBtn.onclick = addSelector;
  addSelector(); // start with one selector slot

  // Live preview
  function updatePreview() {
    const cssSelectors = [];
    const xpaths = [];

    editorContainer.querySelectorAll('[data-field^="speakable.selectors."]').forEach(el => {
      const value = el.value.trim();
      if (value) {
        const index = el.dataset.field.split('.')[2];
        const modeEl = editorContainer.querySelector(`[data-field="speakable.cssSelector.${index}"]`);
        if (modeEl && modeEl.value === 'xpath') {
          xpaths.push(value);
        } else {
          cssSelectors.push(value);
        }
      }
    });

    const speakable = {};
    if (cssSelectors.length > 0) speakable.cssSelector = cssSelectors;
    if (xpaths.length > 0) speakable.xpath = xpaths;

    const data = {
      headline: '',
      body: '',
      speakable: speakable.cssSelector || speakable.xpath ? speakable : undefined
    };

    editorContainer.querySelectorAll('[data-field="headline"], [data-field="body"]').forEach(el => {
      const value = el.value.trim();
      if (value) data[el.dataset.field] = value;
    });

    const jsonLd = buildJsonLdSkeleton('SpeakableSpecification', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };