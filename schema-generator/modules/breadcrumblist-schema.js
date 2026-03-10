// modules/breadcrumblist-schema.js
// Self-contained BreadcrumbList schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Dynamic list of breadcrumb items (position + name + url)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google guidelines (2025–2026)
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About BreadcrumbList Schema</h5>
      <p class="mb-3">Displays hierarchical navigation in search results (breadcrumb trail under title).</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type = "BreadcrumbList", itemListElement array with at least 2 items</li>
        <li>Each item needs: @type = "ListItem", position (integer), name, item (URL or internal ID)</li>
        <li>Google shows breadcrumbs if: clear hierarchy, no duplicates on page, matches visible nav</li>
        <li>Best practice 2026: Use full absolute URLs, last item = current page, 3–7 levels ideal</li>
        <li>Place near top of page (usually in header or under hero)</li>
        <li>Validate with Google Rich Results Test</li>
      </ul>
    </div>
  `;

  // Main form – dynamic breadcrumb items
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Breadcrumb Items</h4>
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Add at least 2 items. Last item should be the current page.
        </p>
        <div id="breadcrumb-list" class="space-y-6"></div>
        <button type="button" id="add-breadcrumb-btn"
                class="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition w-full sm:w-auto">
          + Add Breadcrumb Item
        </button>
      </div>
    </div>
  `);

  const breadcrumbList = editorContainer.querySelector('#breadcrumb-list');
  const addBtn = editorContainer.querySelector('#add-breadcrumb-btn');

  let itemCount = 0;

  function addBreadcrumbItem() {
    const index = itemCount++;
    const position = index + 1;

    breadcrumbList.insertAdjacentHTML('beforeend', `
      <div id="bc-item-${index}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900 relative">
        <div class="absolute top-4 right-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Position: ${position}
        </div>

        <label class="block mb-2 font-medium">Name (visible text)</label>
        <input type="text" data-field="itemListElement.${index}.name" placeholder="Home" required
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <label class="block mt-4 mb-2 font-medium">URL (full absolute link)</label>
        <input type="url" data-field="itemListElement.${index}.item" placeholder="https://example.com/" required
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <button type="button" class="remove-bc mt-5 text-red-600 hover:text-red-800 text-sm font-medium block">
          × Remove this Item
        </button>
      </div>
    `);

    breadcrumbList.lastElementChild.querySelector('.remove-bc').onclick = () => {
      breadcrumbList.querySelector(`#bc-item-${index}`).remove();
      // Re-number positions after removal
      breadcrumbList.querySelectorAll('[id^="bc-item-"]').forEach((el, i) => {
        el.querySelector('.absolute').textContent = `Position: ${i + 1}`;
      });
      updatePreview();
    };

    updatePreview();
  }

  addBtn.onclick = addBreadcrumbItem;

  // Start with 2 items (minimum for meaningful breadcrumbs)
  addBreadcrumbItem(); // Home
  addBreadcrumbItem(); // Current page

  // Live preview
  function updatePreview() {
    const itemListElement = [];

    breadcrumbList.querySelectorAll('[id^="bc-item-"]').forEach((itemDiv, index) => {
      const name = itemDiv.querySelector('input[data-field$=".name"]')?.value.trim();
      const itemUrl = itemDiv.querySelector('input[data-field$=".item"]')?.value.trim();

      if (name && itemUrl) {
        itemListElement.push({
          "@type": "ListItem",
          "position": index + 1,
          "name": name,
          "item": itemUrl
        });
      }
    });

    const jsonLd = buildJsonLdSkeleton('BreadcrumbList', {});
    if (itemListElement.length >= 2) {
      jsonLd.itemListElement = itemListElement;
    }

    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  updatePreview(); // initial state with 2 empty items
}

export default { render };