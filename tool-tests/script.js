document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const input = document.getElementById('url-input');
    const results = document.getElementById('results');
    const loader = document.getElementById('loader');
    const toggleBtn = document.getElementById('toggle-mode');

    // Dark mode toggle + persist
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    });
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');

    // Auto-add https://
    function cleanUrl(url) {
        if (!url) return '';
        url = url.trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
    }

    // FINAL UPDATE SCORE – no flash, perfect color
    function updateScore(cardId, rawScore) {
        const circle = document.querySelector(`#${cardId} .score-circle`);
        if (!circle) return;
        const score = Math.round(rawScore);
        const progress = circle.querySelector('.progress');
        const number = circle.querySelector('.number');
        const dash = (score / 100) * 339;

        progress.style.strokeDasharray = `${dash} 339`;
        number.textContent = score;
        number.style.opacity = '1';
        circle.dataset.score = score;
    }

    // Populate fixes with nice copy button
    function populateIssues(id, issues) {
        const ul = document.getElementById(id);
        ul.innerHTML = '';
        issues.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${item.issue}</strong><br>
                <span style="color:#00c853;font-weight:600">Fix →</span> ${item.fix}
                <button style="margin-left:10px;padding:6px 10px;font-size:0.8rem;border:none;background:#007bff;color:white;border-radius:4px;cursor:pointer;" 
                        onclick="navigator.clipboard.writeText('${item.fix.replace(/'/g, "\\'")}')">
                    Copy Fix
                </button>
            `;
            ul.appendChild(li);
        });
    }

    // Expand/collapse buttons
    document.querySelectorAll('.expand').forEach(btn => {
        btn.onclick = () => {
            const details = btn.nextElementSibling;
            details.classList.toggle('hidden');
            btn.textContent = details.classList.contains('hidden') ? 'Show Fixes' : 'Hide Fixes';
        };
    });

    // MAIN FORM SUBMIT
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let url = cleanUrl(input.value);
        if (!url) return;

        if (loader) loader.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Site not reachable');

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

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

            if (loader) loader.classList.add('hidden');
            results.classList.remove('hidden');

        } catch (err) {
            if (loader) loader.classList.add('hidden');
            alert('Failed to analyze this site. Try another URL.');
            console.error(err);
        }
    });

    // ——————————————————— ANALYSIS FUNCTIONS ———————————————————

    function analyzeSEO(doc) {
        let score = 100;
        const issues = [];

        const title = doc.querySelector('title');
        if (!title || title.textContent.length < 10 || title.textContent.length > 60) {
            score -= 20;
            issues.push({issue: 'Title tag missing or wrong length', fix: 'Use <title>50–60 char keyword-rich title</title>'});
        }

        const metaDesc = doc.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 50 || metaDesc.content.length > 160) {
            score -= 15;
            issues.push({issue: 'Meta description missing or bad length', fix: 'Add <meta name="description" content="150–160 char compelling summary">'}));
        }

        if (doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length === 0) {
            score -= 10;
            issues.push({issue: 'No headings found', fix: 'Add <h1>Main keyword</h1> + logical subheadings'});
        }

        const imgs = doc.querySelectorAll('img');
        const missingAlts = Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '');
        if (missingAlts.length > 0) {
            score -= Math.min(20, missingAlts.length * 3);
            issues.push({issue: `${missingAlts.length} images missing alt text`, fix: 'Add descriptive alt="…" to every <img>'});
        }

        if (!doc.querySelector('link[rel="canonical"]')) {
            score -= 8;
            issues.push({issue: 'Missing canonical tag', fix: 'Add <link rel="canonical" href="https://yoursite.com/page">'}));
        }

        if (!doc.querySelector('[itemscope]') && !doc.querySelector('script[type="application/ld+json"]')) {
            score -= 10;
            issues.push({issue: 'No structured data found', fix: 'Add JSON-LD schema (e.g. Organization, Article, FAQ)'});
        }

        return { score: Math.max(0, score), issues };
    }

    function analyzeMobile(doc) {
        let score = 100;
        const issues = [];

        const viewport = doc.querySelector('meta[name="viewport"]');
        if (!viewport || !viewport.content.includes('width=device-width')) {
            score -= 30;
            issues.push({issue: 'Missing proper viewport meta', fix: '<meta name="viewport" content="width=device-width, initial-scale=1">'});
        }

        if (!doc.querySelector('link[rel="manifest"]')) {
            score -= 20;
            issues.push({issue: 'No web app manifest', fix: 'Create manifest.json + link it'});
        }

        if (!doc.querySelector('link[rel="apple-touch-icon"], link[rel="icon"][sizes="192x192"]')) {
            score -= 15;
            issues.push({issue: 'Missing touch icons', fix: 'Add 192×192 and Apple touch icons'});
        }

        return { score: Math.max(0, score), issues };
    }

    function analyzePerf(html, doc) {
        let score = 100;
        const issues = [];

        const htmlKB = (html.length / 1024).toFixed(1);
        if (htmlKB > 120) {
            score -= 25;
            issues.push({issue: `HTML size ${htmlKB} KB – too big`, fix: 'Minify HTML, remove comments and whitespace'});
        }

        const requests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src]').length + 1;
        if (requests > 25) {
            score -= 20;
            issues.push({issue: `${requests} requests – too many`, fix: 'Bundle CSS/JS, lazy-load images, use sprites'});
        }

        return { score: Math.max(0, score), issues };
    }

    function analyzeAccess(doc) {
        let score = 100;
        const issues = [];

        const missingAlts = Array.from(doc.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '').length;
        if (missingAlts > 0) {
            score -= Math.min(30, missingAlts * 5);
            issues.push({issue: `${missingAlts} images missing alt text`, fix: 'Every image needs alt="" (or alt="decorative" if purely decorative)'});
        }

        const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));
        let prev = 0;
        let skipped = false;
        headings.forEach(h => {
            const level = +h.tagName[1];
            if (level > prev + 1) skipped = true;
            prev = level;
        });
        if (skipped && headings.length > 1) {
            score -= 15;
            issues.push({issue: 'Heading order skipped (e.g. H1 → H3)', fix: 'Use proper hierarchy: H1 → H2 → H3'});
        }

        return { score: Math.max(0, score), issues };
    }
});