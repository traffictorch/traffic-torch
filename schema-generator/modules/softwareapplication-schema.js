// modules/softwareapplication-schema.js
// Self-contained SoftwareApplication schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Software App rich results (2026)
import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google SoftwareApplication guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About SoftwareApplication Schema</h5>
      <p class="mb-3">Enables rich app cards in search with name, price, rating, screenshots, download links — great for SaaS, mobile/desktop apps.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="SoftwareApplication", name, applicationCategory, operatingSystem(s), offers or downloadUrl</li>
        <li>Strongly recommended: image (screenshots), aggregateRating/review, price, fileSize, softwareVersion</li>
        <li>Google shows rich results if: real app page, clear pricing/download, high-quality images</li>
        <li>2026 best practice: use specific subtypes (WebApplication, MobileApplication, DesktopApplication), multiple screenshots, add video if demo available</li>
        <li>Place on app landing/pricing/download page</li>
        <li>Validate with Google Rich Results Test</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#softwareapplication"
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about SoftwareApplication Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core App Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Application Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">App Name</label>
            <input type="text" data-field="name" placeholder="Traffic Torch SEO Analyzer" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Description</label>
            <textarea data-field="description" rows="4" placeholder="Instant 360° SEO & UX health check with AI fixes and rich schema generation..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Application Category</label>
            <input type="text" data-field="applicationCategory" placeholder="BusinessApplication, DeveloperApplication, UtilitiesApplication"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">App Type</label>
            <select data-field="@type" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="SoftwareApplication">SoftwareApplication (general)</option>
              <option value="WebApplication">WebApplication</option>
              <option value="MobileApplication">MobileApplication</option>
              <option value="DesktopApplication">DesktopApplication</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Image / Screenshot URL</label>
            <input type="url" data-field="image" placeholder="https://traffictorch.net/screenshot-dashboard.jpg"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Platform & Download -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Platform & Download</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Operating Systems (comma separated)</label>
            <input type="text" data-field="operatingSystem" placeholder="Windows, macOS, Linux, Web, iOS, Android"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Download / Web URL</label>
            <input type="url" data-field="url" placeholder="https://traffictorch.net/app" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Direct Download URL (optional)</label>
            <input type="url" data-field="downloadUrl" placeholder="https://traffictorch.net/download/traffic-torch.exe"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Software Version</label>
            <input type="text" data-field="softwareVersion" placeholder="1.2.3"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Pricing</h4>
        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Currency</label>
              <input type="text" data-field="offers.priceCurrency" placeholder="USD"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Price (or "Free")</label>
              <input type="text" data-field="offers.price" placeholder="0 or 49.00" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Ratings (optional – strongly recommended for rich stars) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">User Ratings (optional – aggregateRating)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 font-medium">Average Rating (1-5 scale)</label>
            <input type="number" step="0.1" min="1" max="5" data-field="aggregateRating.ratingValue" placeholder="4.7"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Number of Ratings</label>
            <input type="number" min="1" data-field="aggregateRating.ratingCount" placeholder="142"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
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
      applicationCategory: '',
      operatingSystem: '',
      url: '',
      downloadUrl: '',
      softwareVersion: '',
      offers: {
        "@type": "Offer",
        priceCurrency: '',
        price: ''
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: '',
        ratingCount: ''
      }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('offers.')) {
          const key = field.split('.')[1];
          data.offers[key] = value;
        } else if (field.startsWith('aggregateRating.')) {
          const key = field.split('.')[1];
          data.aggregateRating[key] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty offer
    if (!data.offers.priceCurrency && !data.offers.price) {
      delete data.offers;
    } else {
      data.offers = cleanJsonLd(data.offers);
    }

    // Clean aggregateRating – only include if both ratingValue and ratingCount are provided
    if (!data.aggregateRating.ratingValue || !data.aggregateRating.ratingCount) {
      delete data.aggregateRating;
    } else {
      data.aggregateRating = cleanJsonLd(data.aggregateRating);
    }

    const jsonLd = buildJsonLdSkeleton('SoftwareApplication', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };