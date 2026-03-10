// modules/review-schema.js
// Self-contained Review + AggregateRating schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Supports both single Review and AggregateRating (for product/service/page ratings)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google Review/AggregateRating guidelines (2026)
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Review & AggregateRating Schema</h5>
      <p class="mb-3">Displays star ratings, review count, average score in search results — great for products, services, local businesses, recipes, etc.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required for stars: AggregateRating with ratingValue, reviewCount/ratingCount</li>
        <li>Single Review needs: @type="Review", author, reviewRating (1–5), reviewBody</li>
        <li>Google shows stars if: 4+ reviews, consistent scale (1–5), real user content</li>
        <li>2026 best practice: combine with main entity (Product, LocalBusiness, Recipe), use JSON-LD, avoid fake/manipulated ratings</li>
        <li>Place near reviews section or product summary</li>
        <li>Validate with Google Rich Results Test</li>
      </ul>
    </div>
  `;

  // Main form – toggle between AggregateRating (stars) and single Review
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Mode selector -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Schema Type</h4>
        <select id="review-mode" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          <option value="aggregate">AggregateRating (star summary – most common)</option>
          <option value="single">Single Review (individual user review)</option>
        </select>
      </div>

      <!-- AggregateRating fields -->
      <div id="aggregate-section" class="space-y-5">
        <div>
          <label class="block mb-2 font-medium">Average Rating (1.0–5.0)</label>
          <input type="number" step="0.1" min="1" max="5" data-field="aggregateRating.ratingValue" placeholder="4.7" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block mb-2 font-medium">Number of Reviews</label>
          <input type="number" min="1" data-field="aggregateRating.reviewCount" placeholder="128" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block mb-2 font-medium">Best Rating (usually 5.0)</label>
          <input type="number" step="0.1" min="1" max="5" data-field="aggregateRating.bestRating" value="5" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block mb-2 font-medium">Worst Rating (usually 1.0)</label>
          <input type="number" step="0.1" min="1" max="5" data-field="aggregateRating.worstRating" value="1" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
      </div>

      <!-- Single Review fields -->
      <div id="single-section" class="space-y-5 hidden">
        <div>
          <label class="block mb-2 font-medium">Reviewer Name</label>
          <input type="text" data-field="author.name" placeholder="Alex Johnson" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block mb-2 font-medium">Review Rating (1–5)</label>
          <input type="number" min="1" max="5" data-field="reviewRating.ratingValue" placeholder="5" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block mb-2 font-medium">Review Title (optional)</label>
          <input type="text" data-field="reviewBodyTitle" placeholder="Outstanding product!"
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block mb-2 font-medium">Review Text</label>
          <textarea data-field="reviewBody" rows="5" placeholder="This changed the way I manage SEO – highly recommend!"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
        </div>
        <div>
          <label class="block mb-2 font-medium">Review Date (ISO 8601)</label>
          <input type="date" data-field="datePublished" required
                 class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        </div>
      </div>

      <!-- Optional extras (used in both modes) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Optional Extras (works with both modes)</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Item Being Reviewed (name)</label>
            <input type="text" data-field="itemReviewed.name" placeholder="Schema Pro" 
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Item URL or ID</label>
            <input type="url" data-field="itemReviewed.url" placeholder="https://example.com/schema-pro"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Toggle visibility based on mode
  const modeSelect = editorContainer.querySelector('#review-mode');
  const aggregateSection = editorContainer.querySelector('#aggregate-section');
  const singleSection = editorContainer.querySelector('#single-section');

  function toggleMode() {
    if (modeSelect.value === 'aggregate') {
      aggregateSection.classList.remove('hidden');
      singleSection.classList.add('hidden');
    } else {
      aggregateSection.classList.add('hidden');
      singleSection.classList.remove('hidden');
    }
    updatePreview();
  }

  modeSelect.addEventListener('change', toggleMode);
  toggleMode(); // initial state

  // Live preview
  function updatePreview() {
    const mode = modeSelect.value;
    let data = {
      "@type": mode === 'aggregate' ? "AggregateRating" : "Review",
      itemReviewed: {
        "@type": "Product", // can change to Service, Place, etc. later
        name: '',
        url: ''
      }
    };

    if (mode === 'aggregate') {
      data.ratingValue = '';
      data.reviewCount = '';
      data.bestRating = '5';
      data.worstRating = '1';
    } else {
      data.author = { "@type": "Person", name: '' };
      data.reviewRating = { "@type": "Rating", ratingValue: '' };
      data.reviewBody = '';
      data.datePublished = '';
    }

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('itemReviewed.')) {
          const key = field.split('.')[1];
          data.itemReviewed[key] = value;
        } else if (field.startsWith('author.')) {
          data.author[field.split('.')[1]] = value;
        } else if (field.startsWith('reviewRating.')) {
          data.reviewRating[field.split('.')[1]] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty nested objects
    if (!data.itemReviewed.name && !data.itemReviewed.url) {
      delete data.itemReviewed;
    } else {
      data.itemReviewed = cleanJsonLd(data.itemReviewed);
    }

    if (mode === 'single') {
      if (!data.author.name) delete data.author;
      if (!data.reviewRating.ratingValue) delete data.reviewRating;
    }

    const jsonLd = buildJsonLdSkeleton(mode === 'aggregate' ? 'AggregateRating' : 'Review', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };