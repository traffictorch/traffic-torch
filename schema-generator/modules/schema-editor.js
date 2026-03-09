// modules/schema-editor.js
// Reusable schema editor component for Traffic Torch Schema Generator
// Builds dynamic form from schema.formFields, handles arrays/add/remove, live preview, validation, education tooltip
// Latest best practices 2026: Vanilla JS (no React), Tailwind for styling, accessible forms, real-time updates
import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd,
  createEducationSnippet
} from './index.js';

export function renderSchemaEditor(schema, editorContainer, previewEl) {
  editorContainer.innerHTML = '';  // Clear existing

  // Education tooltip
  const educationEl = document.createElement('div');
  educationEl.className = 'mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm';
  educationEl.innerHTML = `<h5 class="font-semibold mb-2">About ${schema.label}</h5>${schema.education}`;
  editorContainer.appendChild(educationEl);

  // Form fields (simple v1: text + textarea + array)
  const form = document.createElement('form');
  form.className = 'space-y-6';
  schema.formFields.forEach(field => {
    const fieldEl = document.createElement('div');
    fieldEl.className = 'relative';
    const label = document.createElement('label');
    label.textContent = field.label;
    label.className = 'block mb-2 font-medium';
    fieldEl.appendChild(label);

    if (field.help) {
      const help = document.createElement('p');
      help.textContent = field.help;
      help.className = 'text-sm text-gray-500 dark:text-gray-400 mb-2';
      fieldEl.appendChild(help);
    }

    if (field.type === 'text') {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = field.placeholder || '';
      input.required = field.required;
      input.className = 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
      fieldEl.appendChild(input);
      input.addEventListener('input', updateManualPreview);
    } else if (field.type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.rows = field.rows || 3;
      textarea.placeholder = field.placeholder || '';
      textarea.required = field.required;
      textarea.className = 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
      fieldEl.appendChild(textarea);
      textarea.addEventListener('input', updateManualPreview);
    } else if (field.type === 'array') {
      const arrayContainer = document.createElement('div');
      arrayContainer.className = 'space-y-4';
      arrayContainer.id = `array-${field.key}`;
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = `+ Add ${field.itemLabel}`;
      addBtn.className = 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition mt-4';
      addBtn.addEventListener('click', () => addArrayItem(field, arrayContainer));
      fieldEl.appendChild(arrayContainer);
      fieldEl.appendChild(addBtn);
      // Add initial minItems
      for (let i = 0; i < (field.minItems || 1); i++) {
        addArrayItem(field, arrayContainer);
      }
    }

    editorContainer.appendChild(fieldEl);
  });

  // Update preview function
  function updateManualPreview() {
    const data = {};
    // Collect all fields (simple v1: assume flat + array keys)
    schema.formFields.forEach(field => {
      if (field.type === 'array') {
        data[field.key] = [];
        const items = editorContainer.querySelectorAll(`#array-${field.key} > div`);
        items.forEach(item => {
          const itemData = {};
          field.itemFields.forEach(subField => {
            const keyParts = subField.key.split('.');
            let target = itemData;
            keyParts.slice(0, -1).forEach(part => {
              target[part] = target[part] || {};
              target = target[part];
            });
            const input = item.querySelector(`[data-key="${subField.key}"]`);
            target[keyParts[keyParts.length - 1]] = input ? input.value.trim() : '';
          });
          if (Object.keys(itemData).length > 0) data[field.key].push(itemData);
        });
      } else {
        const input = editorContainer.querySelector(`[data-key="${field.key}"]`);
        data[field.key] = input ? input.value.trim() : '';
      }
    });

    const jsonLd = schema.generate(data);
    previewEl.textContent = prettyJsonLd(jsonLd);
  }

  // Add array item function
  function addArrayItem(field, container) {
    const itemId = `item-${field.key}-${container.childElementCount}`;
    const itemEl = document.createElement('div');
    itemEl.className = 'border border-gray-300 dark:border-gray-600 rounded-xl p-5 bg-gray-50 dark:bg-gray-900';
    itemEl.id = itemId;

    field.itemFields.forEach(subField => {
      const subFieldEl = document.createElement('div');
      subFieldEl.className = 'mb-4';
      const subLabel = document.createElement('label');
      subLabel.textContent = subField.label;
      subLabel.className = 'block mb-2 font-medium';
      subFieldEl.appendChild(subLabel);

      if (subField.help) {
        const subHelp = document.createElement('p');
        subHelp.textContent = subField.help;
        subHelp.className = 'text-sm text-gray-500 dark:text-gray-400 mb-2';
        subFieldEl.appendChild(subHelp);
      }

      const inputTag = subField.type === 'textarea' ? 'textarea' : 'input';
      const input = document.createElement(inputTag);
      input.placeholder = subField.placeholder || '';
      input.required = subField.required;
      input.className = 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
      if (inputTag === 'textarea') input.rows = subField.rows || 3;
      input.dataset.key = subField.key;  // For data collection
      subFieldEl.appendChild(input);
      input.addEventListener('input', updateManualPreview);

      itemEl.appendChild(subFieldEl);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'text-red-500 hover:text-red-700 text-sm mt-2';
    removeBtn.addEventListener('click', () => {
      itemEl.remove();
      updateManualPreview();
    });
    itemEl.appendChild(removeBtn);

    container.appendChild(itemEl);
    updateManualPreview();
  }

  // Initial preview
  updateManualPreview();
}