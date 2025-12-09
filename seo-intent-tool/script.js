document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        form.classList.add('hidden');
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            // This works 100% on GitHub Pages
            const response = await fetch('/seo-intent-tool/data.json');
            const d = await response.json();

            // 360 Score
            document.getElementById('score').textContent = d.overall;

            // Radar Chart
            document.querySelector('.health-score').insertAdjacentHTML('beforeend',
                `<svg viewBox="0 0 200 200" class="radar mx-auto mt-8">
                  <polygon points="${getRadarPoints(d.intent)}" fill="rgba(16,185,129,0.3)" stroke="#10b981" stroke-width="3"/>
                </svg>`);

            // Modules
            document.getElementById('modules-list').innerHTML = `
                <li><strong>Primary Intent:</strong> ${d.intent.type} (${d.intent.confidence}% match)</li>
                <li><strong>Top Query Cluster:</strong> "${d.intent.topQuery}"</li>
                <li><strong>E-E-A-T Score:</strong> ${d.eeat.overall}/100 (E:${d.eeat.e} X:${d.eeat.x} A:${d.eeat.a} T:${d.eeat.t})</li>
                <li><strong>Content Depth:</strong> ${d.content.words} words | Readability ${d.content.flesch}/100</li>
                <li><strong>Schema Detected:</strong> ${d.schema.join(', ') || 'None'}</li>
            `;

            // Competitors
            document.querySelector('#gaps-table tbody').innerHTML = d.competitors.map(c => `
                <tr><td>${c.rank}. ${c.title}</td><td>${c.intentScore}</td><td>${c.eeatScore}</td>
                <td class="${c.gap > 0 ? 'text-red-500' : 'text-green-500'}">${c.gap > 0 ? '+' : ''}${c.gap}</td></tr>
            `).join('');

            // Fixes
            document.getElementById('fixes-list').innerHTML = d.fixes.map(f => `
                <li><strong>${f.priority} Priority:</strong> ${f.fix}<br>
                <small>Impact: ${f.impact} | Effort: ${f.effort}</small></li>
            `).join('');

            // Forecast
            document.getElementById('forecast-text').innerHTML = `With fixes, expect <strong>+${d.forecast.rankGain} positions</strong> in ${d.forecast.days} days (fix ${d.forecast.fixRate}% of issues)`;

        } catch (err) {
            alert('Error loading results – check console');
            console.error(err);
        } finally {
            loading.classList.add('hidden');
            results.classList.remove('hidden');
        }
    });

    function getRadarPoints(i) {
        const a = [0,90,180,270];
        const v = [i.informational, i.commercial, i.transactional, i.navigational];
        return v.map((val,idx) => {
            const ang = a[idx] * Math.PI/180;
            const r = (val/100)*80;
            return `${100 + r*Math.cos(ang)},${100 + r*Math.sin(ang)}`;
        }).join(' ');
    }
});