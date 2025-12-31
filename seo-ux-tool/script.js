document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.number').forEach(n => n.style.opacity = '0');
  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const overallContainer = document.getElementById('overall-container');
  const progressContainer = document.getElementById('progress-container');
  const progressText = document.getElementById('progress-text');
  const priorityFixes = document.getElementById('priority-fixes');
  const forecastModule = document.getElementById('forecast-module');
  const savePdfBtn = document.getElementById('save-pdf');
  const copyBadgeBtn = document.getElementById('copy-badge');

  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function updateScore(id, score) {
    const circle = document.querySelector('#' + id + ' .score-circle');
    const card = circle?.closest('.score-card');
    if (!circle) return;
    score = Math.round(score);
    const radius = id === 'overall-score' || id === 'forecast-circle' ? 90 : 54;
    const circumference = 2 * Math.PI * radius;
    const dash = (score / 100) * circumference;
    const progress = circle.querySelector('.progress');
    progress.style.strokeDasharray = `${dash} ${circumference}`;
    const num = circle.querySelector('.number');
    num.textContent = score;
    num.style.opacity = '1';
    progress.classList.remove('stroke-red-400', 'stroke-orange-400', 'stroke-green-400');
    num.classList.remove('text-red-400', 'text-orange-400', 'text-green-400');
    if (card) card.classList.remove('red', 'orange', 'green');
    if (score < 60) {
      progress.classList.add('stroke-red-400');
      num.classList.add('text-red-400');
      if (card) card.classList.add('red');
    } else if (score < 80) {
      progress.classList.add('stroke-orange-400');
      num.classList.add('text-orange-400');
      if (card) card.classList.add('orange');
    } else {
      progress.classList.add('stroke-green-400');
      num.classList.add('text-green-400');
      if (card) card.classList.add('green');
    }
  }

  function populateIssues(id, issues) {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
    issues.forEach(i => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="p-5 bg-white/10 backdrop-blur rounded-2xl mb-4 border border-white/20">
          <strong class="text-xl block mb-3">${i.issue}</strong>
          <p class="mb-3">
            <span style="color:#60a5fa;font-weight:700">What it is?</span><br>
            ${i.what || 'A common SEO or UX issue that affects how users and search engines see your page.'}
          </p>
          <p class="mb-3">
            <span style="color:#34d399;font-weight:700">How to Fix:</span><br>
            ${i.fix}
          </p>
          <p>
            <span style="color:#f87171;font-weight:700">Why it Matters?</span><br>
            <strong>UX:</strong> ${i.uxWhy || 'Improves user experience, navigation, and accessibility'}<br>
            <strong>SEO:</strong> ${i.seoWhy || 'Helps Google understand and rank your page better'}
          </p>
        </div>
      `;
      ul.appendChild(li);
    });
  }

  // Save as PDF
  if (savePdfBtn) {
    savePdfBtn.addEventListener('click', () => {
      document.querySelectorAll('#url-form, #save-pdf, #mobile-preview, .expand').forEach(el => {
        el.style.display = 'none';
      });
      const printStyle = document.createElement('style');
      printStyle.innerHTML = `
        @media print {
          body { background: white !important; color: black !important; }
          .score-card { background: white !important; border: 2px solid #333 !important; box-shadow: none !important; }
          .bg-clip-text { -webkit-background-clip: text; background-clip: text; color: #e53e3e !important; }
          .hidden { display: block !important; }
          #mobile-preview, #url-form, #save-pdf { display: none !important; }
        }
      `;
      document.head.appendChild(printStyle);
      window.print();
      window.onafterprint = () => {
        document.querySelectorAll('#url-form, #save-pdf, #mobile-preview, .expand').forEach(el => {
          el.style.display = '';
        });
        document.head.removeChild(printStyle);
      };
    });
  }

  // Copy Badge HTML
  if (copyBadgeBtn) {
    copyBadgeBtn.addEventListener('click', () => {
      const badgeHtml = `
<!-- Traffic Torch Optimized Badge -->
<a href="https://traffictorch.net/" target="_blank" style="display: inline-block; position: relative; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; font-size: 13px; color: #969696; text-decoration: none;">
  Traffic Torch Optimized 🛡️
  <span style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px; padding: 8px 16px; background: #1f2937; color: white; font-size: 14px; border-radius: 8px; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; white-space: nowrap; z-index: 10;">
    UX, SEO & AI Optimization
  </span>
</a>
<style>
  a:hover { color: #fb923c !important; }
  a:hover > span { opacity: 1 !important; }
</style>
      `.trim();
      navigator.clipboard.writeText(badgeHtml).then(() => {
        alert('Badge code copied! Paste anywhere on your site — fully inline, works everywhere.');
      }).catch(() => {
        prompt('Copy this badge code:', badgeHtml);
      });
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (savePdfBtn) savePdfBtn.classList.add('hidden');
    document.getElementById('copy-badge').classList.add('hidden');
    const originalInput = input.value.trim();
    const url = cleanUrl(originalInput);
    if (!url) {
      alert('Please enter a URL');
      return;
    }
    progressContainer.classList.remove('hidden');
    progressText.textContent = 'Fetching page...';
    const proxyUrl = 'https://cors-proxy.traffictorch.workers.dev/?url=' + encodeURIComponent(url);
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Network response was not ok');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      
      
      

      const resultsWrapper = document.getElementById('results-wrapper');
      const modules = [
        { id: 'seo', name: 'On-Page SEO', fn: analyzeSEO },
        { id: 'mobile', name: 'Mobile & PWA', fn: analyzeMobile },
        { id: 'perf', name: 'Performance', fn: analyzePerf },
        { id: 'access', name: 'Accessibility', fn: analyzeAccess },
        { id: 'content', name: 'Content Quality', fn: analyzeContentQuality },
        { id: 'ux', name: 'UX Design', fn: analyzeUXDesign },
        { id: 'security', name: 'Security', fn: analyzeSecurity },
        { id: 'indexability', name: 'Indexability', fn: analyzeIndexability }
      ];

      const scores = [];
      const allIssues = [];

      for (const mod of modules) {
        progressText.textContent = `Analyzing ${mod.name}...`;
        const analysisUrl = mod.id === 'security' ? originalInput : url;
        const result = mod.fn(html, doc, analysisUrl);
        scores.push(result.score);
        updateScore(`${mod.id}-score`, result.score);
        populateIssues(`${mod.id}-issues`, result.issues);
        result.issues.forEach(iss => {
          allIssues.push({
            ...iss,
            module: mod.name,
            impact: 100 - result.score
          });
        });
        await new Promise(r => setTimeout(r, 300));
      }

      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      updateScore('overall-score', overallScore);
      
      
      
      
      

      // FINAL: MATCH OTHER TOOLS – ALWAYS-VISIBLE CHECKLIST + RECOMMENDED FIXES BUTTON (STATIC TEXT) + DETAILED FAILED FIXES + MODULE EDUCATION
      modules.forEach(mod => {
        const card = document.getElementById(`${mod.id}-score`);
        if (!card) return;

        const expandBtn = card.querySelector('.expand');
        if (!expandBtn) return;

        // Fresh analysis
        const analysisUrl = mod.id === 'security' ? originalInput : url;
        const { issues: modIssues } = mod.fn(html, doc, analysisUrl);

        // Checklist definitions (keep all as before – accurate passed/failed)
        let checks = [];
        if (mod.id === 'seo') {
          checks = [
            { text: 'Title optimized (30–65 chars, keyword early)', passed: !modIssues.some(i => i.issue.toLowerCase().includes('title')) },
            { text: 'Meta description present & optimal', passed: !modIssues.some(i => i.issue.toLowerCase().includes('meta description')) },
            { text: 'Main heading includes keyword', passed: !modIssues.some(i => i.issue.toLowerCase().includes('main heading') || i.issue.toLowerCase().includes('keyword')) },
            { text: 'Structured data (schema) detected', passed: !modIssues.some(i => i.issue.toLowerCase().includes('schema') || i.issue.toLowerCase().includes('structured data')) },
            { text: 'Canonical tag present', passed: !modIssues.some(i => i.issue.toLowerCase().includes('canonical')) },
            { text: 'All images have meaningful alt text', passed: !modIssues.some(i => i.issue.toLowerCase().includes('alt text')) }
          ];
        } else if (mod.id === 'mobile') {
          checks = [
            { text: 'Viewport meta tag correct', passed: !modIssues.some(i => i.issue.includes('Viewport')) },
            { text: 'Web app manifest linked', passed: !modIssues.some(i => i.issue.includes('manifest')) },
            { text: 'Homescreen icons (192px+) provided', passed: !modIssues.some(i => i.issue.includes('homescreen') || i.issue.includes('icon')) },
            { text: 'Service worker detected', passed: !modIssues.some(i => i.issue.includes('service worker')) }
          ];
        } else if (mod.id === 'perf') {
          checks = [
            { text: 'Page weight reasonable (<300KB HTML)', passed: !modIssues.some(i => i.issue.includes('Page weight')) },
            { text: 'Low number of HTTP requests', passed: !modIssues.some(i => i.issue.includes('HTTP requests')) },
            { text: 'No excessive render-blocking resources', passed: !modIssues.some(i => i.issue.includes('render-blocking')) },
            { text: 'Web fonts optimized', passed: !modIssues.some(i => i.issue.includes('web font') || i.issue.includes('font')) }
          ];
        } else if (mod.id === 'access') {
          checks = [
            { text: 'All images have alt text', passed: !modIssues.some(i => i.issue.includes('alt text')) },
            { text: 'Lang attribute on <html>', passed: !modIssues.some(i => i.issue.includes('lang attribute')) },
            { text: 'Main landmark present', passed: !modIssues.some(i => i.issue.includes('main landmark')) },
            { text: 'Proper heading hierarchy', passed: !modIssues.some(i => i.issue.includes('Heading order')) },
            { text: 'Form fields properly labeled', passed: !modIssues.some(i => i.issue.includes('form fields') || i.issue.includes('labels')) }
          ];
        } else if (mod.id === 'content') {
          checks = [
            { text: 'Sufficient unique content depth', passed: !modIssues.some(i => i.issue.includes('Thin content')) },
            { text: 'Good readability (short sentences)', passed: !modIssues.some(i => i.issue.includes('Readability')) },
            { text: 'Strong heading structure', passed: !modIssues.some(i => i.issue.includes('heading structure')) },
            { text: 'Uses lists for better scannability', passed: !modIssues.some(i => i.issue.includes('lists')) }
          ];
        } else if (mod.id === 'ux') {
          checks = [
            { text: 'Clear primary calls-to-action', passed: !modIssues.some(i => i.issue.includes('calls-to-action')) },
            { text: 'Breadcrumb navigation (on deep pages)', passed: !modIssues.some(i => i.issue.includes('breadcrumb')) }
          ];
        } else if (mod.id === 'security') {
          checks = [
            { text: 'Served over HTTPS', passed: !modIssues.some(i => i.issue.includes('HTTPS')) },
            { text: 'No mixed content', passed: !modIssues.some(i => i.issue.includes('mixed content')) }
          ];
        } else if (mod.id === 'indexability') {
          checks = [
            { text: 'No noindex tag', passed: !modIssues.some(i => i.issue.includes('noindex')) },
            { text: 'Canonical tag present', passed: !modIssues.some(i => i.issue.includes('canonical')) }
          ];
        }

        // Always-visible checklist below score
        let checklistContainer = card.querySelector('.always-checklist');
        if (!checklistContainer) {
          checklistContainer = document.createElement('div');
          checklistContainer.className = 'always-checklist mt-4 px-4 space-y-1 text-left text-gray-200 text-sm';
          expandBtn.parentNode.insertBefore(checklistContainer, expandBtn);
        }
        checklistContainer.innerHTML = checks.map(c => `
          <p class="${c.passed ? 'text-green-400' : 'text-red-400'} font-medium">
            ${c.passed ? '✅' : '❌'} ${c.text}
          </p>
        `).join('');

        // Expandable container
        let detailsContainer = card.querySelector('.expand-details');
        if (!detailsContainer) {
          detailsContainer = document.createElement('div');
          detailsContainer.className = 'expand-details hidden mt-6 px-4 space-y-8 pb-6';
          card.appendChild(detailsContainer);
        }
        detailsContainer.innerHTML = '';

        // ONLY FAILED ISSUES – detailed 2–3 sentence "How to fix:" (no What/Why per issue)
        if (modIssues.length > 0) {
          modIssues.forEach(iss => {
            const fixBlock = document.createElement('div');
            fixBlock.className = 'p-6 bg-white/5 backdrop-blur rounded-xl border border-white/10';
            fixBlock.innerHTML = `
              <strong class="text-xl block mb-4 text-orange-300">${iss.issue}</strong>
              <p class="text-gray-200 leading-relaxed">
                <span class="font-bold text-blue-400">How to fix:</span><br>
                ${iss.fix}
              </p>
            `;
            detailsContainer.appendChild(fixBlock);
          });
        }

        // Module-level education (What/How/Why for the entire module – at bottom)
        const moduleEdu = {
          seo: { what: 'On-Page SEO evaluates the core elements search engines read directly to understand your page topic and relevance.', how: 'Write a compelling title (50–60 characters) with your primary keyword near the start. Add a detailed meta description (120–158 characters) that encourages clicks. Use proper heading hierarchy and include JSON-LD structured data where applicable.', whyUx: 'Clear titles and descriptions help users instantly know if your page matches their search intent.', whySeo: 'These are the strongest direct ranking signals Google uses to evaluate relevance.' },
          mobile: { what: 'Mobile & PWA checks if your site is fully mobile-friendly and ready to be installed as an app.', how: 'Add the correct viewport meta tag for responsive scaling. Create and link a web app manifest.json file. Provide multiple icon sizes (including 192×192) and register a service worker.', whyUx: 'Gives users a flawless experience on phones and the option to add your site to their home screen.', whySeo: 'Google uses mobile-first indexing — poor mobile setup hurts rankings on all devices.' },
          perf: { what: 'Performance measures how fast your page loads by analyzing size, requests, fonts, and blocking resources.', how: 'Compress images to WebP and use appropriate sizes with lazy-loading. Minify CSS/JS/HTML and limit custom fonts to 2–3 families. Defer non-critical scripts and inline critical CSS.', whyUx: 'Fast loading keeps users engaged and reduces bounce rates.', whySeo: 'Core Web Vitals (LCP, FID, CLS) are official ranking factors.' },
          access: { what: 'Accessibility ensures your site is usable by everyone, including people with disabilities.', how: 'Add meaningful alt text to all images (empty for decorative). Use proper heading order and landmarks like <main>. Connect form labels with for/id attributes and declare the page language.', whyUx: 'Makes your content accessible to screen readers and keyboard navigation.', whySeo: 'Google treats accessibility as a quality signal for better rankings.' },
          content: { what: 'Content Quality assesses depth, readability, structure, and scannability of your text.', how: 'Create comprehensive, unique content with short sentences and paragraphs. Break up text with H2/H3 headings every 300–400 words. Use bullet lists, numbered steps, and tables for key information.', whyUx: 'Helps users quickly scan and absorb the information they need.', whySeo: 'Well-structured, in-depth content better satisfies search intent and earns higher rankings.' },
          ux: { what: 'UX Design reviews clarity of actions, navigation, and overall user flow.', how: 'Highlight 1–3 primary calls-to-action with clear, contrasting buttons. Reduce excessive internal linking that distracts users. Add breadcrumb navigation on deeper pages for better orientation.', whyUx: 'Reduces confusion and helps users complete their goals faster.', whySeo: 'Strong engagement metrics (time on page, low bounce) signal quality to Google.' },
          security: { what: 'Security confirms your site uses HTTPS and has no insecure mixed content.', how: 'Install a valid SSL certificate (free via Let’s Encrypt). Update all resource URLs to HTTPS (images, scripts, styles). Regularly scan for and fix any HTTP links.', whyUx: 'Prevents browser "Not Secure" warnings that scare visitors away.', whySeo: 'Google marks HTTP sites as insecure and downgrades their rankings.' },
          indexability: { what: 'Indexability ensures search engines are allowed to crawl and index your page.', how: 'Remove any noindex meta tags unless the page is intentionally hidden. Add a proper canonical link tag pointing to the preferred URL. Verify settings in Google Search Console.', whyUx: 'No direct user impact.', whySeo: 'Without proper indexability, your page will never appear in search results.' }
        };

        const edu = moduleEdu[mod.id];
        const eduBlock = document.createElement('div');
        eduBlock.className = 'p-6 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-500/20';
        eduBlock.innerHTML = `
          <h4 class="text-lg font-bold mb-4 text-purple-300">About this module</h4>
          <p class="mb-4 text-gray-200"><span class="font-bold text-cyan-400">What is it?</span><br>${edu.what}</p>
          <p class="mb-4 text-gray-200"><span class="font-bold text-blue-400">How to improve overall:</span><br>${edu.how}</p>
          <p class="text-gray-200"><span class="font-bold text-red-400">Why it matters:</span><br>
            <strong>UX:</strong> ${edu.whyUx}<br>
            <strong>SEO:</strong> ${edu.whySeo}
          </p>
        `;
        detailsContainer.appendChild(eduBlock);

        // Button – static "Recommended Fixes" text, orange styling
        expandBtn.className = 'expand mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition';
        expandBtn.textContent = 'Recommended Fixes';
        expandBtn.onclick = () => {
          detailsContainer.classList.toggle('hidden');
        };
      });
      
      
      
      
      

      // Top 3 Priority Fixes
      allIssues.sort((a, b) => b.impact - a.impact);
      const top3 = allIssues.slice(0, 3);
      ['1', '2', '3'].forEach((num, idx) => {
        const issue = top3[idx];
        const prefix = `priority${num}`;
        if (issue) {
          document.getElementById(`${prefix}-issue`).textContent = issue.issue;
          document.getElementById(`${prefix}-what`).textContent = issue.what;
          document.getElementById(`${prefix}-fix`).textContent = issue.fix;
          document.getElementById(`${prefix}-why`).textContent = `UX: ${issue.uxWhy || 'Improves usability'} | SEO: ${issue.seoWhy || 'Boosts ranking'}`;
        } else {
          document.getElementById(`${prefix}-issue`).textContent = 'No major issues';
          document.getElementById(`${prefix}-what`).textContent = 'This area is performing well.';
          document.getElementById(`${prefix}-fix`).textContent = 'Maintain current standards.';
          document.getElementById(`${prefix}-why`).textContent = 'Strong performance supports high rankings and great user experience.';
        }
      });

      // Predictive Rank Forecast
      const forecastTitle = document.getElementById('forecast-title');
      const forecastGain = document.getElementById('forecast-gain');
      const forecastWhat = document.getElementById('forecast-what');
      const forecastHow = document.getElementById('forecast-how');
      const forecastWhy = document.getElementById('forecast-why');
      let title = '';
      let gain = '';
      let what = '';
      let how = '';
      let why = '';
      if (overallScore >= 90) {
        title = 'Dominant Top 3 Position';
        gain = '+0–10% potential traffic gain';
        what = 'Your page is already in elite territory — highly optimized and authoritative.';
        how = 'Maintain excellence and monitor competitors.';
        why = 'Top 3 positions capture the majority of clicks. You are already winning.';
      } else if (overallScore >= 80) {
        title = 'Strong Top 5 Potential';
        gain = '+50–85% potential traffic gain if fixed';
        what = 'With minor refinements, this page can compete for featured positions.';
        how = 'Implement the top priority fixes to push into the 90+ club.';
        why = 'Top 5 results get premium visibility and rich snippet opportunities.';
      } else if (overallScore >= 70) {
        title = 'Realistic Top 10 Opportunity';
        gain = '+100–200% potential traffic gain if fixed';
        what = 'Solid foundation — fixing key issues can deliver major ranking gains.';
        how = 'Focus on the Top 3 fixes; expect significant movement within weeks.';
        why = 'Breaking into page 1 can increase traffic by 5–10x for competitive terms.';
      } else if (overallScore >= 60) {
        title = 'Page 1 Possible with Focused Effort';
        gain = '+200–400% potential traffic gain if fixed';
        what = 'Moderate issues are holding you back from high visibility.';
        how = 'Address critical on-page and technical problems first.';
        why = 'Page 1 vs page 2 is the difference between traffic and obscurity.';
      } else {
        title = 'Major Upside Potential';
        gain = '+400%+ potential traffic gain if fixed';
        what = 'Significant opportunities exist — this page has strong recovery potential.';
        how = 'Start with the highest-impact fixes shown above.';
        why = 'Turning around low-scoring pages often yields the biggest traffic gains.';
      }
      forecastTitle.textContent = title;
      forecastGain.textContent = gain;
      forecastWhat.textContent = what;
      forecastHow.textContent = how;
      forecastWhy.textContent = why;

      // Reveal results
      progressContainer.classList.add('hidden');
      resultsWrapper.classList.remove('hidden');
      document.getElementById('radar-title').classList.remove('hidden');
      if (savePdfBtn) savePdfBtn.classList.remove('hidden');
      document.getElementById('copy-badge').classList.remove('hidden');

      resultsWrapper.style.opacity = '0';
      resultsWrapper.style.transform = 'translateY(40px)';
      resultsWrapper.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
      requestAnimationFrame(() => {
        resultsWrapper.style.opacity = '1';
        resultsWrapper.style.transform = 'translateY(0)';
      });
      resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Re-attach expand buttons
      document.querySelectorAll('.expand').forEach(b => {
        b.onclick = () => {
          b.nextElementSibling.classList.toggle('hidden');
          b.textContent = b.nextElementSibling.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
        };
      });

      // 360° Health Radar Chart (desktop only)
      try {
        if (window.innerWidth >= 768) {
          const radarCtx = document.getElementById('health-radar').getContext('2d');
          const isDark = document.documentElement.classList.contains('dark');
          const gridColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(0, 0, 0, 0.2)';
          const labelColor = '#9ca3af';
          const lineColor = '#9ca3af';
          const fillColor = isDark ? 'rgba(156, 163, 175, 0.25)' : 'rgba(156, 163, 175, 0.1)';
          const radarLabels = modules.map(m => m.name);
          const chart = new Chart(radarCtx, {
            type: 'radar',
            data: {
              labels: radarLabels,
              datasets: [{
                label: 'Health Score',
                data: scores,
                backgroundColor: fillColor,
                borderColor: lineColor,
                borderWidth: 4,
                pointRadius: 9,
                pointHoverRadius: 14,
                pointBackgroundColor: (ctx) => {
                  const v = ctx.parsed?.r ?? 0;
                  if (v < 60) return '#f87171';
                  if (v < 80) return '#fb923c';
                  return '#34d399';
                },
                pointHoverBackgroundColor: (ctx) => {
                  const v = ctx.parsed?.r ?? 0;
                  if (v < 60) return '#ef4444';
                  if (v < 80) return '#f97316';
                  return '#10b981';
                }
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                intersect: true,
                mode: 'point'
              },
              scales: {
                r: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                    color: labelColor,
                    backdropColor: 'transparent',
                    callback: (value) => value
                  },
                  grid: { color: 'rgb(156, 163, 175)' },
                  angleLines: { color: 'rgb(156, 163, 175)' },
                  pointLabels: {
                    color: labelColor,
                    font: { size: 14, weight: 'bold' }
                  }
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (ctx) => ctx[0].label,
                    label: (ctx) => {
                      const value = Math.round(ctx.parsed.r);
                      let grade = '';
                      if (value < 20) grade = 'Very Poor';
                      else if (value < 40) grade = 'Poor';
                      else if (value < 60) grade = 'Fair (major issues)';
                      else if (value < 80) grade = 'Good (room for improvement)';
                      else grade = 'Excellent';
                      const lines = [
                        `Score: ${value}/100`,
                        `Grade: ${grade}`,
                        ''
                      ];
                      if (value < 100) {
                        lines.push('How to Improve:');
                        lines.push('Click "Show Fixes" in the module below for detailed recommendations');
                      } else {
                        lines.push('Strong performance – keep it up!');
                      }
                      return lines;
                    }
                  }
                }
              }
            }
          });
        }
      } catch (chartErr) {
        console.warn('Radar chart failed (non-critical)', chartErr);
      }

      // Mobile Preview
      try {
        const previewIframe = document.getElementById('preview-iframe');
        const phoneFrame = document.getElementById('phone-frame');
        const viewToggle = document.getElementById('view-toggle');
        const deviceToggle = document.getElementById('device-toggle');
        const highlightOverlays = document.getElementById('highlight-overlays');
        previewIframe.src = url;
        let isMobile = true;
        let isIphone = true;
        viewToggle.addEventListener('click', () => {
          isMobile = !isMobile;
          phoneFrame.style.width = isMobile ? '375px' : '100%';
          phoneFrame.style.height = isMobile ? '812px' : '800px';
          viewToggle.textContent = isMobile ? 'Switch to Desktop' : 'Switch to Mobile';
        });
        deviceToggle.addEventListener('click', () => {
          isIphone = !isIphone;
          phoneFrame.classList.toggle('iphone-frame', isIphone);
          phoneFrame.classList.toggle('android-frame', !isIphone);
          deviceToggle.textContent = isIphone ? 'Android Frame' : 'iPhone Frame';
        });
        const mobileIssues = allIssues.filter(i => ['Mobile & PWA', 'Performance', 'Accessibility'].includes(i.module));
        mobileIssues.slice(0, 3).forEach((issue, idx) => {
          const hl = document.createElement('div');
          hl.classList.add('issue-highlight');
          hl.style.top = `${20 + idx * 25}%`;
          hl.style.left = '5%';
          hl.style.width = '90%';
          hl.style.height = '20%';
          hl.addEventListener('click', () => {
            showPopup(issue);
          });
          highlightOverlays.appendChild(hl);
        });
        function showPopup(issue) {
          let popup = document.getElementById('highlight-popup');
          if (!popup) {
            popup = document.createElement('div');
            popup.id = 'highlight-popup';
            popup.innerHTML = `
              <div class="popup-content relative">
                <span class="close">&times;</span>
                <h3 class="text-2xl font-bold mb-4">${issue.issue}</h3>
                <p class="mb-4"><span class="font-bold text-blue-300">What is it?</span><br>${issue.what}</p>
                <p class="mb-4"><span class="font-bold text-green-300">How to fix?</span><br>${issue.fix}</p>
                <p><span class="font-bold text-red-300">Why it matters?</span><br>UX: ${issue.uxWhy} | SEO: ${issue.seoWhy}</p>
              </div>
            `;
            document.body.appendChild(popup);
            popup.querySelector('.close').addEventListener('click', () => popup.style.display = 'none');
          }
          popup.querySelector('h3').textContent = issue.issue;
          popup.querySelectorAll('p')[0].innerHTML = `<span class="font-bold text-blue-300">What is it?</span><br>${issue.what}`;
          popup.querySelectorAll('p')[1].innerHTML = `<span class="font-bold text-green-300">How to fix?</span><br>${issue.fix}`;
          popup.querySelectorAll('p')[2].innerHTML = `<span class="font-bold text-red-300">Why it matters?</span><br>UX: ${issue.uxWhy} | SEO: ${issue.seoWhy}`;
          popup.style.display = 'flex';
        }
      } catch (previewErr) {
        console.warn('Mobile preview failed (non-critical)', previewErr);
      }

    } catch (err) {
      alert('Failed to analyze — try another site or check the URL');
      console.error(err);
    } finally {
      progressContainer.classList.add('hidden');
    }
  });





  // ================== ANALYSIS FUNCTIONS ==================
  function analyzeSEO(html, doc) {
    let score = 100;
    const issues = [];
    const title = doc.querySelector('title')?.textContent.trim() || '';
    let primaryKeywordRaw = '';
    if (title) {
      const sections = title.split(/[\|\–\-]/);
      primaryKeywordRaw = sections[0].trim();
    }
    const cleaned = primaryKeywordRaw.toLowerCase().replace(/\b(the|a|an|and|or|luxury|resorts?|hotels?|best|top|official)\b/g, '').trim();
    const keywordParts = cleaned.split(/\s+/).filter(p => p.length >= 3);
    if (primaryKeywordRaw) {
      issues.push({
        issue: 'Primary Keyword',
        what: `We detect "${primaryKeywordRaw}" as your page's primary keyword/phrase (main title section). This guides recommendations.`,
        fix: 'Ensure it\'s prominent in headings and early content.',
        uxWhy: 'Quickly confirms relevance for users.',
        seoWhy: 'Strong on-page alignment boosts ranking signals.'
      });
    }
    if (!title) {
      score -= 25;
      issues.push({
        issue: 'Missing <title> tag',
        what: 'No title appears in Google search results or browser tabs.',
        fix: '<title>Your Primary Keyword – Brand Name (50–60 characters)</title>',
        uxWhy: 'Users see "Untitled" or blank tab — looks broken and unprofessional.',
        seoWhy: 'Zero chance of ranking or getting clicks — Google shows nothing.'
      });
    } else {
      if (title.length < 30) {
        score -= 18;
        issues.push({
          issue: `Title too short (${title.length} characters)`,
          what: `Your page title is significantly below the recommended length.\nCurrent title: "${title}"`,
          fix: 'Aim for 50–60 characters with descriptive keywords.',
          uxWhy: 'Short titles look incomplete in search results and browser tabs.',
          seoWhy: 'Wastes valuable SERP space and reduces click-through rate.'
        });
      }
      if (title.length > 65) {
        score -= 18;
        issues.push({
          issue: `Title too long (${title.length} characters)`,
          what: `Your page title will be truncated in Google search results.\nCurrent title: "${title}"`,
          fix: 'Keep it under 65 characters while keeping the primary keyword early.',
          uxWhy: 'Users see a cut-off title and may miss important information.',
          seoWhy: 'Google truncates long titles → lower visibility and CTR.'
        });
      }
    }
    const desc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
    if (!desc) {
      score -= 20;
      issues.push({
        issue: 'Missing meta description',
        what: 'No snippet text shows under your link in Google search results.',
        fix: '<meta name="description" content="Compelling 120–158 character summary with primary keyword">',
        uxWhy: 'Users have no idea what the page is about before clicking.',
        seoWhy: 'Google generates a poor snippet → massive drop in click-through rate.'
      });
    } else {
      if (desc.length < 100) {
        score -= 12;
        issues.push({
          issue: `Meta description too short (${desc.length} characters)`,
          what: `Your meta description is too brief.\nCurrent description: "${desc}"`,
          fix: 'Expand to 120–158 characters with compelling details.',
          uxWhy: 'Users see very little context in search results.',
          seoWhy: 'Google may replace it → lower click-through rate.'
        });
      }
      if (desc.length > 160) {
        score -= 12;
        issues.push({
          issue: `Meta description too long (${desc.length} characters)`,
          what: `Your meta description will be truncated.\nCurrent description: "${desc}"`,
          fix: 'Keep between 120–158 characters.',
          uxWhy: 'Important parts get cut off.',
          seoWhy: 'Reduces effectiveness.'
        });
      }
    }
    const mainHeadingElement = doc.querySelector('h1') || doc.querySelector('h2') || doc.querySelector('h3');
    const mainHeadingText = mainHeadingElement?.textContent.trim() || '';
    if (!mainHeadingElement) {
      score -= 8;
      issues.push({
        issue: 'No main heading (<h1>, <h2>, or <h3>)',
        what: 'Page lacks a clear primary heading for topic and hierarchy.',
        fix: 'Add a prominent heading with your primary keyword.',
        uxWhy: 'Users rely on headings to quickly understand the page.',
        seoWhy: 'Headings are key for structure and relevance signals.'
      });
    }
    function flexibleMatch(textLower) {
      if (keywordParts.length === 0) return true;
      const matches = keywordParts.filter(part => textLower.includes(part));
      return matches.length >= Math.max(1, Math.ceil(keywordParts.length * 0.6));
    }
    if (primaryKeywordRaw && doc.body) {
      const first500Lower = doc.body.textContent.toLowerCase().slice(0, 500);
      if (!flexibleMatch(first500Lower)) {
        score -= 10;
        issues.push({
          issue: `Primary keyword "${primaryKeywordRaw}" missing from opening content`,
          what: 'The main phrase does not appear early in visible text.',
          fix: 'Include it naturally in the first paragraph.',
          uxWhy: 'Users expect immediate relevance.',
          seoWhy: 'Google prioritizes early topic signals.'
        });
      }
    }
    if (primaryKeywordRaw && mainHeadingText) {
      const headingLower = mainHeadingText.toLowerCase();
      if (!flexibleMatch(headingLower)) {
        score -= 10;
        issues.push({
          issue: `Primary keyword "${primaryKeywordRaw}" missing from main heading`,
          what: `Main heading lacks the primary keyword.\nCurrent heading: "${mainHeadingText}"`,
          fix: 'Incorporate naturally.',
          uxWhy: 'Users expect heading to match intent.',
          seoWhy: 'Strongest relevance signal.'
        });
      }
    }
    if (doc.querySelector('meta[name="keywords"]')) {
      score -= 8;
      issues.push({
        issue: 'Meta keywords tag found',
        what: 'Obsolete tag still present on page.',
        fix: 'Remove <meta name="keywords"> completely',
        uxWhy: 'No user impact.',
        seoWhy: 'Google ignores it — can hurt trust with some engines.'
      });
    }
    if (!doc.querySelector('meta[property="og:title"], meta[name="twitter:card"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing Open Graph / Twitter cards',
        what: 'No rich preview when shared on social media.',
        fix: 'Add og:title, og:image, twitter:card tags',
        uxWhy: 'Shared links look broken or generic.',
        seoWhy: 'Social traffic drops dramatically without rich previews.'
      });
    }
    const robots = doc.querySelector('meta[name="robots"]');
    if (robots && /noindex/i.test(robots.content)) {
      score -= 30;
      issues.push({
        issue: 'Page blocked from Google (noindex)',
        what: 'Robots meta tells search engines not to index this page.',
        fix: 'Remove noindex or change to index,follow',
        uxWhy: 'No impact on users.',
        seoWhy: 'You are completely invisible in search results.'
      });
    }
    if (!doc.querySelector('link[rel="canonical"]')) {
      score -= 8;
      issues.push({
        issue: 'Missing canonical tag',
        what: 'No preferred version of the page defined.',
        fix: '<link rel="canonical" href="https://yoursite.com/page">',
        uxWhy: 'No direct impact.',
        seoWhy: 'Risk of duplicate content penalties.'
      });
    }
    if (!doc.querySelector('script[type="application/ld+json"], [itemscope]')) {
      score -= 10;
      issues.push({
        issue: 'No structured data (schema)',
        what: 'No machine-readable data for rich results.',
        fix: 'Add JSON-LD schema (Article, FAQ, Organization, etc)',
        uxWhy: 'No rich snippets in search.',
        seoWhy: 'Missing featured snippets, knowledge panels, rich cards.'
      });
    }
    const imgs = doc.querySelectorAll('img');
    const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
    if (noAlt.length) {
      score -= Math.min(20, noAlt.length * 5);
      issues.push({
        issue: `${noAlt.length} images missing alt text`,
        what: 'Images have no description for screen readers or Google Images.',
        fix: 'Add descriptive alt="…" (or alt="" if decorative)',
        uxWhy: 'Blind users can’t understand images.',
        seoWhy: 'No ranking in Google Images search.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeMobile(html, doc) {
    let score = 100;
    const issues = [];
    const viewport = doc.querySelector('meta[name="viewport"]')?.content || '';
    if (!viewport.includes('width=device-width')) {
      score -= 35;
      issues.push({
        issue: 'Viewport missing or incorrect',
        what: 'Site doesn’t scale properly on mobile.',
        fix: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        uxWhy: 'Users must pinch-zoom — terrible mobile experience.',
        seoWhy: 'Google downgrades non-mobile-friendly sites in mobile search.'
      });
    }
    if (!doc.querySelector('link[rel="manifest"]')) {
      score -= 25;
      issues.push({
        issue: 'Missing web app manifest',
        what: 'No manifest.json for PWA/Add to Home Screen.',
        fix: 'Create manifest.json and link it',
        uxWhy: 'Users can’t save site to home screen.',
        seoWhy: 'Missing PWA status and discoverability.'
      });
    }
    const has192 = doc.querySelector('link[sizes*="192"], link[rel="apple-touch-icon"]');
    if (!has192) {
      score -= 15;
      issues.push({
        issue: 'Missing large homescreen icon',
        what: 'No 192×192 or Apple touch icon.',
        fix: 'Add 192×192+ PNG icons',
        uxWhy: 'Icon looks blurry or default when saved to phone.',
        seoWhy: 'Poor PWA branding.'
      });
    }
    const hasSW = Array.from(doc.querySelectorAll('script')).some(s => s.textContent.includes('serviceWorker'));
    if (!hasSW) {
      score -= 10;
      issues.push({
        issue: 'No service worker detected',
        what: 'Site can’t work offline or load instantly.',
        fix: 'Add service worker registration',
        uxWhy: 'Slow repeat visits, no offline access.',
        seoWhy: 'Google favors fast, reliable sites.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzePerf(html, doc) {
    let score = 100;
    const issues = [];
    const sizeKB = Math.round(html.length / 1024);
    if (sizeKB > 150) {
      score -= sizeKB > 300 ? 30 : 15;
      issues.push({
        issue: `Page weight: ${sizeKB} KB ${sizeKB > 300 ? '(Very heavy)' : '(Heavy)'}`,
        what: 'Total HTML size before images/CSS/JS.',
        fix: sizeKB > 200 ? 'Minify HTML + compress images + lazy-load' : 'Consider minification',
        uxWhy: 'Slow first load → users bounce.',
        seoWhy: 'Directly impacts Core Web Vitals and ranking.'
      });
    }
    const requests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src], iframe[src]').length + 1;
    if (requests > 30) {
      score -= requests > 50 ? 25 : 15;
      issues.push({
        issue: `${requests} HTTP requests`,
        what: 'Too many files being loaded.',
        fix: 'Bundle CSS/JS, lazy-load images, use WebP',
        uxWhy: 'Each request adds delay on mobile.',
        seoWhy: 'Google penalizes high request count.'
      });
    }
    const fonts = doc.querySelectorAll('link[href*="font"], link[href*="googleapis"]').length;
    if (fonts > 4) {
      score -= 12;
      issues.push({
        issue: `${fonts} web font requests`,
        what: 'Too many custom fonts loading.',
        fix: 'Limit to 2–3 fonts max',
        uxWhy: 'Fonts delay text rendering (FOUT/FOIT).',
        seoWhy: 'Render-blocking = worse Core Web Vitals.'
      });
    }
    const blocking = doc.querySelectorAll('link[rel="stylesheet"]:not([media]), script:not([async]):not([defer])').length;
    if (blocking > 4) {
      score -= 15;
      issues.push({
        issue: `${blocking} render-blocking resources`,
        what: 'CSS/JS blocking page render.',
        fix: 'Add async/defer, inline critical CSS',
        uxWhy: 'Blank screen until files load.',
        seoWhy: 'Delays First Contentful Paint — ranking penalty.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeAccess(html, doc) {
    let score = 100;
    const issues = [];
    const missingAlts = Array.from(doc.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '');
    if (missingAlts.length) {
      score -= Math.min(35, missingAlts.length * 8);
      issues.push({
        issue: `${missingAlts.length} images missing alt text`,
        what: 'Images have no description for screen readers.',
        fix: 'Add descriptive alt (or alt="" if decorative)',
        uxWhy: 'Blind users can’t understand what the image shows.',
        seoWhy: 'No ranking in Google Images + accessibility complaints.'
      });
    }
    if (!doc.documentElement.lang) {
      score -= 12;
      issues.push({
        issue: 'Missing lang attribute on <html>',
        what: 'No language declared for the document.',
        fix: 'Add lang="en" (or your language) to <html>',
        uxWhy: 'Screen readers may pronounce text wrong.',
        seoWhy: 'Google uses lang for regional targeting.'
      });
    }
    if (!doc.querySelector('main, [role="main"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing main landmark',
        what: 'No <main> region defined.',
        fix: 'Add <main> tag or role="main"',
        uxWhy: 'Screen reader users can’t jump to main content.',
        seoWhy: 'Minor ranking factor + accessibility compliance.'
      });
    }
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
    let prev = 0, skipped = false;
    headings.forEach(h => {
      const lvl = +h.tagName[1];
      if (lvl > prev + 1) skipped = true;
      prev = lvl;
    });
    if (skipped && headings.length > 2) {
      score -= 12;
      issues.push({
        issue: 'Heading order skipped (e.g. H1 → H3)',
        what: 'Headings jump levels without proper hierarchy.',
        fix: 'Use sequential order: H1 → H2 → H3',
        uxWhy: 'Confuses screen reader users navigating by headings.',
        seoWhy: 'Poor content structure hurts crawlability.'
      });
    }
    const unlabeled = Array.from(doc.querySelectorAll('input, textarea, select'))
      .filter(el => el.id && !doc.querySelector(`label[for="${el.id}"]`));
    if (unlabeled.length) {
      score -= 15;
      issues.push({
        issue: `${unlabeled.length} form fields without labels`,
        what: 'Form inputs not connected to visible labels.',
        fix: 'Link labels using for/id attributes',
        uxWhy: 'Screen readers say "edit text" with no context.',
        seoWhy: 'Accessibility = trust signal to Google.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeContentQuality(html, doc) {
    let score = 100;
    const issues = [];
    const bodyText = doc.body ? doc.body.textContent.replace(/\s+/g, ' ').trim() : '';
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    if (wordCount < 300) {
      const severity = wordCount < 100 ? 40 : 30;
      score -= severity;
      issues.push({
        issue: `Thin content detected (${wordCount} words)`,
        what: 'The page contains limited unique, valuable text content.',
        fix: 'Expand with helpful sections: detailed descriptions, benefits, FAQs, guides, or testimonials. Aim for 600+ words where appropriate for the topic.',
        uxWhy: 'Users expect substance; thin pages feel incomplete and cause quick exits.',
        seoWhy: 'Google rewards comprehensive pages that fully answer user intent.'
      });
    } else if (wordCount > 3000) {
      score -= 10;
      issues.push({
        issue: `Very long content (${wordCount} words)`,
        what: 'Extensive text without sufficient structure can overwhelm readers.',
        fix: 'Add clear H2/H3 headings every 300–400 words, use bullet points, and consider a table of contents.',
        uxWhy: 'Improves scannability, especially on mobile devices.',
        seoWhy: 'Better structure increases engagement metrics like time-on-page and scroll depth.'
      });
    }
    if (wordCount >= 50) {
      const sentences = Math.max(1, bodyText.split(/[.!?]+/).filter(s => s.trim()).length);
      let syllableCount = 0;
      words.forEach(word => {
        let clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length === 0) return;
        if (clean.length <= 3) {
          syllableCount += 1;
          return;
        }
        let matches = clean.match(/[aeiouy]+/g);
        syllableCount += matches ? matches.length : 1;
        if (clean.endsWith('es') || clean.endsWith('ed')) {
          syllableCount = Math.max(1, syllableCount - 1);
        }
      });
      const avgSentenceLength = wordCount / sentences;
      const avgSyllables = syllableCount / wordCount;
      const fleschScore = Math.round(206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables);
      if (fleschScore < 60) {
        score -= 20;
        issues.push({
          issue: `Readability needs improvement (Flesch score: ${fleschScore})`,
          what: 'The text uses longer sentences and/or more complex vocabulary than ideal for most web users.',
          fix: 'Aim for 15–20 words per sentence on average. Use common words, active voice, short paragraphs (≤4 lines), and bullet points where possible.',
          uxWhy: 'Easier reading keeps visitors engaged longer and reduces cognitive strain, especially on mobile.',
          seoWhy: 'Improved readability boosts dwell time, lowers bounce rate, and sends positive user experience signals to Google.'
        });
      }
    }
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length < 3 && wordCount > 400) {
      score -= 15;
      issues.push({
        issue: 'Insufficient heading structure',
        what: 'Content has few or no subheadings to guide readers.',
        fix: 'Add descriptive H2 and H3 headings every 300–400 words to create clear sections.',
        uxWhy: 'Headings help users scan and find relevant information quickly.',
        seoWhy: 'Proper hierarchy improves crawlability and increases chances of featured snippets.'
      });
    }
    const lists = doc.querySelectorAll('ul, ol').length;
    if (lists === 0 && wordCount > 500) {
      score -= 10;
      issues.push({
        issue: 'No bullet or numbered lists used',
        what: 'Key information is presented in dense paragraphs instead of scannable lists.',
        fix: 'Convert features, benefits, steps, or options into bulleted or numbered lists.',
        uxWhy: 'Lists dramatically improve skimmability and comprehension.',
        seoWhy: 'Encourages deeper engagement and can trigger rich list results in search.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeUXDesign(html, doc) {
    let score = 100;
    const issues = [];
    const interactive = doc.querySelectorAll('a, button, input[type="submit"], [role="button"]');
    if (interactive.length > 50) {
      score -= 25;
      issues.push({
        issue: 'Too many calls-to-action / links',
        what: 'Page overwhelms users with excessive navigation or buttons.',
        fix: 'Prioritize 1–3 primary actions; move others to secondary menus.',
        uxWhy: 'Causes choice paralysis and frustration.',
        seoWhy: 'High bounce rate and low engagement.'
      });
    }
    const hasBreadcrumb = doc.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
    if (!hasBreadcrumb && doc.body.textContent.length > 2000) {
      score -= 10;
      issues.push({
        issue: 'Missing breadcrumb navigation',
        what: 'Users have no clear path back to higher-level pages.',
        fix: 'Add breadcrumb trail showing page hierarchy.',
        uxWhy: 'Improves orientation and reduces disorientation.',
        seoWhy: 'Helps Google understand site structure.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeSecurity(html, doc, url) {
    let score = 100;
    const issues = [];
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith('http://')) {
      score -= 50;
      issues.push({
        issue: 'Not served over HTTPS',
        what: 'Site uses insecure HTTP connection.',
        fix: 'Obtain and install a valid SSL/TLS certificate (free via Let’s Encrypt).',
        uxWhy: 'Browser shows "Not secure" warning — users leave immediately.',
        seoWhy: 'Google marks HTTP sites as insecure and downgrades rankings.'
      });
    }
    const mixedContent = doc.querySelector('img[src^="http://"], script[src^="http://"], link[href^="http://"]');
    if (mixedContent) {
      score -= 20;
      issues.push({
        issue: 'Mixed content (insecure resources on HTTPS page)',
        what: 'Page loads HTTP resources which are blocked or warned against.',
        fix: 'Update all resource URLs to HTTPS or relative protocol.',
        uxWhy: 'Browser may block content or show warnings.',
        seoWhy: 'Can trigger security flags affecting trust.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }

  function analyzeIndexability(html, doc) {
    let score = 100;
    const issues = [];
    const robotsMeta = doc.querySelector('meta[name="robots"]');
    if (robotsMeta && /noindex/i.test(robotsMeta.content)) {
      score -= 60;
      issues.push({
        issue: 'noindex meta tag present',
        what: 'Page explicitly tells search engines not to index it.',
        fix: 'Remove "noindex" directive unless intentional (e.g., staging page).',
        uxWhy: 'No direct user impact.',
        seoWhy: 'Page will never appear in search results.'
      });
    }
    if (!doc.querySelector('link[rel="canonical"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing canonical tag',
        what: 'No preferred version of the page defined.',
        fix: '<link rel="canonical" href="preferred-url">',
        uxWhy: 'No user impact.',
        seoWhy: 'Prevents duplicate content issues and consolidates ranking signals.'
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }
});