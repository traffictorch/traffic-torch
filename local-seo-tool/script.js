// script.js
import { renderPluginSolutions } from './plugin-solutions.js';
import { moduleFixes } from './fixes.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const locationInput = document.getElementById('location');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';

  const progressModules = [
    "Fetching page...",
    "Scanning NAP & contact info...",
    "Analyzing local keywords & titles...",
    "Checking content relevance...",
    "Detecting maps & visual signals...",
    "Parsing structured data & schema...",
    "Evaluating reviews, canonical & links...",
    "Generating local SEO report..."
  ];

  let currentModuleIndex = 0;
  let moduleInterval;

  const getGrade = (score) => {
    if (score >= 90) {
      return {
        grade: 'Excellent',
        emoji: '🟢',
        color: '#22c55e',           // green-500
        border: 'border-green-500',
        text: 'text-green-600 dark:text-green-400',
        bgLight: 'bg-green-50 dark:bg-green-950/30',
        fill: '#22c55e'
      };
    }
    if (score >= 70) {
      return {
        grade: 'Strong',
        emoji: '🟢',
        color: '#16a34a',           // green-600
        border: 'border-green-600',
        text: 'text-green-700 dark:text-green-300',
        bgLight: 'bg-green-50 dark:bg-green-950/30',
        fill: '#16a34a'
      };
    }
    if (score >= 50) {
      return {
        grade: 'Average',
        emoji: '⚠️',
        color: '#f59e0b',           // amber-500
        border: 'border-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
        bgLight: 'bg-amber-50 dark:bg-amber-950/30',
        fill: '#f59e0b'
      };
    }
    return {
      grade: score >= 30 ? 'Needs Work' : 'Poor',
      emoji: '🔴',
      color: '#dc2626',             // red-600
      border: 'border-red-600',
      text: 'text-red-700 dark:text-red-300',
      bgLight: 'bg-red-50 dark:bg-red-950/30',
      fill: '#dc2626'
    };
  };

  const moduleHashes = {
    'NAP & Contact': 'nap-contact',
    'Local Keywords & Titles': 'keywords-titles',
    'Local Content & Relevance': 'content-relevance',
    'Maps & Visuals': 'maps-visuals',
    'Structured Data': 'structured-data',
    'Reviews & Structure': 'reviews-structure'
  };

  function startSpinnerLoader() {
    results.innerHTML = `
      <div id="loader" class="flex flex-col items-center justify-center space-y-4 mt-8">
        <div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p id="module-text" class="text-xl text-green-600 dark:text-green-300 font-medium"></p>
      </div>
    `;
    results.classList.remove('hidden');
    document.getElementById('module-text').textContent = progressModules[0];
    currentModuleIndex = 1;
    moduleInterval = setInterval(() => {
      if (currentModuleIndex < progressModules.length) {
        document.getElementById('module-text').textContent = progressModules[currentModuleIndex++];
      }
    }, 600);
  }

  function stopSpinnerLoader() {
    clearInterval(moduleInterval);
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
  }

  const fetchPage = async (url) => {
    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) throw new Error('Fetch failed');
      const html = await res.text();
      return new DOMParser().parseFromString(html, 'text/html');
    } catch {
      return null;
    }
  };

  const hasLocalIntent = (text = '', city = '') => {
    const lower = text.toLowerCase();
    return lower.includes('near me') || lower.includes(`in ${city}`) || lower.includes('local ') || lower.includes(city);
  };

  const getCleanContent = (doc) => {
    if (!doc?.body) return '';
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('nav, header, footer, aside, script, style, noscript').forEach(el => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const yourUrl = pageUrlInput.value.trim();
    const location = locationInput.value.trim();
    if (!yourUrl || !location) {
      results.innerHTML = '<p class="text-red-500 text-center text-xl p-10">Please enter both URL and location.</p>';
      results.classList.remove('hidden');
      return;
    }
    let fullUrl = yourUrl;
    if (!/^https?:\/\//i.test(yourUrl)) {
      fullUrl = 'https://' + yourUrl;
      pageUrlInput.value = fullUrl;
    }
    const city = location.split(',')[0].trim().toLowerCase();
    startSpinnerLoader();
    let yourDoc = await fetchPage(fullUrl);
    if (!yourDoc) {
      stopSpinnerLoader();
      results.innerHTML = `
        <div class="text-center p-10 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-red-500">
          <p class="text-xl text-red-600 dark:text-red-400 mb-6">Could not fetch the page (CORS or network issue).</p>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Paste your page HTML source below to analyze:</p>
          <textarea id="paste-html" class="w-full h-64 p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"></textarea>
          <button id="analyze-paste" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition">
            Analyze Pasted HTML
          </button>
        </div>
      `;
      results.classList.remove('hidden');
      document.getElementById('analyze-paste').addEventListener('click', () => {
        const pasted = document.getElementById('paste-html').value.trim();
        if (!pasted) return;
        try {
          yourDoc = new DOMParser().parseFromString(pasted, 'text/html');
          analyzePage(yourDoc, city, fullUrl, location);
        } catch {
          results.innerHTML += '<p class="text-red-500 mt-4">Invalid HTML pasted. Please copy the full source code.</p>';
        }
      });
      return;
    }
    analyzePage(yourDoc, city, fullUrl, location);
  });

  async function analyzePage(doc, city, fullUrl, location) {
    let yourScore = 0;
    const data = {};
    const allFixes = [];

    const passFail = (condition) => condition ? { status: '✅', color: 'text-green-600' } : { status: '❌', color: 'text-red-600' };

    // 1. NAP & Contact
    const addressEl = doc.querySelector('address, [itemprop="address"], footer, .contact, .location');
    const phoneEl = doc.querySelector('a[href^="tel:"], [itemprop="telephone"]');
    const napPresent = !!(addressEl?.textContent.trim() && phoneEl);
    const footerNap = !!doc.querySelector('footer')?.textContent.toLowerCase().includes(city) ||
                      !!doc.querySelector('footer address');
    const contactComplete = napPresent && (doc.querySelector('[itemprop="openingHours"]') || doc.querySelector('time, .hours'));
    data.nap = { present: napPresent, footer: footerNap, complete: contactComplete };

    if (!napPresent) allFixes.push({ module: 'NAP & Contact', sub: 'NAP Present', ...moduleFixes['NAP & Contact']['NAP Present'] });
    if (!footerNap) allFixes.push({ module: 'NAP & Contact', sub: 'Footer NAP', ...moduleFixes['NAP & Contact']['Footer NAP'] });
    if (!contactComplete) allFixes.push({ module: 'NAP & Contact', sub: 'Contact Complete', ...moduleFixes['NAP & Contact']['Contact Complete'] });

    const napScore = (napPresent ? 8 : 0) + (footerNap ? 5 : 0) + (contactComplete ? 5 : 0);
    yourScore += napScore;

    // 2. Local Keywords & Titles
    const titleText = doc.querySelector('title')?.textContent.trim() || '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.content.trim() || '';
    const titleLocal = hasLocalIntent(titleText, city);
    const metaLocal = hasLocalIntent(metaDesc, city);
    const headingsLocal = Array.from(doc.querySelectorAll('h1, h2')).some(h => hasLocalIntent(h.textContent, city));
    data.keywords = { title: titleLocal, meta: metaLocal, headings: headingsLocal };

    const keywordsScore = (titleLocal ? 7 : 0) + (metaLocal ? 5 : 0) + (headingsLocal ? 5 : 0);
    yourScore += keywordsScore;

    // 3. Local Content & Relevance (Rebalanced - max ~20)
    const cleanContent = getCleanContent(doc);
    const bodyLocalKeywords = hasLocalIntent(cleanContent, city) ? 1 : 0;
    const intentPatterns = (cleanContent.match(/near me|in\s+\w+|local\s+/gi) || []).length > 2 ? 1 : 0;
    const locationMentionsCount = (cleanContent.match(new RegExp(city, 'gi')) || []).length;
    const locationMentions = locationMentionsCount > 1 ? 1 : 0;

    data.content = { localKeywords: bodyLocalKeywords, intentPatterns, locationMentions };

    let contentScore = 
      (bodyLocalKeywords * 8) +
      (intentPatterns * 6) +
      (locationMentions * 6);

    if (locationMentionsCount >= 4) {
      contentScore += 4; // bonus for deep integration
    }
    contentScore = Math.min(20, contentScore);
    yourScore += contentScore;

    // 4. Maps & Visuals
    const mapIframe = doc.querySelector('iframe[src*="maps.google"], [src*="google.com/maps"]');
    const images = doc.querySelectorAll('img');
    const localAlts = Array.from(images).filter(img => hasLocalIntent(img.alt || '', city)).length > 0;
    data.maps = { embedded: !!mapIframe, localAlt: localAlts };

    const mapsScore = (mapIframe ? 8 : 0) + (localAlts ? 8 : 0);
    yourScore += mapsScore;

    // 5. Structured Data
    const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    let schemaData = {};
    schemaScripts.forEach(s => {
      try {
        const parsed = JSON.parse(s.textContent);
        if (parsed['@type'] === 'LocalBusiness') schemaData = parsed;
      } catch {}
    });
    const localSchemaPresent = !!schemaData['@type'];
    const geoCoords = !!schemaData?.geo?.latitude && !!schemaData?.geo?.longitude;
    const hoursPresent = !!schemaData?.openingHoursSpecification || !!schemaData?.openingHours;
    data.schema = { localPresent: localSchemaPresent, geoCoords, hours: hoursPresent };

    if (!localSchemaPresent) allFixes.push({ module: 'Structured Data', sub: 'Local Schema', ...moduleFixes['Structured Data']['Local Schema'] });
    if (!geoCoords) allFixes.push({ module: 'Structured Data', sub: 'Geo Coords', ...moduleFixes['Structured Data']['Geo Coords'] });
    if (!hoursPresent) allFixes.push({ module: 'Structured Data', sub: 'Opening Hours', ...moduleFixes['Structured Data']['Opening Hours'] });

    const schemaScore = (localSchemaPresent ? 8 : 0) + (geoCoords ? 5 : 0) + (hoursPresent ? 5 : 0);
    yourScore += schemaScore;

    // 6. Reviews, Canonical & Linking
    const aggregateRating = schemaData?.aggregateRating?.ratingValue;
    const canonical = doc.querySelector('link[rel="canonical"]')?.href === fullUrl;
    const internalGeoLinks = Array.from(doc.querySelectorAll('a')).filter(a =>
      a.href.includes('/contact') || a.href.includes('/locations') || hasLocalIntent(a.textContent, city)
    ).length > 0;
    data.reviews = { schema: !!aggregateRating, canonical, internalLinks: internalGeoLinks };

    if (aggregateRating) { /* good */ } else {
      allFixes.push({ module: 'Reviews & Structure', sub: 'Review Schema', ...moduleFixes['Reviews & Structure']['Review Schema'] });
    }
    if (!canonical) allFixes.push({ module: 'Reviews & Structure', sub: 'Canonical Tag', ...moduleFixes['Reviews & Structure']['Canonical Tag'] });
    if (!internalGeoLinks) allFixes.push({ module: 'Reviews & Structure', sub: 'Internal Geo Links', ...moduleFixes['Reviews & Structure']['Internal Geo Links'] });

    const reviewsScore = (aggregateRating ? 7 : 0) + (canonical ? 5 : 0) + (internalGeoLinks ? 5 : 0);
    yourScore += reviewsScore;

    yourScore = Math.min(100, Math.round(yourScore));

    // Title truncation for big card
    const pageTitle = doc.querySelector('title')?.textContent?.trim() || 'Your Page';
    const truncatedTitle = pageTitle.length > 65 
      ? pageTitle.substring(0, 62) + '...' 
      : pageTitle;

    stopSpinnerLoader();

    const moduleOrder = [
      'NAP & Contact', 'Local Keywords & Titles', 'Local Content & Relevance',
      'Maps & Visuals', 'Structured Data', 'Reviews & Structure'
    ];

    const topPriorityFixes = [];
    const moduleIssues = {};
    allFixes.forEach(f => {
      if (!moduleIssues[f.module]) moduleIssues[f.module] = [];
      moduleIssues[f.module].push(f);
    });

    moduleOrder.forEach(mod => {
      if (moduleIssues[mod] && moduleIssues[mod].length > 0) {
        topPriorityFixes.push(moduleIssues[mod][0]); // highest priority first in module
      }
    });
    topPriorityFixes.length = Math.min(3, topPriorityFixes.length);

    const bigGrade = getGrade(yourScore);

    const modules = [
      { name: 'NAP & Contact', score: napScore, sub: [
        { label: 'NAP Present', ...passFail(napPresent) },
        { label: 'Footer NAP', ...passFail(footerNap) },
        { label: 'Contact Complete', ...passFail(contactComplete) }
      ]},
      { name: 'Local Keywords & Titles', score: keywordsScore, sub: [
        { label: 'Title Local', ...passFail(titleLocal) },
        { label: 'Meta Local', ...passFail(metaLocal) },
        { label: 'Headings Local', ...passFail(headingsLocal) }
      ]},
      { name: 'Local Content & Relevance', score: contentScore, sub: [
        { label: 'Body Keywords', ...passFail(bodyLocalKeywords) },
        { label: 'Intent Patterns', ...passFail(intentPatterns) },
        { label: 'Location Mentions', ...passFail(locationMentions) }
      ]},
      { name: 'Maps & Visuals', score: mapsScore, sub: [
        { label: 'Map Embedded', ...passFail(mapIframe) },
        { label: 'Local Alt Text', ...passFail(localAlts) }
      ]},
      { name: 'Structured Data', score: schemaScore, sub: [
        { label: 'Local Schema', ...passFail(localSchemaPresent) },
        { label: 'Geo Coords', ...passFail(geoCoords) },
        { label: 'Opening Hours', ...passFail(hoursPresent) }
      ]},
      { name: 'Reviews & Structure', score: reviewsScore, sub: [
        { label: 'Review Schema', ...passFail(aggregateRating) },
        { label: 'Canonical Tag', ...passFail(canonical) },
        { label: 'Internal Geo Links', ...passFail(internalGeoLinks) }
      ]}
    ]
    console.log('DEBUG - modules array length:', modules.length);
console.log('DEBUG - module names:', modules.map(m => m.name).join(' | '));
    ;

    const scores = modules.map(m => m.score);

    results.innerHTML = `
      <!-- Overall Score Card -->
      <div class="flex justify-center my-12 px-4">
        <div class="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full border-4 ${bigGrade.border} border-opacity-60">
          <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6 truncate px-4" title="${pageTitle}">${truncatedTitle}</p>
          <div class="relative w-56 h-56 mx-auto md:w-64 md:h-64">
            <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
              <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
              <circle cx="100" cy="100" r="90"
                      stroke="${bigGrade.fill}"
                      stroke-width="16" fill="none"
                      stroke-dasharray="${(yourScore / 100) * 565} 565"
                      stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black drop-shadow-lg ${bigGrade.text}">
                  ${yourScore}
                </div>
                <div class="text-base md:text-lg opacity-80 -mt-1 text-gray-600 dark:text-gray-400">
                  /100
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 text-center">
            <p class="text-3xl md:text-4xl font-bold ${bigGrade.text}">
              ${bigGrade.emoji} ${bigGrade.grade}
            </p>
          </div>
        </div>
      </div>

      <!-- Radar Chart -->
      <div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl p-8">
          <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Local SEO Health Radar</h3>
          <div class="hidden md:block w-full">
            <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
          </div>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
            Radar chart available on desktop/tablet
          </p>
        </div>
      </div>

console.log('Number of modules to render:', modules.length);
console.log('Module names:', modules.map(m => m.name).join(', '));
console.log('DEBUG - Number of modules defined:', modules.length);
console.log('DEBUG - Module names:', modules.map(m => m.name).join(' | '));

<!-- TEST: Minimal grid to confirm all 6 modules render -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-12 px-4">
  ${modules.map((m, index) => `
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-300 dark:border-gray-600">
      <h3 class="text-xl font-bold">${index + 1}. ${m.name}</h3>
      <p>Score: ${Math.round(m.score)}</p>
      <p>Sub-metrics count: ${m.sub.length}</p>
    </div>
  `).join('')}
</div>

      <!-- Top Priority Fixes -->
      <div class="my-16">
        <h3 class="text-4xl font-bold text-center text-orange-600 mb-8">Top Priority Fixes</h3>
        ${topPriorityFixes.length ? `
          <div class="space-y-8 max-w-4xl mx-auto">
            ${topPriorityFixes.map((fix, i) => `
              <div class="p-6 md:p-8 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border-l-8 border-orange-500 flex flex-col md:flex-row gap-6">
                <div class="text-5xl md:text-6xl font-black text-orange-600 shrink-0">${i+1}</div>
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-3 mb-4">
                    <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">${fix.module}</span>
                    ${fix.priority === 'very-high' ? '<span class="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold">URGENT</span>' : ''}
                    ${fix.priority === 'high' ? '<span class="px-3 py-1 bg-orange-600 text-white rounded-full text-xs font-bold">HIGH</span>' : ''}
                  </div>
                  <h4 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">${fix.issue}</h4>
                  <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${fix.how}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-center text-green-500 text-2xl font-bold">Strong local optimization — keep it up!</p>'}
      </div>

      <!-- Plugin Solutions -->
      <div id="plugin-solutions-section" class="mt-20"></div>
    `;

    // Trigger plugins on critical failures
    const failedModules = modules.filter(m => m.score < 50).map(m => m.name);
    if (failedModules.length > 0) {
      renderPluginSolutions(failedModules);
    }

    // Radar Chart
    setTimeout(() => {
      const canvas = document.getElementById('health-radar');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: modules.map(m => m.name),
          datasets: [{
            label: 'Local SEO Score',
            data: scores,
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            borderColor: '#fb923c',
            borderWidth: 4,
            pointRadius: 8,
            pointHoverRadius: 12,
            pointBackgroundColor: scores.map(s => getGrade(s).fill),
            pointBorderColor: '#fff',
            pointBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              min: 0,
              max: 100,
              ticks: { stepSize: 20, color: '#9ca3af' },
              grid: { color: 'rgba(156, 163, 175, 0.3)' },
              angleLines: { color: 'rgba(156, 163, 175, 0.3)' },
              pointLabels: { color: '#9ca3af', font: { size: 15, weight: '600' } }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }, 150);
  }
});