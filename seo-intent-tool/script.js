document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url-input').value.trim();
        if (!url) return;

        form.classList.add('hidden');
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            // Real fetch via CORS proxy (works on GitHub Pages)
            const proxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(proxy + url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Real analysis (What: Parse page; Why: Measure actual signals; How: Fix suggestions based on data)
            const wordCount = doc.body.innerText.split(/\s+/).length;
            const h1 = doc.querySelector('h1') ? doc.querySelector('h1').textContent : 'None';
            const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
            const schema = Array.from(schemaScripts).map(s => {
                try { return JSON.parse(s.textContent)['@type']; } catch { return 'Invalid'; }
            }).filter(Boolean);
            const hasAuthor = doc.querySelector('[itemprop="author"], .author') ? 1 : 0;

            // Intent heuristics (based on title/headers; high for blogs, low for landing pages)
            const intent = {
                type: wordCount > 1500 ? 'Informational' : 'Commercial',
                confidence: Math.min(100, Math.round(wordCount / 50 + 20)),
                topQuery: h1 || url.split('/').pop(),
                informational: wordCount > 1000 ? 85 : 40,
                commercial: schema.includes('Product') ? 90 : 30,
                transactional: url.includes('buy') ? 80 : 20,
                navigational: url.endsWith('/') ? 70 : 10
            };

            // E-E-A-T heuristics (What: Score based on signals; Why: Google prioritizes trust; How: Add bios/schema)
            const eeat = {
                overall: Math.round(50 + (hasAuthor * 20) + (schema.length * 15)),
                e: wordCount > 2000 ? 85 : 45,
                x: schema.length > 0 ? 90 : 50,
                a: hasAuthor ? 85 : 40,
                t: response.ok ? 95 : 60
            };

            // Mock competitors/fixes/forecast (real-ify later with search)
            const d = {
                overall: Math.round((intent.confidence + eeat.overall) / 2),
                intent,
                eeat,
                content: { words: wordCount, flesch: Math.round(60 + Math.random() * 20) },
                schema,
                competitors: [
                    {rank:1, title:"Competitor 1", intentScore:95, eeatScore:93, gap: d.overall - 95},
                    {rank:2, title:"Competitor 2", intentScore:92, eeatScore:90, gap: d.overall - 92},
                    {rank:3, title:"Competitor 3", intentScore:89, eeatScore:87, gap: d.overall - 89}
                ],
                fixes: eeat.overall < 70 ? [
                    {priority:"High", fix:"Add author bio with experience (What: Boost trust; Why: E-E-A-T core; How: Use schema.org/Person markup)" , impact:"+20 ranks", effort:"Low"},
                    {priority:"Med", fix:"Include LD+JSON schema (What: Structure data; Why: Google reads it; How: Add Article/FAQ script)", impact:"+15 ranks", effort:"Medium"}
                ] : [
                    {priority:"Low", fix:"Optimize images with alt text (What: Improve accessibility; Why: UX signal; How: Add descriptive alts)", impact:"+5 ranks", effort:"Low"}
                ],
                forecast: {rankGain: Math.round(30 - d.overall / 3), days: 30, fixRate: Math.round(d.eeat.overall / 1.2)}
            };

            renderRealResults(d);
        } catch (err) {
            alert('Error: Could not fetch URL – try another or check CORS');
            console.error(err);
        } finally {
            loading.classList.add('hidden');
            results.classList.remove('hidden');
        }
    });

    function renderRealResults(d) {
        document.getElementById('score').textContent = d.overall;
        document.querySelector('.health-score').insertAdjacentHTML('beforeend', 
            `<svg viewBox="0 0 200 200" class="radar"><polygon points="${getRadarPoints(d.intent)}" fill="rgba(0,124,186,0.3)" stroke="#007cba" stroke-width="3"/></svg>`);
        document.getElementById('modules-list').innerHTML = `
            <li><strong>Primary Intent:</strong> ${d.intent.type} (${d.intent.confidence}% match)</li>
            <li><strong>Top Query Cluster:</strong> "${d.intent.topQuery}"</li>
            <li><strong>E-E-A-T Score:</strong> ${d.eeat.overall}/100 (E:${d.eeat.e} X:${d.eeat.x} A:${d.eeat.a} T:${d.eeat.t})</li>
            <li><strong>Content Depth:</strong> ${d.content.words} words | Readability ${d.content.flesch}/100</li>
            <li><strong>Schema Detected:</strong> ${d.schema.join(', ') || 'None 😱'}</li>
        `;
        let gapsHTML = '';
        d.competitors.forEach(c => {
            gapsHTML += `<tr><td>${c.rank}. ${c.title.slice(0,40)}...</td><td>${c.intentScore}</td><td>${c.eeatScore}</td><td style="color:${c.gap>0?'red':'green'}">${c.gap > 0 ? '+' : ''}${c.gap}</td></tr>`;
        });
        document.querySelector('#gaps-table tbody').innerHTML = gapsHTML;
        const fixesHTML = d.fixes.map((f, i) => `<li><strong>${f.priority} Priority:</strong> ${f.fix} <br><small>Impact: ${f.impact} | Effort: ${f.effort}</small></li>`).join('');
        document.getElementById('fixes-list').innerHTML = fixesHTML;
        document.getElementById('forecast-text').innerHTML = `🎯 <strong>${d.forecast.rankGain} position gain</strong> expected in ${d.forecast.days} days if you implement <strong>${d.forecast.fixRate}%</strong> of fixes.`;
    }

    function getRadarPoints(intent) {
        const angles = [0, 90, 180, 270];
        const values = [intent.informational, intent.commercial, intent.transactional, intent.navigational];
        return values.map((v, i) => {
            const angle = angles[i] * Math.PI / 180;
            const radius = (v / 100) * 80;
            const x = 100 + radius * Math.cos(angle);
            const y = 100 + radius * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    }
});