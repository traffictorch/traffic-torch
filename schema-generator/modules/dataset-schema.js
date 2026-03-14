// modules/dataset-schema.js
// Self-contained Dataset schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Dataset rich results & Google Dataset Search (2026)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google Dataset guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Dataset Schema</h5>
      <p class="mb-3">Helps datasets appear in Google Dataset Search, rich results, and Knowledge Graph — ideal for open data, research papers, government portals, machine learning datasets.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="Dataset", name, description</li>
        <li>Strongly recommended: creator, publisher, license, distribution (download URL, format, size), temporalCoverage, spatialCoverage</li>
        <li>Google shows rich cards if: public dataset, clear license, direct download link, machine-readable formats (CSV, JSON, etc.)</li>
        <li>2026 best practice: include multiple distributions, use SPDX license identifiers, add keywords, version info</li>
        <li>Place on dataset landing page or data catalog entry</li>
        <li>Validate with Google Rich Results Test + Structured Data Testing Tool</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#dataset" 
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about Dataset Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Dataset Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Dataset Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Dataset Name / Title</label>
            <input type="text" data-field="name" placeholder="Sydney Traffic Patterns 2026" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Description</label>
            <textarea data-field="description" rows="5" placeholder="Hourly traffic volume, speed, and congestion data for major Sydney roads, collected from Transport for NSW sensors..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Keywords (comma separated)</label>
            <input type="text" data-field="keywords" placeholder="traffic, sydney, congestion, transport, open-data"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Version (optional)</label>
            <input type="text" data-field="version" placeholder="v1.2"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Creator / Publisher -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Creator & Publisher</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Creator / Author Name</label>
            <input type="text" data-field="creator.name" placeholder="John Doe" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Creator URL (optional)</label>
            <input type="url" data-field="creator.url" placeholder="https://johndoe.com"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Publisher Name (Organization)</label>
            <input type="text" data-field="publisher.name" placeholder="Traffic Torch Research"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Distribution / Download -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Distribution / Download (required for indexing)</h4>
        <div id="distribution-list" class="space-y-6"></div>
        <button type="button" id="add-distribution-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Distribution (file/format)
        </button>
      </div>

      <!-- License & Temporal Coverage -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">License & Coverage</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">License (SPDX or URL)</label>
            <input type="text" data-field="license" placeholder="https://creativecommons.org/licenses/by/4.0/ OR CC-BY-4.0"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Temporal Coverage (start–end)</label>
              <input type="text" data-field="temporalCoverage" placeholder="2020-01-01/2026-12-31"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Spatial Coverage (place name)</label>
              <input type="text" data-field="spatialCoverage" placeholder="Sydney, New South Wales, Australia"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  // Dynamic distributions
  const distributionList = editorContainer.querySelector('#distribution-list');
  const addDistributionBtn = editorContainer.querySelector('#add-distribution-btn');

  let distCount = 0;

  function addDistribution() {
    const index = distCount++;
    distributionList.insertAdjacentHTML('beforeend', `
      <div id="dist-${index}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
        <label class="block mb-2 font-medium">Download URL / Access Link</label>
        <input type="url" data-field="distribution.${index}.contentUrl" placeholder="https://data.traffictorch.net/sydney-traffic-2026.csv" required
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <label class="block mt-4 mb-2 font-medium">File Format (MIME or extension)</label>
        <input type="text" data-field="distribution.${index}.encodingFormat" placeholder="text/csv OR application/json" required
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <label class="block mt-4 mb-2 font-medium">File Size (e.g. 5.2 MB)</label>
        <input type="text" data-field="distribution.${index}.contentSize" placeholder="5.2 MB"
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <button type="button" class="remove-dist mt-4 text-red-600 hover:text-red-800 text-sm font-medium block">
          × Remove Distribution
        </button>
      </div>
    `);

    distributionList.lastElementChild.querySelector('.remove-dist').onclick = () => {
      distributionList.querySelector(`#dist-${index}`).remove();
      updatePreview();
    };

    updatePreview();
  }

  addDistributionBtn.onclick = addDistribution;
  addDistribution(); // start with one distribution slot

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      description: '',
      image: '',
      keywords: '',
      version: '',
      creator: {
        "@type": "Person",
        name: ''
      },
      publisher: {
        "@type": "Organization",
        name: ''
      },
      license: '',
      temporalCoverage: '',
      spatialCoverage: '',
      distribution: []
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('creator.')) {
          data.creator[field.split('.')[1]] = value;
        } else if (field.startsWith('publisher.')) {
          data.publisher[field.split('.')[1]] = value;
        } else if (field.startsWith('distribution.')) {
          const parts = field.split('.');
          const idx = parseInt(parts[1]);
          if (!data.distribution[idx]) data.distribution[idx] = { "@type": "DataDownload" };
          data.distribution[idx][parts[2]] = value;
        } else {
          data[field] = value;
        }
      }
    });

    data.distribution = data.distribution.filter(d => d.contentUrl && d.encodingFormat);

    if (!data.creator.name) delete data.creator;
    if (!data.publisher.name) delete data.publisher;

    const jsonLd = buildJsonLdSkeleton('Dataset', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };