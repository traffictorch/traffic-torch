// modules/book-schema.js
// Self-contained Book schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Book rich results / entity signals (2026)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google Book schema guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Book Schema</h5>
      <p class="mb-3">Improves visibility for books in Google Books, Knowledge Panels, rich cards — great for author sites, publisher pages, book reviews.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="Book", name, author (Person/Organization), isbn (preferred) or bookFormat</li>
        <li>Strongly recommended: image, publisher, datePublished, numberOfPages, bookEdition, bookFormat</li>
        <li>Google shows rich results / Knowledge Graph if: valid ISBN, real book page, high-quality cover image</li>
        <li>2026 best practice: use ISBN-13, add aggregateRating/review, multiple formats/editions if applicable</li>
        <li>Place on book landing page, author bio, or product detail page</li>
        <li>Validate with Google Rich Results Test + Structured Data Testing Tool</li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Book Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Book Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Book Title</label>
            <input type="text" data-field="name" placeholder="The Art of Structured Data: SEO in 2026" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Subtitle (alternative name)</label>
            <input type="text" data-field="alternateName" placeholder="Mastering Schema Markup for Rich Results and AI Search"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Cover Image URL</label>
            <input type="url" data-field="image" placeholder="https://example.com/book-cover-2026.jpg" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">ISBN (13-digit preferred)</label>
            <input type="text" data-field="isbn" placeholder="978-1-234567-89-0"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Number of Pages</label>
            <input type="number" data-field="numberOfPages" placeholder="320"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Author(s) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Author(s)</h4>
        <div id="authors-list" class="space-y-4"></div>
        <button type="button" id="add-author-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Author
        </button>
      </div>

      <!-- Publisher -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Publisher</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Publisher Name</label>
            <input type="text" data-field="publisher.name" placeholder="Traffic Torch Press" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Publisher URL</label>
            <input type="url" data-field="publisher.url" placeholder="https://traffictorch.net/press"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Publication Details -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Publication Details</h4>
        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Date Published (ISO 8601)</label>
              <input type="date" data-field="datePublished" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Book Edition (e.g. 2nd)</label>
              <input type="text" data-field="bookEdition" placeholder="First Edition"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div>
            <label class="block mb-2 font-medium">Book Format</label>
            <input type="text" data-field="bookFormat" placeholder="Paperback, Hardcover, eBook, Audiobook"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Dynamic authors list
  const authorsList = editorContainer.querySelector('#authors-list');
  const addAuthorBtn = editorContainer.querySelector('#add-author-btn');

  let authorCount = 0;

  function addAuthor() {
    const index = authorCount++;
    authorsList.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3">
        <input type="text" data-field="author.${index}.name" placeholder="Jane Smith" required
               class="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <button type="button" class="remove-author text-red-600 hover:text-red-800 text-sm font-medium">
          × Remove
        </button>
      </div>
    `);

    authorsList.lastElementChild.querySelector('.remove-author').onclick = () => {
      authorsList.lastElementChild.remove();
      updatePreview();
    };

    updatePreview();
  }

  addAuthorBtn.onclick = addAuthor;
  addAuthor(); // start with one author slot

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      description: '',
      image: '',
      isbn: '',
      numberOfPages: '',
      bookEdition: '',
      bookFormat: '',
      datePublished: '',
      publisher: {
        "@type": "Organization",
        name: '',
        url: ''
      },
      author: []
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('author.')) {
          const idx = parseInt(field.split('.')[1]);
          if (!data.author[idx]) data.author[idx] = { "@type": "Person" };
          data.author[idx].name = value;
        } else if (field.startsWith('publisher.')) {
          const key = field.split('.')[1];
          data.publisher[key] = value;
        } else {
          data[field] = value;
        }
      }
    });

    data.author = data.author.filter(a => a.name);

    // Clean empty publisher
    if (!data.publisher.name && !data.publisher.url) {
      delete data.publisher;
    } else {
      data.publisher = cleanJsonLd(data.publisher);
    }

    const jsonLd = buildJsonLdSkeleton('Book', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };