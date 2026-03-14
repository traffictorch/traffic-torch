// modules/speakable-schema.js
// Self-contained Speakable schema editor & generator for Traffic Torch
// Fixed: valid SpeakableSpecification structure (no headline/body, no nested speakable, proper arrays)
// Mobile-friendly, clean output

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – updated for clarity
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Speakable Schema</h5>
      <p class="mb-3">Marks page text for Google Assistant / voice search read-aloud (e.g. news headlines + lead paragraph).</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="SpeakableSpecification" + at least one cssSelector or xpath (as array)</li>
        <li>cssSelector is recommended (e.g. "h1", ".lead p:first-child")</li>
        <li>Google reads text inside matched elements aloud</li>
        <li>Best practice: target headline + intro paragraph or FAQ answers; 1–5 selectors max</li>
        <li>Nest inside Article/NewsArticle/WebPage schema on the same page</li>
        <li>Validate with Google Rich Results Test – look for Speakable section</li>
        <li>
          <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#speakable"
             class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Learn more about Speakable Markup →
          </a>
        </li>
      </ul>
    </div>
  `;

  // Main form – only selectors needed
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Speakable Content Selectors</h4>
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Add CSS selectors (preferred) or XPath for text Google should read aloud.<br>
          Examples: <code>h1</code>, <code>.article-lead p:first-child</code>, <code>#faq-answer-1</code>
        </p>
        <div id="selectors-list" class="space-y-4"></div>
        <button type="button" id="add-selector-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Selector
        </button>
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
        <select data-field="speakable.type.${index}" class="w-32 px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          <option value="cssSelector">CSS Selector</option>
          <option value="xpath">XPath</option>
        </select>
        <input type="text" data-field="speakable.value.${index}" placeholder="h1, .lead-paragraph, #faq-section"
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
  addSelector(); // start with one

  // Live preview – fixed structure
  function updatePreview() {
    const cssSelectors = [];
    const xpaths = [];

    editorContainer.querySelectorAll('[data-field^="speakable.value."]').forEach(el => {
      const value = el.value.trim();
      if (!value) return;

      const index = el.dataset.field.split('.')[2];
      const typeEl = editorContainer.querySelector(`[data-field="speakable.type.${index}"]`);

      if (typeEl && typeEl.value === 'xpath') {
        xpaths.push(value);
      } else {
        cssSelectors.push(value);
      }
    });

    const speakableSpec = {};
    if (cssSelectors.length > 0) speakableSpec.cssSelector = cssSelectors.length === 1 ? cssSelectors[0] : cssSelectors;
    if (xpaths.length > 0) speakableSpec.xpath = xpaths.length === 1 ? xpaths[0] : xpaths;

    const data = {};
    if (Object.keys(speakableSpec).length > 0) {
      data['@type'] = 'SpeakableSpecification';
      Object.assign(data, speakableSpec);
    }

    const jsonLd = buildJsonLdSkeleton('SpeakableSpecification', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };