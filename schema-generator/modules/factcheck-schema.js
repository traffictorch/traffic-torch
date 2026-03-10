// modules/factcheck-schema.js
// Self-contained FactCheck schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Fact Check rich results (2026)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google FactCheck guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About FactCheck Schema</h5>
      <p class="mb-3">Enables fact-check rich results in Google Search & News with rating, claim, reviewer — great for journalism, fact-check sites, debunking pages.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="ClaimReview" (subtype of Review), datePublished, url, author, reviewRating, itemReviewed (Claim with appearance, firstAppearance, claimReviewed)</li>
        <li>Strongly recommended: reviewRating.ratingValue (text like "True", "False", "Mixed"), alternateName (explanation), publisher</li>
        <li>Google shows rich results if: from verified fact-checker, clear rating scale, full article link</li>
        <li>2026 best practice: use ClaimReviewed for short claim summary, add multiple appearances if claim spread across sources, JSON-LD only</li>
        <li>Place on fact-check article page</li>
        <li>Validate with Google Rich Results Test + Fact Check Explorer</li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core FactCheck Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core FactCheck Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Claim Reviewed (short summary)</label>
            <input type="text" data-field="claimReviewed" placeholder="Claim: 'Schema markup guarantees #1 ranking'" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">FactCheck Article URL (full review link)</label>
            <input type="url" data-field="url" placeholder="https://traffictorch.net/fact-check/schema-rankings" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Date Published (ISO 8601)</label>
            <input type="date" data-field="datePublished" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Review Rating -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Review Rating (conclusion)</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Rating Value (e.g. False, True, Mostly False)</label>
            <input type="text" data-field="reviewRating.ratingValue" placeholder="False" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Best Rating (scale max, usually 5)</label>
            <input type="number" data-field="reviewRating.bestRating" value="5"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Worst Rating (scale min, usually 1)</label>
            <input type="number" data-field="reviewRating.worstRating" value="1"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Alternate Name / Explanation (optional)</label>
            <input type="text" data-field="reviewRating.alternateName" placeholder="Schema improves visibility but doesn't guarantee rankings"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Author / Publisher -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Author / Publisher</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Author Name</label>
            <input type="text" data-field="author.name" placeholder="Ylia Cai" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Publisher Name (Organization)</label>
            <input type="text" data-field="publisher.name" placeholder="Traffic Torch Fact Check"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Item Reviewed (Claim) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Item Reviewed (Claim)</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Claim Text</label>
            <textarea data-field="itemReviewed.text" rows="3" placeholder="Schema markup guarantees #1 ranking in Google."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Claim Author Name</label>
            <input type="text" data-field="itemReviewed.author.name" placeholder="Anonymous Blogger"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Claim First Appearance URL</label>
            <input type="url" data-field="itemReviewed.firstAppearance.url" placeholder="https://blog.example.com/schema-guarantee"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Live preview
  function updatePreview() {
    const data = {
      datePublished: '',
      url: '',
      claimReviewed: '',
      author: { "@type": "Person", name: '' },
      publisher: { "@type": "Organization", name: '' },
      reviewRating: {
        "@type": "Rating",
        ratingValue: '',
        bestRating: '5',
        worstRating: '1',
        alternateName: ''
      },
      itemReviewed: {
        "@type": "Claim",
        text: '',
        author: { "@type": "Person", name: '' },
        firstAppearance: { "@type": "CreativeWork", url: '' }
      }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('reviewRating.')) {
          const key = field.split('.')[1];
          data.reviewRating[key] = value;
        } else if (field.startsWith('author.')) {
          data.author[field.split('.')[1]] = value;
        } else if (field.startsWith('publisher.')) {
          data.publisher[field.split('.')[1]] = value;
        } else if (field.startsWith('itemReviewed.author.')) {
          data.itemReviewed.author[field.split('.')[2]] = value;
        } else if (field.startsWith('itemReviewed.firstAppearance.')) {
          data.itemReviewed.firstAppearance[field.split('.')[2]] = value;
        } else if (field.startsWith('itemReviewed.')) {
          const key = field.split('.')[1];
          data.itemReviewed[key] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty nested objects
    if (!data.author.name) delete data.author;
    if (!data.publisher.name) delete data.publisher;
    if (!data.reviewRating.ratingValue) delete data.reviewRating;
    else data.reviewRating = cleanJsonLd(data.reviewRating);

    if (!data.itemReviewed.text) delete data.itemReviewed;
    else {
      if (!data.itemReviewed.author.name) delete data.itemReviewed.author;
      if (!data.itemReviewed.firstAppearance.url) delete data.itemReviewed.firstAppearance;
      data.itemReviewed = cleanJsonLd(data.itemReviewed);
    }

    const jsonLd = buildJsonLdSkeleton('ClaimReview', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };