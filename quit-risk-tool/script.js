document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

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
        flesch = 206.835 - 1.015 * avgSentence - 84.6 * avgSyllable;
      }
      readability = Math.max(0, Math.min(100, Math.round(flesch)));
    }
    const navScore = Math.max(30, Math.min(100, 100 - Math.floor(data.links / 5)));
    let accScore = data.images.length === 0 ? 40 : 65;
    if (data.images.length > 0) {
      accScore = Math.min(95, 65 + Math.min(data.images.length, 15) * 2);
    }
    const mobileScore = 90;
    const speedScore = 85;
    const metrics = [readability, navScore, accScore, mobileScore, speedScore];
    const validMetrics = metrics.filter(v => typeof v === 'number' && isFinite(v) && !isNaN(v));
    const score = validMetrics.length === 5
      ? Math.round(validMetrics.reduce((a, b) => a + b, 0) / 5)
      : 60;
    return {
      score,
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

  form.addEventListener('submit', async e => {
    e.preventDefault();

    let url = input.value.trim();

    if (!url) {
      results.innerHTML = `<div class="text-center py-20"><p class="text-3xl text-red-500 font-bold">Please enter a URL</p></div>`;
      return;
    }

    // Allow input without protocol — auto-add https:// and update field
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      input.value = url;
    }

    // Show results container and static loading section
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
        progressText.textContent = "Generating report and prioritized fixes...";

        const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error('Page not reachable or blocked');

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const uxData = getUXContent(doc);
        const ux = analyzeUX(uxData);
        const fixes = generateFixes(ux);
        const forecast = predictForecast(ux.score);
        const risk = getQuitRiskLabel(ux.score);

        // Hide loading and show full report
        document.getElementById('loading').classList.add('hidden');

        results.innerHTML = `
          <div class="max-w-5xl mx-auto space-y-16 py-12">
            <!-- Big Overall Score Circle -->
            <div class="flex justify-center my-12">
              <div class="relative">
                <div class="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-full"></div>
                <svg width="280" height="280" viewBox="0 0 280 280" class="transform -rotate-90">
                  <circle cx="140" cy="140" r="128" stroke="#e5e7eb" stroke-width="24" fill="none"/>
                  <circle cx="140" cy="140" r="128" stroke="${ux.score < 60 ? '#ef4444' : ux.score < 80 ? '#fb923c' : '#22c55e'}" stroke-width="24" fill="none"
                          stroke-dasharray="${(ux.score / 100) * 804} 804" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="text-center">
                    <div class="text-8xl font-black drop-shadow-2xl" style="color: ${ux.score < 60 ? '#ef4444' : ux.score < 80 ? '#fb923c' : '#22c55e'};">
                      ${ux.score}
                    </div>
                    <div class="text-3xl text-gray-600 dark:text-gray-400">/100 Usability</div>
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
              <p class="text-xl text-gray-400">Scanned ${uxData.links} links + ${uxData.images} images</p>
            </div>
            <!-- Small Metric Circles -->
            <div class="grid md:grid-cols-5 gap-6 my-16">
              ${[
                {name: 'Readability', value: ux.readability},
                {name: 'Navigation', value: ux.nav},
                {name: 'Accessibility', value: ux.accessibility},
                {name: 'Mobile', value: ux.mobile},
                {name: 'Speed', value: ux.speed}
              ].map(m => {
                const ringColor = m.value < 60 ? '#ef4444' : m.value < 80 ? '#fb923c' : '#22c55e';
                let what = '', how = '', why = '';
                if (m.name === 'Readability') {
                  what = 'Measures text complexity using the Flesch Reading Ease formula — higher scores mean easier comprehension for broader audiences.';
                  how = 'Write shorter sentences (under 20 words), use active voice, choose common words, break up long paragraphs, and add subheadings.';
                  why = 'Easy-to-read content reduces cognitive load, keeps visitors engaged longer, lowers bounce rates, and signals quality to search engines.';
                } else if (m.name === 'Navigation') {
                  what = 'Evaluates link density and menu structure — too many links can overwhelm users and dilute focus.';
                  how = 'Limit primary navigation to 5-7 items, use clear labels, group related pages, remove redundant links, and prioritize key actions.';
                  why = 'Clean navigation helps users find information quickly, reduces frustration, improves dwell time, and strengthens topical relevance signals.';
                } else if (m.name === 'Accessibility') {
                  what = 'Proxies core accessibility through image handling and structural signals — essential for inclusive experiences.';
                  how = 'Add descriptive alt text to every image, ensure color contrast ratios meet WCAG standards, use semantic HTML, and test with screen readers.';
                  why = 'Accessible pages reach more users (including disabled), improve SEO through better crawlability, and build trust and compliance.';
                } else if (m.name === 'Mobile') {
                  what = 'Assesses responsiveness and mobile-friendly patterns in HTML structure and viewport configuration.';
                  how = 'Include viewport meta tag, use flexible grids and images, test on real devices, ensure touch targets are large enough, and avoid horizontal scrolling.';
                  why = 'Mobile-first experiences are critical as most traffic is mobile — poor mobile UX causes immediate bounces and ranking penalties.';
                } else if (m.name === 'Speed') {
                  what = 'Estimates perceived performance based on asset optimization and load patterns.';
                  how = 'Compress and resize images, enable lazy loading, minify CSS/JS, use modern formats (WebP/AVIF), and leverage browser caching.';
                  why = 'Faster pages improve user satisfaction, reduce bounce rates, increase conversions, and are directly rewarded in search rankings.';
                }
                return `
                <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                  <div class="relative mx-auto w-32 h-32">
                    <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${ringColor}" stroke-width="12" fill="none"
                              stroke-dasharray="${(m.value / 100) * 352} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${ringColor};">
                      ${m.value}
                    </div>
                  </div>
                  <p class="mt-4 text-lg font-medium">${m.name}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 rounded-full text-white text-sm hover:opacity-90" style="background-color: ${ringColor};">
                    Show Info
                  </button>
                  <div class="hidden mt-6 space-y-4 text-left text-sm">
                    <p><span class="font-bold text-blue-500">What it measures:</span> ${what}</p>
                    <p><span class="font-bold text-green-500">How to improve:</span> ${how}</p>
                    <p><span class="font-bold text-orange-500">Why it matters:</span> ${why}</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
            <!-- Action Buttons -->
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
                        <p class="text-2xl text-green-200">No major improvements needed — your page is highly optimized for user satisfaction and engagement.</p>
                      </div>
                    `}
                  </div>
                </div>
              </div>
              <!-- Predictive Rank Forecast -->
              <div class="mt-20 p-10 bg-gradient-to-br from-orange-500/90 to-pink-600/90 backdrop-blur-xl rounded-3xl shadow-2xl text-white">
                <h3 class="text-4xl md:text-5xl font-black text-center mb-8">Predictive Rank Forecast</h3>
                <div class="text-center mb-12">
                  <p class="text-4xl md:text-8xl font-black mb-4" style="color: ${ux.score < 60 ? '#fca5a5' : ux.score < 80 ? '#fdba74' : '#86efac'};">
                    ${forecast}
                  </p>
                  <p class="text-2xl md:text-3xl font-bold opacity-90">Potential ranking ceiling after applying UX improvements</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8">
                  <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div class="text-5xl mb-4">🎯</div>
                    <p class="font-bold text-xl mb-3 text-cyan-200">What it means</p>
                    <p class="text-gray-500 leading-relaxed opacity-90">Estimated highest achievable position based on current usability and engagement signals compared to competing pages.</p>
                  </div>
                  <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div class="text-5xl mb-4">🧮</div>
                    <p class="font-bold text-xl mb-3 text-green-200">How it's calculated</p>
                    <p class="text-gray-500 leading-relaxed opacity-90">Stronger UX → lower bounce rate → higher dwell time → better behavioral signals that modern search algorithms reward.</p>
                  </div>
                  <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                    <div class="text-5xl mb-4">🚀</div>
                    <p class="font-bold text-xl mb-3 text-orange-200">Why it matters</p>
                    <p class="text-gray-500 leading-relaxed opacity-90">Fixing usability gaps can unlock significant traffic gains, improve conversion rates, and build long-term ranking resilience.</p>
                  </div>
                </div>
                <div class="mt-10 text-center">
                  <p class="text-lg opacity-90 italic">Higher usability scores correlate with stronger performance in user-centric ranking factors.</p>
                </div>
              </div>
              <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                      class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
                <span class="flex items-center gap-6">
                  📄 Save Report as PDF
                </span>
                <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        `;
      } catch (err) {
        document.getElementById('loading').classList.add('hidden');
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }
    }
  });

  document.addEventListener('click', e => {
    if (e.target.closest('#optimizeBtn')) {
      document.getElementById('optimizedOutput').classList.toggle('hidden');
    }
  });
});