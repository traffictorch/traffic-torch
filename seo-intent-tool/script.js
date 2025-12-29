document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const parts = trimmed.split('/', 1);
    const host = parts[0];
    const path = trimmed.slice(host.length);
    return 'https://' + host + path;
  }

  // Clean PDF print without breaking layout
  function printReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Traffic Torch SEO Intent Report</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; background: white; color: black; }
          @media print {
            body { padding: 1rem; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1 class="text-4xl font-black text-center mb-8 bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
          Traffic Torch SEO Intent Report
        </h1>
        <div class="max-w-5xl mx-auto">
          ${results.innerHTML}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    // Optional: close after short delay if user cancels
    printWindow.addEventListener('afterprint', () => printWindow.close());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputValue = document.getElementById('url-input').value;
    const url = cleanUrl(inputValue);
    console.log('Input:', inputValue);
    console.log('Cleaned URL sent to proxy:', url);
    if (!url) return;

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-2 mt-2">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500"></p>
      </div>
    `;
    results.classList.remove('hidden');
    const progressText = document.getElementById('progress-text');

    try {
      progressText.textContent = "Fetching & Analyzing Page...";
      await sleep(800);
      const res = await fetch("https://cors-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable – check URL');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      function getVisibleText(root) {
        let text = '';
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'head', 'iframe', 'object', 'embed'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.hasAttribute('hidden') || parent.getAttribute('aria-hidden') === 'true') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        while (walker.nextNode()) {
          text += walker.currentNode.textContent + ' ';
        }
        return text.trim();
      }

      const text = getVisibleText(doc.body) || '';
      const cleanedText = text.replace(/\s+/g, ' ').trim();
      const words = cleanedText ? cleanedText.split(' ').filter(w => w.length > 0).length : 0;
      const sentences = cleanedText ? (cleanedText.match(/[.!?]+/g) || []).length || 1 : 1;
      const syllables = cleanedText ? cleanedText.split(' ').reduce((acc, word) => {
        const vowelGroups = (word.toLowerCase().match(/[aeiouy]+/g) || []).length;
        return acc + Math.max(vowelGroups, 1);
      }, 0) : 0;
      const readability = words > 0 ? Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)) : 0;

      progressText.textContent = "Analyzing E-E-A-T & Schema...";
      await sleep(800);

      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i], .byline, [itemprop="author"]');
      const schemaTypes = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const json = JSON.parse(s.textContent);
          const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
          schemaTypes.push(...types.filter(Boolean));
        } catch {}
      });

      const titleLower = (doc.title || '').toLowerCase();
      const bodyLower = cleanedText.toLowerCase();
      let intent = 'Informational';
      let confidence = 60;
      if (/buy|price|deal|shop|cart|purchase|order|checkout/i.test(titleLower + bodyLower)) {
        intent = 'Transactional'; confidence = 91;
      } else if (/best|review|vs|comparison|top/i.test(titleLower + bodyLower)) {
        intent = 'Commercial'; confidence = 90;
      } else if (/near me|location|store|hours|address|map/i.test(titleLower + bodyLower)) {
        intent = 'Local'; confidence = 87;
      } else if (/how|what|why|guide|tutorial|learn/i.test(titleLower + bodyLower)) {
        intent = 'Informational'; confidence = 94;
      }

      const isProductPage = /add to cart|price|buy now|in stock|product/i.test(bodyLower);
      const firstPersonMatches = text.match(/\b(I|we|my|our|I've|we've|me|us)\b/gi) || [];
      const firstPersonCount = firstPersonMatches.length;
      const experienceEvidence = firstPersonCount > 5 ? `Strong: ${firstPersonCount} first-person references found` : 'Limited personal voice detected';
      const credentialKeywords = (text.match(/\b(PhD|doctor|certified|years? experience|expert|author|published)\b/gi) || []).length;

      const eeat = {
        Experience: firstPersonCount > 12 ? 92 : firstPersonCount > 5 ? 75 : 45,
        Expertise: hasAuthor || credentialKeywords > 2 ? 90 : credentialKeywords > 0 ? 70 : 32,
        Authoritativeness: schemaTypes.length > 2 ? 94 : schemaTypes.length > 0 ? 80 : 40,
        Trustworthiness: url.startsWith('https') ? 96 : 60
      };
      const eeatAvg = Math.round(Object.values(eeat).reduce((a, b) => a + b) / 4);

      const depthScore = words > 2000 ? 95 : words > 1200 ? 82 : words > 700 ? 65 : words > 300 ? 50 : 35;
      const readScore = readability > 70 ? 90 : readability > 50 ? 75 : readability > 30 ? 55 : 35;
      const overall = Math.round((depthScore + readScore + eeatAvg + confidence + schemaTypes.length * 8) / 5);

      progressText.textContent = "Generating Detailed Report...";
      await sleep(600);

      results.innerHTML = `
<!-- Big Score Circle -->
<div class="flex justify-center my-12 px-4">
  <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
    <svg viewBox="0 0 260 260" class="w-full h-full transform -rotate-90">
      <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
      <circle cx="130" cy="130" r="120"
              stroke="${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}"
              stroke-width="18" fill="none"
              stroke-dasharray="${(overall / 100) * 754} 754"
              stroke-linecap="round"/>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div class="text-5xl sm:text-6xl md:text-7xl font-black drop-shadow-2xl"
             style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
          ${overall}
        </div>
        <div class="text-xl sm:text-2xl opacity-80 -mt-2"
             style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
          /100
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Intent -->
<div class="text-center mb-12">
  <p class="text-4xl font-bold text-gray-500 mb-8">
    Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
    <span class="text-2xl text-gray-500">— ${confidence}% match</span>
  </p>
  <div class="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-left">
    <div class="p-6 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
      <p class="font-bold text-blue-500">What it is</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">The core motivation driving a user's search query — whether they're seeking information, researching options, ready to purchase, or looking for a local service. Understanding this ensures your content delivers exactly what searchers expect.</p>
    </div>
    <div class="p-6 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl">
      <p class="font-bold text-green-500">How to satisfy it</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">Craft your title, H1, meta description, and body content to directly address the user's specific need. Use matching language, structure (e.g., lists for comparisons, steps for how-tos), and calls-to-action — eliminate fluff, assumptions, or mismatched elements.</p>
    </div>
    <div class="p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
      <p class="font-bold text-orange-500">Why it matters</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">Search engines prioritize pages that best align with user intent, leading to higher satisfaction, longer engagement, and lower bounces. Strong alignment drives traffic and conversions.</p>
    </div>
  </div>
  <p class="mt-8 text-lg text-gray-600">Your page shows <strong>${intent}</strong> signals via title and body content — excellent foundation!</p>
</div>

<!-- E-E-A-T Breakdown with Evidence -->
<div class="grid md:grid-cols-4 gap-6 my-16">
  ${Object.entries(eeat).map(([key, val]) => {
    let evidence = '';
    if (key === 'Experience') evidence = experienceEvidence;
    else if (key === 'Expertise') evidence = hasAuthor ? 'Author byline detected' : credentialKeywords > 0 ? `${credentialKeywords} credential mentions` : 'No expertise signals';
    else if (key === 'Authoritativeness') evidence = schemaTypes.length ? `${schemaTypes.length} schema type(s)` : 'No schema';
    else evidence = url.startsWith('https') ? 'Secure HTTPS' : 'HTTP (insecure)';
    return `
    <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${val >= 80 ? 'border-green-500' : val >= 60 ? 'border-orange-500' : 'border-red-500'}">
      <div class="relative mx-auto w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
          <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
          <circle cx="64" cy="64" r="56"
                  stroke="${val >= 80 ? '#22c55e' : val >= 60 ? '#f97316' : '#ef4444'}"
                  stroke-width="12" fill="none"
                  stroke-dasharray="${(val/100)*352} 352"
                  stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-4xl font-black"
             style="color: ${val >= 80 ? '#22c55e' : val >= 60 ? '#f97316' : '#ef4444'};">
          ${val}
        </div>
      </div>
      <p class="mt-4 text-lg font-medium">${key}</p>
      <p class="mt-2 text-sm text-gray-600">${evidence}</p>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
        Show Tailored Fix
      </button>
      <div class="hidden mt-6 space-y-3 text-left text-sm">
        <p class="text-green-600 font-bold">Recommended action:</p>
        <p>${key === 'Experience' ? 'Add more personal anecdotes and first-person storytelling to prove real experience.'
          : key === 'Expertise' ? 'Include visible author bio with qualifications, certifications, or achievements.'
          : key === 'Authoritativeness' ? 'Implement relevant schema markup and earn quality backlinks.'
          : 'Ensure HTTPS and add trust elements like contact page and privacy policy.'}</p>
      </div>
    </div>`;
  }).join('')}
</div>

<!-- Content Depth + Readability + Schema -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  <!-- Depth -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Content Depth</h3>
    <p class="text-5xl font-black mb-2">${words.toLocaleString()}</p>
    <p class="text-gray-500 mb-4">words</p>
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Tailored Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">Current status</p>
      <p>${words < 800 ? `Only ${words} words — thin for ranking potential.` : 'Strong depth achieved!'}</p>
      <p class="text-green-500 font-bold">How to improve</p>
      <p>${isProductPage ? 'Add detailed ingredients, benefits, usage guides, customer stories, and FAQ.' : 'Expand with examples, data, comparisons, case studies, and structured sections.'}</p>
      <p class="text-orange-500 font-bold">Why it matters</p>
      <p>Depth is the #1 on-page ranking factor — comprehensive pages win top positions.</p>
    </div>
  </div>
  <!-- Readability -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Readability</h3>
    <p class="text-5xl font-black mb-2">${readability}</p>
    <p class="text-gray-500 mb-4">Flesch score</p>
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>How easily users can read and understand your content.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>${readability < 60 ? 'Shorten sentences, use active voice, bullet points, and simple words.' : 'Excellent — maintain clear, scannable format.'}</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Readable content reduces bounces and boosts engagement signals.</p>
    </div>
  </div>
  <!-- Schema -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Schema Detected</h3>
    ${schemaTypes.length ? `
      <select class="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
        ${schemaTypes.map(t => `<option>${t}</option>`).join('')}
      </select>
      <p class="mt-4 text-green-500 font-bold">${schemaTypes.length} type${schemaTypes.length > 1 ? 's' : ''} found</p>
    ` : '<p class="text-2xl text-red-500 mt-4">No schema detected</p>'}
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-green-500 font-bold">Recommended schema</p>
      <p>${isProductPage ? 'Product, Review, BreadcrumbList' : 'Article, Person, FAQPage, HowTo'}</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Enables rich snippets, boosts CTR, and strengthens E-E-A-T.</p>
    </div>
  </div>
</div>

<!-- Competitive Gap Table -->
<div class="overflow-x-auto my-12">
  <table class="w-full border-collapse border border-gray-300 dark:border-gray-600 text-left">
    <thead>
      <tr class="bg-gray-200 dark:bg-gray-700">
        <th class="p-4 font-bold">Metric</th>
        <th class="p-4 font-bold">Current</th>
        <th class="p-4 font-bold">Ideal</th>
        <th class="p-4 font-bold">Gap</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b"><td class="p-4 text-gray-500">Word Count</td><td class="p-4 text-gray-500">${words}</td><td class="p-4 text-gray-500">>1,500</td><td class="p-4 ${words<1500?'text-red-500':'text-green-500'}">${words<1500?'Add '+(1500-words)+' words':'Good'}</td></tr>
      <tr class="border-b"><td class="p-4 text-gray-500">Readability</td><td class="p-4 text-gray-500">${readability}</td><td class="p-4 text-gray-500">60-70</td><td class="p-4 ${readability<60||readability>70?'text-orange-500':'text-green-500'}">${readability<60||readability>70?'Adjust':'Good'}</td></tr>
      <tr class="border-b"><td class="p-4 text-gray-500">Schema Types</td><td class="p-4 text-gray-500">${schemaTypes.length}</td><td class="p-4 text-gray-500">≥2</td><td class="p-4 ${schemaTypes.length<2?'text-red-500':'text-green-500'}">${schemaTypes.length<2?'Add':'Good'}</td></tr>
      <tr><td class="p-4 text-gray-500">Author Bio</td><td class="p-4 text-gray-500">${hasAuthor?'Yes':'No'}</td><td class="p-4 text-gray-500">Yes</td><td class="p-4 ${!hasAuthor?'text-red-500':'text-green-500'}">${!hasAuthor?'Add':'Good'}</td></tr>
    </tbody>
  </table>
</div>

<!-- AI-Generated Prioritised Fixes (Dynamic) -->
<div class="space-y-8 my-16">
  <h3 class="text-4xl font-bold text-green-400 text-center mb-8">AI-Generated Prioritised Fixes</h3>
  ${(() => {
    const fixes = [];
    if (!hasAuthor) fixes.push({p:1, t:'Add Author Byline & Bio', d:'Critical for E-E-A-T — add name, photo, credentials.'});
    if (words < 1000) fixes.push({p:2, t:'Expand Content Depth', d:`Only ${words} words. Add ${isProductPage ? 'specs, benefits, reviews, FAQ' : 'examples, data, sections'} to reach 1,500+.`});
    if (schemaTypes.length < 2) fixes.push({p:3, t:'Add Schema Markup', d:`Implement ${isProductPage ? 'Product + Review' : 'Article + Person + FAQ'} for rich results.`});
    if (firstPersonCount < 6) fixes.push({p:4, t:'Boost Personal Experience', d:'Use more "I/we" storytelling to prove real expertise.'});
    if (readability < 60) fixes.push({p:5, t:'Improve Readability', d:'Break long sentences, add bullets, use simpler words.'});
    while (fixes.length < 3 && fixes.length > 0) {
      fixes.push({p:fixes.length+1, t:'Maintain Strength', d:'Continue building on existing strong signals.'});
    }
    return fixes.slice(0,5).map(f => `
      <div class="p-8 bg-gradient-to-r from-${f.p===1?'red':f.p===2?'orange':'purple'}-500/10 border-l-8 border-${f.p===1?'red':f.p===2?'orange':'purple'}-500 rounded-r-2xl">
        <div class="flex gap-6">
          <div class="text-5xl">${f.p===1?'🔴':f.p===2?'🟠':'🟣'}</div>
          <div>
            <h4 class="text-2xl font-bold">${f.t}</h4>
            <p class="mt-4 text-gray-600">${f.d}</p>
          </div>
        </div>
      </div>`).join('');
  })()}
</div>

<!-- Predictive Rank Forecast -->
<div class="text-center mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
  <p class="text-3xl font-medium opacity-80">Predictive Rank Forecast</p>
  <p class="text-8xl font-black mt-6">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
  <p class="text-4xl mt-8 font-bold">+${Math.round((100-overall)*1.5)}% traffic potential</p>
  <p class="mt-6 text-xl">Close the ${100-overall}-point gap with the fixes above.</p>
</div>

<!-- Clean PDF Button -->
<div class="text-center my-16">
  <button onclick="printReport()"
       class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
    📄 Save as PDF
  </button>
</div>
      `;

    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
});