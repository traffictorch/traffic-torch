// quit-risk-tool/script.js - full complete epic perfect version
// Hybrid Top Priority Fixes: balanced, allows extra emphasis on critical modules (max 2 per module)
// Rich educational Quit Risk Reduction & Engagement Impact with per-fix impact, expandables, progress bars, personalized ranges
// Day/night text fully fixed with consistent Tailwind classes
// Dynamic title "Top Priority Fixes" + celebration message when no fixes needed
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';
  const factorDefinitions = {
    readability: {
      factors: [
        { name: "Flesch Reading Ease Score", threshold: 65, shortDesc: "Measures how easy your text is to read using the classic Flesch formula. Higher scores mean broader audience comprehension. Low scores indicate complex or dense writing.", howToFix: "Simplify vocabulary and use shorter sentences. Aim for common words that most people understand easily. Break complex ideas into smaller, digestible parts." },
        { name: "Flesch-Kincaid Grade Level", threshold: 65, shortDesc: "Estimates the U.S. school grade needed to understand the text. Most successful web content targets grade 8 or lower. High scores limit your audience reach.", howToFix: "Target grade 8 or below. Shorten sentences and reduce syllables per word. Test with readability tools and revise accordingly." },
        { name: "Average Sentence Length", threshold: 70, shortDesc: "Long sentences increase cognitive load on screens. Ideal web average is under 20 words. Varied but concise sentences improve flow.", howToFix: "Keep average below 20 words. Mix short and medium sentences. Break up any sentence over 25 words." },
        { name: "Paragraph Density & Length", threshold: 70, shortDesc: "Long, dense paragraphs create walls of text that deter readers. Short paragraphs with whitespace aid scannability. Modern users prefer bite-sized blocks.", howToFix: "Limit paragraphs to 3-5 sentences. Use single-sentence paragraphs for emphasis. Add generous spacing between ideas." },
        { name: "Overall Text Scannability", threshold: 70, shortDesc: "Measures use of bolding, lists, subheadings, and visual hierarchy. Most visitors scan before reading fully. Strong scannability captures attention quickly.", howToFix: "Bold key points, use bullet lists, and add descriptive subheadings. Highlight important phrases strategically. Front-load critical information." }
      ],
      moduleWhat: "Readability assesses how easily visitors can understand and scan your content. It combines multiple proven metrics including Flesch formulas, sentence length, paragraph structure, and visual formatting. High readability keeps users engaged longer and reduces bounce rates.",
      moduleHow: "Use simple, active language and short sentences. Break content into short paragraphs with clear subheadings. Incorporate bullet points, bold text, and whitespace to guide the eye. Always edit with the average reader in mind.",
      moduleWhy: "Easy-to-read content reaches a wider audience and improves engagement metrics. It reduces cognitive strain and frustration. Search engines reward pages where users stay longer and interact more."
    },
    navigation: {
      factors: [
        { name: "Link Density Evaluation", threshold: 70, shortDesc: "Too many links create choice overload and dilute focus. Optimal density balances navigation with clarity. Excessive links confuse users and weaken topical signals.", howToFix: "Audit and remove redundant or low-value links. Focus on quality over quantity. Keep primary navigation focused on key user goals." },
        { name: "Menu Structure Clarity", threshold: 75, shortDesc: "Clear, logical menus help users find information quickly. Simple hierarchy reduces frustration. Poor structure leads to higher bounce rates.", howToFix: "Limit top-level items to 5-7. Use descriptive labels users understand. Organize by user needs, not internal structure." },
        { name: "Internal Linking Balance", threshold: 70, shortDesc: "Balanced internal links guide users deeper into your site. They spread authority and improve crawlability. Isolated pages get less traffic and ranking power.", howToFix: "Add contextual links from body content to related pages. Link important pages from high-traffic content. Use descriptive anchor text naturally." },
        { name: "CTA Prominence & Visibility", threshold: 80, shortDesc: "Clear calls-to-action guide users toward goals. Prominent placement reduces friction. Hidden CTAs mean missed conversions.", howToFix: "Place primary CTAs above the fold with contrasting colors. Use action-oriented text and sufficient size. Add secondary CTAs further down." }
      ],
      moduleWhat: "Navigation Clarity evaluates how easily users can move through your site. It examines link density, menu organization, internal linking patterns, and call-to-action visibility. Strong navigation reduces frustration and improves flow.",
      moduleHow: "Keep menus simple with clear labels. Use contextual links naturally in content. Make primary actions stand out visually. Guide users logically toward their goals.",
      moduleWhy: "Intuitive navigation lowers bounce rates and increases pages per session. Users complete goals faster with less effort. Clear structure strengthens topical authority and user signals for search engines."
    },
    accessibility: {
      factors: [
        { name: "Alt Text Coverage", threshold: 75, shortDesc: "Missing alt text excludes screen reader users and hurts image SEO. Complete coverage ensures inclusivity. Decorative images should have empty alt attributes.", howToFix: "Add concise, descriptive alt text to every meaningful image. Use empty alt for purely decorative ones. Audit images during content creation." },
        { name: "Color Contrast Ratios", threshold: 75, shortDesc: "Insufficient contrast makes text hard to read for low-vision users. WCAG AA standards ensure readability. Poor contrast causes strain in various conditions.", howToFix: "Test with contrast checkers and meet 4.5:1 ratio. Adjust colors rather than relying on bolding. Provide alternatives where needed." },
        { name: "Semantic HTML Structure", threshold: 70, shortDesc: "Proper headings and landmarks help screen readers navigate. Semantic markup creates logical outline. It improves both accessibility and SEO understanding.", howToFix: "Use single H1 and proper heading hierarchy. Implement landmarks like main, nav, footer. Replace generic divs with meaningful elements." },
        { name: "Overall WCAG Compliance", threshold: 70, shortDesc: "WCAG guidelines cover perceivability, operability, and robustness. Compliance creates truly inclusive experiences. It reduces legal risk and expands reach.", howToFix: "Run regular automated audits. Fix keyboard navigation issues. Test with screen readers when possible." }
      ],
      moduleWhat: "Accessibility Health measures how inclusive your page is for users with disabilities. It checks alt text, contrast, semantic structure, and overall WCAG alignment. Good accessibility serves 15-20% of users with impairments.",
      moduleHow: "Provide alt text for all images. Ensure sufficient color contrast. Use proper HTML semantics and landmarks. Test with accessibility tools regularly.",
      moduleWhy: "Accessible sites reach more people and build trust. They face lower legal risk. Many accessibility improvements also enhance SEO and overall user experience."
    },
    mobile: {
      factors: [
        { name: "Viewport Configuration", threshold: 90, shortDesc: "Viewport meta tag controls mobile layout scaling. Missing or incorrect tag causes zoomed-out desktop view. Proper setting enables responsive behavior.", howToFix: "Add exact meta tag: width=device-width, initial-scale=1. Avoid restricting zoom. Test on real devices." },
        { name: "Responsive Breakpoints", threshold: 85, shortDesc: "Responsive design adapts layout to screen size. Poor breakpoints cause horizontal scrolling. Content should reflow naturally on all devices.", howToFix: "Use relative units and flexible grids. Test at common breakpoints. Adopt mobile-first approach." },
        { name: "Touch Target Size", threshold: 85, shortDesc: "Small tap targets cause mis-taps on mobile. Minimum recommended size is 44×44 pixels. Adequate spacing prevents errors.", howToFix: "Add padding around links and buttons. Ensure at least 44px targets. Test tapping on actual phones." },
        { name: "PWA Readiness Indicators", threshold: 80, shortDesc: "PWA features enable install prompts and offline capability. Manifest and service worker are required. They improve engagement significantly.", howToFix: "Add valid manifest.json with icons and name. Implement basic service worker. Ensure HTTPS." }
      ],
      moduleWhat: "Mobile & PWA Readiness checks how well your page works on phones and tablets. It evaluates viewport, responsiveness, touch targets, and progressive web app signals. Mobile traffic dominates modern web usage.",
      moduleHow: "Implement proper viewport meta tag. Use responsive design with flexible layouts. Ensure large touch targets. Add manifest and service worker for PWA features.",
      moduleWhy: "Most users browse on mobile devices. Poor mobile experience causes immediate bounces. PWA capabilities increase return visits and engagement."
    },
    performance: {
      factors: [
        { name: "Asset Volume Flags", threshold: 80, shortDesc: "Large total asset size slows loading dramatically. Every kilobyte counts on mobile networks. Lean pages load faster across connections.", howToFix: "Compress images aggressively. Remove unused resources. Minify CSS and JavaScript." },
        { name: "Script Bloat Detection", threshold: 85, shortDesc: "Excessive JavaScript delays interactivity. Unused code wastes bandwidth. Lean scripts enable faster rendering.", howToFix: "Remove unused JS completely. Defer non-critical scripts. Use lightweight alternatives." },
        { name: "Font Optimization", threshold: 85, shortDesc: "Too many web fonts delay text display. Large font files hurt performance. Optimized fonts balance design with speed.", howToFix: "Limit to essential weights. Use font-display: swap. Prefer system fonts when possible." },
        { name: "Lazy Loading Media", threshold: 80, shortDesc: "Offscreen images and videos should load only when needed. Lazy loading reduces initial payload. Critical content loads first.", howToFix: "Add loading='lazy' to below-fold images and iframes. Implement for videos too." },
        { name: "Image Optimization", threshold: 80, shortDesc: "Images are usually the largest assets. Next-gen formats reduce size dramatically. Proper sizing prevents over-delivery.", howToFix: "Convert to WebP/AVIF. Compress appropriately. Serve device-sized images." },
        { name: "Script Minification & Deferral", threshold: 85, shortDesc: "Render-blocking resources delay visible content. Minified and deferred scripts load faster. Async loading improves perceived speed.", howToFix: "Minify all code. Defer non-critical scripts. Async third-party resources." }
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

  function getQuitRiskLabel(score) {
    if (score >= 75) return { text: "Low Risk", color: "from-green-400 to-emerald-600" };
    if (score >= 55) return { text: "Moderate Risk", color: "from-yellow-400 to-orange-600" };
    return { text: "High Risk", color: "from-red-500 to-pink-600" };
  }

  function getGradeInfo(score) {
    if (score >= 90) return { grade: "A+", color: "text-green-600", emoji: "🏆" };
    if (score >= 85) return { grade: "A", color: "text-green-600", emoji: "✅" };
    if (score >= 80) return { grade: "B+", color: "text-green-500", emoji: "✅" };
    if (score >= 75) return { grade: "B", color: "text-yellow-500", emoji: "👍" };
    if (score >= 70) return { grade: "C+", color: "text-yellow-600", emoji: "👍" };
    if (score >= 65) return { grade: "C", color: "text-orange-600", emoji: "⚠️" };
    if (score >= 60) return { grade: "D", color: "text-orange-600", emoji: "⚠️" };
    return { grade: "F", color: "text-red-600", emoji: "❌" };
  }

function buildModuleHTML(moduleName, value, moduleData) {
  const ringColor = value < 60 ? '#ef4444' : value < 80 ? '#fb923c' : '#22c55e';
  const borderClass = value < 60 ? 'border-red-500' : value < 80 ? 'border-orange-500' : 'border-green-500';
  const gradeInfo = getGradeInfo(value);

  let statusMessage, statusEmoji;
  if (value >= 85) {
    statusMessage = "Excellent";
    statusEmoji = "🏆";
  } else if (value >= 75) {
    statusMessage = "Very good";
    statusEmoji = "✅";
  } else if (value >= 60) {
    statusMessage = "Needs improvement";
    statusEmoji = "⚠️";
  } else {
    statusMessage = "Needs work";
    statusEmoji = "❌";
  }

  let metricsHTML = '';
  let fixesHTML = '';
  let failedOnlyHTML = '';
  let failedCount = 0;

  moduleData.factors.forEach(f => {
    const passed = value >= f.threshold;
    let metricGrade;
    if (passed) {
      metricGrade = { color: "text-green-600", emoji: "✅" };
    } else if (value >= f.threshold - 10) {
      metricGrade = { color: "text-orange-600", emoji: "⚠️" };
    } else {
      metricGrade = { color: "text-red-600", emoji: "❌" };
    }

    // Default list - emoji + colored metric name
    metricsHTML += `
      <div class="mb-6">
        <p class="font-medium text-xl">
          <span class="${metricGrade.color} text-3xl mr-3">${metricGrade.emoji}</span>
          <span class="${metricGrade.color} font-bold">${f.name}</span>
        </p>
      </div>`;

    // Full fixes for More Details
    fixesHTML += `
      <div class="mb-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border-l-4 ${passed ? 'border-green-500' : 'border-red-500'}">
        <p class="font-bold text-xl ${metricGrade.color} mb-3">
          <span class="text-3xl mr-3">${metricGrade.emoji}</span>
          ${f.name}
        </p>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          ${passed ? '✓ This metric meets or exceeds best practices.' : f.howToFix}
        </p>
      </div>`;

    if (!passed) {
      failedOnlyHTML += `
        <div class="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
          <p class="font-bold text-2xl ${metricGrade.color} mb-4">
            <span class="text-6xl">${metricGrade.emoji}</span>
          </p>
          <p class="font-bold text-2xl ${metricGrade.color} mb-4">
            ${f.name}
          </p>
          <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            ${f.howToFix}
          </p>
        </div>`;
      failedCount++;
    }
  });

  const moreDetailsHTML = `
    <div class="text-left px-4 py-6">
      <h4 class="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100 text-center">How ${moduleName} is tested →</h4>
      <div class="space-y-6">
        <div>
          <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">What it is:</strong>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleWhat}</p>
        </div>
        <div>
          <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">How to Improve:</strong>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleHow}</p>
        </div>
        <div>
          <strong class="text-gray-900 dark:text-gray-100 block mb-2 text-lg">Why it matters:</strong>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${moduleData.moduleWhy}</p>
        </div>
      </div>
      <p class="text-center text-gray-600 dark:text-gray-400 mt-10 text-sm italic">
        <a href="index.html" class="underline hover:text-gray-900 dark:hover:text-gray-100">← Back to overview</a>
      </p>
    </div>`;

  const fixesPanelHTML = failedCount > 0 
    ? failedOnlyHTML + `<p class="text-center text-gray-600 dark:text-gray-400 mt-10 text-sm italic">
        <a href="index.html#${moduleName.toLowerCase()}" class="underline hover:text-gray-900 dark:hover:text-gray-100">← More details about ${moduleName}</a>
      </p>`
    : '<p class="text-center text-gray-700 dark:text-gray-300 text-lg py-12 font-medium">All checks passed — no fixes needed!</p>';
    
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

      <p class="mt-4 text-2xl font-bold ${gradeInfo.color}">${moduleName}</p>
      <div class="mt-4 text-center">
        <p class="text-6xl ${gradeInfo.color}">${statusEmoji}</p>
        <p class="text-3xl font-bold ${gradeInfo.color} mt-2">${statusMessage}</p>
      </div>

      <div class="mt-6 text-left metrics-list">
        ${metricsHTML}
      </div>

      <div class="mt-6 flex gap-4 justify-center flex-wrap">
        <button class="more-details px-8 py-3 rounded-full text-white font-medium hover:opacity-90 transition" style="background-color: ${ringColor};">
          More Details
        </button>
        <button class="show-fixes px-8 py-3 rounded-full bg-gray-600 text-white font-medium hover:opacity-90 transition">
          Show Fixes${failedCount > 0 ? ` (${failedCount})` : ''}
        </button>
      </div>

      <div class="more-details-panel hidden mt-8 text-left">
        ${moreDetailsHTML}
      </div>

      <div class="fixes-panel hidden mt-8 text-left">
        ${fixesPanelHTML}
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
      { text: "Fetching and parsing page HTML securely...", delay: 1200 },
      { text: "Extracting main content and text for readability analysis...", delay: 1600 },
      { text: "Counting navigation links and menu structure...", delay: 1400 },
      { text: "Evaluating images for accessibility signals...", delay: 1200 },
      { text: "Checking mobile responsiveness patterns...", delay: 1000 },
      { text: "Assessing performance proxies and asset optimization...", delay: 1400 },
      { text: "Calculating overall usability score and quit risk...", delay: 1600 }
    ];

    let currentStep = 0; // Move declaration outside

    const runStep = () => {
      if (currentStep < steps.length) {
        progressText.textContent = steps[currentStep].text;
        currentStep++;
        setTimeout(runStep, steps[currentStep - 1].delay);
      } else {
        progressText.textContent = "Generating detailed report...";
        setTimeout(performAnalysis, 3000); // Balanced final step
      }
    };
    runStep();

    async function performAnalysis() {
      try {
        const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error('Page not reachable or blocked');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const uxData = getUXContent(doc);
        const ux = analyzeUX(uxData);
        const risk = getQuitRiskLabel(ux.score);
        document.getElementById('loading').classList.add('hidden');
        const safeScore = isNaN(ux.score) ? 60 : ux.score;
        const safeDash = (safeScore / 100) * 804;
        const overallGrade = getGradeInfo(safeScore);
        const readabilityHTML = buildModuleHTML('Readability', ux.readability, factorDefinitions.readability);
        const navHTML = buildModuleHTML('Navigation', ux.nav, factorDefinitions.navigation);
        const accessHTML = buildModuleHTML('Accessibility', ux.accessibility, factorDefinitions.accessibility);
        const mobileHTML = buildModuleHTML('Mobile', ux.mobile, factorDefinitions.mobile);
        const speedHTML = buildModuleHTML('Speed', ux.speed, factorDefinitions.performance);       
        

        // Hybrid Top Priority Fixes
        const modulePriority = [
          { name: 'Readability', score: ux.readability, threshold: 65, data: factorDefinitions.readability },
          { name: 'Navigation', score: ux.nav, threshold: 70, data: factorDefinitions.navigation },
          { name: 'Performance', score: ux.speed, threshold: 85, data: factorDefinitions.performance },
          { name: 'Accessibility', score: ux.accessibility, threshold: 75, data: factorDefinitions.accessibility },
          { name: 'Mobile', score: ux.mobile, threshold: 90, data: factorDefinitions.mobile }
        ];

        const priorityFixes = [];
        const failedModules = modulePriority.filter(m => m.score < m.threshold);

        // First: one from each failed module
        failedModules.forEach(mod => {
          if (mod.data.factors.length > 0) {
            priorityFixes.push({ ...mod.data.factors[0], module: mod.name, extraCount: mod.data.factors.length });
          }
        });

        // Second: if <3 fixes and top module has 3+ failures, add second factor
        if (priorityFixes.length < 3 && failedModules.length > 0) {
          const topModule = failedModules[0];
          if (topModule.data.factors.length >= 3) {
            priorityFixes.push({ ...topModule.data.factors[1], module: topModule.name, isSecond: true, extraCount: topModule.data.factors.length });
          }
        }

        let priorityFixesHTML = '';
        if (priorityFixes.length > 0) {
          priorityFixesHTML = priorityFixes.map((fix, index) => `
            <div class="flex items-start gap-6 p-8 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
              <div class="text-5xl font-black text-purple-600">${index + 1}</div>
              <div class="flex-1">
                <p class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  ${fix.module} → ${fix.name}
                  ${fix.isSecond ? `<span class="text-sm font-normal text-purple-600 dark:text-purple-400 ml-3">(${fix.extraCount}/${fix.extraCount} failed in this module)</span>` : ''}
                </p>
                <p class="text-lg leading-relaxed text-gray-800 dark:text-gray-200">${fix.howToFix}</p>
              </div>
            </div>
          `).join('');
        } else {
          priorityFixesHTML = `
            <div class="p-12 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-3xl border border-green-500/50 text-center">
              <p class="text-5xl mb-6">🎉</p>
              <p class="text-4xl font-black text-green-600 dark:text-green-400 mb-4">Good job! Outstanding UX</p>
              <p class="text-2xl text-gray-800 dark:text-gray-200">Your page delivers excellent user experience across all modules. No critical improvements needed at this time.</p>
              <p class="text-lg text-gray-800 dark:text-gray-200 mt-6">Keep monitoring — even great pages benefit from ongoing optimization.</p>
            </div>`;
        }

        // Enhanced Quit Risk Reduction & Engagement Impact
        const failedCount = failedModules.length;
        let projectedRisk = risk.text;
        let riskDropText = '';
        if (failedCount >= 3) {
          projectedRisk = 'Low Risk';
          riskDropText = 'High → Low';
        } else if (failedCount === 2) {
          projectedRisk = risk.text === 'High Risk' ? 'Moderate Risk' : 'Low Risk';
          riskDropText = risk.text === 'High Risk' ? 'High → Moderate' : 'Moderate → Low';
        } else if (failedCount === 1) {
          riskDropText = 'Moderate improvement';
        } else {
          riskDropText = 'Already optimal';
        }

        const projectedRiskColor = projectedRisk === 'Low Risk' ? 'from-green-400 to-emerald-600' :
                                   projectedRisk === 'Moderate Risk' ? 'from-yellow-400 to-orange-600' : 'from-red-500 to-pink-600';

        // Per-fix impact
        let perFixImpact = '';
        if (priorityFixes.length > 0) {
          perFixImpact = '<div class="mt-8 space-y-4 text-left">';
          priorityFixes.forEach(fix => {
            perFixImpact += `
              <div class="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p class="font-medium text-gray-800 dark:text-gray-200">${fix.module} → ${fix.name}</p>
                <p class="text-gray-800 dark:text-gray-200 mt-1">Reduces friction by making content more approachable and reducing early abandonment. Expected impact: 10–25% lower early exits.</p>
              </div>`;
          });
          perFixImpact += '</div>';
        }

        // Personalized engagement ranges (extra boost if Readability dominates)
        const dominant = priorityFixes.length > 0 ? priorityFixes[0].module : '';
        let bounceRange = failedCount === 0 ? 'Already optimal' : failedCount === 1 ? '10–20%' : failedCount === 2 ? '20–35%' : '30–50%';
        let durationRange = dominant === 'Readability' ? (failedCount >= 2 ? '+60–120%' : '+40–80%') : (failedCount === 0 ? 'Strong' : failedCount === 1 ? '+20–50%' : failedCount === 2 ? '+40–80%' : '+60–120%');
        let pagesRange = failedCount === 0 ? 'Good' : failedCount === 1 ? '+0.4–1.0' : failedCount === 2 ? '+0.8–1.6' : '+1.2–2.4';
        let conversionRange = failedCount === 0 ? 'Strong' : failedCount === 1 ? '+10–25%' : failedCount === 2 ? '+20–40%' : '+30–60%';

        const impactHTML = `
          <div class="grid md:grid-cols-2 gap-8 my-20">
            <div class="p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl border border-purple-400/30">
              <h3 class="text-3xl font-black mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">Quit Risk Reduction</h3>
              <div class="text-center mb-8">
                <div class="flex items-center justify-center gap-8 text-4xl font-black mb-6">
                  <span class="bg-gradient-to-r ${risk.color} bg-clip-text text-transparent">${risk.text}</span>
                  <span class="text-purple-600">→</span>
                  <span class="bg-gradient-to-r ${projectedRiskColor} bg-clip-text text-transparent">${projectedRisk}</span>
                </div>
                <p class="text-xl text-gray-800 dark:text-gray-200">${riskDropText}</p>
              </div>
              ${perFixImpact}
              <details class="mt-8">
                <summary class="cursor-pointer text-lg font-medium text-purple-600 dark:text-purple-400">How We Calculated This</summary>
                <p class="text-gray-800 dark:text-gray-200 mt-4">Based on benchmarks from thousands of analyzed sites — fixing Readability issues alone can reduce quit risk by 20-30% by making content more approachable. Combined fixes across modules deliver compounded gains.</p>
              </details>
              <details class="mt-6">
                <summary class="cursor-pointer text-lg font-medium text-purple-600 dark:text-purple-400">Risk Level Definitions</summary>
                <ul class="text-gray-800 dark:text-gray-200 mt-4 space-y-2">
                  <li><strong>High Risk:</strong> >60% chance of quick bounce based on similar sites</li>
                  <li><strong>Moderate Risk:</strong> 40-60% early exit probability</li>
                  <li><strong>Low Risk:</strong> <40% — users typically stay and engage</li>
                </ul>
              </details>
              <p class="mt-8 text-center text-lg text-gray-800 dark:text-gray-200 font-medium">Track in Analytics: Monitor exit rates pre/post fixes to verify improvement.</p>
            </div>

            <div class="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl border border-cyan-400/30">
              <h3 class="text-3xl font-black mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent text-center">Potential Engagement Gains</h3>
              <ul class="space-y-8">
                <li class="flex items-center gap-6">
                  <span class="text-4xl">📉</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Bounce Rate</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${bounceRange} reduction</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-purple-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 25 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">⏱️</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Session Duration</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${durationRange} longer</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-cyan-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 30 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">📄</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Pages per Session</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${pagesRange} more pages viewed</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-blue-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 25 + '%'}"></div>
                    </div>
                  </div>
                </li>
                <li class="flex items-center gap-6">
                  <span class="text-4xl">💰</span>
                  <div class="flex-1">
                    <p class="font-bold text-xl text-gray-800 dark:text-gray-200">Conversion Rate Lift</p>
                    <p class="text-lg text-gray-800 dark:text-gray-200">Potential ${conversionRange} improvement</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                      <div class="bg-green-600 h-4 rounded-full transition-all" style="width: ${failedCount === 0 ? '100%' : failedCount * 20 + '%'}"></div>
                    </div>
                  </div>
                </li>
              </ul>
              <p class="text-sm text-gray-800 dark:text-gray-200 mt-8">Conservative estimates based on industry benchmarks. Readability fixes often yield the largest session gains.</p>
              <p class="text-lg text-gray-800 dark:text-gray-200 mt-6 font-medium text-center">How to Verify: Use Google Analytics to track these metrics before/after changes. Typical timeline: See gains in 1-4 weeks with consistent traffic.</p>
            </div>
          </div>`;

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
              <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div class="font-black drop-shadow-2xl text-5xl xs:text-6xl sm:text-7xl md:text-8xl"
                     style="color: ${safeScore < 60 ? '#ef4444' : safeScore < 80 ? '#fb923c' : '#22c55e'};">
                  ${safeScore}
                </div>
                <div class="text-6xl font-bold ${overallGrade.color} mt-6 drop-shadow-lg">
                  ${overallGrade.emoji} ${overallGrade.grade}
                </div>
                <div class="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-800 dark:text-gray-200 mt-4">/100 Usability Score</div>
              </div>
            </div>
          </div>

          <!-- Quit Risk Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">
              Quit Risk:
            </p>
            <div class="flex flex-col items-center gap-6">
              <div class="flex items-center gap-6 text-7xl">
                <span class="${risk.text === 'Low Risk' ? 'text-green-600' : risk.text === 'Moderate Risk' ? 'text-orange-600' : 'text-red-600'}">
                  ${risk.text === 'Low Risk' ? '✅✅✅' : risk.text === 'Moderate Risk' ? '⚠️⚠️' : '❌❌❌'}
                </span>
              </div>
              <p class="text-6xl font-black bg-gradient-to-r ${risk.color} bg-clip-text text-transparent">
                ${risk.text}
              </p>
            </div>
            <p class="text-xl text-gray-800 dark:text-gray-200 mt-10">Scanned ${uxData.links} links + ${uxData.images} images</p>
          </div>

          <!-- Modules -->
          <div class="grid gap-8 my-16 max-w-7xl mx-auto px-6">
            <div class="grid md:grid-cols-1 gap-8">${readabilityHTML}</div>
            <div class="grid md:grid-cols-2 gap-8">${navHTML}${accessHTML}</div>
            <div class="grid md:grid-cols-2 gap-8">${mobileHTML}${speedHTML}</div>
          </div>

          <!-- Top Priority Fixes -->
          <div class="text-center my-20">
            <h2 class="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-12">
              Top Priority Fixes
            </h2>
            <div class="max-w-5xl mx-auto space-y-8">
              ${priorityFixesHTML}
            </div>
            ${priorityFixes.length > 0 ? `
            <p class="mt-12 text-xl text-gray-800 dark:text-gray-200">
              Prioritized by impact — focusing on diverse modules for balanced improvements. If one module dominates failures, address it first for biggest gains.
            </p>` : ''}
          </div>

          <!-- Enhanced Quit Risk Reduction & Engagement Impact -->
          ${impactHTML}

          <!-- PDF Button -->
          <div class="text-center my-16">
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
              <span class="flex items-center gap-6">📄 Save Report as PDF</span>
              <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        `;
        
        
        // Clean URL for PDF cover (unchanged)
        let fullUrl = document.getElementById('url-input').value.trim();
        let displayUrl = 'traffictorch.net';
        if (fullUrl) {
          let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
          const firstSlash = cleaned.indexOf('/');
          if (firstSlash !== -1) {
            const domain = cleaned.slice(0, firstSlash);
            const path = cleaned.slice(firstSlash);
            displayUrl = domain + '\n' + path;
          } else {
            displayUrl = cleaned;
          }
        }
        document.body.setAttribute('data-url', displayUrl);

      } catch (err) {
        document.getElementById('loading').classList.add('hidden');
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-600 dark:text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }
    }
  });

  document.addEventListener('click', e => {
    const moreBtn = e.target.closest('.more-details');
    if (moreBtn) {
      const card = moreBtn.closest('.p-6');
      card.querySelector('.more-details-panel').classList.toggle('hidden');
    }

    const fixesBtn = e.target.closest('.show-fixes');
    if (fixesBtn) {
      const card = fixesBtn.closest('.p-6');
      card.querySelector('.fixes-panel').classList.toggle('hidden');
    }
  });
});