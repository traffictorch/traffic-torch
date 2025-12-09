// script.js – Epic Intent Tool v2 – REAL functionality 2025
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const body = document.body;


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url-input').value.trim();
        if (!url) return;

        form.classList.add('hidden');
        loading.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            const response = await fetch('/seo-intent-tool/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            renderRealResults(data);
        } catch (err) {
            alert('Error: ' + err.message);
            console.error(err);
        } finally {
            loading.classList.add('hidden');
            results.classList.remove('hidden');
        }
    });

    function renderRealResults(d) {
        // 360° Score
        document.getElementById('score').textContent = d.overall;

        // Intent Radar Chart (simple SVG)
        document.querySelector('.health-score').insertAdjacentHTML('beforeend', 
            `<svg viewBox="0 0 200 200" class="radar"><polygon points="${getRadarPoints(d.intent)}" fill="rgba(0,124,186,0.3)" stroke="#007cba" stroke-width="3"/></svg>`);

        // Modules
        const modulesHTML = `
            <li><strong>Primary Intent:</strong> ${d.intent.type} (${d.intent.confidence}% match)</li>
            <li><strong>Top Query Cluster:</strong> "${d.intent.topQuery}"</li>
            <li><strong>E-E-A-T Score:</strong> ${d.eeat.overall}/100 
                (E:${d.eeat.e} X:${d.eeat.x} A:${d.eeat.a} T:${d.eeat.t})</li>
            <li><strong>Content Depth:</strong> ${d.content.words} words | Readability ${d.content.flesch}/100</li>
            <li><strong>Schema Detected:</strong> ${d.schema.join(', ') || 'None 😱'}</li>
        `;
        document.getElementById('modules-list').innerHTML = modulesHTML;

        // Competitive Gaps
        let gapsHTML = '';
        d.competitors.forEach(c => {
            gapsHTML += `<tr>
                <td>${c.rank}. ${c.title.slice(0,40)}...</td>
                <td>${c.intentScore}</td>
                <td>${c.eeatScore}</td>
                <td style="color:${c.gap>0?'red':'green'}">${c.gap > 0 ? '+' : ''}${c.gap}</td>
            </tr>`;
        });
        document.querySelector('#gaps-table tbody').innerHTML = gapsHTML;

        // AI Fixes (real OpenAI suggestions)
        const fixesHTML = d.fixes.map((f, i) => 
            `<li><strong>${f.priority} Priority:</strong> ${f.fix} 
             <br><small>Impact: ${f.impact} | Effort: ${f.effort}</small></li>`
        ).join('');
        document.getElementById('fixes-list').innerHTML = fixesHTML;

        // Forecast
        document.getElementById('forecast-text').innerHTML = 
            `🎯 <strong>${d.forecast.rankGain} position gain</strong> expected in ${d.forecast.days} days 
             if you implement <strong>${d.forecast.fixRate}%</strong> of fixes.`;
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