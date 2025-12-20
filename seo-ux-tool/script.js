// /seo-ux-tool/script.js

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.number').forEach(n => n.style.opacity = '0'); // Hide on load

  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const loader = document.getElementById('loader');

  function cleanUrl(u) {
    return u.trim() && !/^https?:\/\//i.test(u) ? 'https://' + u.trim() : u.trim();
  }

  function updateScore(id, score) {
    const circle = document.querySelector('#' + id + ' .score-circle');
    if (!circle) return;
    score = Math.round(score);
    const dash = (score / 100) * 339;
    circle.querySelector('.progress').style.strokeDasharray = `${dash} 339`;
    const num = circle.querySelector('.number');
    num.textContent = score;
    num.setAttribute('dominant-baseline', 'middle');
    num.style.opacity = '1';
    circle.dataset.score = score; // ← This lets the radar chart use the real score
  }

  function populateIssues(id, issues) {
    const ul = document.getElementById(id);
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

  document.querySelectorAll('.expand').forEach(b => b.onclick = () => {
    b.nextElementSibling.classList.toggle('hidden');
    b.textContent = b.nextElementSibling.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
  });

      form.addEventListener('submit', async e => {
    e.preventDefault();
    let url = cleanUrl(input.value);
    if (!url) return;

    loader.classList.remove('hidden');
    results.classList.add('hidden');
    document.getElementById('visual-health-dashboard')?.classList.add('hidden'); // Hide radar until success

    try {
      // Fixed proxy URL with https://
      const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      
      if (!res.ok) {
        throw new Error(`Proxy returned ${res.status}`);
      }
      
      const html = await res.text();
      if (html.length < 100 || html.includes('blocked') || html.includes('403')) {
        throw new Error('Page blocked or empty');
      }

      const doc = new DOMParser().parseFromString(html, 'text/html');

      const seo = analyzeSEO(doc);
      const mobile = analyzeMobile(doc);
      const perf = analyzePerf(html, doc);
      const access = analyzeAccess(doc);

      updateScore('seo-score', seo.score);
      updateScore('mobile-score', mobile.score);
      updateScore('perf-score', perf.score);
      updateScore('access-score', access.score);

      populateIssues('seo-issues', seo.issues);
      populateIssues('mobile-issues', mobile.issues);
      populateIssues('perf-issues', perf.issues);
      populateIssues('access-issues', access.issues);

      loader.classList.add('hidden');
      results.classList.remove('hidden');

      // Show radar only on success
      document.getElementById('visual-health-dashboard').classList.remove('hidden');
      if (typeof window.initRadarAfterAnalysis === 'function') {
        window.initRadarAfterAnalysis();
      }
    } catch (err) {
      loader.classList.add('hidden');
      console.error('Analysis failed:', err);
      alert('Failed to analyze this site — it may block scraping or require login.\nTry a public site like:\nhttps://example.com\nor\nhttps://httpbin.org/html');
    }
  });
  
  
  // ——————————————————— FULL ANALYSIS FUNCTIONS ———————————————————
  function analyzeSEO(doc) {
    let score = 100;
    const issues = [];
    const title = doc.querySelector('title')?.textContent.trim();
    if (!title) {
      score -= 25;
      issues.push({
        issue: 'Missing <title> tag',
        what: 'No title appears in Google search results or browser tabs.',
        fix: '<title>Your Main Keyword – Brand Name (50–60 characters)</title>',
        uxWhy: 'Users see "Untitled" or blank tab — looks broken and unprofessional.',
        seoWhy: 'Zero chance of ranking or getting clicks — Google shows nothing.'
      });
    } else if (title.length < 30 || title.length > 65) {
      score -= 18;
      issues.push({
        issue: `Title length: ${title.length} characters`,
        what: 'Title is too short or too long — gets cut off in search results.',
        fix: 'Keep 50–60 characters, main keywords first',
        uxWhy: 'Users see truncated title in tabs and search results.',
        seoWhy: 'Google cuts long titles → lost keyword visibility and lower CTR.'
      });
    }
    const desc = doc.querySelector('meta[name="description"]')?.content?.trim();
    if (!desc) {
      score -= 20;
      issues.push({
        issue: 'Missing meta description',
        what: 'No snippet text shows under your link in Google.',
        fix: '<meta name="description" content="Compelling 150-char summary with keyword">',
        uxWhy: 'Users have no idea what the page is about before clicking.',
        seoWhy: 'Google writes its own bad snippet → massive CTR drop.'
      });
    } else if (desc.length < 100 || desc.length > 160) {
      score -= 12;
      issues.push({
        issue: `Meta description: ${desc.length} characters`,
        what: 'Description too short or long — not fully displayed.',
        fix: 'Ideal length: 120–158 characters',
        uxWhy: 'Users see incomplete or generic text.',
        seoWhy: 'Google may replace it → lower click-through rate.'
      });
    }
    if (!doc.querySelector('h1')) {
      score -= 12;
      issues.push({
        issue: 'No <h1> heading',
        what: 'Page has no main heading — no clear topic.',
        fix: '<h1>Main Keyword – Page Topic</h1>',
        uxWhy: 'Users don’t instantly know what the page is about.',
        seoWhy: 'H1 is the strongest on-page ranking signal.'
      });
    }
    const mainKeyword = title?.split(' ')[0]?.toLowerCase() || '';
    if (mainKeyword && doc.body && !doc.body.textContent.toLowerCase().slice(0, 500).includes(mainKeyword)) {
      score -= 10;
      issues.push({
        issue: 'Main keyword not in first 100 words',
        what: 'Primary keyword missing from opening content.',
        fix: 'Include keyword naturally in first paragraph',
        uxWhy: 'Users expect to see what they searched for immediately.',
        seoWhy: 'Google expects topic relevance from the start.'
      });
    }
    if (mainKeyword && !doc.querySelector('h1')?.textContent.toLowerCase().includes(mainKeyword)) {
      score -= 10;
      issues.push({
        issue: 'Main keyword missing from H1',
        what: 'H1 doesn’t contain the primary keyword.',
        fix: 'Add main keyword to H1 heading',
        uxWhy: 'Users expect the heading to match their search.',
        seoWhy: 'Strongest relevance signal for ranking.'
      });
    }
    if (doc.querySelector('meta[name="keywords"]')) {
      score -= 8;
      issues.push({
        issue: 'Meta keywords tag found',
        what: 'Obsolete tag still present on page.',
        fix: 'Remove <meta name="keywords"> completely',
        uxWhy: 'No user impact.',
        seoWhy: 'Google ignores it since 2009 — can hurt trust with some engines.'
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
        what: 'No preferred URL defined for this page.',
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

  function analyzeMobile(doc) {
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
        issue: `Page weight: ${sizeKB} KB`,
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
        fix: 'Bundle CSS/JS, lazy-load images, use sprites/WebP',
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

  function analyzeAccess(doc) {
    let score = 100;
    const issues = [];
    const missingAlts = Array.from(doc.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '');
    if (missingAlts) {
      score -= Math.min(35, missingAlts * 8);
      issues.push({
        issue: `${missingAlts} images missing alt text`,
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
});