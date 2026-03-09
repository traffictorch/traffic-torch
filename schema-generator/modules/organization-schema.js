// modules/organization-schema.js
// Self-contained Organization schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on recommended SEO fields: core IDs, contact, address, social sameAs

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Organization Schema</h5>
      <p class="mb-3">Describes companies, NGOs, clubs, etc. Enhances Knowledge Panels, local search, and entity recognition in Google.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Use for site-wide markup (e.g., homepage or about page)</li>
        <li>Required: @type, name, url</li>
        <li>Recommended: logo, address, contactPoint, sameAs for social profiles</li>
        <li>Subtype as LocalBusiness if applicable (add in @type)</li>
        <li>Validate with Google Rich Results Test</li>
      </ul>
    </div>
  `;

  // Main form – grouped sections
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Name</label>
            <input type="text" data-field="name" placeholder="Your Organization Name" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Legal Name (if different)</label>
            <input type="text" data-field="legalName" placeholder="Official Registered Name"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">URL</label>
            <input type="url" data-field="url" placeholder="https://yourwebsite.com" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Logo URL</label>
            <input type="url" data-field="logo" placeholder="https://yourwebsite.com/logo.png"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Contact Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Contact Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Telephone</label>
            <input type="tel" data-field="telephone" placeholder="+1-555-123-4567"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Email</label>
            <input type="email" data-field="email" placeholder="info@yourcompany.com"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Address (structured) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Address</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Street Address</label>
            <input type="text" data-field="address.streetAddress" placeholder="123 Main St"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">City</label>
              <input type="text" data-field="address.addressLocality" placeholder="City"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">State/Region</label>
              <input type="text" data-field="address.addressRegion" placeholder="State or Province"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Postal Code</label>
              <input type="text" data-field="address.postalCode" placeholder="ZIP Code"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Country</label>
              <input type="text" data-field="address.addressCountry" placeholder="Country (e.g., US, CA)"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- SameAs (social profiles – array) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Social Profiles (sameAs)</h4>
        <div id="sameas-list" class="space-y-4"></div>
        <button type="button" id="add-sameas-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Social Profile URL
        </button>
      </div>
    </div>
  `);

  const sameAsList = editorContainer.querySelector('#sameas-list');
  const addSameAsBtn = editorContainer.querySelector('#add-sameas-btn');

  let sameAsCount = 0;

  function addSameAs() {
    const index = sameAsCount++;
    sameAsList.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3">
        <input type="url" data-field="sameAs.${index}" placeholder="https://facebook.com/yourpage"
               class="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <button type="button" class="remove-sameas text-red-600 hover:text-red-800 text-sm font-medium">
          × Remove
        </button>
      </div>
    `);

    sameAsList.lastElementChild.querySelector('.remove-sameas').onclick = () => {
      sameAsList.lastElementChild.remove();
      updatePreview();
    };

    updatePreview();
  }

  addSameAsBtn.onclick = addSameAs;
  addSameAs(); // start with one empty

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      legalName: '',
      url: '',
      logo: '',
      telephone: '',
      email: '',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        postalCode: '',
        addressCountry: ''
      },
      sameAs: []
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('address.')) {
          const addrKey = field.split('.')[1];
          data.address[addrKey] = value;
        } else if (field.startsWith('sameAs.')) {
          const index = parseInt(field.split('.')[1]);
          data.sameAs[index] = value;
        } else {
          data[field] = value;
        }
      }
    });

    data.sameAs = data.sameAs.filter(Boolean); // clean empty

    if (Object.values(data.address).every(v => !v)) {
      delete data.address; // remove empty address
    } else {
      data.address = cleanJsonLd(data.address);
    }

    const jsonLd = buildJsonLdSkeleton('Organization', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  updatePreview();
}

export default { render };