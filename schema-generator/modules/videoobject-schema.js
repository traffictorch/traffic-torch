// modules/videoobject-schema.js
// Self-contained VideoObject schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Video rich results & thumbnails

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google VideoObject guidelines (2026)
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About VideoObject Schema</h5>
      <p class="mb-3">Enables video thumbnails, duration, title & description in Google Search, Video tab & Discover.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required for rich results: name, thumbnailUrl (at least one), uploadDate, contentUrl or embedUrl</li>
        <li>Strongly recommended: description, duration (ISO 8601), thumbnailUrl (1280×720+), transcript</li>
        <li>Video must be publicly accessible, hosted on your domain or YouTube/Vimeo</li>
        <li>2026 best practice: multiple thumbnails (different sizes), add interactionCount if available</li>
        <li>Place near or inside the video player area on the page</li>
        <li>Validate with Google Rich Results Test + Video Index Status in Search Console</li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Video Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Video Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Video Title (name)</label>
            <input type="text" data-field="name" placeholder="How to Implement Schema Markup in 2026" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Description</label>
            <textarea data-field="description" rows="4" placeholder="Step-by-step tutorial showing how to add structured data to your website..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Upload Date (ISO 8601)</label>
              <input type="date" data-field="uploadDate" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Duration (ISO 8601, e.g. PT5M30S)</label>
              <input type="text" data-field="duration" placeholder="PT12M45S" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Video URLs -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Video URLs (at least one required)</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Direct Video File URL (contentUrl)</label>
            <input type="url" data-field="contentUrl" placeholder="https://example.com/video.mp4"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Embed URL (e.g. YouTube iframe src)</label>
            <input type="url" data-field="embedUrl" placeholder="https://www.youtube.com/embed/VIDEO_ID"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Thumbnails (multiple recommended) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Thumbnails (at least one required)</h4>
        <div id="thumbnail-list" class="space-y-4"></div>
        <button type="button" id="add-thumbnail-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Thumbnail URL
        </button>
      </div>

      <!-- Optional extras -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Optional Extras</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Transcript / Captions Text</label>
            <textarea data-field="transcript" rows="5" placeholder="Full spoken transcript or closed captions..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Interaction Count (views/likes)</label>
            <input type="number" data-field="interactionStatistic.userInteractionCount" placeholder="12500"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Dynamic thumbnails
  const thumbnailList = editorContainer.querySelector('#thumbnail-list');
  const addThumbnailBtn = editorContainer.querySelector('#add-thumbnail-btn');

  let thumbCount = 0;

  function addThumbnail() {
    const index = thumbCount++;
    thumbnailList.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3">
        <input type="url" data-field="thumbnailUrl.${index}" placeholder="https://example.com/thumbnail-1280x720.jpg"
               class="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <button type="button" class="remove-thumb text-red-600 hover:text-red-800 text-sm font-medium">
          × Remove
        </button>
      </div>
    `);

    thumbnailList.lastElementChild.querySelector('.remove-thumb').onclick = () => {
      thumbnailList.lastElementChild.remove();
      updatePreview();
    };

    updatePreview();
  }

  addThumbnailBtn.onclick = addThumbnail;
  addThumbnail(); // start with one thumbnail slot

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      description: '',
      uploadDate: '',
      duration: '',
      contentUrl: '',
      embedUrl: '',
      thumbnailUrl: [],
      transcript: '',
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "http://schema.org/WatchAction",
        userInteractionCount: ''
      }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('thumbnailUrl.')) {
          const idx = parseInt(field.split('.')[1]);
          data.thumbnailUrl[idx] = value;
        } else if (field.startsWith('interactionStatistic.')) {
          data.interactionStatistic[field.split('.')[1]] = value;
        } else {
          data[field] = value;
        }
      }
    });

    data.thumbnailUrl = data.thumbnailUrl.filter(Boolean);

    if (!data.interactionStatistic.userInteractionCount) {
      delete data.interactionStatistic;
    }

    const jsonLd = buildJsonLdSkeleton('VideoObject', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };