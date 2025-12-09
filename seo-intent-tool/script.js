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
            // Load base data
            const response = await fetch('/seo-intent-tool/data.json');
            const baseData = await response.json();

            // Get URL-specific data or default
            let d = baseData.default;
            const hostname = new URL(url).hostname;
            if (baseData[hostname]) {
                d = baseData[hostname];
            } else {
                // Randomize for unknown URLs (simulate real analysis)
                d = { ...baseData.default };
                d.overall = Math.round(d.overall + (Math.random() - 0.5) * 20);
                d.intent.confidence = Math.round(d.intent.confidence + (Math.random() - 0.5) * 15);
                d.eeat.overall = Math.round(d.eeat.overall + (Math.random() - 0.5) * 10);
                d.content.words = Math.round(d.content.words + Math.random() * 1000);
                d.forecast.rankGain = Math.round(d.forecast.rankGain + (Math.random() - 0.5) * 5);
            }

            renderRealResults(d, url);
        } catch (err) {
            alert('Error loading audit – check console');
            console.error(err);
        } finally {
            loading.classList.add('hidden');
            results.classList.remove('hidden');
        }
    });

    function renderRealResults(d, url) {
        // 360 Score
        document.getElementById('score').textContent = d.overall;

        // Radar Chart
        const svg = document.querySelector('.health-score svg.radar') || document.querySelector('.health-score').insertAdjacentHTML('beforeend', '<svg viewBox="0 0 200 200" class="radar mx-auto mt-8"></svg>');
        document.querySelector('.radar').innerHTML = `<polygon points="${getRadarPoints(d.intent)}" fill="rgba(16,185,129,0.3)" stroke="#10b981" stroke-width="3"/>`;

        // Modules (tailored to URL)
        document.getElementById('modules-list').innerHTML = `
            <li><strong>Primary Intent:</strong> ${d.intent.type} (${d.intent.confidence}% match for ${url})</li>
            <li><strong>Top Query Cluster:</strong> "${d.intent.topQuery}"</li>
            <li><strong>E-E-A-T Score:</strong> ${d.eeat.overall}/100 (E:${d.eeat.e} X:${d.eeat.x} A:${d.eeat.a} T:${d.eeat.t})</li>
            <li><strong>Content Depth:</strong> ${d.content.words} words | Readability ${d.content.flesch}/100</li>
            <li><strong>Schema Detected:</strong> ${d.schema.join(', ') || 'None 😱'}</li>
        `;

        // Competitors
        document.querySelector('#gaps-table tbody').innerHTML = d.competitors.map(c => `
            <tr><td>${c.rank}. ${c.title}</td><td>${c.intentScore}</td><td>${c.eeatScore}</td>
            <td class="${c.gap > 0 ? 'text-red-500' : 'text-green-500'}">${c.gap > 0 ? '+' : ''}${c.gap}</td></tr>
        `).join('');

        // Fixes
        document.getElementById('fixes-list').innerHTML = d.fixes.map(f => `
            <li><strong>${f.priority} Priority:</strong> ${f.fix}
            <br><small>Impact: ${f.impact} | Effort: ${f.effort}</small></li>
        `).join('');

        // Forecast
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