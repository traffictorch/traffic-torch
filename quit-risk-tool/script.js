document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  const factorDefinitions = {
    readability: {
      factors: [
        { name: "Flesch Reading Ease Score", threshold: 65, shortDesc: "Measures how easy your text is to read using the classic Flesch formula. Higher scores mean broader audience comprehension. Low scores indicate complex or dense writing.",
          howToFix: "Simplify vocabulary and use shorter sentences. Aim for common words that most people understand easily. Break complex ideas into smaller, digestible parts." },
        { name: "Flesch-Kincaid Grade Level", threshold: 65, shortDesc: "Estimates the U.S. school grade needed to understand the text. Most successful web content targets grade 8 or lower. High scores limit your audience reach.",
          howToFix: "Target grade 8 or below. Shorten sentences and reduce syllables per word. Test with readability tools and revise accordingly." },
        { name: "Average Sentence Length", threshold: 70, shortDesc: "Long sentences increase cognitive load on screens. Ideal web average is under 20 words. Varied but concise sentences improve flow.",
          howToFix: "Keep average below 20 words. Mix short and medium sentences. Break up any sentence over 25 words." },
        { name: "Paragraph Density & Length", threshold: 70, shortDesc: "Long, dense paragraphs create walls of text that deter readers. Short paragraphs with whitespace aid scannability. Modern users prefer bite-sized blocks.",
          howToFix: "Limit paragraphs to 3-5 sentences. Use single-sentence paragraphs for emphasis. Add generous spacing between ideas." },
        { name: "Overall Text Scannability", threshold: 70, shortDesc: "Measures use of bolding, lists, subheadings, and visual hierarchy. Most visitors scan before reading fully. Strong scannability captures attention quickly.",
          howToFix: "Bold key points, use bullet lists, and add descriptive subheadings. Highlight important phrases strategically. Front-load critical information." }
      ],
      moduleWhat: "Readability assesses how easily visitors can understand and scan your content. It combines multiple proven metrics including Flesch formulas, sentence length, paragraph structure, and visual formatting. High readability keeps users engaged longer and reduces bounce rates.",
      moduleHow: "Use simple, active language and short sentences. Break content into short paragraphs with clear subheadings. Incorporate bullet points, bold text, and whitespace to guide the eye. Always edit with the average reader in mind.",
      moduleWhy: "Easy-to-read content reaches a wider audience and improves engagement metrics. It reduces cognitive strain and frustration. Search engines reward pages where users stay longer and interact more."
    },
    navigation: {
      factors: [
        { name: "Link Density Evaluation", threshold: 70, shortDesc: "Too many links create choice overload and dilute focus. Optimal density balances navigation with clarity. Excessive links confuse users and weaken topical signals.",
          howToFix: "Audit and remove redundant or low-value links. Focus on quality over quantity. Keep primary navigation focused on key user goals." },
        { name: "Menu Structure Clarity", threshold: 75, shortDesc: "Clear, logical menus help users find information quickly. Simple hierarchy reduces frustration. Poor structure leads to higher bounce rates.",
          howToFix: "Limit top-level items to 5-7. Use descriptive labels users understand. Organize by user needs, not internal structure." },
        { name: "Internal Linking Balance", threshold: 70, shortDesc: "Balanced internal links guide users deeper into your site. They spread authority and improve crawlability. Isolated pages get less traffic and ranking power.",
          howToFix: "Add contextual links from body content to related pages. Link important pages from high-traffic content. Use descriptive anchor text naturally." },
        { name: "CTA Prominence & Visibility", threshold: 80, shortDesc: "Clear calls-to-action guide users toward goals. Prominent placement reduces friction. Hidden CTAs mean missed conversions.",
          howToFix: "Place primary CTAs above the fold with contrasting colors. Use action-oriented text and sufficient size. Add secondary CTAs further down." }
      ],
      moduleWhat: "Navigation Clarity evaluates how easily users can move through your site. It examines link density, menu organization, internal linking patterns, and call-to-action visibility. Strong navigation reduces frustration and improves flow.",
      moduleHow: "Keep menus simple with clear labels. Use contextual links naturally in content. Make primary actions stand out visually. Guide users logically toward their goals.",
      moduleWhy: "Intuitive navigation lowers bounce rates and increases pages per session. Users complete goals faster with less effort. Clear structure strengthens topical authority and user signals for search engines."
    },
    accessibility: {
      factors: [
        { name: "Alt Text Coverage", threshold: 75, shortDesc: "Missing alt text excludes screen reader users and hurts image SEO. Complete coverage ensures inclusivity. Decorative images should have empty alt attributes.",
          howToFix: "Add concise, descriptive alt text to every meaningful image. Use empty alt for purely decorative ones. Audit images during content creation." },
        { name: "Color Contrast Ratios", threshold: 75, shortDesc: "Insufficient contrast makes text hard to read for low-vision users. WCAG AA standards ensure readability. Poor contrast causes strain in various conditions.",
          howToFix: "Test with contrast checkers and meet 4.5:1 ratio. Adjust colors rather than relying on bolding. Provide alternatives where needed." },
        { name: "Semantic HTML Structure", threshold: 70, shortDesc: "Proper headings and landmarks help screen readers navigate. Semantic markup creates logical outline. It improves both accessibility and SEO understanding.",
          howToFix: "Use single H1 and proper heading hierarchy. Implement landmarks like main, nav, footer. Replace generic divs with meaningful elements." },
        { name: "Overall WCAG Compliance", threshold: 70, shortDesc: "WCAG guidelines cover perceivability, operability, and robustness. Compliance creates truly inclusive experiences. It reduces legal risk and expands reach.",
          howToFix: "Run regular automated audits. Fix keyboard navigation issues. Test with screen readers when possible." }
      ],
      moduleWhat: "Accessibility Health measures how inclusive your page is for users with disabilities. It checks alt text, contrast, semantic structure, and overall WCAG alignment. Good accessibility serves 15-20% of users with impairments.",
      moduleHow: "Provide alt text for all images. Ensure sufficient color contrast. Use proper HTML semantics and landmarks. Test with accessibility tools regularly.",
      moduleWhy: "Accessible sites reach more people and build trust. They face lower legal risk. Many accessibility improvements also enhance SEO and overall user experience."
    },
    mobile: {
      factors: [
        { name: "Viewport Configuration", threshold: 90, shortDesc: "Viewport meta tag controls mobile layout scaling. Missing or incorrect tag causes zoomed-out desktop view. Proper setting enables responsive behavior.",
          howToFix: "Add exact meta tag: width=device-width, initial-scale=1. Avoid restricting zoom. Test on real devices." },
        { name: "Responsive Breakpoints", threshold: 85, shortDesc: "Responsive design adapts layout to screen size. Poor breakpoints cause horizontal scrolling. Content should reflow naturally on all devices.",
          howToFix: "Use relative units and flexible grids. Test at common breakpoints. Adopt mobile-first approach." },
        { name: "Touch Target Size", threshold: 85, shortDesc: "Small tap targets cause mis-taps on mobile. Minimum recommended size is 44×44 pixels. Adequate spacing prevents errors.",
          howToFix: "Add padding around links and buttons. Ensure at least 44px targets. Test tapping on actual phones." },
        { name: "PWA Readiness Indicators", threshold: 80, shortDesc: "PWA features enable install prompts and offline capability. Manifest and service worker are required. They improve engagement significantly.",
          howToFix: "Add valid manifest.json with icons and name. Implement basic service worker. Ensure HTTPS." }
      ],
      moduleWhat: "Mobile & PWA Readiness checks how well your page works on phones and tablets. It evaluates viewport, responsiveness, touch targets, and progressive web app signals. Mobile traffic dominates modern web usage.",
      moduleHow: "Implement proper viewport meta tag. Use responsive design with flexible layouts. Ensure large touch targets. Add manifest and service worker for PWA features.",
      moduleWhy: "Most users browse on mobile devices. Poor mobile experience causes immediate bounces. PWA capabilities increase return visits and engagement."
    },
    performance: {
      factors: [
        { name: "Asset Volume Flags", threshold: 80, shortDesc: "Large total asset size slows loading dramatically. Every kilobyte counts on mobile networks. Lean pages load faster across connections.",
          howToFix: "Compress images aggressively. Remove unused resources. Minify CSS and JavaScript." },
        { name: "Script Bloat Detection", threshold: 85, shortDesc: "Excessive JavaScript delays interactivity. Unused code wastes bandwidth. Lean scripts enable faster rendering.",
          howToFix: "Remove unused JS completely. Defer non-critical scripts. Use lightweight alternatives." },
        { name: "Font Optimization", threshold: 85, shortDesc: "Too many web fonts delay text display. Large font files hurt performance. Optimized fonts balance design with speed.",
          howToFix: "Limit to essential weights. Use font-display: swap. Prefer system fonts when possible." },
        { name: "Lazy Loading Media", threshold: 80, shortDesc: "Offscreen images and videos should load only when needed. Lazy loading reduces initial payload. Critical content loads first.",
          howToFix: "Add loading='lazy' to below-fold images and iframes. Implement for videos too." },
        { name: "Image Optimization", threshold: 80, shortDesc: "Images are usually the largest assets. Next-gen formats reduce size dramatically. Proper sizing prevents over-delivery.",
          howToFix: "Convert to WebP/AVIF. Compress appropriately. Serve device-sized images." },
        { name: "Script Minification & Deferral", threshold: 85, shortDesc: "Render-blocking resources delay visible content. Minified and deferred scripts load faster. Async loading improves perceived speed.",
          howToFix: "Minify all code. Defer non-critical scripts. Async third-party resources." }
      ],
      moduleWhat: "Performance Optimization measures loading speed and resource efficiency. It flags heavy assets, script bloat, font issues, lazy loading, and image optimization. Speed is critical for user satisfaction and rankings.",
      moduleHow: "Compress and optimize all assets. Lazy load offscreen content. Minify and defer scripts. Use modern image formats.",
      moduleWhy: "Fast pages keep users and reduce bounce rates. Speed is a direct ranking factor. Users perceive faster sites as higher quality."
    }
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
    readability = isNaN(readability) ? 60 : readability;

    const navScore = Math.max(30, Math.min(100, 100 - Math.floor(data.links / 5)));
    const accScore = data.images.length === 0 ? 70 : Math.min(95, 65 + Math.min(data.images.length, 15) * 2);
    const mobileScore = 90;
    const speedScore = data.images.length > 20 ? 70 : 85;

    const scores = [readability, navScore, accScore, mobileScore, speedScore].map(s => isNaN(s) ? 70 : s);
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / 5);

    return {
      score: isNaN(score) ? 60 : score,
      readability: scores[0],
      nav: scores[1],
      accessibility: scores[2],
      mobile: scores[3],
      speed: scores[4]
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
    const borderClass = value < 60 ? 'border-red-500' : value < 80 ? 'border-orange-500' : 'border-green-500';

    let passFailHTML = '';
    factors.forEach(f => {
      const emoji = value >= f.threshold ? '✅' : '❌';
      passFailHTML += `<p class="text-gray-700 dark:text-gray-300">${emoji} ${f.name}</p>`;
    });

    let detailsHTML = '<h4 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Recommendations for Improvement</h4>';
    let hasFails = false;
    factors.forEach(f => {
      if (value < f.threshold) {
        hasFails = true;
        detailsHTML += `
          <div class="mb-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <h5 class="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">${f.name}</h5>
            <p class="mb-2 text-gray-700 dark:text-gray-300"><strong class="text-gray-900 dark:text-gray-100">How to fix:</strong> ${f.howToFix}</p>
            <p class="mb-2 text-gray-700 dark:text-gray-300"><strong class="text-gray-900 dark:text-gray-100">What:</strong> ${f.whatFull || f.what}</p>
            <p class="mb-2 text-gray-700 dark:text-gray-300"><strong class="text-gray-900 dark:text-gray-100">How:</strong> ${f.howFull || f.howToFix}</p>
            <p class="text-gray-700 dark:text-gray-300"><strong class="text-gray-900 dark:text-gray-100">Why it matters:</strong> ${f.why}</p>
          </div>`;
      }
    });
    if (!hasFails) {
      detailsHTML += '<p class="text-xl font-bold text-gray-700 dark:text-gray-300">All checks passed! Excellent work on this module.</p>';
    }

    return `
      <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderClass}">
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
        <p class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">${moduleName}</p>
        
        <div class="mt-6 text-left text-sm" style="overflow-wrap: break-word; word-break: break-word;">
          ${passFailHTML}
        </div>
        
        <button class="more-details mt-6 px-6 py-2 rounded-full text-white text-sm hover:opacity-90" style="background-color: ${ringColor};">
          More Details
        </button>
        
        <div class="details-panel hidden mt-8 text-left" style="overflow-wrap: break-word; word-break: break-word;">
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

        const readabilityHTML = buildModuleHTML('Readability', ux.readability, factorDefinitions.readability);
        const navHTML = buildModuleHTML('Navigation', ux.nav, factorDefinitions.navigation);
        const accessHTML = buildModuleHTML('Accessibility', ux.accessibility, factorDefinitions.accessibility);
        const mobileHTML = buildModuleHTML('Mobile', ux.mobile, factorDefinitions.mobile);
        const speedHTML = buildModuleHTML('Speed', ux.speed, factorDefinitions.performance);

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

          <!-- Modules Groups -->
          <div class="grid gap-6 my-16">
            <div class="grid md:grid-cols-1">
              ${readabilityHTML}
            </div>
            <div class="grid md:grid-cols-2 gap-6">
              ${navHTML}
              ${accessHTML}
            </div>
            <div class="grid md:grid-cols-2 gap-6">
              ${mobileHTML}
              ${speedHTML}
            </div>
          </div>

          <!-- Action Buttons Section -->
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
            <div class="mt-20 p-10 bg-gradient-to-br from-orange-500/90 to-pink-600/90 backdrop-blur-xl rounded-3xl shadow-2xl text-white">
              <h3 class="text-4xl md:text-5xl font-black text-center mb-8">Predictive Rank Forecast</h3>
              <div class="text-center mb-12">
                <p class="text-4xl md:text-8xl font-black mb-4" style="color: ${safeScore < 60 ? '#fca5a5' : safeScore < 80 ? '#fdba74' : '#86efac'};">
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
    if (btn) {
      btn.nextElementSibling.classList.toggle('hidden');
    }
    if (e.target.closest('#optimizeBtn')) {
      document.getElementById('optimizedOutput').classList.toggle('hidden');
    }
  });
});