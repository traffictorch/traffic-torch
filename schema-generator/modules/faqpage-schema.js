// modules/faqpage-schema.js
// Self-contained FAQPage schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About FAQPage Schema</h5>
      <p class="mb-3">Enables expandable FAQ rich results in Google SERPs. Improves voice search & AI overview visibility.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Questions should match real user searches (natural language)</li>
        <li>Answers must be fully visible on the page (no hidden content)</li>
        <li>3–10 high-quality Q&As recommended (max ~12 for best display)</li>
        <li>Use only JSON-LD format (preferred by Google in 2026)</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#faqpage" 
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about FAQPage Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Title section -->
      <div>
        <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">FAQ Section Title (name)</label>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <span class="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
            Frequently Asked Questions About
          </span>
          <input type="text" data-field="name-topic" placeholder="Your Topic (e.g. Schema Markup, Local SEO, Coffee Brewing)"
                 class="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
          Optional — schema will use: "Frequently Asked Questions About [your input]"
        </p>
      </div>

      <!-- Q&A section -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Questions & Answers</h4>
        <div id="qa-list" class="space-y-6"></div>
        <button type="button" id="add-qa-btn"
                class="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition w-full sm:w-auto">
          + Add Q&A Pair
        </button>
      </div>
    </div>
  `);

  const qaList = editorContainer.querySelector('#qa-list');
  const addBtn = editorContainer.querySelector('#add-qa-btn');
  const nameTopicInput = editorContainer.querySelector('[data-field="name-topic"]');

  let qaCount = 0;

  function addQAPair() {
    const index = qaCount++;
    qaList.insertAdjacentHTML('beforeend', `
      <div id="qa-${index}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900 relative">
        <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Question</label>
        <textarea data-field="mainEntity.${index}.name" rows="2" required
                  placeholder="What is schema markup and why should I use it?"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>

        <label class="block mt-5 mb-2 font-medium text-gray-800 dark:text-gray-200">Answer</label>
        <textarea data-field="mainEntity.${index}.acceptedAnswer.text" rows="5" required
                  placeholder="Schema markup is structured data added to your HTML that helps search engines understand your content better..."
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>

        <button type="button" class="remove-qa mt-5 text-red-600 hover:text-red-800 text-sm font-medium block">
          × Remove this Q&A Pair
        </button>
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

  function updatePreview() {
    const topic = nameTopicInput.value.trim();
    const fullName = topic ? `Frequently Asked Questions About ${topic}` : undefined;

    const data = { name: fullName, mainEntity: [] };

    qaList.querySelectorAll('[id^="qa-"]').forEach(qaDiv => {
      const question = qaDiv.querySelector('textarea[data-field$=".name"]')?.value.trim();
      const answer   = qaDiv.querySelector('textarea[data-field$=".text"]')?.value.trim();

      if (question && answer) {
        data.mainEntity.push({
          "@type": "Question",
          "name": question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answer
          }
        });
      }
    });

    const jsonLd = buildJsonLdSkeleton('FAQPage', fullName ? { name: fullName } : {});
    if (data.mainEntity.length > 0) {
      jsonLd.mainEntity = data.mainEntity;
    }

    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  updatePreview(); // initial state
}

export default { render };