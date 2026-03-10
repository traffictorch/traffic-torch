// modules/article-schema.js
// Self-contained Article / BlogPosting schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on SEO-essential fields: headline/author/publisher/dates/image/body/section

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block (best practices from 2026 SEO guidelines)
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Article / BlogPosting Schema</h5>
      <p class="mb-3">Enhances blog posts, news, and articles for rich results like carousels, timestamps, and author info in Google SERPs.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Use "Article" for general content or "BlogPosting" for blogs/social media posts</li>
        <li>Required for rich results: headline, image (at least 696px wide), datePublished, author</li>
        <li>Recommended: dateModified (for freshness), publisher (Organization with logo), wordCount</li>
        <li>Best practices 2026: JSON-LD only, validate with Google Rich Results Test, avoid duplicates on page</li>
        <li>SEO benefits: Better visibility in Google News, Discover, and AI overviews</li>
      </ul>
    </div>
  `;

  // Main form – sections for core/publishing/content
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Schema Type</label>
            <select data-field="@type" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="Article">Article (general)</option>
              <option value="BlogPosting">BlogPosting (for blogs)</option>
              <option value="NewsArticle">NewsArticle (for news)</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 font-medium">Headline</label>
            <input type="text" data-field="headline" placeholder="Your Article Title" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Alternative Headline (subheadline)</label>
            <input type="text" data-field="alternativeHeadline" placeholder="Secondary Title (optional)"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Image URL (min 696px wide)</label>
            <input type="url" data-field="image" placeholder="https://example.com/image.jpg" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Publishing Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Publishing Details</h4>
        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Date Published (ISO format)</label>
              <input type="datetime-local" data-field="datePublished" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Date Modified (ISO format)</label>
              <input type="datetime-local" data-field="dateModified"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div>
            <label class="block mb-2 font-medium">Author Name</label>
            <input type="text" data-field="author.name" placeholder="Author's Full Name" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Publisher Name (Organization)</label>
            <input type="text" data-field="publisher.name" placeholder="Your Company Name" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Publisher Logo URL</label>
            <input type="url" data-field="publisher.logo" placeholder="https://example.com/logo.png" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Content Details -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Content Details</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Article Body (full text, optional)</label>
            <textarea data-field="articleBody" rows="6" placeholder="Paste the full article text here if needed for validation"
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Article Section/Category</label>
            <input type="text" data-field="articleSection" placeholder="e.g., SEO, Technology, Health"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Word Count</label>
            <input type="number" data-field="wordCount" placeholder="Calculated automatically if body provided"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Live preview update
  function updatePreview() {
    const data = {
      "@type": editorContainer.querySelector('[data-field="@type"]').value,
      headline: '',
      alternativeHeadline: '',
      image: '',
      datePublished: '',
      dateModified: '',
      author: { "@type": "Person", name: '' },
      publisher: { "@type": "Organization", name: '', logo: '' },
      articleBody: '',
      articleSection: '',
      wordCount: ''
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('author.')) {
          data.author[field.split('.')[1]] = value;
        } else if (field.startsWith('publisher.')) {
          data.publisher[field.split('.')[1]] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty nested objects
    if (!data.author.name) delete data.author;
    else data.author = cleanJsonLd(data.author);

    if (!data.publisher.name || !data.publisher.logo) delete data.publisher;
    else data.publisher = cleanJsonLd(data.publisher);

    if (!data.wordCount && data.articleBody) {
      data.wordCount = data.articleBody.split(/\s+/).length; // simple auto-count
    }

    const jsonLd = buildJsonLdSkeleton(data["@type"], data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview); // for select/date
  updatePreview(); // initial empty
}

export default { render };