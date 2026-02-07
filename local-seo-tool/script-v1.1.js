// script-v1.1.js
import { renderPluginSolutions } from './plugin-solutions-v1.0.js';
import { moduleFixes } from './fixes-v1.0.js';
import { analyzeNapContact } from './module-nap-contact.js';
import { analyzeKeywordsTitles } from './module-keywords-titles.js';
import { analyzeContentRelevance } from './module-content-relevance.js';
import { analyzeMapsVisuals } from './module-maps-visuals.js';
import { analyzeStructuredData } from './module-structured-data.js';
import { analyzeReviewsStructure } from './module-reviews-structure.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const locationInput = document.getElementById('location');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';
  const progressModules = [
    "Fetching page...",
    "Scanning NAP & contact",
    "Analyzing local keywords",
    "Checking content relevance",
    "Detecting maps & visuals",
    "Parsing structured data",
    "Evaluating reviews & links",
    "Generating local report"
  ];
  let currentModuleIndex = 0;
  let moduleInterval;

  const getGrade = (score) => {
    if (score >= 90) {
      return {
        grade: 'Excellent',
        emoji: '🟢',
        color: '#22c55e',
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
        color: '#16a34a',
        border: 'border-green-600',
        text: 'text-green-700 dark:text-green-300',
        bgLight: 'bg-green-50 dark:bg-green-950/30',
        fill: '#16a34a'
      };
    }
    if (score >= 50) {
      return {
        grade: 'Needs Improvement',
        emoji: '⚠️',
        color: '#f59e0b',
        border: 'border-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
        bgLight: 'bg-amber-50 dark:bg-amber-950/30',
        fill: '#f59e0b'
      };
    }
    return {
      grade: 'Needs Work',
      emoji: '🔴',
      color: '#dc2626',
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

  const moduleWeights = {
    'NAP & Contact': 22,
    'Local Keywords & Titles': 18,
    'Local Content & Relevance': 20,
    'Maps & Visuals': 12,
    'Structured Data': 18,
    'Reviews & Structure': 10
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
    if (!text || !city) return false;
    const lower = text.toLowerCase();
    const cityLower = city.toLowerCase();
    const patterns = [
      'near me',
      `in ${cityLower}`,
      `near ${cityLower}`,
      `${cityLower} near me`,
      'local ',
      cityLower,
      `${cityLower} area`,
      `${cityLower} suburbs`,
      `${cityLower} cbd`,
    ];
    return patterns.some(p => lower.includes(p));
  };

  const getCleanContent = (doc) => {
    if (!doc?.body) return '';
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('nav, header, footer, aside, script, style, noscript').forEach(el => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  // ── FORM SUBMIT HANDLER ───────────────────────────────────────────────────────
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
      document.getElementById('analyze-paste')?.addEventListener('click', () => {
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
    const data = {};
    const allFixes = [];
    const passFail = (condition) => condition ? { status: '✅', color: 'text-green-600' } : { status: '❌', color: 'text-red-600' };

    // Run all 6 modular analyzers
    const napResult       = analyzeNapContact(doc, city);
    const keywordsResult  = analyzeKeywordsTitles(doc, city, hasLocalIntent);
    const contentResult   = analyzeContentRelevance(doc, city, getCleanContent, hasLocalIntent);
    const mapsResult      = analyzeMapsVisuals(doc, city, hasLocalIntent);
    const schemaResult    = analyzeStructuredData(doc);
    const reviewsResult   = analyzeReviewsStructure(doc, fullUrl, city, schemaResult.data);

    // Collect all fixes from modules
    allFixes.push(
      ...napResult.fixes,
      ...keywordsResult.fixes,
      ...contentResult.fixes,
      ...mapsResult.fixes,
      ...schemaResult.fixes,
      ...reviewsResult.fixes
    );

    // Build data object (still used in modules array sub checks)
    data.nap       = napResult.data;
    data.keywords  = keywordsResult.data;
    data.content   = contentResult.data;
    data.maps      = mapsResult.data;
    data.schema    = schemaResult.data;
    data.reviews   = reviewsResult.data;

    // ── Weighted Normalized Scoring ───────────────────────────────────────────────
    const normalizedModuleScores = {};
    let overallScore = 0;

    const moduleResults = {
      'NAP & Contact': napResult,
      'Local Keywords & Titles': keywordsResult,
      'Local Content & Relevance': contentResult,
      'Maps & Visuals': mapsResult,
      'Structured Data': schemaResult,
      'Reviews & Structure': reviewsResult
    };

    Object.keys(moduleWeights).forEach(mod => {
      const result = moduleResults[mod];
      const rawScore = result.score;
      const maxRaw   = result.maxRaw;
      const percentage = maxRaw > 0 ? (rawScore / maxRaw) * 100 : 0;
      const weighted = (percentage / 100) * moduleWeights[mod];
      normalizedModuleScores[mod] = Math.round(percentage);
      overallScore += weighted;
    });

    overallScore = Math.min(100, Math.round(overallScore));
    const yourScore = overallScore;

    // ── Potential improvement & fixes logic ───────────────────────────────────────
    let totalPotentialGain = 0;
    const fixGains = allFixes.map(fix => {
      let gain = 0;
      let trafficImpact = 'Low';
      switch (fix.sub) {
        case 'NAP Present': gain = 8; trafficImpact = 'High'; break;
        case 'Footer NAP': gain = 5; trafficImpact = 'Medium'; break;
        case 'Contact Complete': gain = 5; trafficImpact = 'Medium'; break;
        case 'Title Local': gain = 7; trafficImpact = 'Very High'; break;
        case 'Meta Local': gain = 5; trafficImpact = 'High'; break;
        case 'Headings Local': gain = 5; trafficImpact = 'Medium'; break;
        case 'Body Keywords': gain = 8; trafficImpact = 'High'; break;
        case 'Intent Patterns': gain = 6; trafficImpact = 'Medium'; break;
        case 'Location Mentions': gain = 6; trafficImpact = 'Medium'; break;
        case 'Map Embedded': gain = 8; trafficImpact = 'High'; break;
        case 'Local Alt Text': gain = 8; trafficImpact = 'Medium'; break;
        case 'Local Schema': gain = 8; trafficImpact = 'Very High'; break;
        case 'Geo Coords': gain = 5; trafficImpact = 'High'; break;
        case 'Opening Hours': gain = 5; trafficImpact = 'High'; break;
        case 'Review Schema': gain = 7; trafficImpact = 'High'; break;
        case 'Canonical Tag': gain = 5; trafficImpact = 'Medium'; break;
        case 'Internal Geo Links': gain = 5; trafficImpact = 'Medium'; break;
        default: gain = 3; trafficImpact = 'Low';
      }
      totalPotentialGain += gain;
      return { ...fix, estimatedGain: gain, trafficImpact };
    });

    const projectedScore = Math.min(100, yourScore + totalPotentialGain);
    const scoreDelta = projectedScore - yourScore;

    const pageTitle = doc.querySelector('title')?.textContent?.trim() || 'Your Page';
    const truncatedTitle = pageTitle.length > 65 ? pageTitle.substring(0, 62) + '...' : pageTitle;

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
      {
        name: 'NAP & Contact',
        score: normalizedModuleScores['NAP & Contact'],
        sub: [
          { label: 'NAP Present', ...passFail(napResult.data.present) },
          { label: 'Footer NAP', ...passFail(napResult.data.footer) },
          { label: 'Contact Complete', ...passFail(napResult.data.complete) }
        ]
      },
      {
        name: 'Local Keywords & Titles',
        score: normalizedModuleScores['Local Keywords & Titles'],
        sub: [
          { label: 'Title Local', ...passFail(keywordsResult.data.title) },
          { label: 'Meta Local', ...passFail(keywordsResult.data.meta) },
          { label: 'Headings Local', ...passFail(keywordsResult.data.headings) }
        ]
      },
      {
        name: 'Local Content & Relevance',
        score: normalizedModuleScores['Local Content & Relevance'],
        sub: [
          { label: 'Body Keywords', ...passFail(contentResult.data.localKeywords) },
          { label: 'Intent Patterns', ...passFail(contentResult.data.intentPatterns) },
          { label: 'Location Mentions', ...passFail(contentResult.data.locationMentions) }
        ]
      },
      {
        name: 'Maps & Visuals',
        score: normalizedModuleScores['Maps & Visuals'],
        sub: [
          { label: 'Map Embedded', ...passFail(mapsResult.data.embedded) },
          { label: 'Local Alt Text', ...passFail(mapsResult.data.localAlt) }
        ]
      },
      {
        name: 'Structured Data',
        score: normalizedModuleScores['Structured Data'],
        sub: [
          { label: 'Local Schema', ...passFail(schemaResult.data.localPresent) },
          { label: 'Geo Coords', ...passFail(schemaResult.data.geoCoords) },
          { label: 'Opening Hours', ...passFail(schemaResult.data.hours) }
        ]
      },
      {
        name: 'Reviews & Structure',
        score: normalizedModuleScores['Reviews & Structure'],
        sub: [
          { label: 'Review Schema', ...passFail(reviewsResult.data.schema) },
          { label: 'Canonical Tag', ...passFail(reviewsResult.data.canonical) },
          { label: 'Internal Geo Links', ...passFail(reviewsResult.data.internalLinks) }
        ]
      }
    ];

    // Scroll to results
    const offset = 240;
    const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });

    results.innerHTML = `
      <!-- Overall Score Card -->
      <div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
        <div class="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${bigGrade.border} border-opacity-60">
          <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
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
                <div class="text-5xl sm:text-6xl font-black drop-shadow-lg ${bigGrade.text}">
                  ${yourScore}
                </div>
                <div class="text-lg sm:text-xl opacity-80 -mt-1 text-gray-600 dark:text-gray-400">
                  /100
                </div>
              </div>
            </div>
          </div>
          <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mt-6 truncate px-3 sm:px-4" title="${pageTitle}">
            ${truncatedTitle}
          </p>
          <div class="mt-4 text-center">
            <p class="text-5xl sm:text-6xl font-bold ${bigGrade.text} drop-shadow-lg">
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
      <!-- Modern Scoring Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 my-12 px-4 w-full max-w-none mx-auto">
        ${modules.map((m, index) => {
          const grade = getGrade(m.score);
          const explanation = window.metricExplanations?.find(e => e.id === moduleHashes[m.name]) || { what: 'Local check' };
          const shortDesc = explanation.what ? explanation.what.split('.')[0] + '.' : 'Local SEO metric';
          const deepDiveId = moduleHashes[m.name];
          return `
            <div class="bg-white dark:bg-gray-950 rounded-3xl shadow-xl overflow-hidden border-2 ${grade.border} border-opacity-50 flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <div class="p-6 md:p-8 text-center border-b ${grade.bgLight} border-opacity-40">
                <div class="relative w-32 h-32 md:w-36 md:h-36 mx-auto">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="60" stroke="#e5e7eb" stroke-width="12" fill="none" class="dark:stroke-gray-700"/>
                    <circle cx="70" cy="70" r="60" stroke="${grade.fill}" stroke-width="12" fill="none" stroke-dasharray="${(m.score / 100) * 377} 377" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <div class="text-5xl md:text-6xl font-extrabold ${grade.text}">${Math.round(m.score)}</div>
                  </div>
                </div>
              </div>
              <h3 class="text-xl md:text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mt-6 mb-2 px-6">
                ${m.name}
              </h3>
              <p class="text-xl md:text-2xl font-bold text-center ${grade.text} mb-4 px-6">
                ${grade.emoji} ${grade.grade}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed px-6 mb-6">
                ${shortDesc}
              </p>
              <div class="px-6 pb-4">
                <button onclick="openModuleDetails('${deepDiveId}')" class="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl font-medium transition text-gray-900 dark:text-gray-100 shadow-sm text-center cursor-pointer">
                  More Details
                </button>
              </div>
              <div class="px-6 py-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
                ${m.sub.map(s => `
                  <div class="flex items-center gap-3">
                    <span class="text-2xl ${s.color}">${s.status}</span>
                    <span class="text-gray-800 dark:text-gray-200">${s.label}</span>
                  </div>
                `).join('')}
              </div>
              <div class="px-6 pt-2 pb-6">
                <button class="w-full px-6 py-3 ${grade.bgLight} hover:opacity-90 rounded-xl font-medium transition ${grade.text} shadow-sm" onclick="document.getElementById('fixes-${index}').classList.toggle('hidden')">
                  Show Fixes
                </button>
              </div>
              <div id="fixes-${index}" class="hidden px-6 pb-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm">
                ${allFixes.filter(f => f.module?.trim().toLowerCase() === m.name.trim().toLowerCase()).length > 0 ?
                  allFixes.filter(f => f.module?.trim().toLowerCase() === m.name.trim().toLowerCase()).map(f => `
                    <div class="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-semibold text-orange-600">${f.sub}</span>
                        ${f.priority === 'very-high' ? '<span class="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">URGENT</span>' :
                          f.priority === 'high' ? '<span class="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">HIGH</span>' : ''}
                      </div>
                      <p class="font-medium text-gray-900 dark:text-gray-100 mb-1">${f.issue}</p>
                      <p class="text-gray-700 dark:text-gray-300">${f.how}</p>
                    </div>
                  `).join('')
                : '<p class="text-green-600 dark:text-green-400 font-medium text-center">All checks passed – excellent!</p>'}
                <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button onclick="openModuleDetails('${moduleHashes[m.name]}')" class="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:underline font-medium cursor-pointer">
                    How ${m.name} is tested? <span class="text-xl">→</span>
                  </button>
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
            ${topPriorityFixes.map((fix, i) => {
              const gainFix = fixGains.find(f => f.module === fix.module && f.sub === fix.sub) || { estimatedGain: 5, trafficImpact: 'Medium' };
              const gainText = `+${gainFix.estimatedGain}–${gainFix.estimatedGain + 5} points`;
              let impactIcon = '📈';
              let impactColor = 'text-orange-600';
              if (gainFix.trafficImpact === 'Very High') {
                impactIcon = '🚀'; impactColor = 'text-red-600';
              } else if (gainFix.trafficImpact === 'High') {
                impactIcon = '📊'; impactColor = 'text-orange-600';
              }
              return `
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
              `;
            }).join('')}
          </div>
          <div class="max-w-5xl mx-auto mt-16 grid md:grid-cols-2 gap-8 px-4">
            <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 class="text-3xl font-bold text-center mb-8 text-orange-500">Overall Score Improvement</h3>
              <div class="flex justify-center items-baseline gap-4 mb-8">
                <div class="text-5xl font-black text-gray-800 dark:text-gray-200">${yourScore}</div>
                <div class="text-4xl text-gray-400">→</div>
                <div class="text-6xl font-black text-green-500">${projectedScore}</div>
                <div class="text-2xl text-green-600 font-medium">(${scoreDelta > 0 ? '+' + scoreDelta : 'Optimal'})</div>
              </div>
              <div class="text-center py-4">
                <p class="text-lg text-gray-600 dark:text-gray-400">
                  Fixing the top priorities above could boost your score by up to ${totalPotentialGain} points.
                </p>
              </div>
              <details class="mt-8 text-sm text-gray-600 dark:text-gray-400">
                <summary class="cursor-pointer font-medium text-orange-500 hover:underline text-center block">
                  How We Calculated This
                </summary>
                <div class="mt-4 space-y-2 px-2">
                  <p>• Weighted scoring across 6 key local modules (NAP, Keywords, Content, Maps, Schema, Reviews)</p>
                  <p>• Each module contributes proportionally based on real-world local SEO impact</p>
                  <p>• Projected score assumes full implementation of top priority fixes</p>
                  <p>• Top-ranking pages in local pack typically score 80+ on these on-page factors</p>
                  <p class="italic mt-4">Conservative estimate based on on-page optimization benchmarks from high-performing local sites</p>
                </div>
              </details>
            </div>
            <div class="p-8 bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
              <h3 class="text-3xl font-bold text-center mb-8">Potential Visibility & Traffic Gains</h3>
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class="text-4xl">📈</div>
                  <div class="flex-1">
                    <p class="font-medium">Ranking Position Lift</p>
                    <p class="text-2xl font-bold">Medium → High potential</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-4xl">🚀</div>
                  <div class="flex-1">
                    <p class="font-medium">Organic Traffic Increase</p>
                    <p class="text-2xl font-bold">+40–100% potential</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-4xl">👆</div>
                  <div class="flex-1">
                    <p class="font-medium">Click-Through Rate Boost</p>
                    <p class="text-2xl font-bold">+15–35% from better local signals</p>
                  </div>
                </div>
              </div>
              <div class="mt-10 text-sm space-y-2 opacity-90">
                <p>Conservative estimates based on on-page fixes.</p>
                <p>Actual gains depend on competition and off-page factors.</p>
              </div>
            </div>
          </div>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 max-w-3xl mx-auto">
            Conservative estimates based on on-page optimization benchmarks. Improvements often visible in 1–4 weeks.
          </p>
        ` : '<p class="text-center text-green-500 text-2xl font-bold">Strong local optimization — keep it up!</p>'}
      </div>
      <!-- Plugin Solutions -->
      <div id="plugin-solutions-section" class="mt-20"></div>
      <!-- PDF Button -->
      <div class="text-center my-16 px-4">
        <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
                class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:opacity-90 transition transform hover:scale-105">
          Save Report 📄
        </button>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          This will expand all sections for a complete printable report
        </p>
      </div>
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
            data: Object.values(normalizedModuleScores),
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            borderColor: '#fb923c',
            borderWidth: 4,
            pointRadius: 8,
            pointHoverRadius: 12,
            pointBackgroundColor: Object.values(normalizedModuleScores).map(s => getGrade(s).fill),
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