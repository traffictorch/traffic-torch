// script.js – FINAL & BULLETPROOF – All 6 modules (Dec 2025)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analysis-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const modulesContainer = document.getElementById('modules');
    const bottomLoader = document.getElementById('bottom-loader');
    const loaderText = document.getElementById('loader-text');
    const yourTotalEl = document.getElementById('your-total');
    const compTotalEl = document.getElementById('comp-total');

    let yourScore = 0;
    let compScore = 0;

    document.getElementById('mode-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    const showLoader = (text) => {
        loaderText.textContent = text;
        bottomLoader.classList.remove('hidden');
    };
    const hideLoader = () => bottomLoader.classList.add('hidden');

    // BULLETPROOF FETCH
    const fetchPage = async (url) => {
        const proxies = [
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
            `https://cf-cors.s3.us-west-1.amazonaws.com/cors-proxy.php?url=${encodeURIComponent(url)}`
        ];
        for (const proxy of proxies) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 9000);
                const res = await fetch(proxy, { signal: controller.signal });
                clearTimeout(timeout);
                if (res.ok) {
                    const text = await res.text();
                    return new DOMParser().parseFromString(text, 'text/html');
                }
            } catch (e) { continue; }
        }
        return null;
    };

    // SMART PHRASE MATCHER
    const countPhrase = (text = '', originalPhrase = '') => {
        if (!text || !originalPhrase) return 0;
        const phrase = originalPhrase.toLowerCase().trim();
        let matches = (text.toLowerCase().match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        const fillers = ['in','the','a','an','of','at','on','for','and','&','near','best','top','great'];
        let cleanPhrase = phrase;
        fillers.forEach(w => cleanPhrase = cleanPhrase.replace(new RegExp('\\b' + w + '\\b', 'gi'), ''));
        cleanPhrase = cleanPhrase.replace(/\s+/g, ' ').trim();
        if (cleanPhrase.length > 4) {
            matches += (text.toLowerCase().match(new RegExp(cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
        }
        const words = phrase.split(/\s+/).filter(w => w.length > 2 && !fillers.includes(w));
        if (words.length >= 2) {
            const pattern = words.map(w => `(?=.*\\b${w}\\b)`).join('');
            matches += (text.toLowerCase().match(new RegExp(pattern, 'gi')) || []).length;
        }
        return matches;
    };

    // CLEAN CONTENT FOR WORD COUNT
    const getCleanContent = (doc) => {
        if (!doc?.body) return '';
        const clone = doc.body.cloneNode(true);
        clone.querySelectorAll('nav, header, footer, aside, script, style, noscript, .menu, .nav, .navbar, .footer, .cookie, .popup, [role="navigation"]').forEach(el => el.remove());
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    };
    const getWordCount = (doc) => getCleanContent(doc).split(/\s+/).filter(w => w.length > 0).length;

    // MODULE 1 – Meta Title & Description
    const moduleMeta = (yourDoc, compDoc, phrase) => {
        const yourTitle = yourDoc?.querySelector('title')?.textContent.trim() || '(no title)';
        const compTitle = compDoc?.querySelector('title')?.textContent.trim() || '(no title)';
        const yourDesc = yourDoc?.querySelector('meta[name="description"]')?.content.trim() || '(no description)';
        const compDesc = compDoc?.querySelector('meta[name="description"]')?.content.trim() || '(no description)';
        const yT = countPhrase(yourTitle, phrase);
        const cT = countPhrase(compTitle, phrase);
        const yD = countPhrase(yourDesc, phrase);
        const cD = countPhrase(compDesc, phrase);
        yourScore += (yT > 0 ? 15 : 0) + (yD > 0 ? 10 : 0);
        compScore += (cT > 0 ? 15 : 0) + (cD > 0 ? 10 : 0);
        modulesContainer.insertAdjacentHTML('beforeend', `
        <div class="module-card"><h3>Meta Title & Description</h3><div class="grid">
            <div class="side you"><strong>You</strong><br>Title: "${yourTitle.substring(0,70)}…"<br><span class="highlight">${yT} match(es)</span><br><br>Description: ${yourDesc.substring(0,120)}…<br><span class="highlight">${yD} match(es)</span></div>
            <div class="side competitor"><strong>Competitor</strong><br>Title: "${compTitle.substring(0,70)}…"<br><span class="highlight">${cT} match(es)</span><br><br>Description: ${compDesc.substring(0,120)}…<br><span class="highlight">${cD} match(es)</span></div>
        </div><button class="expand-btn">What / Why / How to Fix</button><div class="details hidden">
            <strong>Why:</strong> Phrase in title/description = 15–30% CTR boost.<br>
            <strong>AI Fix:</strong><br><code>&lt;title&gt;${phrase.charAt(0).toUpperCase()+phrase.slice(1)} – Your Brand&lt;/title&gt;</code>
        </div></div>`);
    };

    // MODULE 2 – H1 & Heading Structure
    const moduleHeadings = (yourDoc, compDoc, phrase) => {
        const get = (doc) => {
            const h = doc?.querySelectorAll('h1,h2,h3,h4,h5,h6') || [];
            const total = h.length;
            const withPhrase = Array.from(h).filter(el => countPhrase(el.textContent, phrase) > 0).length;
            const h1 = doc?.querySelector('h1')?.textContent.trim() || '(no H1)';
            const h1Match = countPhrase(h1, phrase);
            return { total, withPhrase, h1, h1Match };
        };
        const you = get(yourDoc);
        const comp = get(compDoc);
        yourScore += Math.min(you.total, 10) + (you.h1Match > 0 ? 10 : 0);
        compScore += Math.min(comp.total, 10) + (comp.h1Match > 0 ? 10 : 0);
        modulesContainer.insertAdjacentHTML('beforeend', `
        <div class="module-card"><h3>H1 & Heading Structure</h3><div class="grid">
            <div class="side you"><strong>You</strong><br>H1: "${you.h1.substring(0,80)}…"<br><span class="highlight">${you.h1Match} match(es) in H1</span><br>Total headings: ${you.total}<br>With phrase: ${you.withPhrase}</div>
            <div class="side competitor"><strong>Competitor</strong><br>H1: "${comp.h1.substring(0,80)}…"<br><span class="highlight">${comp.h1Match} match(es) in H1</span><br>Total headings: ${comp.total}<br>With phrase: ${comp.withPhrase}</div>
        </div><button class="expand-btn">What / Why / How to Fix</button><div class="details hidden">
            <strong>Why:</strong> Strong headings = topical authority & snippet wins.<br>
            <strong>AI Fix:</strong><br><code>&lt;h1&gt;${phrase.charAt(0).toUpperCase()+phrase.slice(1)} Guide&lt;/h1&gt;</code>
        </div></div>`);
    };

    // MODULE 3 – Content Density & Word Count
    const moduleContent = (yourDoc, compDoc, phrase) => {
        const youText = getCleanContent(yourDoc);
        const compText = getCleanContent(compDoc);
        const youWords = getWordCount(yourDoc);
        const compWords = getWordCount(compDoc);
        const youMatches = countPhrase(youText, phrase);
        const compMatches = countPhrase(compText, phrase);
        const youDensity = youWords > 0 ? (youMatches / youWords * 100).toFixed(2) : 0;
        const compDensity = compWords > 0 ? (compMatches / compWords * 100).toFixed(2) : 0;
        yourScore += Math.min(youWords / 100, 10) + (youDensity >= 1 ? 20 : youDensity * 20);
        compScore += Math.min(compWords / 100, 10) + (compDensity >= 1 ? 20 : compDensity * 20);
        modulesContainer.insertAdjacentHTML('beforeend', `
        <div class="module-card"><h3>Content Density & Word Count</h3><div class="grid">
            <div class="side you"><strong>You</strong><br>Word count: <strong>${youWords.toLocaleString()}</strong><br>Phrase appears: <strong>${youMatches}x</strong><br>Density: <strong>${youDensity}%</strong></div>
            <div class="side competitor"><strong>Competitor</strong><br>Word count: <strong>${compWords.toLocaleString()}</strong><br>Phrase appears: <strong>${compMatches}x</strong><br>Density: <strong>${compDensity}%</strong></div>
        </div><button class="expand-btn">What / Why / How to Fix</button><div class="details hidden">
            <strong>Ideal:</strong> 800–2500 words + 1.0–2.5% density.<br>
            <strong>AI Fix:</strong> Add 300-word section titled “Why ${phrase} matters”.
        </div></div>`);
    };

    // MODULE 4 – Image Alt Tags
    const moduleAltTags = (yourDoc, compDoc, phrase) => {
        const get = (doc) => {
            const imgs = doc?.querySelectorAll('img') || [];
            const total = imgs.length;
            const withAlt = Array.from(imgs).filter(i => i.hasAttribute('alt') && i.getAttribute('alt').trim() !== '').length;
            const withPhrase = Array.from(imgs).filter(i => countPhrase(i.getAttribute('alt') || '', phrase) > 0).length;
            return { total, withAlt, withPhrase };
        };
        const you = get(yourDoc);
        const comp = get(compDoc);
        const coverageYou = you.total > 0 ? (you.withAlt / you.total * 15) : 0;
        const coverageComp = comp.total > 0 ? (comp.withAlt / comp.total * 15) : 0;
        yourScore += coverageYou + (you.withPhrase * 1.5);
        compScore += coverageComp + (comp.withPhrase * 1.5);
        modulesContainer.insertAdjacentHTML('beforeend', `
        <div class="module-card"><h3>Image Alt Tags</h3><div class="grid">
            <div class="side you"><strong>You</strong><br>Images: ${you.total}<br>With alt: ${you.withAlt} (${Math.round(coverageYou*10)}%)<br><span class="highlight">Phrase in alt: ${you.withPhrase}x</span></div>
            <div class="side competitor"><strong>Competitor</strong><br>Images: ${comp.total}<br>With alt: ${comp.withAlt} (${Math.round(coverageComp*10)}%)<br><span class="highlight">Phrase in alt: ${comp.withPhrase}x</span></div>
        </div><button class="expand-btn">What / Why / How to Fix</button><div class="details hidden">
            <strong>Why:</strong> Alt text = image SEO + accessibility.<br>
            <strong>AI Fix:</strong><br><code>&lt;img src="coffee.jpg" alt="${phrase} at sunrise in Byron Bay"&gt;</code>
        </div></div>`);
    };

    // MODULE 5 – Anchor Text Links – SAFE VERSION
    const moduleAnchors = (yourDoc, compDoc, phrase, yourUrl, compUrl) => {
        const get = (doc, baseUrl) => {
            const links = doc?.querySelectorAll('a') || [];
            const total = links.length;
            let internal = 0;
            let withPhrase = 0;
            links.forEach(a => {
                const text = a.textContent || '';
                if (countPhrase(text, phrase) > 0) withPhrase++;
                const href = a.getAttribute('href') || '';
                if (!href) return;
                if (href.startsWith('/') || href.startsWith('#') || href.includes(baseUrl)) internal++;
            });
            const external = total - internal;
            return { total, internal, external, withPhrase };
        };
        const you = get(yourDoc, new URL(yourUrl).hostname);
        const comp = get(compDoc, new URL(compUrl).hostname);
        yourScore += Math.min(you.internal / 10, 5) + Math.min(you.withPhrase, 5);
        compScore += Math.min(comp.internal / 10, 5) + (comp.withPhrase * 5);
        modulesContainer.insertAdjacentHTML('beforeend', `
        <div class="module-card"><h3>Anchor Text Links</h3><div class="grid">
            <div class="side you"><strong>You</strong><br>Total links: ${you.total}<br>Internal: ${you.internal} · External: ${you.external}<br><span class="highlight">Phrase in anchor: ${you.withPhrase}x</span></div>
            <div class="side competitor"><strong>Competitor</strong><br>Total links: ${comp.total}<br>Internal: ${comp.internal} · External: ${comp.external}<br><span class="highlight">Phrase in anchor: ${comp.withPhrase}x</span></div>
        </div><button class="expand-btn">What / Why / How to Fix</button><div class="details hidden">
            <strong>Why:</strong> Phrase-rich internal anchors = stronger relevance signals.<br>
            <strong>AI Fix:</strong><br><code>&lt;a href="/best-coffee"&gt;${phrase}&lt;/a&gt;</code>
        </div></div>`);
    };

// MODULE 6 – URL & Schema Check – 100% BULLETPROOF FINAL VERSION
const moduleUrlSchema = (yourUrl, compUrl, phrase, yourDoc, compDoc) => {
    const urlMatch = (url) => countPhrase(url.toLowerCase(), phrase);

    const schema = (doc) => {
        const scripts = doc?.querySelectorAll('script[type="application/ld+json"]') || [];
        return scripts.length > 0 && Array.from(scripts).some(s => countPhrase(s.textContent || '', phrase) > 0);
    };

    const youUrlMatch = urlMatch(yourUrl);
    const compUrlMatch = urlMatch(compUrl);
    const youSchema = schema(yourDoc);
    const compSchema = schema(compDoc);

    yourScore += (youUrlMatch > 0 ? 5 : 0) + (youSchema ? 5 : 0);
    compScore += (compUrlMatch > 0 ? 5 : 0) + (compSchema ? 5 : 0);

    modulesContainer.insertAdjacentHTML('beforeend', `
    <div class="module-card">
        <h3>URL & Schema Markup</h3>
        <div class="grid">
            <div class="side you">
                <strong>You</strong><br>
                Phrase in URL: ${youUrlMatch > 0 ? 'Yes' : 'No'}<br>
                Schema with phrase: ${youSchema ? 'Yes' : 'No'}
            </div>
            <div class="side competitor">
                <strong>Competitor</strong><br>
                Phrase in URL: ${compUrlMatch > 0 ? 'Yes' : 'No'}<br>
                Schema with phrase: ${compSchema ? 'Yes' : 'No'}
            </div>
        </div>
        <button class="expand-btn">What / Why / How to Fix</button>
        <div class="details hidden">
            <strong>Why:</strong> Phrase in URL + schema = rich results & stronger relevance.<br>
            <strong>AI Fix:</strong> Use hyphens: <code>${phrase.replace(/\s+/g,'-')}</code>
        </div>
    </div>`);
};

    // MAIN FLOW – unchanged from last working version
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        modulesContainer.innerHTML = '';
        results.classList.add('hidden');
        document.getElementById('overall-score').classList.add('hidden');
        loading.classList.remove('hidden');
        yourScore = compScore = 0;

        const yourUrl = document.getElementById('your-url').value.trim();
        const compUrl = document.getElementById('competitor-url').value.trim();
        const phrase = document.getElementById('phrase').value.trim();

        if (!yourUrl.startsWith('http') || !compUrl.startsWith('http') || phrase.length < 2) {
            alert('Fill all fields');
            loading.classList.add('hidden');
            return;
        }

        const [yourDoc, compDoc] = await Promise.all([fetchPage(yourUrl), fetchPage(compUrl)]);
        loading.classList.add('hidden');

        if (!yourDoc && !compDoc) {
            modulesContainer.innerHTML = `<p style="text-align:center;color:#f87171;">Both sites blocked.</p>`;
            results.classList.remove('hidden');
            return;
        }

        moduleMeta(yourDoc, compDoc, phrase);
        showLoader('Processing: H1 & Headings…'); await new Promise(r => setTimeout(r, 1100));
        moduleHeadings(yourDoc, compDoc, phrase); hideLoader();

        showLoader('Processing: Content Density…'); await new Promise(r => setTimeout(r, 300));
        moduleContent(yourDoc, compDoc, phrase); hideLoader();

        showLoader('Processing: Image Alt Tags…'); await new Promise(r => setTimeout(r, 1200));
        moduleAltTags(yourDoc, compDoc, phrase); hideLoader();

        showLoader('Processing: Anchor Text Links…'); await new Promise(r => setTimeout(r, 1400));
        moduleAnchors(yourDoc, compDoc, phrase, yourUrl, compUrl); hideLoader();

        showLoader('Processing: URL & Schema…'); await new Promise(r => setTimeout(r, 1200));
        moduleUrlSchema(yourUrl, compUrl, phrase, yourDoc, compDoc); hideLoader();

        results.classList.remove('hidden');
        document.getElementById('overall-score').classList.remove('hidden');
// FINAL CORRECT SCORING – max 100/100
const finalScore = (score) => Math.min(Math.round(score), 100);

yourTotalEl.textContent = Math.min(Math.round(yourScore), 100) + '/100';
compTotalEl.textContent = Math.min(Math.round(compScore), 100) + '/100';

// Optional fire if they hit 100
if (yourScore >= 100) yourTotalEl.parentElement.innerHTML += ' 🔥';
if (compScore >= 100) compTotalEl.parentElement.innerHTML += ' 🔥';
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('expand-btn')) {
            const details = e.target.nextElementSibling;
            details.classList.toggle('hidden');
            e.target.parentElement.classList.toggle('expanded');
        }
    });
});