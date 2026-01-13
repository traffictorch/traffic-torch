import { renderPluginSolutions } from './plugin-solutions.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const locationInput = document.getElementById('location'); // New: location instead of keyword
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
    if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
    return { grade: 'Poor', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  };

  const moduleHashes = {
    'NAP & Contact': 'nap-contact',
    'Local Keywords & Titles': 'keywords-titles',
    'Local Content & Relevance': 'content-relevance',
    'Maps & Visuals': 'maps-visuals',
    'Structured Data': 'structured-data',
    'Reviews & Structure': 'reviews-structure'
  };

  const getModuleDiagnostics = (m, data, location) => {
    const diags = [];
    const city = location.split(',')[0].trim().toLowerCase(); // e.g., "sydney"

    if (m.name === 'NAP & Contact') {
      if (!data.nap.present) diags.push({status: '❌', issue: 'NAP missing or incomplete', how: 'Add full Name, Address, Phone in footer and contact page.'});
      else diags.push({status: '✅', issue: 'NAP present'});
      if (!data.nap.footer) diags.push({status: '⚠️', issue: 'No NAP in footer', how: 'Standardize NAP in site footer for crawler trust.'});
      if (!data.contact.complete) diags.push({status: '⚠️', issue: 'Incomplete contact info', how: 'Include hours, tel/mailto links, full address.'});
    } else if (m.name === 'Local Keywords & Titles') {
      if (!data.keywords.title) diags.push({status: '❌', issue: 'No local keyword in title', how: 'Include city/service in title (e.g., "Best Plumber in Sydney").'});
      if (!data.keywords.meta) diags.push({status: '⚠️', issue: 'Meta missing local intent', how: 'Add city/near me phrases in meta description.'});
      if (!data.keywords.headings) diags.push({status: '⚠️', issue: 'Headings lack location', how: 'Use city/service in H1/H2 (e.g., "Sydney Plumbing Services").'});
    } else if (m.name === 'Local Content & Relevance') {
      if (data.content.localKeywords === 0) diags.push({status: '❌', issue: 'No local keywords in body', how: 'Mention services + city naturally in content.'});
      if (data.content.intentPatterns === 0) diags.push({status: '⚠️', issue: 'No local intent phrases', how: 'Add "near me", "in [city]", "local [service]" naturally.'});
      if (data.content.locationMentions === 0) diags.push({status: '⚠️', issue: 'City not mentioned in content', how: 'Reference your location multiple times in main text.'});
    } else if (m.name === 'Maps & Visuals') {
      if (!data.maps.embedded) diags.push({status: '❌', issue: 'No embedded map', how: 'Embed Google Maps iframe on contact/location page.'});
      if (data.images.localAlt === 0) diags.push({status: '⚠️', issue: 'No local alt text on images', how: 'Add city/service to alt text of store/map photos.'});
    } else if (m.name === 'Structured Data') {
      if (!data.schema.localPresent) diags.push({status: '❌', issue: 'No LocalBusiness schema', how: 'Add JSON-LD LocalBusiness with address, geo.'});
      if (!data.schema.geoCoords) diags.push({status: '⚠️', issue: 'Missing geo coordinates', how: 'Include latitude/longitude in schema.'});
      if (!data.schema.hours) diags.push({status: '⚠️', issue: 'No opening hours schema', how: 'Add openingHoursSpecification in JSON-LD.'});
    } else if (m.name === 'Reviews & Structure') {
      if (!data.reviews.schema) diags.push({status: '⚠️', issue: 'No AggregateRating schema', how: 'Add review schema for stars in SERPs.'});
      if (!data.structure.canonical) diags.push({status: '⚠️', issue: 'Missing canonical tag', how: 'Add rel="canonical" for multi-location pages.'});
      if (data.structure.internalLinks === 0) diags.push({status: '⚠️', issue: 'No internal links to location pages', how: 'Link to /locations or /contact with local anchors.'});
    }
    return diags;
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
      if (!res.ok) return null;
      const html = await res.text();
      return new DOMParser().parseFromString(html, 'text/html');
    } catch {
      return null;
    }
  };

  // Helper: Check if text contains city or local intent patterns
  const hasLocalIntent = (text = '', city = '') => {
    const lower = text.toLowerCase();
    return lower.includes('near me') || 
           lower.includes(`in ${city}`) || 
           lower.includes('local ') || 
           lower.includes(city);
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
    const location = locationInput.value.trim(); // e.g., "Sydney, NSW"
    if (!yourUrl || !location) return;

    let fullUrl = yourUrl;
    if (!/^https?:\/\//i.test(yourUrl)) {
      fullUrl = 'https://' + yourUrl;
      pageUrlInput.value = fullUrl;
    }

    const city = location.split(',')[0].trim().toLowerCase();

    startSpinnerLoader();

    const yourDoc = await fetchPage(fullUrl);
    if (!yourDoc) {
      stopSpinnerLoader();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: Page not reachable. Try pasting HTML if CORS blocks.</p>`;
      return;
    }

    let yourScore = 0;
    const data = {};
    const allFixes = [];

    // 1. NAP & Contact Signals
    const addressEl = yourDoc.querySelector('address, [itemprop="address"], footer, .contact, .location');
    const phoneEl = yourDoc.querySelector('a[href^="tel:"], [itemprop="telephone"]');
    const napPresent = !!(addressEl?.textContent.trim() && phoneEl);
    const footerNap = !!yourDoc.querySelector('footer')?.textContent.toLowerCase().includes(city) ||
                      !!yourDoc.querySelector('footer address');
    const contactComplete = napPresent && yourDoc.querySelector('[itemprop="openingHours"]') || 
                           yourDoc.querySelector('time, .hours');
    data.nap = { present: napPresent, footer: footerNap, complete: contactComplete };
    const napScore = (napPresent ? 7 : 0) + (footerNap ? 5 : 0) + (contactComplete ? 5 : 0);
    yourScore += napScore;
    if (!napPresent) allFixes.push({module: 'NAP & Contact', issue: 'Add NAP', how: 'Include full name, address, phone in contact section.'});

    // 2. Local Keywords & Titles
    const titleText = yourDoc.querySelector('title')?.textContent.trim() || '';
    const metaDesc = yourDoc.querySelector('meta[name="description"]')?.content.trim() || '';
    const titleLocal = hasLocalIntent(titleText, city);
    const metaLocal = hasLocalIntent(metaDesc, city);
    const headingsLocal = Array.from(yourDoc.querySelectorAll('h1, h2')).some(h => hasLocalIntent(h.textContent, city));
    data.keywords = { title: titleLocal, meta: metaLocal, headings: headingsLocal };
    const keywordsScore = (titleLocal ? 6 : 0) + (metaLocal ? 5 : 0) + (headingsLocal ? 5 : 0);
    yourScore += keywordsScore;
    if (!titleLocal) allFixes.push({module: 'Local Keywords & Titles', issue: 'Add city to title', how: 'Include location in page title.'});

    // 3. Local Content & Relevance Signals
    const cleanContent = getCleanContent(yourDoc);
    const bodyLocalKeywords = hasLocalIntent(cleanContent, city) ? 1 : 0;
    const intentPatterns = (cleanContent.match(/near me|in\s+\w+|local\s+/gi) || []).length > 2 ? 1 : 0;
    const locationMentions = (cleanContent.match(new RegExp(city, 'gi')) || []).length > 1 ? 1 : 0;
    data.content = { localKeywords: bodyLocalKeywords, intentPatterns, locationMentions };
    const contentScore = (bodyLocalKeywords * 6) + (intentPatterns * 5) + (locationMentions * 5);
    yourScore += contentScore;
    if (bodyLocalKeywords === 0) allFixes.push({module: 'Local Content & Relevance', issue: 'Add local keywords', how: 'Mention services + city naturally.'});

    // 4. Maps & Visual Signals
    const mapIframe = yourDoc.querySelector('iframe[src*="maps.google"], [src*="google.com/maps"]');
    const images = yourDoc.querySelectorAll('img');
    const localAlts = Array.from(images).filter(img => hasLocalIntent(img.alt || '', city)).length > 0;
    data.maps = { embedded: !!mapIframe, localAlt: localAlts };
    const mapsScore = (mapIframe ? 8 : 0) + (localAlts ? 8 : 0);
    yourScore += mapsScore;
    if (!mapIframe) allFixes.push({module: 'Maps & Visuals', issue: 'Embed map', how: 'Add Google Maps iframe.'});

    // 5. Structured Data (Schema)
    const schemaScripts = yourDoc.querySelectorAll('script[type="application/ld+json"]');
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
    const schemaScore = (localSchemaPresent ? 7 : 0) + (geoCoords ? 5 : 0) + (hoursPresent ? 5 : 0);
    yourScore += schemaScore;
    if (!localSchemaPresent) allFixes.push({module: 'Structured Data', issue: 'Add LocalBusiness schema', how: 'Use JSON-LD with address, geo.'});

    // 6. Reviews, Canonical & Linking
    const aggregateRating = schemaData?.aggregateRating?.ratingValue;
    const canonical = yourDoc.querySelector('link[rel="canonical"]')?.href === fullUrl;
    const internalGeoLinks = Array.from(yourDoc.querySelectorAll('a')).filter(a => 
      a.href.includes('/contact') || a.href.includes('/locations') || hasLocalIntent(a.textContent, city)
    ).length > 0;
    data.reviews = { schema: !!aggregateRating, canonical, internalLinks: internalGeoLinks };
    const reviewsScore = (aggregateRating ? 6 : 0) + (canonical ? 5 : 0) + (internalGeoLinks ? 5 : 0);
    yourScore += reviewsScore;
    if (!aggregateRating) allFixes.push({module: 'Reviews & Structure', issue: 'Add review schema', how: 'Include AggregateRating in JSON-LD.'});

    yourScore = Math.min(100, Math.round(yourScore));

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
        topPriorityFixes.push(moduleIssues[mod][0]);
      }
    });

    topPriorityFixes.length = Math.min(3, topPriorityFixes.length);

    const bigGrade = getGrade(yourScore);

    const modules = [
      { name: 'NAP & Contact', score: napScore },
      { name: 'Local Keywords & Titles', score: keywordsScore },
      { name: 'Local Content & Relevance', score: contentScore },
      { name: 'Maps & Visuals', score: mapsScore },
      { name: 'Structured Data', score: schemaScore },
      { name: 'Reviews & Structure', score: reviewsScore }
    ];

    const scores = modules.map(m => m.score);

    results.innerHTML = `
      <!-- Overall Score Card -->
      <div class="flex justify-center my-12 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
          <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Your Page</p>
          <div class="relative w-56 h-56 mx-auto md:w-64 md:h-64">
            <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
              <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
              <circle cx="100" cy="100" r="90"
                      stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'}"
                      stroke-width="16" fill="none"
                      stroke-dasharray="${(yourScore / 100) * 565} 565"
                      stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black drop-shadow-lg"
                     style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'};">
                  ${yourScore}
                </div>
                <div class="text-base md:text-lg opacity-80 -mt-1"
                     style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'};">
                  /100
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 text-center">
            <p class="text-3xl md:text-4xl font-bold ${bigGrade.color}">
              ${bigGrade.emoji} ${bigGrade.grade}
            </p>
          </div>
        </div>
      </div>

      <!-- On-Page Health Radar Chart -->
      <div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Local SEO Health Radar</h3>
          <div class="hidden md:block w-full">
            <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
          </div>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
            Radar chart available on desktop/tablet
          </p>
        </div>
      </div>

      <!-- Small Metric Circles (6 modules, 3x2 grid) -->
      <div class="grid md:grid-cols-3 gap-8 my-16">
        ${modules.map(m => {
          const borderColor = m.score >= 80 ? 'border-green-500' : m.score >= 60 ? 'border-orange-400' : 'border-red-500';
          const textColor = m.score >= 80 ? 'text-green-600' : m.score >= 60 ? 'text-orange-600' : 'text-red-600';
          const grade = getGrade(m.score);
          return `
            <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
              <h4 class="text-xl font-medium mb-4">${m.name}</h4>
              <div class="relative w-28 h-28 mx-auto">
                <svg width="112" height="112" viewBox="0 0 112 112" class="transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                  <circle cx="56" cy="56" r="48" stroke="${textColor.replace('text-', '#')}"
                          stroke-width="12" fill="none" stroke-dasharray="${(m.score / 100) * 301} 301" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-4xl font-black ${textColor}">${Math.round(m.score)}</div>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-2xl font-bold ${grade.color}">
                  ${grade.emoji} ${grade.grade}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Top Priority Fixes -->
      <div class="my-16">
        <h3 class="text-4xl font-bold text-center text-orange-600 mb-8">Top Priority Fixes</h3>
        ${topPriorityFixes.length ? `
          <div class="space-y-8 max-w-4xl mx-auto">
            ${topPriorityFixes.map((fix, i) => `
              <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-l-8 border-orange-500 flex gap-6">
                <div class="text-5xl font-black text-orange-600">${i+1}</div>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">${fix.module}</span>
                  </div>
                  <h4 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">${fix.issue}</h4>
                  <p class="text-gray-800 dark:text-gray-200">${fix.how}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-center text-green-500 text-2xl font-bold">Strong local optimization — keep it up!</p>'}
      </div>

      <!-- Plugin Solutions Section -->
      <div id="plugin-solutions-section" class="mt-20"></div>
    `;

    // Trigger plugin solutions on critical failures (e.g., NAP, Schema)
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
            pointBackgroundColor: scores.map(s => s >= 80 ? '#22c55e' : s >= 60 ? '#fb923c' : '#ef4444'),
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
  });
});