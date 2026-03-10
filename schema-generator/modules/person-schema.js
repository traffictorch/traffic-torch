// modules/person-schema.js
// Self-contained Person schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields useful for author markup, entity SEO, Knowledge Graph signals

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current 2026 best practices
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Person Schema</h5>
      <p class="mb-3">Used for author profiles, team pages, about pages — helps build entity authority and rich author cards.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type, name</li>
        <li>Highly recommended: image, jobTitle, worksFor (Organization), sameAs (social profiles)</li>
        <li>Useful for: author markup in articles, speaker bios, team pages, Google Knowledge Panel signals</li>
        <li>2026 priority: high-quality photo (face clearly visible), verified social links, consistent NAP</li>
        <li>Place on author bio pages, about us, or article author sections</li>
        <li>Validate with Google Rich Results Test + Structured Data Testing Tool</li>
      </ul>
    </div>
  `;

  // Main form – grouped logically
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Identity -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Identity</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Full Name</label>
            <input type="text" data-field="name" placeholder="Jane Smith" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Alternative Name / Nickname</label>
            <input type="text" data-field="alternateName" placeholder="Dr. Jane, JaneDoe"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Profile Photo URL</label>
            <input type="url" data-field="image" placeholder="https://example.com/jane-smith.jpg" 
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Job Title / Position</label>
            <input type="text" data-field="jobTitle" placeholder="SEO Director, Founder, Content Strategist"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Organization Affiliation -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Works For / Affiliation</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Organization Name</label>
            <input type="text" data-field="worksFor.name" placeholder="Traffic Torch Pty Ltd"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Organization URL</label>
            <input type="url" data-field="worksFor.url" placeholder="https://traffictorch.net"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Contact & Online Presence -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Contact & Online Profiles</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Email</label>
            <input type="email" data-field="email" placeholder="jane@traffictorch.net"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Telephone</label>
            <input type="tel" data-field="telephone" placeholder="+61 412 345 678"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <!-- sameAs – social & professional profiles -->
        <div class="mt-8">
          <h5 class="text-base font-medium mb-3">Social / Professional Profiles (sameAs)</h5>
          <div id="sameas-list" class="space-y-4"></div>
          <button type="button" id="add-sameas-btn"
                  class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
            + Add Profile URL
          </button>
        </div>
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
        <input type="url" data-field="sameAs.${index}" placeholder="https://linkedin.com/in/janesmith OR https://twitter.com/janesmith"
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
      alternateName: '',
      image: '',
      jobTitle: '',
      email: '',
      telephone: '',
      worksFor: {
        "@type": "Organization",
        name: '',
        url: ''
      },
      sameAs: []
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('worksFor.')) {
          const key = field.split('.')[1];
          data.worksFor[key] = value;
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
    if (!data.worksFor.name && !data.worksFor.url) {
      delete data.worksFor;
    } else {
      data.worksFor = cleanJsonLd(data.worksFor);
    }

    const jsonLd = buildJsonLdSkeleton('Person', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview(); // initial empty state
}

export default { render };