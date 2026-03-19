// modules/recipe-schema.js
// Self-contained Recipe schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Recipe rich results (2026)
import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google Recipe guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Recipe Schema</h5>
      <p class="mb-3">Enables rich recipe cards with ingredients, steps, cook time, ratings, nutrition info.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="Recipe", name, image, author, recipeIngredient (array), recipeInstructions (array or HowToStep)</li>
        <li>Strongly recommended: prepTime, cookTime, totalTime (ISO 8601), recipeYield, calories/nutrition</li>
        <li>Google shows carousel if: high-quality images, clear steps, real recipe content</li>
        <li>2026 best practice: multiple images, aggregateRating/review, video if available, keywords, cuisine/category</li>
        <li>Place above or near the recipe content on the page</li>
        <li>Validate with Google Rich Results Test</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#recipe"
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about Recipe Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Recipe Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Recipe Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Recipe Name</label>
            <input type="text" data-field="name" placeholder="Classic Chocolate Chip Cookies" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Description</label>
            <textarea data-field="description" rows="3" placeholder="Soft and chewy cookies with melty chocolate chips – ready in 30 minutes."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Image URL</label>
            <input type="url" data-field="image" placeholder="https://example.com/cookies-hero.jpg" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block mb-2 font-medium">Prep Time (ISO 8601)</label>
              <input type="text" data-field="prepTime" placeholder="PT15M"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Cook Time (ISO 8601)</label>
              <input type="text" data-field="cookTime" placeholder="PT12M"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Total Time (ISO 8601)</label>
              <input type="text" data-field="totalTime" placeholder="PT27M"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Use uppercase PT format: PT1H30M, PT45M, PT2H (Google is strict on duration format)</p>
          <div>
            <label class="block mb-2 font-medium">Servings / Yield</label>
            <input type="text" data-field="recipeYield" placeholder="24 cookies" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Keywords (comma-separated, optional)</label>
            <input type="text" data-field="keywords" placeholder="easy dessert, chocolate, quick bake"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Recipe Category (e.g., Dessert, Appetizer)</label>
            <input type="text" data-field="recipeCategory" placeholder="Dessert"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Recipe Cuisine (e.g., American, Italian)</label>
            <input type="text" data-field="recipeCuisine" placeholder="American"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Author -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Author</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Author Name</label>
            <input type="text" data-field="author.name" placeholder="John Smith" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Author URL (optional)</label>
            <input type="url" data-field="author.url" placeholder="https://example.com/author/johnsmith"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Video (optional) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Recipe Video (optional)</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Video Name</label>
            <input type="text" data-field="video.name" placeholder="How to Make Chocolate Chip Cookies"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Video Description</label>
            <textarea data-field="video.description" rows="2" placeholder="Quick tutorial for perfect cookies..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Video URL (contentUrl or embedUrl)</label>
            <input type="url" data-field="video.contentUrl" placeholder="https://example.com/video.mp4 or YouTube embed"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Thumbnail URL</label>
            <input type="url" data-field="video.thumbnailUrl" placeholder="https://example.com/video-thumb.jpg"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Video Upload Date <span class="text-xs text-red-600 dark:text-red-400 font-semibold">* REQUIRED by Google when video is included – missing = critical error</span></label>
            <input type="date" data-field="video.uploadDate" placeholder="YYYY-MM-DD" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Ingredients (required array) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Ingredients (required)</h4>
        <div id="ingredients-list" class="space-y-4"></div>
        <button type="button" id="add-ingredient-btn"
                class="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          + Add Ingredient
        </button>
      </div>

      <!-- Instructions / Steps (required array) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Instructions / Steps (required)</h4>
        <div id="instructions-list" class="space-y-6"></div>
        <button type="button" id="add-instruction-btn"
                class="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition w-full sm:w-auto">
          + Add Step
        </button>
      </div>

      <!-- Ratings (optional) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Ratings (optional – aggregateRating)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 font-medium">Average Rating (1-5)</label>
            <input type="number" step="0.1" min="1" max="5" data-field="aggregateRating.ratingValue" placeholder="4.7"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Number of Ratings</label>
            <input type="number" data-field="aggregateRating.reviewCount" placeholder="42"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Nutrition (optional) -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Nutrition (optional – per serving)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block mb-2 font-medium">Calories</label>
            <input type="number" data-field="nutrition.calories" placeholder="250"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Fat (g)</label>
            <input type="number" step="0.1" data-field="nutrition.fatContent" placeholder="12"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Protein (g)</label>
            <input type="number" step="0.1" data-field="nutrition.proteinContent" placeholder="4"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Dynamic lists: ingredients & instructions
  const ingredientsList = editorContainer.querySelector('#ingredients-list');
  const instructionsList = editorContainer.querySelector('#instructions-list');
  const addIngredientBtn = editorContainer.querySelector('#add-ingredient-btn');
  const addInstructionBtn = editorContainer.querySelector('#add-instruction-btn');

  function addSimpleItem(container, fieldPrefix, placeholder) {
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-3">
        <input type="text" data-field="${fieldPrefix}.${index}" placeholder="${placeholder}"
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

  addIngredientBtn.onclick = () => addSimpleItem(ingredientsList, 'recipeIngredient', '2 cups all-purpose flour');

  let stepCount = 0;
  function addInstruction() {
    const index = stepCount++;
    instructionsList.insertAdjacentHTML('beforeend', `
      <div id="instr-${index}" class="border border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Step ${index + 1}
        </div>
        <label class="block mb-2 font-medium">Step Text / Instructions</label>
        <textarea data-field="recipeInstructions.${index}.text" rows="4" placeholder="Preheat oven to 180°C. Line baking tray with parchment..."
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
        <label class="block mt-4 mb-2 font-medium">Step Name (short title, optional)</label>
        <input type="text" data-field="recipeInstructions.${index}.name" placeholder="Preheat oven"
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <label class="block mt-4 mb-2 font-medium">Step URL (anchor link, optional e.g. #step1)</label>
        <input type="url" data-field="recipeInstructions.${index}.url" placeholder="https://example.com/recipe#step1"
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <label class="block mt-4 mb-2 font-medium">Step Image URL (optional)</label>
        <input type="url" data-field="recipeInstructions.${index}.image" placeholder="https://example.com/mixing-dough.jpg"
               class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
        <button type="button" class="remove-instr mt-5 text-red-600 hover:text-red-800 text-sm font-medium block">
          × Remove Step
        </button>
      </div>
    `);
    instructionsList.lastElementChild.querySelector('.remove-instr').onclick = () => {
      instructionsList.querySelector(`#instr-${index}`).remove();
      instructionsList.querySelectorAll('[id^="instr-"]').forEach((el, i) => {
        el.querySelector('.text-sm').textContent = `Step ${i + 1}`;
      });
      updatePreview();
    };
    updatePreview();
  }

  addInstructionBtn.onclick = addInstruction;
  addInstruction(); // start with one step

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      description: '',
      image: '',
      prepTime: '',
      cookTime: '',
      totalTime: '',
      recipeYield: '',
      keywords: '',
      recipeCategory: '',
      recipeCuisine: '',
      author: { "@type": "Person", name: '' },
      recipeIngredient: [],
      recipeInstructions: [],
      video: { "@type": "VideoObject", name: '', description: '', contentUrl: '', embedUrl: '', thumbnailUrl: '', uploadDate: '' },
      aggregateRating: { "@type": "AggregateRating", ratingValue: '', reviewCount: '' },
      nutrition: {
        "@type": "NutritionInformation",
        calories: '',
        fatContent: '',
        proteinContent: ''
      }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('recipeIngredient.')) {
          const idx = parseInt(field.split('.')[1]);
          data.recipeIngredient[idx] = value;
        } else if (field.startsWith('recipeInstructions.')) {
          const parts = field.split('.');
          const idx = parseInt(parts[1]);
          if (!data.recipeInstructions[idx]) data.recipeInstructions[idx] = { "@type": "HowToStep" };
          if (parts[2] === 'text') data.recipeInstructions[idx].text = value;
          else if (parts[2] === 'name') data.recipeInstructions[idx].name = value;
          else if (parts[2] === 'url') data.recipeInstructions[idx].url = value;
          else if (parts[2] === 'image') data.recipeInstructions[idx].image = value;
        } else if (field.startsWith('nutrition.')) {
          const key = field.split('.')[1];
          data.nutrition[key] = value;
        } else if (field.startsWith('author.')) {
          data.author[field.split('.')[1]] = value;
        } else if (field.startsWith('aggregateRating.')) {
          const key = field.split('.')[1];
          data.aggregateRating[key] = value;
        } else if (field.startsWith('video.')) {
          const key = field.split('.')[1];
          data.video[key] = value;
        } else if (field === 'keywords' || field === 'recipeCategory' || field === 'recipeCuisine') {
          data[field] = value;
        } else {
          data[field] = value;
        }
      }
    });

    data.recipeIngredient = data.recipeIngredient.filter(Boolean);
    data.recipeInstructions = data.recipeInstructions.filter(s => s.text || s.name || s.url || s.image);

    if (!data.author.name) delete data.author;
    if (Object.values(data.nutrition).every(v => !v)) delete data.nutrition;

    if (!data.aggregateRating.ratingValue || !data.aggregateRating.reviewCount) delete data.aggregateRating;
    else data.aggregateRating = cleanJsonLd(data.aggregateRating);

    // Very strict video cleanup: require name + (contentUrl OR embedUrl) + uploadDate
    // Otherwise Google flags as critical missing uploadDate
    if (
      !data.video.name ||
      (!data.video.contentUrl && !data.video.embedUrl) ||
      !data.video.uploadDate
    ) {
      delete data.video;
    } else {
      data.video = cleanJsonLd(data.video);
    }

    const jsonLd = buildJsonLdSkeleton('Recipe', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);

  // Auto-uppercase PT prefix on duration fields for better UX
  editorContainer.querySelectorAll('[data-field$="Time"]').forEach(input => {
    input.addEventListener('input', () => {
      let val = input.value.trim().toUpperCase();
      if (val && !val.startsWith('PT')) {
        val = 'PT' + val.replace(/^PT?/i, '');
      }
      if (val !== input.value) input.value = val;
    });
  });

  updatePreview();
}

export default { render };