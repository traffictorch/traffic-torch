// modules/localbusiness-schema.js
// Self-contained LocalBusiness schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on Google Local Pack / Knowledge Panel essentials 2026

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current best practices
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About LocalBusiness Schema</h5>
      <p class="mb-3">Improves visibility in Google Maps, Local Pack, Knowledge Panels, and voice/local search.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type, name, address, geo (lat/long), telephone or url</li>
        <li>Strongly recommended: openingHours, priceRange, image, logo, sameAs (social), review/rating</li>
        <li>Use specific subtype if possible (e.g. Restaurant, Dentist, PlumbingService) instead of plain LocalBusiness</li>
        <li>Place on homepage, contact/about, or location pages</li>
        <li>Validate with Google Rich Results Test + Merchant Center</li>
        <li>2026 priority: accurate NAP (Name, Address, Phone), photos, hours consistency</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#localbusiness" 
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about LocalBusiness Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Identity -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Identity</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Business Type</label>
            <select data-field="@type" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="LocalBusiness">LocalBusiness (general)</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Dentist">Dentist</option>
              <option value="PlumbingService">Plumbing Service</option>
              <option value="HairSalon">Hair Salon</option>
              <option value="AutoRepair">Auto Repair</option>
              <option value="Store">Store / Retail</option>
              <option value="ProfessionalService">Professional Service</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 font-medium">Business Name</label>
            <input type="text" data-field="name" placeholder="Your Business Name" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Website URL</label>
            <input type="url" data-field="url" placeholder="https://yourbusiness.com" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Business Logo URL</label>
            <input type="url" data-field="logo" placeholder="https://yourbusiness.com/logo.png"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Photo / Image URL</label>
            <input type="url" data-field="image" placeholder="https://yourbusiness.com/storefront.jpg"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Address & Geo -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Address & Location</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Street Address</label>
            <input type="text" data-field="address.streetAddress" placeholder="123 Example Street" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">City / Suburb</label>
              <input type="text" data-field="address.addressLocality" placeholder="Sydney" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">State / Region</label>
              <input type="text" data-field="address.addressRegion" placeholder="NSW" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Postal Code</label>
              <input type="text" data-field="address.postalCode" placeholder="2000" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Country Code</label>
              <input type="text" data-field="address.addressCountry" placeholder="AU" value="AU" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Latitude</label>
              <input type="number" step="any" data-field="geo.latitude" placeholder="-33.8688"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Longitude</label>
              <input type="number" step="any" data-field="geo.longitude" placeholder="151.2093"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Contact & Hours -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Contact & Opening Hours</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Telephone</label>
            <input type="tel" data-field="telephone" placeholder="+61 2 1234 5678" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Price Range ($, $$, $$$, $$$$)</label>
            <input type="text" data-field="priceRange" placeholder="$$" maxlength="4"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Opening Hours (example: Mo-Fr 09:00-17:00)</label>
            <textarea data-field="openingHoursSpecification" rows="3" placeholder="Mo-Fr 09:00-17:00&#10;Sa 10:00-14:00"
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>
      </div>

      <!-- Social Profiles (sameAs) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Social Profiles (sameAs)</h4>
        <div id="sameas-list" class="space-y-4"></div>
        <button type="button" id="add-sameas-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Social / Review Profile URL
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
        <input type="url" data-field="sameAs.${index}" placeholder="https://facebook.com/yourbusiness or https://g.page/yourbusiness"
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
  addSameAs(); // start with one empty slot

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      url: '',
      logo: '',
      image: '',
      telephone: '',
      priceRange: '',
      address: {
        "@type": "PostalAddress",
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        postalCode: '',
        addressCountry: ''
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: '',
        longitude: ''
      },
      openingHoursSpecification: '',
      sameAs: []
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('address.')) {
          const key = field.split('.')[1];
          data.address[key] = value;
        } else if (field.startsWith('geo.')) {
          const key = field.split('.')[1];
          data.geo[key] = parseFloat(value) || value;
        } else if (field.startsWith('sameAs.')) {
          const index = parseInt(field.split('.')[1]);
          data.sameAs[index] = value;
        } else {
          data[field] = value;
        }
      }
    });

    data.sameAs = data.sameAs.filter(Boolean);

    // Clean empty nested objects
    if (Object.values(data.address).every(v => !v)) delete data.address;
    else data.address = cleanJsonLd(data.address);

    if (!data.geo.latitude || !data.geo.longitude) delete data.geo;
    else data.geo = cleanJsonLd(data.geo);

    const jsonLd = buildJsonLdSkeleton('LocalBusiness', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };