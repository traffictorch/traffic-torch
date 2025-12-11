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
            li.innerHTML = `<strong>${i.issue}</strong><br><span style="color:#00c853">Fix →</span> ${i.fix}
                <button style="margin-left:10px;padding:6px 12px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;" 
                        onclick="navigator.clipboard.writeText('${i.fix.replace(/'/g, "\\'")}')">Copy</button>`;
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

    // ← YOUR FULL ORIGINAL ANALYSIS FUNCTIONS BELOW (unchanged) ↓

    function analyzeSEO(doc) {
        let score = 100;
        const issues = [];
        const title = doc.querySelector('title');
        if (!title || title.textContent.length < 10 || title.textContent.length > 60) {
            score -= 20;
            issues.push({issue: 'Title tag missing or suboptimal length.', fix: 'Add <title>Your Page Title (50-60 chars)</title> with keywords.'});
        }
        const metaDesc = doc.querySelector('meta[name="description"]');
        if (!metaDesc || metaDesc.content.length < 50 || metaDesc.content.length > 160) {
            score -= 15;
            issues.push({issue: 'Meta description missing or wrong length.', fix: 'Add <meta name="description" content="Your 150-char summary with keywords.">'});
        }
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            score -= 10;
            issues.push({issue: 'No headings found.', fix: 'Use <h1>Main Keyword</h1> and subheadings for structure.'});
        }
        const imgs = doc.querySelectorAll('img');
        const missingAlts = Array.from(imgs).filter(img => !img.alt);
        if (missingAlts.length > 0) {
            score -= 10 * Math.min(missingAlts.length / imgs.length, 1);
            issues.push({issue: `${missingAlts.length} images missing alt text.`, fix: 'Add alt="Descriptive text" to each <img> for SEO and accessibility.'});
        }
        if (!doc.querySelector('link[rel="canonical"]')) {
            score -= 5;
            issues.push({issue: 'No canonical tag.', fix: 'Add <link rel="canonical" href="https://yoururl.com"> to avoid duplicate content issues.'});
        }
        if (!doc.querySelector('[itemscope]')) {
            score -= 10;
            issues.push({issue: 'No schema.org markup.', fix: 'Add structured data like <script type="application/ld+json">{JSON schema}</script> for rich snippets.'});
        }
        return {score: Math.max(0, score), issues};
    }

    function analyzeMobile(doc) {
        let score = 100;
        const issues = [];
        const viewport = doc.querySelector('meta[name="viewport"]');
        if (!viewport || !viewport.content.includes('width=device-width')) {
            score -= 30;
            issues.push({issue: 'Missing or incorrect viewport meta.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">.'});
        }
        if (!doc.querySelector('link[rel="apple-touch-icon"]')) {
            score -= 15;
            issues.push({issue: 'No Apple touch icon.', fix: 'Add <link rel="apple-touch-icon" href="/icon.png">.'});
        }
        if (!doc.querySelector('link[rel="manifest"]')) {
            score -= 20;
            issues.push({issue: 'No web manifest.', fix: 'Create manifest.json and add <link rel="manifest" href="/manifest.json">.'});
        }
        return {score: Math.max(0, score), issues};
    }

    function analyzePerf(html, doc) {
        let score = 100;
        const issues = [];
        const htmlSize = html.length / 1024;
        if (htmlSize > 100) {
            score -= 20;
            issues.push({issue: `HTML size too large (${htmlSize.toFixed(1)} KB).`, fix: 'Minify HTML, remove unnecessary whitespace/code.'});
        }
        const totalRequests = doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src]').length + 1;
        if (totalRequests > 20) {
            score -= 15;
            issues.push({issue: `High number of requests (${totalRequests}).`, fix: 'Bundle CSS/JS, lazy-load images with loading="lazy".'});
        }
        return {score: Math.max(0, score), issues};
    }

    function analyzeAccess(doc) {
        let score = 100;
        const issues = [];
        const imgs = doc.querySelectorAll('img');
        const missingAlts = Array.from(imgs).filter(img => !img.alt);
        if (missingAlts.length > 0) {
            score -= 20;
            issues.push({issue: `${missingAlts.length} images missing alt text.`, fix: 'Add descriptive alt="" to all <img>.'});
        }
        return {score: Math.max(0, score), issues};
    }
});