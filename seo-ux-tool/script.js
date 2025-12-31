document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.number').forEach(n => n.style.opacity = '0');
  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const resultsWrapper = document.getElementById('results-wrapper');
  const progressContainer = document.getElementById('progress-container');
  const progressText = document.getElementById('progress-text');
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

  // Save as PDF
  if (savePdfBtn) {
    savePdfBtn.addEventListener('click', () => {
      document.querySelectorAll('#url-form, #save-pdf, #mobile-preview, .expand').forEach(el => el.style.display = 'none');
      const printStyle = document.createElement('style');
      printStyle.innerHTML = `
        @media print {
          body { background: white !important; color: black !important; }
          .score-card { background: white !important; border: 2px solid #333 !important; box-shadow: none !important; }
          .hidden { display: block !important; }
          #mobile-preview, #url-form, #save-pdf { display: none !important; }
        }
      `;
      document.head.appendChild(printStyle);
      window.print();
      window.onafterprint = () => {
        document.querySelectorAll('#url-form, #save-pdf, #mobile-preview, .expand').forEach(el => el.style.display = '');
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

      // ALWAYS-VISIBLE CHECKLIST + SHOW/HIDE FIXES + DETAILED FAILED FIXES + MODULE EDUCATION
      modules.forEach(mod => {
        const card = document.getElementById(`${mod.id}-score`);
        if (!card) return;

        const expandBtn = card.querySelector('.expand');
        if (!expandBtn) return;

        const analysisUrl = mod.id === 'security' ? originalInput : url;
        const { issues: modIssues } = mod.fn(html, doc, analysisUrl);

        // Checklist definitions
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

        // Always-visible checklist
        let checklist = card.querySelector('.checklist');
        if (!checklist) {
          checklist = document.createElement('div');
          checklist.className = 'checklist mt-4 px-4 space-y-1 text-left text-gray-200 text-sm';
          expandBtn.parentNode.insertBefore(checklist, expandBtn);
        }
        checklist.innerHTML = checks.map(c => `
          <p class="${c.passed ? 'text-green-400' : 'text-red-400'} font-medium">
            ${c.passed ? '✅' : '❌'} ${c.text}
          </p>
        `).join('');

        // Expand container
        let expand = card.querySelector('.expand-content');
        if (!expand) {
          expand = document.createElement('div');
          expand.className = 'expand-content hidden mt-6 px-4 space-y-8 pb-6';
          card.appendChild(expand);
        }
        expand.innerHTML = '';

        // Failed fixes – detailed 2–3 sentences
        modIssues.forEach(iss => {
          const block = document.createElement('div');
          block.className = 'p-6 bg-white/5 backdrop-blur rounded-xl border border-white/10';
          block.innerHTML = `
            <strong class="text-xl block mb-4 text-orange-300">${iss.issue}</strong>
            <p class="text-gray-200 leading-relaxed">
              <span class="font-bold text-blue-400">How to fix:</span><br>
              ${iss.fix}
            </p>
          `;
          expand.appendChild(block);
        });

        // Module education
        const moduleInfo = {
          seo: { what: 'On-Page SEO evaluates the core elements search engines read directly to understand your page topic and relevance.', how: 'Write a unique title (50–60 characters) with your main keyword near the start. Add a compelling meta description (120–158 characters). Use proper heading hierarchy and include structured data where applicable.', whyUx: 'Clear titles and descriptions set accurate user expectations in search results.', whySeo: 'These are the strongest direct ranking factors Google uses.' },
          mobile: { what: 'Mobile & PWA checks if your site is fully mobile-friendly and ready to be installed as a progressive web app.', how: 'Add the viewport meta tag, create and link a manifest.json file, provide multiple icon sizes, and register a service worker.', whyUx: 'Ensures flawless experience on phones and allows users to add your site to their home screen.', whySeo: 'Google uses mobile-first indexing – non-mobile-friendly sites are penalized.' },
          perf: { what: 'Performance analyzes page weight, requests, fonts, and render-blocking resources.', how: 'Compress images to WebP format and use lazy-loading. Minify HTML, CSS, and JS. Limit custom fonts and defer non-critical scripts.', whyUx: 'Fast loading keeps users engaged and reduces bounce rates.', whySeo: 'Core Web Vitals are direct ranking factors.' },
          access: { what: 'Accessibility ensures your site is usable by everyone, including people with disabilities.', how: 'Add meaningful alt text to all images. Use proper heading order and landmarks. Label form fields and declare the page language.', whyUx: 'Makes content available to screen readers and keyboard users.', whySeo: 'Google treats accessibility as a quality signal.' },
          content: { what: 'Content Quality assesses depth, readability, structure, and scannability.', how: 'Write comprehensive content with short sentences and paragraphs. Use frequent H2/H3 headings and bullet lists. Include tables where helpful.', whyUx: 'Helps users quickly find and understand information.', whySeo: 'In-depth, structured content ranks higher.' },
          ux: { what: 'UX Design reviews clarity of actions and navigation flow.', how: 'Highlight 1–3 primary CTAs with contrasting buttons. Reduce excessive links. Add breadcrumbs on deep pages.', whyUx: 'Reduces confusion and helps users complete goals faster.', whySeo: 'Better engagement signals improve rankings.' },
          security: { what: 'Security confirms HTTPS and no mixed content.', how: 'Install a valid SSL certificate. Update all resources to HTTPS. Regularly scan for insecure links.', whyUx: 'Prevents browser warnings that scare users away.', whySeo: 'Google marks HTTP sites as Not Secure and downgrades them.' },
          indexability: { what: 'Indexability ensures the page can appear in search results.', how: 'Remove noindex tags unless intentional. Add a canonical link to the preferred URL.', whyUx: 'No direct user impact.', whySeo: 'Without indexability the page is invisible in search.' }
        }; 

        const info = moduleInfo[mod.id];
        const moduleBlock = document.createElement('div');
        moduleBlock.className = 'p-6 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-500/20';
        moduleBlock.innerHTML = `
          <h4 class="text-lg font-bold mb-4 text-purple-300">About this module</h4>
          <p class="mb-4 text-gray-200"><span class="font-bold text-cyan-400">What is it?</span><br>${info.what}</p>
          <p class="mb-4 text-gray-200"><span class="font-bold text-blue-400">How to improve overall:</span><br>${info.how}</p>
          <p class="text-gray-200"><span class="font-bold text-red-400">Why it matters:</span><br>
            <strong>UX:</strong> ${info.whyUx}<br>
            <strong>SEO:</strong> ${info.whySeo}
          </p>
        `;
        expand.appendChild(moduleBlock);

        // Toggle button
        expandBtn.className = 'expand mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition';
        expandBtn.textContent = 'Show Fixes';
        expandBtn.onclick = () => {
          expand.classList.toggle('hidden');
          expandBtn.textContent = expand.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
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
          document.getElementById(`${prefix}-what`).textContent = issue.what || '';
          document.getElementById(`${prefix}-fix`).textContent = issue.fix;
          document.getElementById(`${prefix}-why`).textContent = `UX: ${issue.uxWhy || ''} | SEO: ${issue.seoWhy || ''}`;
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

  // ================== ANALYSIS FUNCTIONS WITH DETAILED 2–3 SENTENCE FIXES ==================
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
        fix: 'Identify your main target keyword from the title and make it prominent in the H1 heading. Include it naturally in the first paragraph of visible content without stuffing. This confirms relevance for users immediately and sends strong topic signals to search engines.',
      });
    }
    if (!title) {
      score -= 25;
      issues.push({
        issue: 'Missing <title> tag',
        fix: 'Add a unique title tag in the head section containing your primary keyword near the beginning. Keep it 50–60 characters for optimal display in search results. This is the first thing users see in Google and directly impacts click-through rates.',
      });
    } else {
      if (title.length < 30) {
        score -= 18;
        issues.push({
          issue: `Title too short (${title.length} characters)`,
          fix: 'Expand the title to 50–60 characters while placing the primary keyword early. Include compelling words or benefits to encourage clicks. Short titles waste valuable space in search results and look incomplete to users.',
        });
      }
      if (title.length > 65) {
        score -= 18;
        issues.push({
          issue: `Title too long (${title.length} characters)`,
          fix: 'Shorten the title to under 65 characters while keeping the most important keyword at the start. Move brand name or secondary info to the end if needed. This prevents truncation in Google results and improves visibility.',
        });
      }
    }
    const desc = doc.querySelector('meta[name="description"]')?.content?.trim() || '';
    if (!desc) {
      score -= 20;
      issues.push({
        issue: 'Missing meta description',
        fix: 'Add a unique meta description tag 120–158 characters long with natural keyword placement. Make it compelling with benefits or a call to action. This text appears below your link in search results and directly affects click-through rates.',
      });
    } else {
      if (desc.length < 100) {
        score -= 12;
        issues.push({
          issue: `Meta description too short (${desc.length} characters)`,
          fix: 'Expand the meta description to 120–158 characters with additional details or benefits. Include the primary keyword naturally early on. Short descriptions give users little context and may be replaced by Google with less relevant text.',
        });
      }
      if (desc.length > 160) {
        score -= 12;
        issues.push({
          issue: `Meta description too long (${desc.length} characters)`,
          fix: 'Trim the meta description to 120–158 characters while keeping the most compelling part at the beginning. Focus on user benefits and keyword placement. Long descriptions get cut off in search results, reducing their effectiveness.',
        });
      }
    }
    const mainHeadingElement = doc.querySelector('h1') || doc.querySelector('h2') || doc.querySelector('h3');
    if (!mainHeadingElement) {
      score -= 8;
      issues.push({
        issue: 'No main heading',
        fix: 'Add a clear H1 heading that includes your primary keyword and describes the page topic. Make it prominent and user-friendly. The main heading is one of the strongest on-page signals for both users and search engines.',
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
          issue: `Primary keyword missing from opening content`,
          fix: 'Include your primary keyword naturally in the first paragraph of visible text. Write for users first while avoiding stuffing. This gives strong relevance signals to Google and confirms topic match for visitors right away.',
        });
      }
    }
    if (primaryKeywordRaw && mainHeadingElement) {
      const headingLower = mainHeadingElement.textContent.toLowerCase();
      if (!flexibleMatch(headingLower)) {
        score -= 10;
        issues.push({
          issue: `Primary keyword missing from main heading`,
          fix: 'Incorporate your primary keyword naturally into the H1 heading. Keep it readable and compelling for users. The main heading carries the strongest weight for on-page relevance signals.',
        });
      }
    }
    if (doc.querySelector('meta[name="keywords"]')) {
      score -= 8;
      issues.push({
        issue: 'Meta keywords tag found',
        fix: 'Remove the obsolete meta keywords tag completely from your HTML head. Search engines have ignored it for years and it adds unnecessary code. Keeping it can make your site appear outdated to crawlers.',
      });
    }
    if (!doc.querySelector('meta[property="og:title"], meta[name="twitter:card"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing Open Graph / Twitter cards',
        fix: 'Add og:title, og:description, og:image, and twitter:card meta tags with high-quality content. Use an image at least 1200×630 pixels for best display. This ensures attractive rich previews when your page is shared on social media.',
      });
    }
    const robots = doc.querySelector('meta[name="robots"]');
    if (robots && /noindex/i.test(robots.content)) {
      score -= 30;
      issues.push({
        issue: 'Page blocked from Google (noindex)',
        fix: 'Remove the noindex directive from the robots meta tag unless this page is intentionally hidden. Change it to index,follow if you want visibility. Noindex completely prevents the page from appearing in search results.',
      });
    }
    if (!doc.querySelector('link[rel="canonical"]')) {
      score -= 8;
      issues.push({
        issue: 'Missing canonical tag',
        fix: 'Add a canonical link tag pointing to the preferred URL version of this page. This prevents duplicate content issues across variations like www/non-www or trailing slash. It consolidates all ranking signals to one URL.',
      });
    }
    if (!doc.querySelector('script[type="application/ld+json"], [itemscope]')) {
      score -= 10;
      issues.push({
        issue: 'No structured data (schema)',
        fix: 'Add JSON-LD structured data markup appropriate for your page type (Article, FAQ, Product, etc). Use Google's testing tool to validate it. This enables rich results like stars, FAQs, and knowledge panels in search.',
      });
    }
    const imgs = doc.querySelectorAll('img');
    const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
    if (noAlt.length) {
      score -= Math.min(20, noAlt.length * 5);
      issues.push({
        issue: `${noAlt.length} images missing alt text`,
        fix: 'Add descriptive alt text to every image describing what it shows. Use empty alt="" only for purely decorative images. This improves accessibility for screen readers and enables ranking in Google Images search.',
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
        fix: 'Add the viewport meta tag with content="width=device-width, initial-scale=1" in the head section. This enables proper scaling on mobile devices. Without it, users must pinch-zoom and Google penalizes non-mobile-friendly sites.',
      });
    }
    if (!doc.querySelector('link[rel="manifest"]')) {
      score -= 25;
      issues.push({
        issue: 'Missing web app manifest',
        fix: 'Create a manifest.json file with name, icons, start_url, and display: standalone properties. Link it in the head with rel="manifest". This enables "Add to Home Screen" functionality and PWA features for better user engagement.',
      });
    }
    const has192 = doc.querySelector('link[sizes*="192"], link[rel="apple-touch-icon"]');
    if (!has192) {
      score -= 15;
      issues.push({
        issue: 'Missing large homescreen icon',
        fix: 'Provide PNG icons in multiple sizes including 192x192 and 512x512 pixels. Add them with sizes attribute or apple-touch-icon links. This ensures crisp, high-quality icons when users save your site to their phone home screen.',
      });
    }
    const hasSW = Array.from(doc.querySelectorAll('script')).some(s => s.textContent.includes('serviceWorker'));
    if (!hasSW) {
      score -= 10;
      issues.push({
        issue: 'No service worker detected',
        fix: 'Register a service worker script to enable offline capability and faster repeat loads. Use libraries like Workbox for easier implementation. This improves reliability on poor connections and is favored by Google for performance scoring.',
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
        fix: 'Minify HTML, CSS, and JS to remove unnecessary whitespace and comments. Compress images to WebP format with proper dimensions and lazy-loading. These steps reduce total payload size, speed up load times, and improve Core Web Vitals scores.',
      });
    }
    const requests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src], iframe[src]').length + 1;
    if (requests > 30) {
      score -= requests > 50 ? 25 : 15;
      issues.push({
        issue: `${requests} HTTP requests`,
        fix: 'Bundle multiple CSS and JS files into fewer requests. Lazy-load images and iframes below the fold. Use modern formats like WebP and srcset for responsive images to lower the number of requests.',
      });
    }
    const fonts = doc.querySelectorAll('link[href*="font"], link[href*="googleapis"]').length;
    if (fonts > 4) {
      score -= 12;
      issues.push({
        issue: `${fonts} web font requests`,
        fix: 'Limit custom fonts to 2–3 families maximum and use system fonts where possible. Preload key fonts and use font-display: swap to avoid invisible text. Host fonts locally or use variable fonts to reduce file size and requests.',
      });
    }
    const blocking = doc.querySelectorAll('link[rel="stylesheet"]:not([media]), script:not([async]):not([defer])').length;
    if (blocking > 4) {
      score -= 15;
      issues.push({
        issue: `${blocking} render-blocking resources`,
        fix: 'Add async or defer to non-critical JavaScript files. Inline critical CSS for above-the-fold content and defer the rest. Use preload for key resources to prevent render-blocking delays.',
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
        fix: 'Add descriptive alt text to every image describing what it shows. Use empty alt="" only for purely decorative images. This improves accessibility for screen readers and enables ranking in Google Images search.',
      });
    }
    if (!doc.documentElement.lang) {
      score -= 12;
      issues.push({
        issue: 'Missing lang attribute on <html>',
        fix: 'Add the lang attribute to the <html> tag with your primary language code (e.g. lang="en"). This helps screen readers pronounce content correctly. It also signals to search engines the language for regional targeting.',
      });
    }
    if (!doc.querySelector('main, [role="main"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing main landmark',
        fix: 'Wrap your primary content in a <main> tag or add role="main" to the container. This defines the main content area clearly. It allows screen reader users to skip navigation and jump directly to the important part.',
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
        fix: 'Use headings in sequential order (H1 → H2 → H3) without skipping levels. This creates a logical content hierarchy. It helps screen reader users navigate and improves crawlability for search engines.',
      });
    }
    const unlabeled = Array.from(doc.querySelectorAll('input, textarea, select'))
      .filter(el => el.id && !doc.querySelector(`label[for="${el.id}"]`));
    if (unlabeled.length) {
      score -= 15;
      issues.push({
        issue: `${unlabeled.length} form fields without labels`,
        fix: 'Connect every form input to a visible label using for/id attributes. Add aria-label if no visible label is possible. This gives screen readers context for form fields and improves accessibility compliance.',
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
        fix: 'Expand the page with unique, valuable content covering the topic in depth. Add helpful sections like descriptions, benefits, FAQs, or guides. Aim for 600+ words where appropriate to fully satisfy user intent and search engines.',
      });
    } else if (wordCount > 3000) {
      score -= 10;
      issues.push({
        issue: `Very long content (${wordCount} words)`,
        fix: 'Break up long text with clear H2/H3 headings every 300–400 words. Use bullet points, numbered lists, and short paragraphs. This improves scannability on mobile and increases engagement metrics like time-on-page.',
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
          fix: 'Use shorter sentences (15–20 words average) and common words in active voice. Break paragraphs into 3–4 lines max and add bullet points where possible. Easier reading keeps visitors engaged longer and sends positive signals to Google.',
        });
      }
    }
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length < 3 && wordCount > 400) {
      score -= 15;
      issues.push({
        issue: 'Insufficient heading structure',
        fix: 'Add descriptive H2 and H3 headings every 300–400 words to create clear sections. This guides readers through the content. Proper hierarchy improves crawlability and increases chances of featured snippets.',
      });
    }
    const lists = doc.querySelectorAll('ul, ol').length;
    if (lists === 0 && wordCount > 500) {
      score -= 10;
      issues.push({
        issue: 'No bullet or numbered lists used',
        fix: 'Convert features, benefits, steps, or options into bulleted or numbered lists. This makes key information scannable at a glance. Lists improve comprehension and can trigger rich list results in search.',
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
        fix: 'Prioritize 1–3 primary calls-to-action with clear, contrasting buttons. Move secondary links to menus or footers. This reduces choice paralysis, improves conversion rates, and lowers bounce rates.',
      });
    }
    const hasBreadcrumb = doc.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
    if (!hasBreadcrumb && doc.body.textContent.length > 2000) {
      score -= 10;
      issues.push({
        issue: 'Missing breadcrumb navigation',
        fix: 'Add a breadcrumb trail showing the page hierarchy (Home > Category > Page). Use schema markup for rich results. This helps users orient themselves and navigate back, improving overall site experience.',
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
        fix: 'Install a valid SSL/TLS certificate (free via Let’s Encrypt). Force HTTPS site-wide with redirects from HTTP. This secures data in transit, prevents browser warnings, and is a direct ranking factor.',
      });
    }
    const mixedContent = doc.querySelector('img[src^="http://"], script[src^="http://"], link[href^="http://"]');
    if (mixedContent) {
      score -= 20;
      issues.push({
        issue: 'Mixed content (insecure resources on HTTPS page)',
        fix: 'Update all resource URLs (images, scripts, styles) to use HTTPS or relative protocol. Scan the page for any HTTP links. This prevents content blocking and security warnings on HTTPS pages.',
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
        fix: 'Remove the noindex directive unless this page is intentionally hidden (e.g. staging). Change to index,follow if you want visibility. Noindex completely blocks the page from search results.',
      });
    }
    if (!doc.querySelector('link[rel="canonical"]')) {
      score -= 15;
      issues.push({
        issue: 'Missing canonical tag',
        fix: 'Add a canonical link tag pointing to the preferred URL version. This prevents duplicate content issues. It consolidates all ranking signals to one URL and avoids penalties.',
      });
    }
    return { score: Math.max(0, Math.round(score)), issues };
  }
});