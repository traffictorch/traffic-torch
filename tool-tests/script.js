document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-form');
    const input = document.getElementById('url-input');
    const results = document.getElementById('results');
    const toggleBtn = document.getElementById('toggle-mode');

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = input.value.trim();
        if (!url) return;

        try {
            const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Run analyses
            const seo = analyzeSEO(doc);
            const mobile = analyzeMobile(doc);
            const perf = analyzePerf(html, doc);
            const access = analyzeAccess(doc);

            // Update scores
function updateScore(cardId, rawScore) {
    const circle = document.querySelector(`#${cardId} .score-circle`);
    if (!circle) return;
    const score = Math.round(rawScore);
    const path = circle.querySelector('.progress');
    const text = circle.querySelector('.number');
    const circumference = 339;
    const dash = (score / 100) * circumference;

    path.style.strokeDasharray = `${dash} ${circumference}`;
    text.textContent = score;
    circle.dataset.score = score;
}

// Now call all 4
updateScore('seo-score', seo.score);
updateScore('mobile-score', mobile.score);
updateScore('perf-score', perf.score);
updateScore('access-score', access.score);


            // Populate issues with fixes
            populateIssues('seo-issues', seo.issues);
            populateIssues('mobile-issues', mobile.issues);
            populateIssues('perf-issues', perf.issues);
            populateIssues('access-issues', access.issues);

            // Show results
            results.classList.remove('hidden');

            // Expand/collapse handlers
            document.querySelectorAll('.expand-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.nextElementSibling.classList.toggle('hidden');
                    btn.textContent = btn.nextElementSibling.classList.contains('hidden') ? 'Expand Details' : 'Collapse Details';
                });
            });
        } catch (error) {
            alert('Error fetching or analyzing the page. Ensure the URL is valid.');
            console.error(error);
        }
    });

    function populateIssues(id, issues) {
        const ul = document.getElementById(id);
        ul.innerHTML = '';
        issues.forEach(issue => {
            const li = document.createElement('li');
            li.innerHTML = `${issue.issue} <br><strong>Fix:</strong> ${issue.fix} <button onclick="navigator.clipboard.writeText('${issue.fix}')">Copy Fix</button>`;
            ul.appendChild(li);
        });
    }

    function analyzeSEO(doc) {
        let score = 100;
        const issues = [];

        // Title check
        const title = doc.querySelector('title');
        if (!title || title.textContent.length < 10 || title.textContent.length > 60) {
            score -= 20;
            issues.push({issue: 'Title tag missing or suboptimal length.', fix: 'Add <title>Your Page Title (50-60 chars)</title> with keywords.'});
        }

        // Meta description
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 50 || metaDesc.content.length > 160) {
            score -= 15;
            issues.push({issue: 'Meta description missing or wrong length.', fix: 'Add <meta name="description" content="Your 150-char summary with keywords.">'});
        }

        // Headings
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            score -= 10;
            issues.push({issue: 'No headings found.', fix: 'Use <h1>Main Keyword</h1> and subheadings for structure.'});
        }

        // Image alts
        const imgs = doc.querySelectorAll('img');
        const missingAlts = Array.from(imgs).filter(img => !img.alt);
        if (missingAlts.length > 0) {
            score -= 10 * Math.min(missingAlts.length / imgs.length, 1);
            issues.push({issue: `${missingAlts.length} images missing alt text.`, fix: 'Add alt="Descriptive text" to each <img> for SEO and accessibility.'});
        }

        // Links
        const links = doc.querySelectorAll('a');
        const internal = Array.from(links).filter(a => a.href.startsWith('/') || a.href.includes(location.host));
        if (links.length > 0 && internal.length / links.length < 0.5) {
            score -= 10;
            issues.push({issue: 'Low internal link ratio.', fix: 'Add more internal <a href="/page">links</a> to improve site navigation.'});
        }

        // Canonical, etc.
        if (!doc.querySelector('link[rel="canonical"]')) {
            score -= 5;
            issues.push({issue: 'No canonical tag.', fix: 'Add <link rel="canonical" href="https://yoururl.com"> to avoid duplicate content issues.'});
        }
        // Similar for robots.txt (can't check, but assume via meta)
        const robotsMeta = doc.querySelector('meta[name="robots"]');
        if (!robotsMeta) {
            score -= 5;
            issues.push({issue: 'No robots meta.', fix: 'Add <meta name="robots" content="index,follow"> or check robots.txt file.'});
        }
        // Hreflang
        if (!doc.querySelector('link[rel="alternate"][hreflang]')) {
            score -= 5;
            issues.push({issue: 'No hreflang for multilingual.', fix: 'If multilingual, add <link rel="alternate" hreflang="en" href="url">.'});
        }
        // Schema.org
        if (!doc.querySelector('[itemscope]')) {
            score -= 10;
            issues.push({issue: 'No schema.org markup.', fix: 'Add structured data like <script type="application/ld+json">{JSON schema}</script> for rich snippets.'});
        }

        return {score: Math.max(0, score), issues};
    }

    function analyzeMobile(doc) {
        let score = 100;
        const issues = [];

        // Viewport
        const viewport = doc.querySelector('meta[name="viewport"]');
        if (!viewport || !viewport.content.includes('width=device-width')) {
            score -= 30;
            issues.push({issue: 'Missing or incorrect viewport meta.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">.'});
        }

        // Touch icons
        if (!doc.querySelector('link[rel="apple-touch-icon"]')) {
            score -= 15;
            issues.push({issue: 'No Apple touch icon.', fix: 'Add <link rel="apple-touch-icon" href="/icon.png">.'});
        }

        // Manifest
        if (!doc.querySelector('link[rel="manifest"]')) {
            score -= 20;
            issues.push({issue: 'No web manifest.', fix: 'Create manifest.json and add <link rel="manifest" href="/manifest.json">.'});
        }

        // Service worker (check script tag for registration)
        const scripts = doc.querySelectorAll('script');
        const hasSW = Array.from(scripts).some(s => s.textContent.includes('navigator.serviceWorker.register'));
        if (!hasSW) {
            score -= 10;
            issues.push({issue: 'No service worker detected.', fix: 'For full PWA, add <script>if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js"); }</script>.'});
        }

        // Tap targets (estimate via CSS, but basic check for small fonts)
        if (doc.querySelector('style, link[rel="stylesheet"]')) {
            // Assume check for font-size <16px, but can't parse CSS fully; suggest generally
            issues.push({issue: 'Potential tap target issues.', fix: 'Ensure buttons/links have min 48px touch area and fonts >=16px.'});
            score -= 10;
        }

        // Font legibility (basic)
        score -= 5; // Placeholder for responsive checks

        return {score: Math.max(0, score), issues};
    }

    function analyzePerf(html, doc) {
        let score = 100;
        const issues = [];

        // HTML size
        const htmlSize = html.length / 1024; // KB
        if (htmlSize > 100) {
            score -= 20;
            issues.push({issue: `HTML size too large (${htmlSize.toFixed(1)} KB).`, fix: 'Minify HTML, remove unnecessary whitespace/code. Predicted LCP: 2-4s.'});
        }

        // Number of requests
        const css = doc.querySelectorAll('link[rel="stylesheet"]').length;
        const js = doc.querySelectorAll('script[src]').length;
        const imgs = doc.querySelectorAll('img[src]').length;
        const totalRequests = css + js + imgs + 1; // +1 for HTML
        if (totalRequests > 20) {
            score -= 15 * (totalRequests / 20 - 1);
            issues.push({issue: `High number of requests (${totalRequests}).`, fix: 'Bundle CSS/JS, use sprites or lazy-load images with loading="lazy".'});
        }

        // Inline bloat
        const inlineCSS = doc.querySelectorAll('style').length;
        const inlineJS = doc.querySelectorAll('script:not([src])').length;
        if (inlineCSS + inlineJS > 5) {
            score -= 10;
            issues.push({issue: 'Inline CSS/JS bloat detected.', fix: 'Move to external files for caching.'});
        }

        // Image opts
        const unoptImgs = Array.from(doc.querySelectorAll('img')).filter(img => !img.hasAttribute('loading') || !img.hasAttribute('width'));
        if (unoptImgs.length > 0) {
            score -= 10;
            issues.push({issue: `${unoptImgs.length} images not optimized.`, fix: 'Add width/height attrs and loading="lazy" to <img>.'});
        }

        // Predicted LCP
        issues.push({issue: 'Estimated LCP: 1-3s based on size/requests.', fix: 'Optimize largest contentful paint by prioritizing critical CSS.'});

        return {score: Math.max(0, score), issues};
    }

    function analyzeAccess(doc) {
        let score = 100;
        const issues = [];

        // Missing alts (overlap with SEO)
        const imgs = doc.querySelectorAll('img');
        const missingAlts = Array.from(imgs).filter(img => !img.alt);
        if (missingAlts.length > 0) {
            score -= 20;
            issues.push({issue: `${missingAlts.length} images missing alt text.`, fix: 'Add descriptive alt="" to all <img>.'});
        }

        // Contrast (basic, can't check colors; suggest)
        issues.push({issue: 'Potential contrast issues.', fix: 'Use tools like WAVE to check AA compliance (4.5:1 ratio).'});
        score -= 10;

        // Heading order
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let prevLevel = 0;
        let outOfOrder = false;
        headings.forEach(h => {
            const level = parseInt(h.tagName[1]);
            if (level > prevLevel + 1) outOfOrder = true;
            prevLevel = level;
        });
        if (outOfOrder) {
            score -= 15;
            issues.push({issue: 'Headings out of logical order.', fix: 'Ensure headings follow sequence: h1 > h2 > h3 without skips.'});
        }

        // ARIA landmarks
        if (!doc.querySelector('[role="banner"], [role="main"], [role="contentinfo"]')) {
            score -= 15;
            issues.push({issue: 'Missing ARIA landmarks.', fix: 'Add role="main" to <main>, role="banner" to header, etc.'});
        }

        // Form labels
        const inputs = doc.querySelectorAll('input, textarea, select');
        const unlabeled = Array.from(inputs).filter(input => !input.labels || input.labels.length === 0);
        if (unlabeled.length > 0) {
            score -= 20;
            issues.push({issue: `${unlabeled.length} form fields without labels.`, fix: 'Add <label for="id">Label</label> and id to inputs.'});
        }

        return {score: Math.max(0, score), issues};
    }
});