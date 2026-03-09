// modules/faqpage-schema.js
import { buildJsonLdSkeleton, cleanJsonLd, prettyJsonLd } from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block
  editorContainer.innerHTML = `
    <div class="mb-6 p-5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-sm">
      <h5 class="font-bold mb-2">About FAQPage</h5>
      Best for pages with Q&A sections. Enables rich FAQ snippets in Google.
      <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>Questions must match real user searches</li>
        <li>Answers must be visible on page</li>
        <li>3–10 items recommended</li>
      </ul>
    </div>
  `;

  // Form fields (you build whatever you want per schema)
  const formHTML = `
    <div class="space-y-6">
      <div>
        <label class="block mb-2 font-medium">Section Title (name)</label>
        <input type="text" data-field="name" placeholder="Frequently Asked Questions" class="w-full px-4 py-3 rounded-lg border dark:bg-gray-800">
      </div>
      <div id="qa-container" class="space-y-6"></div>
      <button type="button" id="add-qa" class="px-6 py-3 bg-blue-600 text-white rounded-xl">+ Add Question & Answer</button>
    </div>
  `;
  editorContainer.insertAdjacentHTML('beforeend', formHTML);

  const qaContainer = editorContainer.querySelector('#qa-container');
  const addBtn = editorContainer.querySelector('#add-qa');

  function addQA() {
    const index = qaContainer.children.length;
    qaContainer.insertAdjacentHTML('beforeend', `
      <div class="border dark:border-gray-600 rounded-xl p-5 bg-gray-50 dark:bg-gray-900">
        <label class="block mb-2">Question</label>
        <textarea data-field="mainEntity.${index}.name" rows="2" class="w-full px-4 py-3 rounded-lg border dark:bg-gray-800" placeholder="What is..."></textarea>
        <label class="block mt-4 mb-2">Answer</label>
        <textarea data-field="mainEntity.${index}.acceptedAnswer.text" rows="5" class="w-full px-4 py-3 rounded-lg border dark:bg-gray-800"></textarea>
        <button type="button" class="remove-qa mt-3 text-red-500 text-sm">Remove</button>
      </div>
    `);

    qaContainer.lastElementChild.querySelector('.remove-qa').onclick = (e) => {
      e.target.closest('div').remove();
      updatePreview();
    };

    updatePreview();
  }

  addBtn.onclick = addQA;
  addQA(); // start with one

  // Real-time preview
  function updatePreview() {
    const data = { name: '', mainEntity: [] };
    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const [path, ...rest] = el.dataset.field.split('.');
      let target = data;
      if (path === 'mainEntity') {
        const idx = parseInt(rest[0]);
        if (!data.mainEntity[idx]) data.mainEntity[idx] = { '@type': 'Question', acceptedAnswer: { '@type': 'Answer' } };
        target = data.mainEntity[idx];
        if (rest[1] === 'acceptedAnswer') target = target.acceptedAnswer;
        target[rest[rest.length-1]] = el.value.trim();
      } else {
        data[path] = el.value.trim();
      }
    });

    const json = buildJsonLdSkeleton('FAQPage', { name: data.name });
    json.mainEntity = data.mainEntity.filter(q => q.name && q.acceptedAnswer?.text);

    previewEl.textContent = prettyJsonLd(json);
  }

  editorContainer.addEventListener('input', updatePreview);
  updatePreview();
}

export default { render };