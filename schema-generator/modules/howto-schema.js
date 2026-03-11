// modules/howto-schema.js
// Self-contained HowTo schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Supports required + recommended fields for Google HowTo rich results (2026)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google HowTo guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About HowTo Schema</h5>
      <p class="mb-3">Enables step-by-step rich results with images, duration, cost — great for tutorials, recipes, guides.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="HowTo", name, step (array of HowToStep), supply/tool if applicable</li>
        <li>Each step needs: @type="HowToStep", name (title), text or image/description</li>
        <li>Strongly recommended: image (main), estimatedCost, totalTime or performTime</li>
        <li>Google shows carousel if: clear steps, visuals, real content match</li>
        <li>2026 best practice: 4–12 steps, high-quality images (1200px+), JSON-LD only</li>
        <li>Validate with Google Rich Results Test</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#howto" 
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about HowTo Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Guide Title (name)</label>
            <input type="text" data-field="name" placeholder="How to Set Up Schema Markup in 2026" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Image URL</label>
            <input type="url" data-field="image" placeholder="https://example.com/how-to-guide-main.jpg"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Estimated Time (ISO 8601, e.g. PT30M)</label>
              <input type="text" data-field="totalTime" placeholder="PT45M" 
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Estimated Cost (e.g. USD 10.00)</label>
              <input type="text" data-field="estimatedCost" placeholder="USD 0.00"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Supplies (optional array) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Supplies Needed (optional)</h4>
        <div id="supplies-list" class="space-y-4"></div>
        <button type="button" id="add-supply-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Supply Item
        </button>
      </div>

      <!-- Tools (optional array) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Tools Needed (optional)</h4>
        <div id="tools-list" class="space-y-4"></div>
        <button type="button" id="add-tool-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Tool Item
        </button>
      </div>

      <!-- Steps (required array) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Steps (required – add at least 1)</h4>
        <div id="steps-list" class="space-y-6"></div>
        <button type="button" id="add-step-btn"
                class="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition w-full sm:w-auto">
          + Add Step
        </button>
      </div>
    </div>
  `);

  // Dynamic lists: supplies, tools, steps
  const suppliesList = editorContainer.querySelector('#supplies-list');
  const toolsList    = editorContainer.querySelector('#tools-list');
  const stepsList    = editorContainer.querySelector('#steps-list');

  const addSupplyBtn = editorContainer.querySelector('#add-supply-btn');
  const addToolBtn   = editorContainer.querySelector('#add-tool-btn');
  const addStepBtn   = editorContainer.querySelector('#add-step-btn');

  function addListItem(container, fieldPrefix, placeholder, labelText) {
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3">
        <input type="text" data-field="${fieldPrefix}.${index}.name" placeholder="${placeholder}"
               class="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <button type="button" class="remove-item text-red-600 hover:text-red-800 text-sm font-medium">
          × Remove
        </button>
      </div>
    `);

    container.lastElementChild.querySelector('.remove-item').onclick = () => {
      container.lastElementChild.remove();
      updatePreview();
    };

    updatePreview();
  }

  addSupplyBtn.onclick = () => addListItem(suppliesList, 'supply', 'Screwdriver, Measuring tape...', 'Supply');
  addToolBtn.onclick   = () => addListItem(toolsList,   'tool',   'Laptop, Camera...', 'Tool');

  let stepCount = 0;

  function addStep() {
    const index = stepCount++;
    stepsList.insertAdjacentHTML('beforeend', `
      <div id="step-${index}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Step ${index + 1}
        </div>

        <label class="block mb-2 font-medium">Step Title (name)</label>
        <input type="text" data-field="step.${index}.name" placeholder="Install the plugin" required
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <label class="block mt-4 mb-2 font-medium">Step Description / Text</label>
        <textarea data-field="step.${index}.text" rows="4" placeholder="Go to Plugins → Add New → Search for 'Schema Pro'..."
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>

        <label class="block mt-4 mb-2 font-medium">Step Image URL (optional)</label>
        <input type="url" data-field="step.${index}.image" placeholder="https://example.com/step1-screenshot.png"
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">

        <button type="button" class="remove-step mt-5 text-red-600 hover:text-red-800 text-sm font-medium block">
          × Remove Step
        </button>
      </div>
    `);

    stepsList.lastElementChild.querySelector('.remove-step').onclick = () => {
      stepsList.querySelector(`#step-${index}`).remove();
      // Re-number steps after removal
      stepsList.querySelectorAll('[id^="step-"]').forEach((el, i) => {
        el.querySelector('.text-sm').textContent = `Step ${i + 1}`;
      });
      updatePreview();
    };

    updatePreview();
  }

  addStepBtn.onclick = addStep;
  addStep(); // start with one empty step

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      image: '',
      totalTime: '',
      estimatedCost: '',
      supply: [],
      tool: [],
      step: []
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('supply.')) {
          const idx = parseInt(field.split('.')[1]);
          if (!data.supply[idx]) data.supply[idx] = { "@type": "HowToSupply" };
          data.supply[idx].name = value;
        } else if (field.startsWith('tool.')) {
          const idx = parseInt(field.split('.')[1]);
          if (!data.tool[idx]) data.tool[idx] = { "@type": "HowToTool" };
          data.tool[idx].name = value;
        } else if (field.startsWith('step.')) {
          const parts = field.split('.');
          const idx = parseInt(parts[1]);
          if (!data.step[idx]) data.step[idx] = { "@type": "HowToStep" };
          if (parts[2] === 'text') data.step[idx].text = value;
          else if (parts[2] === 'image') data.step[idx].image = value;
          else data.step[idx][parts[2]] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean arrays
    data.supply = data.supply.filter(Boolean);
    data.tool   = data.tool.filter(Boolean);
    data.step   = data.step.filter(s => s.name || s.text);

    const jsonLd = buildJsonLdSkeleton('HowTo', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };