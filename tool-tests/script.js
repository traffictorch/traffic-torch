document.addEventListener('DOMContentLoaded', () => {
document.querySelectorAll('.number').forEach(n => n.style.opacity = '0');  // Hide on load
    const form = document.getElementById('url-form');
    const input = document.getElementById('url-input');
    const results = document.getElementById('results');
    const loader = document.getElementById('loader');

    function cleanUrl(u) { return u.trim() && !/^https?:\/\//i.test(u) ? 'https://' + u.trim() : u.trim(); }

    function updateScore(id, score) {
    const circle = document.querySelector('#' + id + ' .score-circle');
    if (!circle) return;
    score = Math.round(score);
    const dash = (score / 100) * 339;
    circle.querySelector('.progress').style.strokeDasharray = `${dash} 339`;
    const num = circle.querySelector('.number');
    num.textContent = score;
    num.setAttribute('dominant-baseline', 'middle');  // Force horizontal center
    num.style.opacity = '1';
    circle.dataset.score = score;
}

function populateIssues(id, issues) {
    const ul = document.getElementById(id);
    ul.innerHTML = '';
    issues.forEach(i => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${i.issue}</strong>
            <p class="mt-3"><span style="color:#3b82f6;font-weight:600">What it is?</span><br>${i.what || 'A technical issue affecting performance or accessibility.'}</p>
            <p class="mt-3"><span style="color:#10b981;font-weight:600">How to Fix:</span><br>${i.fix}</p>
            <p class="mt-3"><span style="color:#ef4444;font-weight:600">Why it Matters?</span><br>
               <strong>UX:</strong> ${i.uxWhy || 'Improves user experience and navigation'}<br>
               <strong>SEO:</strong> ${i.seoWhy || 'Helps search engines understand and rank your page'}
            </p>
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

        try {
            const res = await fetch(`https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw '';
            const html = await res.text();
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
        } catch {
            loader.classList.add('hidden');
            alert('Failed to analyze — try another site');
        }
    });




    // ——————————————————— FINAL 2025 FULL ANALYSIS — ALL CHECKS + 100 POINTS TOTAL ———————————————————

    function analyzeSEO(doc) {
        let score = 100;
        const issues = [];

        const title = doc.querySelector('title')?.textContent.trim();
        if (!title) {
            score -= 25;
            issues.push({issue: 'Missing <title> tag', fix: '<title>Your Main Keyword – Brand (50–60 chars)</title>', why: 'Google shows this as the blue link — missing = zero clicks'});
        } else if (title.length < 30 || title.length > 65) {
            score -= 18;
            issues.push({issue: `Title length ${title.length} chars`, fix: 'Keep 50–60 characters with main keyword first', why: 'Wrong length = cut off in Google results'});
        }

        const desc = doc.querySelector('meta[name="description"]')?.content?.trim();
        if (!desc) {
            score -= 20;
            issues.push({issue: 'Missing meta description', fix: '<meta name="description" content="Compelling 150-char summary">', why: 'This is the snippet under your link — huge CTR impact'});
        } else if (desc.length < 100 || desc.length > 160) {
            score -= 12;
            issues.push({issue: `Meta description ${desc.length} chars`, fix: 'Ideal: 120–158 characters', why: 'Perfect length = full snippet shown'});
        }

        if (!doc.querySelector('h1')) {
            score -= 12;
            issues.push({issue: 'No <h1> heading', fix: '<h1>Main Keyword – Page Topic</h1>', why: 'Most important on-page ranking signal'});
        }

        const mainKeyword = title?.split(' ')[0]?.toLowerCase() || '';
        if (mainKeyword && doc.body && !doc.body.textContent.toLowerCase().slice(0, 500).includes(mainKeyword)) {
            score -= 10;
            issues.push({issue: 'Main keyword not in first 100 words', fix: 'Include it early in content', why: 'Google expects topic relevance from the start'});
        }
        if (mainKeyword && !doc.querySelector('h1')?.textContent.toLowerCase().includes(mainKeyword)) {
            score -= 10;
            issues.push({issue: 'Main keyword missing from H1', fix: 'Add keyword to H1', why: 'Strongest relevance signal'});
        }

        if (doc.querySelector('meta[name="keywords"]')) {
            score -= 8;
            issues.push({issue: 'Meta keywords tag found', fix: 'Remove it completely', why: 'Ignored by Google since 2009 — can hurt trust'});
        }

        if (!doc.querySelector('meta[property="og:title"], meta[name="twitter:card"]')) {
            score -= 15;
            issues.push({issue: 'Missing Open Graph / Twitter cards', fix: 'Add og:title, og:image, twitter:card', why: 'Controls how your link looks when shared'});
        }

        const robots = doc.querySelector('meta[name="robots"]');
        if (robots && /noindex/i.test(robots.content)) {
            score -= 30;
            issues.push({issue: 'Page blocked from Google (noindex)', fix: 'Remove noindex', why: 'You are invisible in search results'});
        }

        if (!doc.querySelector('link[rel="canonical"]')) {
            score -= 8;
            issues.push({issue: 'Missing canonical tag', fix: '<link rel="canonical" href="https://yoursite.com/page">', why: 'Prevents duplicate content penalties'});
        }

        if (!doc.querySelector('script[type="application/ld+json"], [itemscope]')) {
            score -= 10;
            issues.push({issue: 'No structured data', fix: 'Add JSON-LD schema', why: 'Enables rich results and featured snippets'});
        }

        const imgs = doc.querySelectorAll('img');
        const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
        if (noAlt.length) {
            score -= Math.min(20, noAlt.length * 5);
            issues.push({issue: `${noAlt.length} images missing alt text`, fix: 'Add descriptive alt (or alt="" if decorative)', why: 'Critical for Google Images + accessibility'});
        }

        return { score: Math.max(0, Math.round(score)), issues };
    }

    function analyzeMobile(doc) {
        let score = 100;
        const issues = [];

        const viewport = doc.querySelector('meta[name="viewport"]')?.content || '';
        if (!viewport.includes('width=device-width')) {
            score -= 35;
            issues.push({issue: 'Viewport missing or wrong', fix: '<meta name="viewport" content="width=device-width, initial-scale=1">', why: 'Google will mark site as not mobile-friendly'});
        }

        if (!doc.querySelector('link[rel="manifest"]')) {
            score -= 25;
            issues.push({issue: 'Missing web manifest', fix: 'Add manifest.json + link', why: 'Required for Add to Home Screen'});
        }

        const has192 = doc.querySelector('link[sizes*="192"], link[rel="apple-touch-icon"]');
        if (!has192) {
            score -= 15;
            issues.push({issue: 'Missing 192×192 icon', fix: 'Add large icon for homescreen', why: 'Looks professional when saved to phone'});
        }

        const hasSW = Array.from(doc.querySelectorAll('script')).some(s => s.textContent.includes('serviceWorker'));
        if (!hasSW) {
            score -= 10;
            issues.push({issue: 'No service worker detected', fix: 'Add sw.js registration', why: 'Needed for full PWA status'});
        }

        return { score: Math.max(0, Math.round(score)), issues };
    }

    function analyzePerf(html, doc) {
        let score = 100;
        const issues = [];

        const sizeKB = Math.round(html.length / 1024);
        if (sizeKB > 300) score -= 30;
        else if (sizeKB > 150) score -= 15;
        issues.push({issue: `Page weight: ${sizeKB} KB`, fix: sizeKB > 200 ? 'Minify + compress images' : 'Good size', why: 'Directly affects load time and Core Web Vitals'});

        const requests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src], iframe[src]').length + 1;
        if (requests > 50) score -= 25;
        else if (requests > 30) score -= 15;
        issues.push({issue: `${requests} requests`, fix: requests > 40 ? 'Too many — bundle + lazy-load' : 'Acceptable', why: 'Each request adds mobile latency'});

        const fonts = doc.querySelectorAll('link[href*="font"], link[href*="googleapis"]').length;
        if (fonts > 4) {
            score -= 12;
            issues.push({issue: `${fonts} font requests`, fix: 'Limit to 2–3 fonts', why: 'Fonts are render-blocking'});
        }

        const blocking = doc.querySelectorAll('link[rel="stylesheet"]:not([media]), script:not([async]):not([defer])').length;
        if (blocking > 4) {
            score -= 15;
            issues.push({issue: `${blocking} render-blocking resources`, fix: 'Add async/defer or inline critical CSS', why: 'Delays First Contentful Paint'});
        }

        return { score: Math.max(0, Math.round(score)), issues };
    }

    function analyzeAccess(doc) {
        let score = 100;
        const issues = [];

        const missingAlts = Array.from(doc.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '').length;
        if (missingAlts) {
            score -= Math.min(35, missingAlts * 8);
            issues.push({issue: `${missingAlts} images missing alt text`, fix: 'Add descriptive alt (or alt="" if decorative)', why: 'Legal WCAG requirement + Google Images'});
        }

        if (!doc.documentElement.lang) {
            score -= 12;
            issues.push({issue: 'Missing lang attribute', fix: 'Add lang="en" to <html>', why: 'Required for screen readers and SEO'});
        }

        if (!doc.querySelector('main, [role="main"]')) {
            score -= 15;
            issues.push({issue: 'Missing main landmark', fix: 'Add <main> or role="main"', why: 'Screen readers jump to main content'});
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
            issues.push({issue: 'Heading order skipped', fix: 'Don’t jump from H1 → H3', why: 'Breaks screen reader navigation'});
        }

        const unlabeled = Array.from(doc.querySelectorAll('input, textarea, select'))
            .filter(el => el.id && !doc.querySelector(`label[for="${el.id}"]`));
        if (unlabeled.length) {
            score -= 15;
            issues.push({issue: `${unlabeled.length} form fields without labels`, fix: 'Connect labels with for/id', why: 'Required for accessibility'});
        }

        return { score: Math.max(0, Math.round(score)), issues };
    }
});