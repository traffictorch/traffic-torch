// modules/faqpage-schema.js
// Self-contained FAQPage schema editor & generator
// Exports a default object with .render() method

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education / info block
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About FAQPage Schema</h5>
      <p class="mb-3">Enables expandable FAQ rich results in Google SERPs. Improves voice search & AI overview visibility.</p>
      <ul class="list-disc pl-5 space-y-1.5">
        <li>Questions should match real user searches (natural language)</li>
        <li>Answers must be fully visible on the page (no hidden/accordion-only content)</li>
        <li>3–10 high-quality Q&As recommended (max ~12 for best display)</li>
        <li>Use only JSON-LD format (preferred by Google in 2026)</li>
      </ul>
    </div>
  `;

  // Form structure
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-8">
      <div>
        <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">FAQ Section Title (name)</label>
        <input type="text" data-field="name" placeholder="Frequently Asked Questions About [Topic]" 
               class="w-full px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Helps label the FAQ block in search results. Optional but recommended.</p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Questions & Answers</h4>
          <button type="button" id="add-qa-btn" 
                  class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
            + Add Q&A Pair
          </button>
        </div>
        <div id="qa-list" class="space-y-6"></div>
      </div>
    </div>
  `);

  const qaList = editorContainer.querySelector('#qa-list');
  const addBtn = editorContainer.querySelector('#add-qa-btn');

  let qaCount = 0;

  function addQAPair() {
    const index = qaCount++;
    qaList.insertAdjacentHTML('beforeend', `
      <div id="qa-${index}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900 relative">
        <button type="button" class="remove-qa absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">
          Remove
        </button>
        
        <label class="block mb-2 font-medium">Question</label>
        <textarea data-field="mainEntity.${index}.name" rows="2" required
                  placeholder="What is schema markup and why should I use it?"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"></textarea>
        
        <label class="block mt-5 mb-2 font-medium">Answer</label>
        <textarea data-field="mainEntity.${index}.acceptedAnswer.text" rows="6" required
                  placeholder="Schema markup (structured data) is code you add to your website that helps search engines understand your content..."
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"></textarea>
      </div>
    `);

    qaList.lastElementChild.querySelector('.remove-qa').onclick = () => {
      qaList.querySelector(`#qa-${index}`).remove();
      updatePreview();
    };

    updatePreview();
  }

  addBtn.onclick = addQAPair;
  addQAPair(); // start with one empty pair

  // Live preview update
  function updatePreview() {
    const data = { name: '', mainEntity: [] };

    editorContainer.querySelector('[data-field="name"]').value = 
      editorContainer.querySelector('[data-field="name"]').value.trim();

    data.name = editorContainer.querySelector('[data-field="name"]').value || undefined;

    qaList.querySelectorAll('[id^="qa-"]').forEach(qaDiv => {
      const question = qaDiv.querySelector('textarea[data-field$=".name"]')?.value.trim();
      const answer   = qaDiv.querySelector('textarea[data-field$=".text"]')?.value.trim();

      if (question && answer) {
        data.mainEntity.push({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer
          }
        });
      }
    });

    const jsonLd = buildJsonLdSkeleton('FAQPage', data.name ? { name: data.name } : {});
    if (data.mainEntity.length > 0) {
      jsonLd.mainEntity = data.mainEntity;
    }

    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  updatePreview(); // initial empty state
}

export default { render };