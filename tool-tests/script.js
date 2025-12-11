document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const input = document.getElementById('url-input');
    const results = document.getElementById('results');
    const loader = document.getElementById('loader');
    const toggleBtn = document.getElementById('toggle-mode');

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    });
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');

    function cleanUrl(u) { return u.trim() && !/^https?:\/\//i.test(u) ? 'https://' + u.trim() : u.trim(); }

    function updateScore(id, score) {
        const circle = document.querySelector('#' + id + ' .score-circle');
        if (!circle) return;
        score = Math.round(score);
        const dash = (score / 100) * 339;
        circle.querySelector('.progress').style.strokeDasharray = `${dash} 339`;
        const num = circle.querySelector('.number');
        num.textContent = score;
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
            <p><span style="color:#00c853;font-weight:600">Educational Fix:</span> ${i.fix} <em>(This boosts SEO/UX by [brief reason, e.g., helping Google understand content].)</em></p>
            <button style="margin-left:10px;padding:6px 12px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;" 
                    onclick="navigator.clipboard.writeText('${i.fix.replace(/'/g, "\\'")}')">Copy Full Fix Code</button>
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

    // ——————————————————— UPDATED 2025 EDUCATIONAL ANALYSIS ———————————————————

    function analyzeSEO(doc) {
        let score = 100;
        const issues = [];

        const title = doc.querySelector('title');
        if (!title) {
            score -= 25;
            issues.push({
                issue: 'Missing <title> tag',
                fix: '<title>Your Main Keyword – Brand Name (50–60 characters)</title>',
                why: 'Google uses the title as the blue link in search results. Missing = lost clicks.'
            });
        } else if (title.textContent.trim().length < 30 || title.textContent.trim().length > 65) {
            score -= 20;
            issues.push({
                issue: `Title length bad: ${title.textContent.trim().length} chars`,
                fix: `<title>${title.textContent.trim().slice(0, 50)}… (keep 50–60 chars)</title>`,
                why: 'Too short = weak relevance. Too long = cut off in Google results.'
            });
        }

        const metaDesc = doc.querySelector('meta[name="description"]');
        if (!metaDesc) {
            score -= 20;
            issues.push({
                issue: 'Missing meta description',
                fix: '<meta name="description" content="Compelling 150–160 char summary with keywords">',
                why: 'This text appears under your link in Google. Huge CTR impact.'
            });
        } else if (metaDesc.content.length < 100 || metaDesc.content.length > 160) {
            score -= 15;
            issues.push({
                issue: `Meta description length: ${metaDesc.content.length} chars`,
                fix: 'Keep 120–160 characters for best display in search results',
                why: 'Perfect length = full snippet shown = higher click-through rate.'
            });
        }

        if (doc.querySelectorAll('h1').length === 0) {
            score -= 15;
            issues.push({
                issue: 'No <h1> heading',
                fix: '<h1>Primary Keyword – Page Topic</h1>',
                why: 'H1 is the most important on-page signal for topic relevance.'
            });
        }

        const imgs = doc.querySelectorAll('img');
        const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
        if (noAlt.length > 0) {
            score -= Math.min(20, noAlt.length * 4);
            issues.push({
                issue: `${noAlt.length} image(s) missing alt text`,
                fix: 'Add descriptive alt="…" to every <img> (or alt="" if decorative)',
                why: 'Critical for accessibility + Google Images ranking.'
            });
        }

        if (!doc.querySelector('link[rel="canonical"]')) {
            score -= 8;
            issues.push({
                issue: 'Missing canonical tag',
                fix: '<link rel="canonical" href="https://yoursite.com/current-page/">',
                why: 'Prevents duplicate content penalties.'
            });
        }

        if (!doc.querySelector('script[type="application/ld+json"]') && !doc.querySelector('[itemscope]')) {
            score -= 10;
            issues.push({
                issue: 'No structured data (schema.org)',
                fix: 'Add JSON-LD schema (e.g. Article, FAQ, Organization)',
                why: 'Enables rich snippets, featured cards, and better visibility.'
            });
        }

        return { score: Math.max(0, score), issues };
    }

    function analyzeMobile(doc) {
        let score = 100;
        const issues = [];

        const viewport = doc.querySelector('meta[name="viewport"]');
        if (!viewport || !viewport.content.includes('width=device-width')) {
            score -= 35;
            issues.push({
                issue: 'Viewport meta missing or wrong',
                fix: '<meta name="viewport" content="width=device-width, initial-scale=1">',
                why: 'Without this, mobile users pinch-zoom and Google marks site as not mobile-friendly.'
            });
        }

        if (!doc.querySelector('link[rel="manifest"]')) {
            score -= 20;
            issues.push({
                issue: 'No web app manifest',
                fix: 'Create manifest.json and link it',
                why: 'Required for "Add to Home Screen" and full PWA status.'
            });
        }

        if (!doc.querySelector('link[rel="apple-touch-icon"]') && !doc.querySelector('link[rel="icon"][sizes="192x192"]')) {
            score -= 15;
            issues.push({
                issue: 'Missing homescreen icons',
                fix: 'Add 192×192 PNG + Apple touch icons',
                why: 'Professional look when saved to phone home screen.'
            });
        }

        return { score: Math.max(0, score), issues };
    }

    function analyzePerf(html, doc) {
        let score = 100;
        const issues = [];

        const htmlKB = (html.length / 1024).toFixed(0);
        if (htmlKB > 120) {
            score -= 25;
            issues.push({
                issue: `HTML size ${htmlKB} KB (very heavy)`,
                fix: 'Minify HTML, remove comments and whitespace',
                why: 'Large HTML = slower First Contentful Paint and worse Core Web Vitals.'
            });
        }

        const requests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src]').length + 1;
        if (requests > 30) {
            score -= 20;
            issues.push({
                issue: `${requests} HTTP requests (too many)`,
                fix: 'Combine CSS/JS, use lazy-loading, image sprites or WebP',
                why: 'Each request adds latency, especially on mobile 4G.'
            });
        }

        return { score: Math.max(0, score), issues };
    }

    function analyzeAccess(doc) {
        let score = 100;
        const issues = [];

        const imgs = doc.querySelectorAll('img');
        const noAlt = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
        if (noAlt.length > 0) {
            score -= Math.min(35, noAlt.length * 7);
            issues.push({
                issue: `${noAlt.length} image(s) missing alt text`,
                fix: 'Every image needs alt="description" (or alt="" if decorative)',
                why: 'Legal requirement (WCAG) + huge accessibility win.'
            });
        }

        const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
        let prev = 0, skipped = false;
        headings.forEach(h => {
            const lvl = +h.tagName[1];
            if (lvl > prev + 1) skipped = true;
            prev = lvl;
        });
        if (skipped && headings.length > 3) {
            score -= 15;
            issues.push({
                issue: 'Heading hierarchy skipped (e.g. H1 → H3)',
                fix: 'Use proper order: H1 → H2 → H3 → H4',
                why: 'Screen readers rely on logical heading structure.'
            });
        }

        return { score: Math.max(0, score), issues };
    }
});