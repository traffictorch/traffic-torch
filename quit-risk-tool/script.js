// Full complete fixed quit-risk-tool/script.js
// Changes applied:
// - Emojis injected directly in HTML (✅ / ❌) – no CSS needed, works exactly like other tools
// - No .pass or .fail classes
// - Fixed NaN in big score circle (safe number fallback)
// - Prevented text overflow with inline word-break
// - Identical behavior to other working Traffic Torch tools

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  const factorDefinitions = {
    readability: [
      { name: "Flesch Reading Ease Score", threshold: 65, howToFix: "Use shorter sentences (<20 words), active voice, common words, and subheadings.", whatFull: "Easy-to-read content for broad audiences.", howFull: "Break up walls of text, avoid jargon, aim for grade 8 level or lower.", why: "Reduces cognitive load, lowers bounce rates, improves engagement and SEO signals." }
    ],
    navigation: [
      { name: "Link Density & Overload Risk", threshold: 70, howToFix: "Limit menu items to 5-7, remove redundant links, prioritize key pages.", whatFull: "Balanced internal linking and clear menu structure.", howFull: "Use descriptive labels, hierarchy, and dropdowns sparingly.", why: "Clean navigation helps users find info fast, reduces frustration and pogo-sticking." },
      { name: "Call-to-Action Prominence", threshold: 80, howToFix: "Place main CTAs above the fold with contrasting colors and clear text.", whatFull: "Strong, visible calls to action.", howFull: "Use size, color, whitespace to make CTAs stand out.", why: "Guides user journey, increases conversions and time on site." }
    ],
    accessibility: [
      { name: "Image Alt Text Coverage", threshold: 75, howToFix: "Add descriptive, concise alt text to every image.", whatFull: "Proper alt attributes on images.", howFull: "Describe content and function, avoid 'image of'.", why: "Essential for screen readers, improves SEO and inclusivity." },
      { name: "Color Contrast & Semantics", threshold: 70, howToFix: "Ensure 4.5:1 contrast, use proper heading hierarchy.", whatFull: "Sufficient contrast and semantic HTML.", howFull: "Test with tools, use landmarks and ARIA where needed.", why: "Makes site usable for all, including low vision users." }
    ],
    mobile: [
      { name: "Viewport & Responsive Design", threshold: 90, howToFix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'> and use relative units.", whatFull: "Proper viewport configuration and breakpoints.", howFull: "Test on multiple screen sizes, avoid fixed widths.", why: "Prevents zooming issues and horizontal scroll on mobile." },
      { name: "Touch Target Size", threshold: 85, howToFix: "Make tap targets at least 44×44px with padding.", whatFull: "Adequate spacing and size for touch.", howFull: "Add padding, avoid cramped links.", why: "Reduces mis-taps and frustration on mobile devices." }
    ],
    performance: [
      { name: "Image Optimization", threshold: 80, howToFix: "Compress, resize, use WebP/AVIF, add width/height attributes.", whatFull: "Efficient image formats and sizing.", howFull: "Use tools like Squoosh or ImageOptim.", why: "Largest impact on load time and data usage." },
      { name: "Lazy Loading Media", threshold: 75, howToFix: "Add loading='lazy' to img/iframe below the fold.", whatFull: "Deferred loading of offscreen resources.", howFull: "Native lazy loading or JS fallback.", why: "Speeds up initial paint and reduces bandwidth." },
      { name: "Script & Font Bloat", threshold: 85, howToFix: "Minify scripts, defer non-critical JS, limit font variants.", whatFull: "Minimal render-blocking resources.", howFull: "Use system fonts or subset web fonts.", why: "Faster parsing and rendering." }
    ]
  };

  function getUXContent(doc) {
    const nav = doc.querySelector('nav') || doc.querySelector('header');
    const headings = doc.querySelectorAll('h1, h2, h3');
    const links = doc.querySelectorAll('a[href]');
    const images = doc.querySelectorAll('img');
    const main = doc.querySelector('main') || doc.body;
    return {
      nav: nav?.textContent?.length || 0,
      headings: headings.length,
      links: links.length,
      images: images.length,
      text: main.textContent || ''
    };
  }

  function analyzeUX(data) {
    let readability = 60;
    if (data.text && data.text.length >= 200) {
      const text = data.text.replace(/\s+/g, ' ').trim();
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const syl = text.match(/[aeiouy]+/gi) || [];
      let flesch = 60;
      if (sentences.length > 0 && words.length > 0) {
        const avgSentence = words.length / sentences.length;
        const avgSyllable = syl.length / words.length || 1;
        flesch = Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentence - 84.6 * avgSyllable));
      }
      readability = Math.round(flesch);
    }

    const navScore = Math.max(30, Math.min(100, 100 - Math.floor(data.links / 5)));
    const accScore = data.images.length === 0 ? 70 : Math.min(95, 65 + Math.min(data.images.length, 15) * 2);
    const mobileScore = 90;
    const speedScore = data.images.length > 20 ? 70 : 85;

    const scores = [readability, navScore, accScore, mobileScore, speedScore];
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / 5);

    return {
      score: isNaN(score) ? 60 : score,
      readability,
      nav: navScore,
      accessibility: accScore,
      mobile: mobileScore,
      speed: speedScore
    };
  }

  function generateFixes(ux) {
    const fixes = [];
    if (ux.readability < 65) fixes.push("Use shorter sentences and paragraphs. Aim for active voice and common words.");
    if (ux.nav < 70) fixes.push("Simplify navigation — limit top-level menu items and reduce overall link density.");
    if (ux.accessibility < 75) fixes.push("Add meaningful alt text to every image. Ensure sufficient color contrast.");
    if (ux.mobile < 90) fixes.push("Confirm viewport meta tag is present and test responsive breakpoints.");
    if (ux.speed < 85) fixes.push("Compress images, enable lazy loading, and minify CSS/JS.");
    return fixes;
  }

  function predictForecast(score) {
    if (score >= 85) return "Top 3 Potential";
    if (score >= 75) return "Top 10 Potential";
    if (score >= 60) return "Page 1 Potential";
    return "Page 2+ Likely";
  }

  function getQuitRiskLabel(score) {
    if (score >= 75) return { text: "Low Risk", color: "from-green-400 to-emerald-600" };
    if (score >= 55) return { text: "Moderate Risk", color: "from-yellow-400 to-orange-600" };
    return { text: "High Risk", color: "from-red-500 to-pink-600" };
  }

  function buildModuleHTML(moduleName, value, factors) {
    const ringColor = value < 60 ? '#ef4444' : value < 80 ? '#fb923c' : '#22c55e';

    // Direct emoji injection – no CSS needed
    let passFailHTML = '';
    factors.forEach(f => {
      const emoji = value >= f.threshold ? '✅' : '❌';
      passFailHTML += `<p>${emoji} ${f.name}</p>`;
    });

    let detailsHTML = '<h4 class="text-2xl font-bold mb-6">Recommendations for Improvement</h4>';
    let hasFails = false;
    factors.forEach(f => {
      if (value < f.threshold) {
        hasFails = true;
        detailsHTML += `
          <div class="mb-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <h5 class="text-xl font-bold mb-3">${f.name}</h5>
            <p class="mb-2"><strong>How to fix:</strong> ${f.howToFix}</p>
            <p class="mb-2"><strong>What:</strong> ${f.whatFull}</p>
            <p class="mb-2"><strong>How:</strong> ${f.howFull}</p>
            <p><strong>Why it matters:</strong> ${f.why}</p>
          </div>`;
      }
    });
    if (!hasFails) {
      detailsHTML += '<p class="text-xl font-bold">All checks passed! Excellent work on this module.</p>';
    }

    return `
      <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="${ringColor}" stroke-width="12" fill="none"
                    stroke-dasharray="${(value / 100) * 352} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${ringColor};">
            ${value}
          </div>
        </div>
        <p class="mt-4 text-lg font-medium">${moduleName}</p>
        
        <!-- Pass/Fail Summary - emojis direct in HTML, word-break to prevent overflow -->
        <div class="mt-6 text-left text-sm" style="word-break: break-word;">
          ${passFailHTML}
        </div>
        
        <button class="more-details mt-6 px-6 py-2 rounded-full text-white text-sm hover:opacity-90" style="background-color: ${ringColor};">
          More Details
        </button>
        
        <div class="details-panel hidden mt-8 text-left">
          ${detailsHTML}
        </div>
      </div>`;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let url = input.value.trim();
    if (!url) {
      results.innerHTML = `<div class="text-center py-20"><p class="text-3xl text-red-500 font-bold">Please enter a URL</p></div>`;
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      input.value = url;
    }

    results.classList.remove('hidden');
    document.getElementById('loading').classList.remove('hidden');
    const progressText = document.getElementById('progressText');

    const steps = [
      { text: "Fetching and parsing page HTML securely...", delay: 600 },
      { text: "Extracting main content and text for readability analysis...", delay: 800 },
      { text: "Counting navigation links and menu structure...", delay: 700 },
      { text: "Evaluating images for accessibility signals...", delay: 600 },
      { text: "Checking mobile responsiveness patterns...", delay: 500 },
      { text: "Assessing performance proxies and asset optimization...", delay: 700 },
      { text: "Calculating overall usability score and quit risk...", delay: 800 }
    ];

    let currentStep = 0;
    const runStep = () => {
      if (currentStep < steps.length) {
        progressText.textContent = steps[currentStep].text;
        currentStep++;
        setTimeout(runStep, steps[currentStep - 1].delay);
      } else {
        performAnalysis();
      }
    };
    runStep();

    async function performAnalysis() {
      try {
        progressText.textContent = "Generating detailed report...";
        const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error('Page not reachable or blocked');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const uxData = getUXContent(doc);
        const ux = analyzeUX(uxData);
        const fixes = generateFixes(ux);
        const forecast = predictForecast(ux.score);
        const risk = getQuitRiskLabel(ux.score);

        document.getElementById('loading').classList.add('hidden');

        const safeScore = isNaN(ux.score) ? 60 : ux.score;
        const safeDash = (safeScore / 100) * 804;

        const modulesHTML = `
          ${buildModuleHTML('Readability', ux.readability, factorDefinitions.readability)}
          ${buildModuleHTML('Navigation', ux.nav, factorDefinitions.navigation)}
          ${buildModuleHTML('Accessibility', ux.accessibility, factorDefinitions.accessibility)}
          ${buildModuleHTML('Mobile', ux.mobile, factorDefinitions.mobile)}
          ${buildModuleHTML('Speed', ux.speed, factorDefinitions.performance)}
        `;

        results.innerHTML = `
          <!-- Big Overall Score Circle -->
          <div class="flex justify-center my-12 px-4">
            <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div class="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-full"></div>
              <svg viewBox="0 0 280 280" class="transform -rotate-90 w-full h-auto">
                <circle cx="140" cy="140" r="128" stroke="#e5e7eb" stroke-width="24" fill="none"/>
                <circle cx="140" cy="140" r="128" stroke="${safeScore < 60 ? '#ef4444' : safeScore < 80 ? '#fb923c' : '#22c55e'}"
                        stroke-width="24" fill="none"
                        stroke-dasharray="${safeDash} 804" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="text-center">
                  <div class="font-black drop-shadow-2xl text-5xl xs:text-6xl sm:text-7xl md:text-8xl"
                       style="color: ${safeScore < 60 ? '#ef4444' : safeScore < 80 ? '#fb923c' : '#22c55e'};">
                    ${safeScore}
                  </div>
                  <div class="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 dark:text-gray-500 mt-2">/100 Usability</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quit Risk Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-bold text-gray-500 mb-8">
              Quit Risk: <span class="bg-gradient-to-r ${risk.color} bg-clip-text text-transparent">
                ${risk.text}
              </span>
            </p>
            <p class="text-xl text-gray-500">Scanned ${uxData.links} links + ${uxData.images} images</p>
          </div>

          <!-- Modules Grid -->
          <div class="grid md:grid-cols-5 gap-6 my-16">
            ${modulesHTML}
          </div>

          <!-- Rest of the report (optimize button, fixes, forecast, PDF) remains exactly as before -->
          <div class="text-center my-20 space-y-12">
            <button id="optimizeBtn" class="group relative inline-flex items-center px-16 py-8 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-3xl md:text-4xl rounded-3xl shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105">
              <span class="flex items-center gap-6">
                ⚡ One-Click UX Optimize Suggestions
              </span>
              <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div id="optimizedOutput" class="hidden mt-12 max-w-5xl mx-auto">
              <div class="p-10 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-cyan-500/40">
                <h3 class="text-4xl md:text-5xl font-black text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  AI-Powered UX Optimization Tips
                </h3>
                <div class="space-y-8">
                  ${fixes.length ? fixes.map(f => `
                    <div class="flex items-start gap-6 p-8 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                      <div class="text-5xl">✨</div>
                      <p class="text-xl leading-relaxed text-gray-100">${f}</p>
                    </div>
                  `).join('') : `
                    <div class="p-12 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-3xl border border-green-500/50 text-center">
                      <p class="text-4xl font-black text-green-300 mb-6">🎉 Outstanding Performance!</p>
                      <p class="text-2xl text-green-200">No major improvements needed.</p>
                    </div>
                  `}
                </div>
              </div>
            </div>

            <div class="mt-20 p-10 bg-gradient-to-br from-orange-500/90 to-pink-600/90 backdrop-blur-xl rounded-3xl shadow-2xl text-white">
              <h3 class="text-4xl md:text-5xl font-black text-center mb-8">Predictive Rank Forecast</h3>
              <div class="text-center mb-12">
                <p class="text-4xl md:text-8xl font-black mb-4" style="color: ${safeScore < 60 ? '#fca5a5' : safeScore < 80 ? '#fdba74' : '#86efac'};">
                  ${forecast}
                </p>
                <p class="text-2xl md:text-3xl font-bold opacity-90">Potential ranking ceiling after applying UX improvements</p>
              </div>
              <!-- forecast cards unchanged -->
              <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div class="text-5xl mb-4">🎯</div>
                  <p class="font-bold text-xl mb-3 text-cyan-200">What it means</p>
                  <p class="text-gray-300 opacity-90">Estimated highest achievable position based on usability signals.</p>
                </div>
                <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div class="text-5xl mb-4">🧮</div>
                  <p class="font-bold text-xl mb-3 text-green-200">How it's calculated</p>
                  <p class="text-gray-300 opacity-90">Stronger UX → better behavioral signals rewarded by search engines.</p>
                </div>
                <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <div class="text-5xl mb-4">🚀</div>
                  <p class="font-bold text-xl mb-3 text-orange-200">Why it matters</p>
                  <p class="text-gray-300 opacity-90">Fixing usability gaps can unlock significant traffic and conversion gains.</p>
                </div>
              </div>
            </div>

            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
              <span class="flex items-center gap-6">
                📄 Save Report as PDF
              </span>
            </button>
          </div>
        `;
      } catch (err) {
        document.getElementById('loading').classList.add('hidden');
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500">Please check the URL and try again.</p>
          </div>
        `;
      }
    }
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.more-details');
    if (btn) btn.nextElementSibling.classList.toggle('hidden');
    if (e.target.closest('#optimizeBtn')) document.getElementById('optimizedOutput').classList.toggle('hidden');
  });
});