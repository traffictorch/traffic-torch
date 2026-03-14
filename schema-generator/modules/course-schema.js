// modules/course-schema.js
// Self-contained Course schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Course rich results (2026)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google Course guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Course Schema</h5>
      <p class="mb-3">Enables rich course cards in search results with title, provider, price, duration, rating — great for online/offline courses.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="Course", name, provider (Organization/Person), hasCourseInstance (at least one Offer/CourseInstance)</li>
        <li>Strongly recommended: description, image, offers (price/currency), aggregateRating/review</li>
        <li>Google shows rich results if: real course page, clear pricing, provider info, valid dates</li>
        <li>2026 best practice: use hasCourseInstance for specific sessions, add courseCode if applicable, multiple images</li>
        <li>Place on course landing/enrollment page</li>
        <li>Validate with Google Rich Results Test</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#course" 
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about Course Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Course Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Course Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Course Name</label>
            <input type="text" data-field="name" placeholder="Advanced Schema Markup & Structured Data 2026" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Description</label>
            <textarea data-field="description" rows="4" placeholder="Master JSON-LD, FAQ, HowTo, Article, LocalBusiness markup for better SERP visibility..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Image URL</label>
            <input type="url" data-field="image" placeholder="https://example.com/course-cover.jpg"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Course Code (optional)</label>
            <input type="text" data-field="courseCode" placeholder="SEO-2026-ADV"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Provider -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Course Provider</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Provider Name</label>
            <input type="text" data-field="provider.name" placeholder="Traffic Torch Academy" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Provider URL</label>
            <input type="url" data-field="provider.url" placeholder="https://traffictorch.net/academy"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Provider Logo URL</label>
            <input type="url" data-field="provider.logo" placeholder="https://traffictorch.net/logo.png"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Offers / Pricing -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Pricing & Offers</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Currency</label>
            <input type="text" data-field="offers.priceCurrency" placeholder="USD" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Price (number or range)</label>
            <input type="text" data-field="offers.price" placeholder="199.00 or 149–299"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Offer URL (enrollment link)</label>
            <input type="url" data-field="offers.url" placeholder="https://traffictorch.net/enroll/course-2026"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Availability</label>
            <select data-field="offers.availability" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="https://schema.org/InStock">In Stock / Available</option>
              <option value="https://schema.org/OutOfStock">Out of Stock</option>
              <option value="https://schema.org/PreOrder">Pre-order</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Course Instance / Session (recommended) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Course Instance / Session (recommended)</h4>
        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Course Mode</label>
              <select data-field="hasCourseInstance.courseMode" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
                <option value="https://schema.org/Online">Online</option>
                <option value="https://schema.org/Offline">In-person</option>
                <option value="https://schema.org/Blended">Blended</option>
              </select>
            </div>
            <div>
              <label class="block mb-2 font-medium">Course Workload (e.g. PT20H)</label>
              <input type="text" data-field="hasCourseInstance.courseWorkload" placeholder="PT20H"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      description: '',
      image: '',
      courseCode: '',
      provider: {
        "@type": "Organization",
        name: '',
        url: '',
        logo: ''
      },
      offers: {
        "@type": "Offer",
        priceCurrency: '',
        price: '',
        url: '',
        availability: ''
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: '',
        courseWorkload: ''
      }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('provider.')) {
          const key = field.split('.')[1];
          data.provider[key] = value;
        } else if (field.startsWith('offers.')) {
          const key = field.split('.')[1];
          data.offers[key] = value;
        } else if (field.startsWith('hasCourseInstance.')) {
          const key = field.split('.')[1];
          data.hasCourseInstance[key] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty nested objects
    if (!data.provider.name && !data.provider.url && !data.provider.logo) {
      delete data.provider;
    } else {
      data.provider = cleanJsonLd(data.provider);
    }

    if (!data.offers.priceCurrency && !data.offers.price) {
      delete data.offers;
    } else {
      data.offers = cleanJsonLd(data.offers);
    }

    if (!data.hasCourseInstance.courseMode && !data.hasCourseInstance.courseWorkload) {
      delete data.hasCourseInstance;
    } else {
      data.hasCourseInstance = cleanJsonLd(data.hasCourseInstance);
    }

    const jsonLd = buildJsonLdSkeleton('Course', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };