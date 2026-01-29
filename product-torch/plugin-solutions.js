export function renderPluginSolutions(failedFactors, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = `
    <h3 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
      Targeted Fix Recommendations
    </h3>
  `;

  if (!failedFactors || failedFactors.length === 0) {
    html += `
      <div class="text-center p-10 bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 dark:border-green-800">
        <p class="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">No critical issues detected 🎉</p>
        <p class="text-lg text-gray-700 dark:text-gray-300">All checked metrics are above threshold — great job!</p>
      </div>
    `;
  } else {
    // Sort worst score first
    failedFactors.sort((a, b) => a.score - b.score);

    // Group by module for better readability
    const grouped = failedFactors.reduce((acc, f) => {
      if (!acc[f.module]) acc[f.module] = [];
      acc[f.module].push(f);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([moduleName, items]) => {
      html += `
        <div class="mb-12">
          <h4 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">${moduleName}</h4>
          <div class="space-y-6">
      `;

      items.forEach(f => {
        html += `
          <div class="p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/40 dark:to-pink-900/40 rounded-2xl border border-red-200 dark:border-red-800/60">
            <div class="flex items-center justify-between mb-4">
              <p class="text-xl font-bold text-red-700 dark:text-red-400">$$   {f.metric} (   $${f.grade.grade})</p>
              <span class="text-sm px-3 py-1 bg-red-100 dark:bg-red-900/50 rounded-full text-red-800 dark:text-red-300">
                ${f.score} / ${f.threshold}
              </span>
            </div>
            <p class="text-lg text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">${f.howToFix}</p>
            <div class="mt-4">
              <p class="font-semibold text-purple-700 dark:text-purple-400 mb-2">Recommended tools & plugins:</p>
              <ul class="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Try <strong>Schema App</strong> or <strong>Merkle SEO</strong> for schema issues</li>
                <li>Use <strong>Image SEO Optimizer</strong> or <strong>Alt Text AI</strong> for images</li>
                <li><strong>JSON-LD for SEO</strong> (Shopify) or free <a href="https://technicalseo.com/tools/schema-markup-generator/" class="underline text-purple-600">schema generator</a></li>
                <li>Validate with <a href="https://search.google.com/test/rich-results" class="underline text-purple-600">Google Rich Results Test</a></li>
              </ul>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;
    });
  }

  container.innerHTML = html;
}