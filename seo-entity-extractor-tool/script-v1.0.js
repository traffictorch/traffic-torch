document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('entity-form');
  const results = document.getElementById('results');

  if (!form) {
    console.error('Form #entity-form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const urlInput = document.getElementById('url-input');
    if (!urlInput) {
      console.error('URL input #url-input not found');
      alert('URL input field missing – check HTML');
      return;
    }

    const inputValue = urlInput.value.trim();
    const url = cleanUrl(inputValue);
    if (!url) return;

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-8">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500">Analyzing entities...</p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');

    try {
      progressText.textContent = "Fetching page content...";

      const res = await fetch("https://traffic-torch-entity-proxy.traffictorch.workers.dev/entity-analyze", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();

      progressText.textContent = "Rendering report...";

      const entitiesHTML = (data.extracted || []).map(entity => `
        <div class="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <p class="font-bold text-gray-800 dark:text-gray-200">${entity.text || 'Unknown'}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">${entity.type || 'Unknown'}</p>
          <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.round((entity.salience || 0) * 100)}%"></div>
          </div>
          <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
            Salience: ${(entity.salience || 0).toFixed(2)}
          </p>
        </div>
      `).join('') || '<p class="text-gray-600 dark:text-gray-400">No entities detected.</p>';

      const audit = data.audit || { overall: 30, suggestions: ['No audit data – check Worker response'] };
      const grade = getGrade(audit.overall);

      results.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-200">Entity Analysis Report</h2>
            <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Overall Semantic Health: <span class="$$   {grade.color} font-bold">   $${audit.overall}/100 ${grade.emoji} ${grade.text}</span>
            </p>
          </div>

          <div class="mb-12">
            <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Extracted Entities</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
              ${entitiesHTML}
            </div>
          </div>

          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Audit & Recommendations</h3>
            <ul class="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              ${audit.suggestions?.map(s => `<li>${s}</li>`).join('') || '<li>No suggestions available.</li>'}
            </ul>
          </div>
        </div>
      `;

    } catch (err) {
      console.error('Analysis error:', err);
      results.innerHTML = `
        <div class="text-center py-12 text-red-600 dark:text-red-400">
          <p class="text-xl font-bold">Error during analysis</p>
          <p class="mt-4">${err.message || 'Unknown error – check console'}</p>
        </div>
      `;
    }
  });

  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function getGrade(score) {
    if (score >= 80) return { text: 'Excellent', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
    if (score >= 60) return { text: 'Good', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
    return { text: 'Needs Work', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
  }
});